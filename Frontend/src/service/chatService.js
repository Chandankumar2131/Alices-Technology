import api, { unwrap } from "../lib/api";

export const chatService = {
  getUsers: async () => unwrap(await api.get("/chat/users")),
  getConversations: async () => unwrap(await api.get("/chat/conversations")),
  createGroup: async ({ name, memberIds }) =>
    unwrap(await api.post("/chat/groups", { name, memberIds })),
  getDirectMessages: async (userId) =>
    unwrap(await api.get(`/chat/messages/direct/${userId}`)),
  getConversationMessages: async (conversationId) =>
    unwrap(await api.get(`/chat/messages/conversation/${conversationId}`)),
  sendMessage: async ({ receiverId, conversationId, text }) =>
    unwrap(await api.post("/chat/messages", { receiverId, conversationId, text })),
  markRead: async (userId) => unwrap(await api.patch(`/chat/messages/${userId}/read`)),
};
