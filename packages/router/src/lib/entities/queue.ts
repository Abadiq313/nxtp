import { Queue } from "bull";

export type QueueManager = {
  createQueue: <T>(name: string) => Queue<T>;
};
