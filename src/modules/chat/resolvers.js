/*
 * IMPORTS
 */
import ChatGetConversations from "./queries/ChatConversationGetAll.js";
import ChatStartConversation from "./mutations/ChatStartConversation.js";
import ChatDeleteConversation from "./mutations/ChatDeleteConversation.js";
import ChatGetMessages from "./queries/ChatGetMessages.js";
import ChatSendMessage from "./mutations/ChatSendMessage.js";
import ChatSubscription from "./subscription/ChatSubscription.js";

/*
 * CHAT RESOLVERS
 */
const ChatResolvers = {
  Query: {
    ChatGetConversations,
    ChatGetMessages,
  },
  Mutation: {
    ChatStartConversation,
    ChatDeleteConversation,
    ChatSendMessage,
  },
  Subscription: ChatSubscription,
};

export default ChatResolvers;
