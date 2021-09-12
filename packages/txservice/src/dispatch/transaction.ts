import { providers, BigNumber, utils } from "ethers";
import { createLoggingContext, delay, getUuid, Logger, RequestContext } from "@connext/nxtp-utils";

import { DEFAULT_CONFIG } from "../config";
import { FullTransaction, Gas, WriteTransaction } from "../types";
import {
  TimeoutError,
  TransactionKilled,
  TransactionReplaced,
  TransactionReverted,
  TransactionServiceFailure,
} from "../error";

import { ChainRpcProvider } from "./provider";

export interface TransactionInterface {
  id: string;
  chainId: number;
  timestamp: number;
  params: FullTransaction;
  error: Error | undefined;
  attempt: number;
  validated: boolean;
  discontinued: boolean;
  didSubmit: boolean;
  didFinish: boolean;
  responses: providers.TransactionResponse[];
  receipt?: providers.TransactionReceipt;
  submit(): Promise<providers.TransactionResponse>;
  validate(): Promise<void>;
  confirm(): Promise<providers.TransactionReceipt>;
  bumpGasPrice(): Promise<void>;
}

/**
 * @classdesc Handles the sending of a single transaction and making it easier to monitor the execution/rebroadcast
 */
export class Transaction implements TransactionInterface {
  // TODO: Temp solution - will be replaced by batching solution.
  // How many attempts until we consider a blocking tx as taking too long.
  public static MAX_ATTEMPTS = 99999;

  // We use a unique ID to internally track a transaction through logs.
  public id: string = getUuid();
  public readonly chainId: number;
  // Response that was accepted on-chain (this reference will be used in the event that replacements are made).
  private response: providers.TransactionResponse | undefined = undefined;
  // Responses, in the order of attempts made for this tx.
  public responses: providers.TransactionResponse[] = [];
  // Receipt that we received for the on-chain transaction that was mined with
  // the desired number of confirmations.
  public receipt?: providers.TransactionReceipt;

  public get expired(): boolean {
    // A transaction is considered expired once we've gone over our alotted time to confirm our last submission,
    // and no attempt has been made to resubmit.
    return this.timeUntilExpiry() <= 0;
  }

  // TODO: private setter
  // Timestamp initially set on creation, but will be updated each time submit() is called.
  public timestamp: number = Date.now();

  // Indicates whether this transaction has been killed by monitor loop.
  private _discontinued = false;
  public get discontinued(): boolean {
    return this._discontinued;
  }

  // This error will be set in the instance of a failure.
  private _error: Error | undefined;
  public get error(): Error | undefined {
    return this._error;
  }

  // Which transaction attempt we are on.
  private _attempt = 0;
  /**
   * Getter to return the internal attempt
   * @returns The attempt # of the transction
   */
  public get attempt(): number {
    return this._attempt;
  }

  // Whether this transaction has been validated (received at least 1 confirmation).
  // This flag will be flipped once validate() is called and validation is successful.
  private _validated = false;
  public get validated(): boolean {
    return this._validated;
  }

  /**
   * Specifies whether the transaction has been submitted.
   * @returns boolean indicating whether the transaction is submitted.
   */
  public get didSubmit(): boolean {
    return this.responses.length > 0;
  }

  /**
   * Specifies whether the transaction has been completed - meaning that it's been
   * mined and has received the target number of confirmations.
   * @returns boolean indicating whether the transaction is completed.
   */
  public get didFinish(): boolean {
    return !!this.receipt && this.receipt.confirmations >= this.provider.confirmationsRequired;
  }

  /**
   * Retrieves all params needed to format a full transaction, including current gas price set, nonce, etc.
   */
  public get params(): FullTransaction {
    return {
      ...this.minTx,
      gasPrice: this.gas.price,
      nonce: this.nonce,
      gasLimit: this.gas.limit,
    };
  }

  /**
   * A data structure used for management of the lifecycle of one on-chain transaction.
   *
   * @param logger The Logger instance we use for logging.
   * @param provider The ChainRpcProvider instance we use for interfacing with the chain.
   * @param minTx The minimum transaction data required to send a transaction.
   * @param nonce Assigned nonce number for this transaction.
   * @param gas The Gas tracker instance, which will include price, limit, and maximum.
   */
  constructor(
    private readonly logger: Logger,
    private readonly provider: ChainRpcProvider,
    public readonly minTx: WriteTransaction,
    public readonly nonce: number,
    public readonly gas: Gas,
    public readonly isBackfill = false,
    private readonly context: RequestContext,
  ) {
    const { requestContext, methodContext } = createLoggingContext("Transaction.constructor", this.context);
    this.logger.debug("New transaction created.", requestContext, methodContext, {
      id: this.id,
      chainId: this.provider.chainId,
      params: this.params,
      createdAt: this.timestamp,
      isBackfill,
    });
    this.chainId = this.provider.chainId;
  }

  /// LIFECYCLE
  /**
   * Makes a single attempt to send this transaction based on its current data.
   *
   * @returns A TransactionResponse once the transaction has been mined
   */
  public async submit(): Promise<providers.TransactionResponse> {
    const method = this.submit.name;

    // Check to make sure that, if this is a replacement tx, the replacement gas is higher.
    if (this.responses.length > 0) {
      // NOTE: There *should* always be a gasPrice in every response, but it is
      // defined as optional. Handle that case?
      // If there isn't a lastPrice, we're going to skip this validation step.
      const lastPrice = this.responses[this.responses.length - 1].gasPrice;
      if (lastPrice && this.gas.price.lte(lastPrice)) {
        // NOTE: We do not set this._error here, as the transaction hasn't failed - just the txservice.
        throw new TransactionServiceFailure("Gas price was not incremented from last transaction.", { method });
      }
    }

    // Check to make sure we haven't already mined this transaction.
    if (this.didFinish) {
      // NOTE: We do not set this._error here, as the transaction hasn't failed - just the txservice.
      throw new TransactionServiceFailure("Submit was called but transaction is already completed.", { method });
    }

    // Check to make sure we haven't been killed by monitor loop.
    if (this.discontinued) {
      throw new TransactionKilled({ method });
    }

    // Increment transaction # attempts made.
    this._attempt++;

    // Send the tx.
    const result = await this.provider.sendTransaction(this);
    // If we end up with an error, it should be thrown here.
    if (result.isErr()) {
      this._error = result.error;
      throw result.error;
    }

    // Set the timestamp according to when we last submitted.
    this.timestamp = Date.now();

    const response = result.value;

    // Add this response to our local response history.
    this.responses.push(response);
    return response;
  }

  public async validate() {
    const method = this.validate.name;

    // Ensure we've submitted at least 1 tx.
    if (!this.didSubmit) {
      throw new TransactionServiceFailure("Transaction validate was called, but no transaction has been sent.", {
        method,
        id: this.id,
      });
    }

    // Ensure we don't already have a receipt.
    if (this.receipt != null) {
      throw new TransactionServiceFailure("Transaction validate was called, but we already have receipt.", {
        method,
        id: this.id,
      });
    }

    // Now we attempt to confirm the first response among our attempts. If it fails due to replacement,
    // we'll get back the replacement's receipt from confirmTransaction.
    this.response = this.response ?? this.responses[0];

    // Get receipt for tx with at least 1 confirmation. If it times out (using default, configured timeout),
    // it will throw a TransactionTimeout error.
    const result = await this.provider.confirmTransaction(this.response, 1);
    if (result.isErr()) {
      const { error: _error } = result;
      if (_error.type === TransactionReplaced.type) {
        const error = _error as TransactionReplaced;
        // TODO: #150 Should we handle error.reason?:
        // error.reason - a string reason; one of "repriced", "cancelled" or "replaced"
        // error.receipt - the receipt of the replacement transaction (a TransactionReceipt)
        this.receipt = error.receipt;
        // error.replacement - the replacement transaction (a TransactionResponse)
        if (!error.replacement) {
          throw new TransactionServiceFailure(
            "Transaction was replaced, but no replacement transaction was returned.",
            {
              method,
              id: this.id,
            },
          );
        }
        this.response = error.replacement;
        // TODO: Validate that we've been replaced by THIS transaction (and not an unrecognized transaction).
        this._validated = true;
      } else if (_error.type === TransactionReverted.type) {
        const error = _error as TransactionReverted;
        // NOTE: This is the official receipt with status of 0, so it's safe to say the
        // transaction was in fact reverted and we should throw here.
        this.receipt = error.receipt;
        this._validated = true;
        this._error = error;
        throw error;
      } else {
        this._error = _error;
        throw _error;
      }
    } else {
      const receipt = result.value;
      // Sanity checks.
      if (receipt == null) {
        // Receipt is undefined or null. This should never occur; timeout should occur before this does,
        // as a null receipt indicates 0 confirmations.
        throw new TransactionServiceFailure("Unable to obtain receipt: ethers responded with null.", {
          method,
          receipt,
          hash: this.response.hash,
          id: this.id,
        });
      } else if (receipt.status === 0) {
        // This should never occur. We should always get a TransactionReverted error in this event.
        throw new TransactionServiceFailure("Transaction was reverted but TransactionReverted error was not thrown.", {
          method,
          receipt,
          hash: this.response.hash,
          id: this.id,
        });
      } else if (receipt.confirmations < 1) {
        // Again, should never occur.
        throw new TransactionServiceFailure("Receipt did not have any confirmations, should have timed out!", {
          method,
          receipt: this.receipt,
          hash: this.response.hash,
          id: this.id,
        });
      }
      // Set our local receipt and flag the tx as validated.
      this.receipt = receipt;
      this._validated = true;
    }
  }

  /**
   * Makes an attempt to confirm this transaction, waiting up to a designated period to achieve
   * a desired number of confirmation blocks. If confirmation times out, throws TimeoutError.
   * If all txs, including replacements, are reverted, throws TransactionReverted.
   *
   * @privateRemarks
   *
   * Ultimately, we should see 1 tx accepted and confirmed, and the rest - if any - rejected (due to
   * replacement) and confirmed. If at least 1 tx has been accepted and received 1 confirmation, we will
   * wait an extended period for the desired number of confirmations. If no further confirmations appear
   * (which is extremely unlikely), we throw a TransactionServiceFailure.NotEnoughConfirmations.
   *
   * @returns A TransactionReceipt (or undefined if it did not confirm).
   */
  public async confirm(): Promise<providers.TransactionReceipt> {
    const method = this.confirm.name;

    // Ensure we've submitted at least 1 tx.
    if (!this.didSubmit) {
      throw new TransactionServiceFailure("Transaction confirm was called, but no transaction has been sent.", {
        method,
        id: this.id,
        didSubmit: this.didSubmit,
      });
    }

    // Ensure we've been validated.
    if (!this.validated || this.receipt === undefined || this.response === undefined) {
      throw new TransactionServiceFailure("Transaction confirm was called, but transaction has not been validated.", {
        method,
        validated: this.validated,
        receipt: this.receipt ? this.receipt.transactionHash : null,
        response: this.response ? this.response.hash : null,
        id: this.id,
      });
    }

    // Here we do an impatient, iterating confirmation wait() that checks to make sure we receive continued confirmations.
    // TODO: Alternatively, we could have wait() running in the background (ever since submit?) and simply poll here. Might be
    // more economic...
    const response = this.response;
    for (let i = 2; i < this.provider.confirmationsRequired; i++) {
      // This maximum here actually ensures a minimum of at least 5 second wait period.
      // Meaning we at least give response.wait() some time to attempt confirm, even if this tx has just expired.
      const timeout = Math.max(this.timeUntilNConfirmations(i), 5_000);
      const result = await this.provider.confirmTransaction(response, i, timeout);
      if (result.isErr()) {
        this._error = result.error;
        if (result.error.type === TimeoutError.type) {
          // This implies a re-org occurred.
          throw result.error;
        }
        // No other errors should occur during this confirmation attempt.
        throw new TransactionServiceFailure(TransactionServiceFailure.reasons.NotEnoughConfirmations, {
          method,
          receipt: this.receipt,
          error: result.error,
          hash: response.hash,
          id: this.id,
        });
      }
      const receipt = result.value;
      if (receipt === null) {
        // Should never occur.
        throw new TransactionServiceFailure("Transaction receipt was null.", {
          method,
          badReceipt: receipt,
          validationReceipt: this.receipt,
          hash: response.hash,
          id: this.id,
        });
      }
      this.receipt = receipt;
    }

    return this.receipt;
  }

  /**
   * Bump the gas price for this tx up by the configured percentage.
   */
  public async bumpGasPrice() {
    const { requestContext, methodContext } = createLoggingContext(this.bumpGasPrice.name, this.context);
    if (this.attempt >= Transaction.MAX_ATTEMPTS) {
      // TODO: Log more info?
      throw new TransactionServiceFailure(TransactionServiceFailure.reasons.MaxAttemptsReached, {
        gasPrice: `${utils.formatUnits(this.gas.price, "gwei")} gwei`,
        attempts: this.attempt,
      });
    }
    const previousPrice = this.gas.price;
    // Get the current gas baseline price, in case it's changed drastically in the last block.
    const result = await this.provider.getGasPrice(requestContext);
    const updatedPrice = result.isOk() ? result.value : BigNumber.from(0);
    const determinedBaseline = updatedPrice.gt(previousPrice) ? updatedPrice : previousPrice;
    // Scale up gas by percentage as specified by config.
    // TODO: Replace with actual config.
    this.gas.price = determinedBaseline
      .add(determinedBaseline.mul(DEFAULT_CONFIG.gasReplacementBumpPercent).div(100))
      .add(1);
    this.logger.info(`Bumping tx gas price for reattempt.`, requestContext, methodContext, {
      chainId: this.chainId,
      id: this.id,
      attempt: this.attempt,
      latestAvgPrice: `${utils.formatUnits(updatedPrice, "gwei")} gwei`,
      previousPrice: `${utils.formatUnits(previousPrice, "gwei")} gwei`,
      newGasPrice: `${utils.formatUnits(this.gas.price, "gwei")} gwei`,
    });
  }

  /**
   * Kills the transaction (marking it as discontinued, preventing submit).
   * Will block until the transaction is expired.
   *
   * @remarks
   * This method is not required by TransactionInterface, as it should not be exposed outside of this
   * submodule. It should only be accessible to TransactionMonitor.
   */
  public async kill() {
    this._discontinued = true;
    await delay(Math.max(this.timeUntilExpiry(), 1_000));
    return;
  }

  /// HELPERS
  /**
   * @param n - The number of confirmations to mark our end time.
   * @returns The time until this transaction should have acquired N confirmations.
   */
  public timeUntilNConfirmations(n = 1): number {
    const expiry = this.timestamp + this.provider.confirmationTimeout * n;
    return expiry - Date.now();
  }

  /**
   * @returns The time until this transaction expires.
   */
  public timeUntilExpiry(): number {
    // We allow extra time to give a bit of leeway for the transaction to be resubmitted/etc after expiry.
    const resubmitGracePeriod = 60_000;
    const expiry =
      this.timestamp + resubmitGracePeriod + this.provider.confirmationTimeout * this.provider.confirmationsRequired;
    return expiry - Date.now();
  }
}
