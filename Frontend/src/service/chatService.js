import api, { unwrap } from "../lib/api";

export const chatService = {
  getUsers: async () => unwrap(await api.get("/chat/users")),
  getConversations: async () => unwrap(await api.get("/chat/conversations")),
  createGroup: async ({ name, memberIds }) =>
    unwrap(await api.post("/chat/groups", { name, memberIds })),
  updateGroupMembers: async (conversationId, memberIds) =>
    unwrap(await api.patch(`/chat/groups/${conversationId}/members`, { memberIds })),
  deleteGroup: async (conversationId) =>
    unwrap(await api.delete(`/chat/groups/${conversationId}`)),
  getDirectMessages: async (userId) =>
    unwrap(await api.get(`/chat/messages/direct/${userId}`)),
  getConversationMessages: async (conversationId) =>
    unwrap(await api.get(`/chat/messages/conversation/${conversationId}`)),
  uploadAttachment: async ({ dataUrl, fileName, mimeType, size }) =>
    unwrap(await api.post("/chat/attachments", { dataUrl, fileName, mimeType, size })),
  sendMessage: async ({ receiverId, conversationId, text, attachments }) =>
    unwrap(
      await api.post("/chat/messages", {
        receiverId,
        conversationId,
        text,
        attachments,
      })
    ),
  markRead: async (userId) => unwrap(await api.patch(`/chat/messages/${userId}/read`)),
  markGroupRead: async (conversationId) =>
    unwrap(await api.patch(`/chat/conversations/${conversationId}/read`)),
};
