/*
 * IMPORTS
 */
import axios from "axios";
import debug from "debug";

const ENV = process.env;
const log = debug("gateway:chat:send");

/*
 * EXPORTS
 */
export default async function ChatSendMessage(_, args, context) {
  try {
    if (!context.user || !context.user.id) {
      throw new Error("Unauthorized: User not logged in");
    }

    // Input validation
    const { conversationId, message } = args;

    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      throw new Error("Message content is required");
    }

    if (message.trim().length > 4000) {
      throw new Error("Message is too long (maximum 4000 characters)");
    }

    const res = await axios.post(
      `${ENV.CHAT_SERVICE_URL}/api/chat/send/messages`,
      {
        conversationId: args.conversationId,
        message: args.message,
      },
      {
        headers: {
          Authorization: `Bearer ${context.user.token}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    log("Chat send message error:", err.message);

    // Handle different error types
    if (err.code === "ECONNREFUSED") {
      throw new Error("Chat service is unavailable");
    }

    if (err.response?.status === 404) {
      throw new Error("Conversation not found");
    } else if (err.response?.status === 403) {
      throw new Error("Access denied to this conversation");
    } else if (err.response?.status === 429) {
      throw new Error(
        "Rate limit exceeded. Please wait before sending another message"
      );
    } else if (err.response?.status >= 500) {
      throw new Error("Chat service temporarily unavailable");
    }

    throw new Error(err.message || "Failed to send message");
  }
}
