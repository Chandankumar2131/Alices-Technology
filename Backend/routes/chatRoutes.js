const express = require("express");
const { auth } = require("../middleware/auth");
const {
  listChatUsers,
  listConversations,
  getDirectMessages,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  createGroup,
} = require("../controller/chatController");

const router = express.Router();

router.use(auth);
router.get("/users", listChatUsers);
router.get("/conversations", listConversations);
router.post("/groups", createGroup);
router.get("/messages/direct/:userId", getDirectMessages);
router.get("/messages/conversation/:conversationId", getConversationMessages);
router.post("/messages", sendMessage);
router.patch("/messages/:userId/read", markConversationRead);

module.exports = router;
