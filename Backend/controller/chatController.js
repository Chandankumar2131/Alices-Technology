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
  return true;
};

const isAdminUser = (user) =>
  user.accountType === "Admin" || user.accountType === "SuperAdmin";

const findOrCreateConversation = async (userId, otherUserId) => {
  const participantIds = [userId, otherUserId].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  let conversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: participantIds, $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: "direct",
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
    { path: "receivers", select: userSelect },
  ]);

exports.listChatUsers = async (req, res) => {
  try {
    const filter =
      req.user.accountType === "Employee"
        ? { _id: { $ne: req.user.id }, isActive: true }
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

exports.createGroup = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can create groups",
      });
    }

    const name = String(req.body.name || "").trim();
    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
    const uniqueMemberIds = [...new Set(memberIds.map(String))].filter(
      (id) => id && id !== String(req.user.id)
    );

    if (!name || uniqueMemberIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Group name and at least one member are required",
      });
    }

    const members = await User.find({
      _id: { $in: uniqueMemberIds },
      isActive: true,
    }).select("_id");

    if (members.length !== uniqueMemberIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected members are invalid",
      });
    }

    const conversation = await Conversation.create({
      type: "group",
      name,
      createdBy: req.user.id,
      participants: [req.user.id, ...uniqueMemberIds],
      lastMessageAt: new Date(),
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", userSelect)
      .populate("createdBy", userSelect);

    const io = req.app.get("io");
    if (io) {
      populated.participants.forEach((participant) => {
        io.to(`user:${participant._id}`).emit("chat:group_created", populated);
      });
    }

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create group",
      error: error.message,
    });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate("participants", userSelect)
      .populate("createdBy", userSelect)
      .populate({
        path: "lastMessage",
        select: "text sender receiver receivers createdAt readAt",
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

exports.getDirectMessages = async (req, res) => {
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

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id,
    }).populate("participants", userSelect);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate("sender", userSelect)
      .populate("receiver", userSelect)
      .populate("receivers", userSelect)
      .sort({ createdAt: 1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: {
        conversation,
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
    const { receiverId, conversationId, text } = req.body;
    const messageText = normalizeMessageText(text);

    if ((!receiverId && !conversationId) || !messageText) {
      return res.status(400).json({
        success: false,
        message: "Receiver or conversation and message are required",
      });
    }

    let conversation;
    let receiver = null;
    let receivers = [];

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: req.user.id,
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      receivers = conversation.participants.filter(
        (participantId) => String(participantId) !== String(req.user.id)
      );
    } else {
      receiver = await User.findById(receiverId).select(userSelect);
      if (!canChatWith(req.user, receiver)) {
        return res.status(403).json({
          success: false,
          message: "You cannot chat with this user",
        });
      }

      conversation = await findOrCreateConversation(req.user.id, receiverId);
      receivers = [receiverId];
    }

    const messagePayload = {
      conversation: conversation._id,
      sender: req.user.id,
      receivers,
      text: messageText,
    };

    if (receiverId) {
      messagePayload.receiver = receiverId;
    }

    let message = await Message.create(messagePayload);

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    message = await populateMessage(message);

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((participantId) => {
        io.to(`user:${participantId}`).emit("chat:message", message);
      });
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
      type: "direct",
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
