import Bull, { Queue } from "bull";

import { getContext } from "../../router";

export const createQueue = <T>(name: string): Queue<T> => {
  const { config } = getContext();
  const q = new Bull<T>(name, { redis: config.redisUrl });
  return q;
};
