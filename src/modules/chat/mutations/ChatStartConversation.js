/*
 * IMPORTS
 */
import axios from "axios";

const ENV = process.env;

/*
 * EXPORTS
 */
export default async function ChatStartConversation(_, args, context) {
  try {
    if (!context.user || !context.user.id) {
      throw new Error("Unauthorized: User not logged in");
    }

    // Call chat_service REST API
    const res = await axios.post(
      `${ENV.CHAT_SERVICE_URL}/api/chat/start/conversation`,
      { message: args.message },
      {
        headers: {
          Authorization: `Bearer ${context.user.token}`, // pass token from context
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("ChatStartConversation Error:", err.message);
    throw new Error("Failed to start conversation");
  }
}
