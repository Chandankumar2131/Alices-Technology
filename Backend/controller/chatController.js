const mongoose = require("mongoose");
const Conversation = require("../model/Conversation");
const Message = require("../model/Message");
const User = require("../model/User");

const userSelect =
  "firstName lastName email accountType image department designation employeeId isActive";

const normalizeMessageText = (text) => String(text || "").trim();

const canChatWith = (currentUser, otherUser) => {
  if (!otherUser || !otherUser.isActive) return false;
  if (String(currentUser.id) === String(otherUser._id)) return false;

  if (currentUser.accountType === "Employee") {
    return otherUser.accountType === "Admin" || otherUser.accountType === "SuperAdmin";
  }

  return true;
};

const findOrCreateConversation = async (userId, otherUserId) => {
  const participantIds = [userId, otherUserId].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  let conversation = await Conversation.findOne({
    participants: { $all: participantIds, $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: participantIds,
      lastMessageAt: new Date(),
    });
  }

  return conversation;
};

const populateMessage = (message) =>
  message.populate([
    { path: "sender", select: userSelect },
    { path: "receiver", select: userSelect },
  ]);

exports.listChatUsers = async (req, res) => {
  try {
    const filter =
      req.user.accountType === "Employee"
        ? { accountType: { $in: ["Admin", "SuperAdmin"] }, isActive: true }
        : { _id: { $ne: req.user.id }, isActive: true };

    const users = await User.find(filter).select(userSelect).sort({
      accountType: 1,
      firstName: 1,
      lastName: 1,
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat users",
      error: error.message,
    });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate("participants", userSelect)
      .populate({
        path: "lastMessage",
        select: "text sender receiver createdAt readAt",
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const otherUser = await User.findById(userId).select(userSelect);

    if (!canChatWith(req.user, otherUser)) {
      return res.status(403).json({
        success: false,
        message: "You cannot chat with this user",
      });
    }

    const conversation = await findOrCreateConversation(req.user.id, userId);
    const messages = await Message.find({ conversation: conversation._id })
      .populate("sender", userSelect)
      .populate("receiver", userSelect)
      .sort({ createdAt: 1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: {
        conversation,
        otherUser,
        messages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const messageText = normalizeMessageText(text);

    if (!receiverId || !messageText) {
      return res.status(400).json({
        success: false,
        message: "Receiver and message are required",
      });
    }

    const receiver = await User.findById(receiverId).select(userSelect);
    if (!canChatWith(req.user, receiver)) {
      return res.status(403).json({
        success: false,
        message: "You cannot chat with this user",
      });
    }

    const conversation = await findOrCreateConversation(req.user.id, receiverId);
    let message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      receiver: receiverId,
      text: messageText,
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    message = await populateMessage(message);

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${receiverId}`).to(`user:${req.user.id}`).emit("chat:message", message);
    }

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversation = await Conversation.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(req.user.id),
          new mongoose.Types.ObjectId(userId),
        ],
        $size: 2,
      },
    });

    if (!conversation) {
      return res.status(200).json({ success: true, data: { modifiedCount: 0 } });
    }

    const readAt = new Date();
    const unreadMessages = await Message.find({
      conversation: conversation._id,
      sender: userId,
      receiver: req.user.id,
      readAt: { $exists: false },
    }).select("_id");

    const result = await Message.updateMany(
      {
        conversation: conversation._id,
        sender: userId,
        receiver: req.user.id,
        readAt: { $exists: false },
      },
      { readAt }
    );

    const messageIds = unreadMessages.map((message) => String(message._id));
    const io = req.app.get("io");
    if (io && messageIds.length > 0) {
      io.to(`user:${userId}`).to(`user:${req.user.id}`).emit("chat:seen", {
        conversationId: String(conversation._id),
        readerId: String(req.user.id),
        senderId: String(userId),
        messageIds,
        readAt,
      });
    }

    return res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount, messageIds, readAt },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};
