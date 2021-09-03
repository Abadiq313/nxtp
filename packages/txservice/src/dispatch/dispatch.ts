import { BigNumber, Signer } from "ethers";
import PriorityQueue from "p-queue";
import { createLoggingContext, delay, jsonifyError, Logger, mkAddress, NxtpError, RequestContext } from "@connext/nxtp-utils";

import { Gas, WriteTransaction } from "../types";
import { AlreadyMined, TimeoutError, TransactionReplaced, TransactionReverted } from "../error";
import { ChainConfig, TransactionServiceConfig } from "../config";

import { ChainRpcProvider } from "./provider";
import { Transaction } from "./transaction";
import { TransactionBuffer } from "./buffer";

export type TransactionEventCallbacks = {
  onCreate: (tx: Transaction) => void;
  onSubmit: (tx: Transaction) => void;
  onBump: (tx: Transaction) => void;
  onConfirm: (tx: Transaction) => void;
  onFail: (tx: Transaction, error: NxtpError) => void;
}

/**
 * @classdesc Wraps and monitors transaction queue; handles transactions' initial creation and nonce assignment.
 *
 * All transactions created through txservice must go through here.
 */
export class TransactionDispatch {
  // This queue is used for creation of Transactions - specifically, for assigning nonce.
  private readonly queue: PriorityQueue = new PriorityQueue({ concurrency: 1 });
  // Buffer for monitoring transactions locally. Enables us to perform lookback and ensure all of them get through.
  private readonly buffer: TransactionBuffer = new TransactionBuffer();
  // Flag to indicate whether we should continue monitoring. This will stop the loop if flipped.
  private shouldMonitor = true;
  private isActive = false;

  // TODO: Make poll parity (in ms) configurable
  private static MONITOR_POLL_PARITY = 5_000;
  // How many attempts until we consider a blocking tx as taking too long.
  private static TOO_MANY_ATTEMPTS = 5;

  // The current nonce of the signer is tracked locally here. It will be used for comparison
  // to the nonce we get back from the pending transaction count call to our providers.
  // NOTE: Should not be accessed outside of the helper methods, getNonce and incrementNonce.
  private _nonce = 0;

  /**
   * Centralized transaction monitoring class. Extends ChainRpcProvider, thus exposing all provider methods
   * through this class.
   *
   * @param logger Logger used for logging.
   * @param signer Signer instance or private key used for signing transactions.
   * @param chainId The ID of the chain for which this class's providers will be servicing.
   * @param chainConfig Configuration for this specified chain, including the providers we'll
   * be using for it.
   * @param config The shared TransactionServiceConfig with general configuration.
   *
   * @throws ChainError.reasons.ProviderNotFound if no valid providers are found in the
   * configuration.
   */
  constructor(
    signer: string | Signer,
    public readonly chainId: number,
    chainConfig: ChainConfig,
    config: TransactionServiceConfig,
    public readonly callbacks: TransactionEventCallbacks,
    startMonitor = true,
  ) {
    // super(logger, signer, chainId, chainConfig, config);
    // A separate loop will make sure they get through or get backfilled.
    if (startMonitor) {
      this.startMonitor();
    }
  }

  public stopMonitor() {
    this.shouldMonitor = false;
  }

  public startMonitor() {
    this.shouldMonitor = true;
    if (!this.isActive) {
      this.monitorLoop();
    }
  }

  /**
   * This will create a transaction with an assigned nonce as well as estimated gas / set gas price.
   * We use this structure to essentially enforce all created transactions are saved locally in the buffer for
   * continue monitoring, thus enabling us to further ensure they all go through.
   *
   * @param minTx - Minimum transaction params needed to form a transaction for sending.
   * @param context - Request context.
   *
   * @returns Transaction instance with populated params, ready for submit.
   */
  public async sendTransaction(minTx: WriteTransaction, context: RequestContext) {
    const transaction = await this.createTransaction(minTx, context);

    try {
      while (!transaction.didFinish) {
        // Submit: send to chain.
        try {
          // await transaction.submit();
          this.rpc.send(transaction);
          this.callbacks.onSubmit(transaction);
          // await this.submitTransaction(transaction, requestContext);
        } catch (error) {
          if (error.type === AlreadyMined.type) {
            if (transaction.attempt === 1) {
              // A transaction that's only been attempted once has an expired nonce. This means that TransactionMonitor
              // assigned us a bunk (already used) nonce.

              // TODO: In this event, we need to go back to the beginning and actually "recreate" the transaction
              // itself now. Assuming our nonce tracker (TransactionMonitor) is effective, this should normally never occur...
              // but there is at least 1 legit edge case: if the TransactionMonitor has just come online and is can only rely on
              // the provider's TransactionCount to assign nonce - and the provider turns out to be incorrect (e.g. off by 1 or 2
              // pending tx's not in its mempool yet for some reason).
              // So we may want to replace this throw with a recreate.
              throw error;
            }
            // Otherwise if attempts > 1, we ignore this error and proceed to validation step on the assumption that our prev tx
            // got confirmed.
          } else {
            throw error;
          }
        }

        // Validate: wait for 1 confirmation.
        try {
          // await transaction.validate();
        } catch (error) {
          // this.logger.debug(
          //   `Transaction validation step: received ${error.type} error.`,
          //   requestContext,
          //   methodContext,
          //   { id: transaction.id, attempt: transaction.attempt, error: jsonifyError(error) },
          // );
          if (error.type === TimeoutError.type) {
            // Transaction timed out trying to validate. We should bump the tx and submit again.
            // this.logger.debug(`Bumping transaction gas price for resubmit.`, requestContext, methodContext, {
            //   id: transaction.id,
            // });
            
            transaction.bumpGasPrice();
            this.callbacks.onBump(transaction);
            continue;
          } else {
            throw error;
          }
        }

        // Confirm: get target # confirmations.
        try {
          // await this.confirmTransaction(transaction, requestContext);
          this.callbacks.onConfirm(transaction);
          break;
        } catch (error) {
          // this.logger.debug(
          //   `Transaction confirmation step: received ${error.type} error`,
          //   requestContext,
          //   methodContext,
          //   { id: transaction.id, attempt: transaction.attempt, error: jsonifyError(error) },
          // );
          if (error.type === TimeoutError.type) {
            // Transaction timed out trying to confirm. This implies a re-org has happened. We should attempt to resubmit.
            // this.logger.warn(
            //   "Transaction timed out waiting for target confirmations. A possible re-org has occurred; resubmitting transaction.",
            //   requestContext,
            //   methodContext,
            //   { id: transaction.id },
            // );
            continue;
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      // this.handleFail(error, transaction, requestContext);
      callbacks.onFail(transaction, error);
      throw error;
    }

    return transaction.receipt!;
  }

  /**
   * This will create a transaction with an assigned nonce as well as estimated gas / set gas price.
   * We use this structure to essentially enforce all created transactions are saved locally in the buffer for
   * continue monitoring, thus enabling us to further ensure they all go through.
   *
   * @param minTx - Minimum transaction params needed to form a transaction for sending.
   * @param context - Request context.
   *
   * @returns Transaction instance with populated params, ready for submit.
   */
  private async createTransaction(minTx: WriteTransaction, context: RequestContext): Promise<Transaction> {
    // Make sure we haven't aborted dispatch.
    this.assertNotAborted();
    // Estimate gas here will throw if the transaction is going to revert on-chain for "legit" reasons. This means
    // that, if we get past this method, we can safely assume that the transaction will go through on submit, saving for
    // instances where the provider malfunctions.
    const gas = await this.getGas(minTx, context);
    // Queue up the transaction with these values.
    const result = await this.queue.add(async (): Promise<{ value: Transaction | Error; success: boolean }> => {
      try {
        // NOTE: This call must be here, serialized within the queue, as it is dependent on current pending transaction count.
        const nonce = await this.getNonce();
        // Create a new transaction instance to track lifecycle. We will NOT be submitting here.
        const transaction = Transaction.create(this.logger, minTx, nonce, gas, undefined, context);
        this.buffer.insert(nonce, transaction);
        this.incrementNonce();
        return { value: transaction, success: true };
      } catch (e) {
        return { value: e, success: false };
      }
    });
    if (result.success) {
      return result.value as Transaction;
    } else {
      throw result.value;
    }
  }

  /**
   * Get the current nonce value. Should ONLY ever be called within a serialized
   * queue.
   *
   * @remarks
   * Caller should still be prepared to get the incorrect nonce back. For instance,
   * if the provider that just handled our sent tx has suddenly gone offline, this
   * method may give the wrong nonce. This can be solved by making additional calls to
   * submit the tx.
   *
   * @returns A number value for the current nonce.
   */
  private async getNonce(): Promise<number> {
    const buffer = (this.buffer.getLastNonce() ?? -1) + 1;
    const result = await this.rpc.getTransactionCount();
    if (result.isErr()) {
      throw result.error;
    }
    const pending = result.value;
    // Set to whichever value is higher. This should almost always be our local nonce.
    this._nonce = Math.max(this._nonce, pending, buffer);
    return this._nonce;
  }

  /**
   * Increments the nonce by one. Should ONLY ever be called within the serialized queue.
   */
  private incrementNonce() {
    this._nonce++;
  }

  /**
   *
   */
  private async monitorLoop(context?: RequestContext) {
    // TODO: Throttle this loop during lulls in traffic, speed up during high load??
    if (this.isActive) {
      return;
    }
    this.isActive = true;
    while (this.shouldMonitor) {
      await this.monitor(context);
      await delay(TransactionDispatch.MONITOR_POLL_PARITY);
    }
    this.isActive = false;
  }

  /**
   * The method that actually performs the monitoring used in the loop above. Will scan the current
   * buffer for any funny business: i.e. nonce gaps and stuck transactions.
   * @remarks
   * Left exposed as public as it is useful for testing, and we may want to eventually execute
   * this on a whim (i.e. when a specific event occurs).
   */
  public async monitor(context?: RequestContext): Promise<void> {
    // Lazy solution: we only care about a potential hold-up if it could hold anything up.
    const { requestContext, methodContext } = createLoggingContext(this.monitor.name, context);
    if (this.buffer.pending().length < 2) {
      await delay(TransactionDispatch.MONITOR_POLL_PARITY);
      return;
    }
    const result = await this.rpc.getTransactionCount();
    if (result.isErr()) {
      this.logger.error(`Failed to get transaction count`, requestContext, methodContext, jsonifyError(result.error));
      // TODO: If we keep getting failures due to RPC issue, escape out?
      return;
    }
    // This nonce will belong to the last transaction that's been indexed.
    const indexedNonce = result.value ?? -1;
    // Buffer's last nonce must be defined, assuming there is at least 2 pending transactions.
    const currentNonce = Math.max(this.buffer.getLastNonce()!, this._nonce);
    if (indexedNonce >= currentNonce) {
      // If the pending transaction count > buffer's last nonce, then we are all caught up; all tx's are
      // indexed, meaning their nonces have been used and there won't be any need to backfill.
      // We can probably wait at least another poll cycle safely in this case (to avoid hammering provider).
      await delay(TransactionDispatch.MONITOR_POLL_PARITY);
      return;
    }
    const tx = this.buffer.get(indexedNonce);
    if (!tx) {
      // TODO: We need to verify that this is indeed a valid nonce gap.

      // If it is, then we need to backfill the gap.
      await this.backfill(indexedNonce, undefined, "NOT_FOUND", context);
    } else {
      if (tx.didFinish || tx.error) {
        // IF the transaction did finish already, we can ignore this one.
        return;
      }
      // Check to make sure that the transaction is not expired.
      if (tx.expired) {
        await tx.kill();
        await this.backfill(indexedNonce, tx, "EXPIRED", context);
      } else if (tx.attempt > TransactionDispatch.TOO_MANY_ATTEMPTS) {
        // This will mark a transaction for death, but it does get 1 hail mary; the transaction
        // can still attempt to confirm whatever's currently been submitted.
        // TODO: Alternatively, we could give this tx a hail mary by allowing it to submit at max gas BEFORE
        // we kill it... ensuring that there is indeed no hope of getting it through before we give up entirely.
        await tx.kill();
        await this.backfill(indexedNonce, tx, "TAKING_TOO_LONG", context);
      }
    }
  }

  /**
   * Method to execute a generic backfill at a specified nonce.
   * @param nonce - The nonce to backfill at.
   * @param blockade - The transaction that's blocking. Used predominantly for logging.
   * @param reason - The reason for the backfill, a string value to be specify in logs.
   */
  private async backfill(nonce: number, blockade: Transaction | undefined, reason: string, context?: RequestContext) {
    // Make sure that the blockade transaction didn't manage to confirm.
    if (blockade?.didFinish) {
      return;
    }
    const { requestContext, methodContext } = createLoggingContext(this.backfill.name, context);

    let addedToBuffer = false;
    try {
      this.logger.warn(`Transaction requires backfill: ${reason}`, requestContext, methodContext, {
        nonce,
        id: blockade?.id,
        timestamp: blockade?.timestamp,
        blockade: blockade?.params,
        hashes: blockade?.responses.map((r) => r.hash),
      });
      const addressResult = await this.getAddress();
      if (addressResult.isErr()) {
        throw addressResult.error;
      }
      // Sending a 0 wei transaction to fill the gap. We only have to eat the cost of gas here.
      const minTx: WriteTransaction = {
        chainId: this.chainId,
        value: BigNumber.from(0),
        data: "0x",
        to: addressResult.value,
      };
      const gas = await this.getGas(minTx, requestContext);
      // Set gas to maximum.
      gas.setToMax();
      // Create transaction, and forcefully overwrite the stale one (blockade) in the buffer.
      const transaction = new Transaction(this.logger, this, minTx, nonce, gas, true, requestContext);
      const response = await this.sendTransaction(transaction);
      if (response.isErr()) {
        throw response.error;
      }
      const receipt = await this.confirmTransaction(
        response.value,
        this.confirmationsRequired,
        transaction.timeUntilExpiry(),
      );
      if (receipt.isErr()) {
        throw receipt.error;
      }
      this.buffer.insert(nonce, transaction, true);
      addedToBuffer = true;
      this.logger.info("Backfill completed successfully", requestContext, methodContext, {
        nonce,
        blockadeId: blockade?.id,
        backfillTx: {
          id: transaction.id,
          hash: response.value.hash,
          gasPrice: transaction.params.gasPrice.toString(),
          gasLimit: transaction.params.gasLimit.toString(),
          value: transaction.params.value.toString(),
          to: transaction.params.to.toString(),
        },
      });
    } catch (error) {
      if (error.type === AlreadyMined.type) {
        // We can assume that the transaction was sent using the signer outside of dispatch,
        // and as a result, we didn't have it stored in the buffer.
        this.logger.warn("Backfill failed: Transaction already mined", requestContext, methodContext, {
          nonce,
          backfilledTxId: blockade?.id,
          error,
        });
        if (!addedToBuffer) {
          // Fill the gap with a fake transaction. This tx will be labeled with .isBackfill = true,
          // and get removed as soon as the buffer trims up to its nonce.
          this.buffer.insert(
            nonce,
            new Transaction(
              this.logger,
              this,
              {
                chainId: this.chainId,
                value: BigNumber.from(0),
                data: "0x",
                to: mkAddress(),
              },
              nonce,
              new Gas(BigNumber.from(1), BigNumber.from(24001)),
              true,
              requestContext,
            ),
            // overwrite
            true,
          );
        }
        return;
      } else if (error.type === TransactionReplaced.type) {
        // The backfill was replaced by the original transaction, so we can just ignore it.
        this.logger.info("Backfill failed: Transaction replaced", requestContext, methodContext, {
          nonce,
          originalTxId: blockade?.id,
          error,
          replacement: error.replacement?.hash,
          receipt: error.receipt?.hash,
        });
        return;
      }
      // Backfill failed, we should shut the system down.
      this.logger.error(`Backfill failed: ${error.type}`, requestContext, methodContext, jsonifyError(error), {
        nonce,
        backfilledTxId: blockade?.id,
      });
      // Raise the abort flag.
      // TODO / DEBUG: Temporarily disabled for debugging.
      // this.aborted = error;
    }
  }

  /// HELPERS
  /**
   * A helper method to get the Gas tracker instance, which is used to hold price and limit.
   *
   * @param transaction - The transaction to get the Gas tracker for.
   *
   * @returns A GasTracker instance.
   *
   * @throws TransactionReverted if gas estimate fails.
   */
  private async getGas(transaction: WriteTransaction, context?: RequestContext): Promise<Gas> {
    const { requestContext, methodContext } = createLoggingContext(this.getGas.name, context);
    // Get gas estimate.
    let gasLimit: BigNumber;
    let result = await this.estimateGas(transaction);
    if (result.isErr()) {
      if (result.error.type === TransactionReverted.type) {
        // If we get a TransactionReverted error, that means the gas estimate call
        // indicated our transaction would fail on-chain. The details of the failure will
        // be included in the error.
        throw result.error;
      }
      this.logger.warn("Estimate gas failed due to an unexpected error.", requestContext, methodContext, {
        transaction: transaction,
        error: jsonifyError(result.error),
      });
      throw result.error;
    } else {
      gasLimit = result.value;
    }

    // Get gas price and create tracker instance.
    result = await this.getGasPrice(requestContext);
    if (result.isErr()) {
      throw result.error;
    }
    return new Gas(result.value, gasLimit);
  }
}
