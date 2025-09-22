/*
 * IMPORTS
 */
import axios from "axios";

const ENV = process.env;

/*
 * EXPORTS
 */
export default async function ChatGetMessages(_, args, context) {
  try {
    if (!context.user || !context.user.id) {
      throw new Error("Unauthorized: User not logged in");
    }

    const res = await axios.get(
      `${ENV.CHAT_SERVICE_URL}/api/chat/get/messages/${args.conversationId}`,
      {
        headers: {
          Authorization: `Bearer ${context.user.token}`,
        },
      }
    );

    return res.data.messages;
  } catch (err) {
    console.error("ChatGetMessages Error:", err.message);
    throw new Error("Failed to fetch messages");
  }
}
