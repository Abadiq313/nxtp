import { QueueManager } from "../../lib/entities";

import { createQueue } from "./bullQueue";

export const bullQueueManager = async (): Promise<QueueManager> => {
  return { createQueue };
};
