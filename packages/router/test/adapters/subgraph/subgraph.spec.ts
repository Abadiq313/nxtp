import { expect, mkAddress, transactionSubgraphMock } from "@connext/nxtp-utils";
import { constants } from "ethers";
import { reset, restore, SinonStub, stub } from "sinon";
import * as subgraphAdapter from "../../../src/adapters/subgraph";
import { TransactionStatus } from "../../../src/adapters/subgraph/graphqlsdk";
import {
  getActiveTransactions,
  getAssetBalance,
  getSyncRecord,
  getTransactionForChain,
} from "../../../src/adapters/subgraph/subgraph";
import { ContractReaderNotAvailableForChain } from "../../../src/lib/errors";
import { ctxMock, txServiceMock } from "../../globalTestHook";
import { configMock, routerAddrMock } from "../../utils";

let sdks: Record<
  number,
  {
    GetSenderTransactions: SinonStub;
    GetTransactions: SinonStub;
    GetTransaction: SinonStub;
    GetAssetBalance: SinonStub;
    GetBlockNumber: SinonStub;
  }
>;

let getSdkStub: SinonStub;

describe("Subgraph Adapter", () => {
  const chainId = 12345;
  let config;
  afterEach(() => {
    restore();
    reset();
  });

  beforeEach(() => {
    sdks = {
      [chainId]: {
        GetSenderTransactions: stub().resolves({ router: { transactions: [] } }),
        GetTransactions: stub().resolves({ transactions: [] }),
        GetTransaction: stub().resolves(undefined),
        GetAssetBalance: stub().resolves(constants.Zero),
        GetBlockNumber: stub().resolves({ _meta: { block: { number: 10000 } } }),
      },
    };

    getSdkStub = stub(subgraphAdapter, "getSdks").returns(sdks as any);
    config = {
      ...configMock,
      chainConfig: {
        [chainId]: {
          ...configMock.chainConfig[1337],
        },
      },
    };
    ctxMock.config = config;
  });

  describe("getSyncRecord", () => {
    it("should work", async () => {
      expect(getSyncRecord(1337)).to.be.deep.eq({
        synced: false,
        syncedBlock: 0,
        latestBlock: 0,
      });
    });
  });

  describe("getActiveTransactions", () => {
    it("should fail if theres no chain config for that chain", async () => {
      const _sdks = {
        [9876]: sdks[chainId],
      };
      getSdkStub.returns(_sdks as any);

      await expect(getActiveTransactions()).to.be.rejectedWith("No chain config");
    });

    it("should return an empty array if the chain is unsynced", async () => {
      sdks[chainId].GetBlockNumber.resolves({ _meta: { block: { number: 1 } } });
      txServiceMock.getBlockNumber.resolves(10000);
      expect(await getActiveTransactions()).to.be.deep.eq([]);
      expect(getSyncRecord(chainId)).to.be.deep.eq({ synced: false, syncedBlock: 1, latestBlock: 10000 });
    });

    it("should return an empty array if GetBlockNumber fails", async () => {
      sdks[chainId].GetBlockNumber.rejects("fail");
      expect(await getActiveTransactions()).to.be.deep.eq([]);
    });

    it("should return an empty array if txService.getBlockNumber fails", async () => {
      txServiceMock.getBlockNumber.rejects("fail");
      expect(await getActiveTransactions()).to.be.deep.eq([]);
    });

    it("should fail GetSenderTransactions fails", async () => {
      sdks[chainId].GetSenderTransactions.rejects(new Error("fail"));

      await expect(getActiveTransactions()).to.be.rejectedWith("fail");
    });

    it("should fail GetTransaction fails", async () => {
      sdks[chainId].GetSenderTransactions.resolves({
        router: {
          transactions: [{ ...transactionSubgraphMock, receivingChainId: chainId }],
        },
      });

      sdks[chainId].GetTransactions.rejects(new Error("fail"));

      await expect(getActiveTransactions()).to.be.rejectedWith("fail");

      expect(
        sdks[chainId].GetSenderTransactions.calledOnceWithExactly({
          routerId: routerAddrMock,
          sendingChainId: chainId,
          status: TransactionStatus.Prepared,
        }),
      ).to.be.true;
    });
  });

  describe("getTransactionForChain", () => {
    it("should work", async () => {
      const transaction = transactionSubgraphMock;
      const transactionId = transaction.transactionId;
      const user = transaction.user.id;

      sdks[chainId].GetTransaction.resolves({ transaction });
      getSdkStub.returns(sdks);

      const result = await getTransactionForChain(transactionId, user, chainId);
      expect(result).to.containSubset({
        txData: {
          ...transaction,
          sendingChainId: parseInt(transaction.sendingChainId),
          receivingChainId: parseInt(transaction.receivingChainId),
          expiry: parseInt(transaction.expiry),
          preparedBlockNumber: parseInt(transaction.preparedBlockNumber),
          user,
          router: transaction.router.id,
        },
      });
    });

    it("should return undefined if it does not exist", async () => {
      const transactionId = mkAddress("0xa");
      const user = mkAddress("0xbbb");

      sdks[chainId].GetTransaction.resolves({ transaction: null });
      getSdkStub.returns(sdks);

      const result = await getTransactionForChain(transactionId, user, chainId);
      expect(result).to.be.undefined;
      expect(
        sdks[chainId].GetTransaction.calledOnceWithExactly({
          transactionId: `${transactionId}-${user}-${routerAddrMock}`,
        }),
      ).to.be.true;
    });

    it("should throw if sdk throws", async () => {
      const transactionId = mkAddress("0xa");
      const user = mkAddress("0xbbb");

      sdks[chainId].GetTransaction.rejects(new Error("fail"));

      await expect(getTransactionForChain(transactionId, user, chainId)).to.be.rejectedWith("fail");
    });

    it("should throw if there is no sdk", async () => {
      const transactionId = mkAddress("0xa");
      const user = mkAddress("0xbbb");
      sdks[chainId] = undefined;
      getSdkStub.returns(sdks);

      await expect(getTransactionForChain(transactionId, user, chainId)).to.be.rejectedWith(
        (new ContractReaderNotAvailableForChain(chainId) as any).message,
      );
    });
  });

  describe("getAssetBalance", () => {
    it("should work", async () => {
      const assetId = mkAddress("0xa");
      const amount = "1000";
      sdks[chainId].GetAssetBalance.resolves({ assetBalance: { amount } });
      getSdkStub.returns(sdks);

      const result = await getAssetBalance(assetId, chainId);
      expect(result.eq(amount)).to.be.true;
      expect(sdks[chainId].GetAssetBalance.calledOnceWithExactly({ assetBalanceId: `${assetId}-${routerAddrMock}` }));
    });

    it("should throw if there is no sdk", async () => {
      const assetId = mkAddress("0xa");
      sdks[chainId] = undefined;
      getSdkStub.returns(sdks);

      await expect(getAssetBalance(assetId, chainId)).to.be.rejectedWith(
        (new ContractReaderNotAvailableForChain(chainId) as any).message,
      );
    });
  });
});
