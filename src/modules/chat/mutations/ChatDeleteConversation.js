/*
 * IMPORTS
 */
import axios from "axios";

const ENV = process.env;

/*
 * EXPORTS
 */
export default async function ChatDeleteConversation(_, args, context) {
  try {
    if (!context.user || !context.user.id) {
      throw new Error("Unauthorized: User not logged in");
    }

    const res = await axios.post(
      `${ENV.CHAT_SERVICE_URL}/api/chat/delete/conversation`,
      { conversationId: args.conversationId },
      {
        headers: {
          Authorization: `Bearer ${context.user.token}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("ChatDeleteConversation Error:", err.message);
    throw new Error("Failed to delete conversation");
  }
}
