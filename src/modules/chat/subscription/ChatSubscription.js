/*
 * IMPORTS
 */
import { kafkaAsyncIterator } from "../../../kafka/KafkaAsyncIterator.js";

/*
 * CHAT SUBSCRIPTIONS
 */
const ChatSubscription = {
  conversationCreated: {
    subscribe: (_, __, context) => {
      if (!context.user?.id) {
        throw new Error("Unauthorized subscription: missing userId");
      }
      console.log("Setting up conversationCreated subscription...");

      const iterator = kafkaAsyncIterator(
        "conversation-created",
        context.user.id
      );

      console.log("🚀 Subscription started: conversationCreated", {
        userId: context.user.id,
      });

      return {
        async *[Symbol.asyncIterator]() {
          console.log(
            "⚡ Iterator started for conversationCreated [userId:",
            context.user.id,
            "]"
          );
          for await (const msg of iterator) {
            console.log("📥 Kafka → conversation-created event received:", msg);

            // direct yield since kafkaAsyncIterator already filters by userId
            console.log("✅ Passing conversationCreated to client:", msg);
            yield {
              conversationCreated: {
                id: msg.conversationId,
                title: msg.title,
                userId: msg.userId,
                createdAt: msg.createdAt,
              },
            };
          }
        },
      };
    },
  },

  messageSent: {
    subscribe: (_, { conversationId }, context) => {
      if (!context.user?.id) {
        throw new Error("Unauthorized subscription: missing userId");
      }

      const iterator = kafkaAsyncIterator("message-sent", context.user.id);

      console.log("🚀 Subscription started: messageSent", {
        conversationId,
        userId: context.user.id,
      });

      return {
        async *[Symbol.asyncIterator]() {
          console.log(
            "⚡ Iterator started for messageSent [userId:",
            context.user.id,
            ", conversationId:",
            conversationId,
            "]"
          );
          for await (const msg of iterator) {
            console.log("📥 Kafka → message-sent event received:", msg);

            if (msg.conversationId === conversationId) {
              console.log("✅ Passing messageSent to client:", msg);
              yield { messageSent: msg };
            } else {
              console.log("⛔ Skipped messageSent (wrong conversation):", {
                msgConversationId: msg.conversationId,
                expectedConversationId: conversationId,
              });
            }
          }
        },
      };
    },
  },
};

export default ChatSubscription;
