const express = require("express");
const { auth } = require("../middleware/auth");
const {
  listChatUsers,
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
} = require("../controller/chatController");

const router = express.Router();

router.use(auth);
router.get("/users", listChatUsers);
router.get("/conversations", listConversations);
router.get("/messages/:userId", getMessages);
router.post("/messages", sendMessage);
router.patch("/messages/:userId/read", markConversationRead);

module.exports = router;
