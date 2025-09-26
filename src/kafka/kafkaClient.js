// kafkaClient.js
import { Kafka } from "kafkajs";
import { EventEmitter } from "events";
import debug from "debug";

const log = debug("gateway:kafka");

const kafka = new Kafka({
  clientId: "gateway-service",
  brokers: [process.env.KAFKA_BROKER || "127.0.0.1:9092"],
});

export const consumer = kafka.consumer({ groupId: "gateway-consumers" });
export const kafkaEmitter = new EventEmitter();

export async function initKafka() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "conversation-created",
    fromBeginning: false,
  });
  await consumer.subscribe({ topic: "message-sent", fromBeginning: false });

  log("Kafka connected and subscribed (gateway)");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        log("Gateway Kafka message received:", topic, value);

        // Broadcast to in-memory emitter
        kafkaEmitter.emit(topic, value);
      } catch (err) {
        log("Kafka parse error:", err.message);
      }
    },
  });
}
