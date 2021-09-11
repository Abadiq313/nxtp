import {
  ajv,
  createLoggingContext,
  InvariantTransactionData,
  InvariantTransactionDataSchema,
  RequestContext,
} from "@connext/nxtp-utils";
import { providers } from "ethers";

import { getContext } from "../../router";
import { ParamsInvalid, ReceiverTxExists } from "../errors";
import { CancelInput, CancelInputSchema } from "../entities";
import { TransactionStatus } from "../../adapters/subgraph/graphqlsdk";

export const cancel = async (
  invariantData: InvariantTransactionData,
  input: CancelInput,
  _requestContext: RequestContext<string>,
): Promise<providers.TransactionReceipt | undefined> => {
  const { requestContext, methodContext } = createLoggingContext(cancel.name, _requestContext);

  const { logger, contractWriter, contractReader } = getContext();
  logger.info("Method start", requestContext, methodContext, { invariantData, input });

  // Validate InvariantData schema
  const validateInvariantData = ajv.compile(InvariantTransactionDataSchema);
  const validInvariantData = validateInvariantData(invariantData);
  if (!validInvariantData) {
    const error = validateInvariantData.errors?.map((err: any) => `${err.instancePath} - ${err.message}`).join(",");
    throw new ParamsInvalid({
      methodContext,
      invariantData,
      paramsError: error,
      requestContext,
    });
  }

  // Validate Prepare Input schema
  const validateInput = ajv.compile(CancelInputSchema);
  const validInput = validateInput(input);
  if (!validInput) {
    const error = validateInput.errors?.map((err: any) => `${err.instancePath} - ${err.message}`).join(",");
    throw new ParamsInvalid({
      input,
      paramsError: error,
      requestContext,
      methodContext,
    });
  }

  const { side, amount, preparedBlockNumber, expiry } = input;

  let cancelChain: number;
  if (side === "sender") {
    cancelChain = invariantData.sendingChainId;
    const existing = await contractReader.getTransactionForChain(
      invariantData.transactionId,
      invariantData.user,
      invariantData.receivingChainId,
    );
    if (existing && existing.status !== TransactionStatus.Cancelled) {
      throw new ReceiverTxExists(invariantData.transactionId, invariantData.receivingChainId, {
        requestContext,
        methodContext,
        existing,
      });
    }
  } else {
    cancelChain = invariantData.receivingChainId;
  }

  // Send to tx service
  logger.info("Sending cancel tx", requestContext, methodContext, { side });

  const receipt = await contractWriter.cancel(
    cancelChain,
    {
      txData: { ...invariantData, amount, preparedBlockNumber, expiry },
      signature: "0x",
    },
    requestContext,
  );
  logger.info("Method complete", requestContext, methodContext, { transactionHash: receipt.transactionHash });
  return receipt;
};
