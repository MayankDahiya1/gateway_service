import { kafkaEmitter } from "./kafkaClient.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("gateway:kafka:iterator");

export function kafkaAsyncIterator(topic, userId) {
  return {
    async *[Symbol.asyncIterator]() {
      const queue = [];
      let resolve;

      const handler = (msg) => {
        logger.debug("Received message", { msg, userId });
        if (msg.userId === userId) {
          if (resolve) {
            resolve(msg);
            resolve = null;
          } else {
            queue.push(msg);
          }
        }
      };

      kafkaEmitter.on(topic, handler);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift();
          } else {
            const msg = await new Promise((r) => (resolve = r));
            yield msg;
          }
        }
      } finally {
        kafkaEmitter.off(topic, handler);
      }
    },
  };
}
