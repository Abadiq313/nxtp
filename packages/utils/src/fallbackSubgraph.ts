import { jsonifyError } from "./error";
import { Logger } from "./logger";
import { createLoggingContext } from "./request";

export type SubgraphSyncRecord = {
  uri: string;
  synced: boolean;
  latestBlock: number;
  syncedBlock: number;
  lag: number;
};

type SdkLike = { GetBlockNumber: () => Promise<any> };

type Sdk<T extends SdkLike> = {
  client: T;
  record: SubgraphSyncRecord;
};

export class FallbackSubgraph<T extends SdkLike> {
  private readonly sdks: Sdk<T>[];

  constructor(
    private readonly logger: Logger,
    private readonly chainId: number,
    // We use the URIs in sync records for reference in logging.
    sdks: { client: T; uri: string }[],
    // Subgraph is considered out of sync if it lags more than this many blocks behind the latest block.
    private readonly maxLag: number,
  ) {
    this.sdks = sdks.map(({ client, uri }) => ({
      client,
      record: {
        synced: false,
        latestBlock: 0,
        syncedBlock: 0,
        // Setting maxLag + 1 as default to ensure we don't use the subgraph in this current state
        // by virtue of this metric (sync() must be called first).
        lag: this.maxLag + 1,
        // Typically used for logging, distinguishing between which subgraph is which, so we can monitor
        // which ones are most in sync.
        uri: uri.replace("https://", "").split(".com")[0],
      },
    }));
  }

  public async request<Q>(method: (client: T) => Promise<any>, syncRequired = false, minBlock?: number): Promise<Q> {
    const { methodContext } = createLoggingContext(this.sync.name);
    // Order the subgraphs by lag / how in-sync they are.
    const ordered = this.sdks
      .sort((sdk) => sdk.record.lag)
      .filter((sdk) => (sdk.record.syncedBlock > (minBlock ?? 0) && syncRequired ? sdk.record.synced : true));
    if (ordered.every((sdk) => !sdk.record.synced)) {
      throw new Error(`All subgraphs out of sync! Cannot handle active transactions for chain ${this.chainId}`);
    }
    const errors: Error[] = [];
    // Starting with most in-sync, keep retrying the callback with each client.
    for (let i = 0; i < ordered.length; i++) {
      const sdk = ordered[i];
      try {
        return await method(sdk.client);
      } catch (e) {
        errors.push(e);
      }
    }
    this.logger.error(
      "Error calling method on subgraph client(s).",
      undefined,
      methodContext,
      jsonifyError(errors[0]),
      {
        chainId: this.chainId,
        otherErrors: errors.slice(1),
      },
    );
    throw errors[0];
  }

  public async sync(latestBlock: number): Promise<SubgraphSyncRecord[]> {
    // Using a Promise.all here to ensure we do our GetBlockNumber queries in parallel.
    await Promise.all(
      this.sdks.map(async (sdk, index) => {
        const record = this.sdks[index].record;
        // We'll retry after an ENOTFOUND error up to 5 times.
        const errors: Error[] = [];
        for (let i = 0; i < 5; i++) {
          try {
            const { _meta } = await sdk.client.GetBlockNumber();
            const syncedBlock = _meta.block.number ?? 0;
            const synced = latestBlock - syncedBlock <= this.maxLag;
            this.sdks[index].record = {
              ...record,
              synced,
              latestBlock,
              syncedBlock,
              lag: latestBlock - syncedBlock,
            };
            return;
          } catch (e) {
            errors.push(e);
            if (e.errno !== "ENOTFOUND") {
              break;
            }
          }
        }
        this.sdks[index].record = {
          ...record,
          synced: false,
          latestBlock,
          lag: record.syncedBlock > 0 ? latestBlock - record.syncedBlock : record.lag,
        };
      }),
    );
    return this.sdks.map((sdk) => sdk.record);
  }
}
