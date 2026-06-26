const express = require("express");
const { auth } = require("../middleware/auth");
const {
  listChatUsers,
  listConversations,
  getDirectMessages,
  getConversationMessages,
  sendMessage,
  uploadAttachment,
  markConversationRead,
  markGroupRead,
  createGroup,
  updateGroupMembers,
  deleteGroup,
} = require("../controller/chatController");

const router = express.Router();

router.use(auth);
router.get("/users", listChatUsers);
router.get("/conversations", listConversations);
router.post("/groups", createGroup);
router.patch("/groups/:conversationId/members", updateGroupMembers);
router.delete("/groups/:conversationId", deleteGroup);
router.get("/messages/direct/:userId", getDirectMessages);
router.get("/messages/conversation/:conversationId", getConversationMessages);
router.post("/attachments", uploadAttachment);
router.post("/messages", sendMessage);
router.patch("/messages/:userId/read", markConversationRead);
router.patch("/conversations/:conversationId/read", markGroupRead);

module.exports = router;
