import api, { unwrap } from "../lib/api";

export const chatService = {
  getUsers: async () => unwrap(await api.get("/chat/users")),
  getConversations: async () => unwrap(await api.get("/chat/conversations")),
  getMessages: async (userId) => unwrap(await api.get(`/chat/messages/${userId}`)),
  sendMessage: async ({ receiverId, text }) =>
    unwrap(await api.post("/chat/messages", { receiverId, text })),
  markRead: async (userId) => unwrap(await api.patch(`/chat/messages/${userId}/read`)),
};
