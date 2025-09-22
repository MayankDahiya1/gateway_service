/*
 * IMPORTS
 */
import axios from "axios";

const ENV = process.env;

/*
 * EXPORTS
 */
export default async function ChatGetConversations(_, __, context) {
  try {
    // Ensure user is authenticated
    if (!context.user || !context.user.id) {
      throw new Error("Unauthorized: User not logged in");
    }

    // Call Chat_Service REST API
    const res = await axios.get(
      `${ENV.CHAT_SERVICE_URL}/api/chat/get/conversation`,
      {
        headers: {
          Authorization: `Bearer ${context.user.token}`,
        },
      }
    );

    return res.data.conversations;
  } catch (err) {
    console.error("ChatGetConversations Error:", err.message);
    throw new Error("Failed to fetch conversations");
  }
}
