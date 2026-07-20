const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const Conversation = require("../model/Conversation");
const Message = require("../model/Message");
const User = require("../model/User");

const userSelect =
  "firstName lastName email accountType image department designation employeeId isActive";

const normalizeMessageText = (text) => String(text || "").trim();
const allowedAttachmentTypes = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maxAttachmentSizeBytes = 5 * 1024 * 1024;

const sanitizeFileName = (fileName) =>
  String(fileName || "attachment")
    .replace(/[^\w.\- ()]/g, "")
    .trim()
    .slice(0, 160) || "attachment";

const buildCloudinaryPublicId = (fileName, mimeType) => {
  const safeName = sanitizeFileName(fileName).replace(/\s+/g, "-");
  const withoutExtension = safeName.replace(/\.[^.]+$/, "");
  const suffix = `${Date.now()}-${withoutExtension}`;

  return mimeType === "application/pdf"
    ? `hrm-chat/${suffix}.pdf`
    : `hrm-chat/${suffix}`;
};

const isValidDataUrl = (value, mimeType) =>
  typeof value === "string" &&
  value.startsWith(`data:${mimeType};base64,`) &&
  value.length > 0;

const normalizeAttachments = (attachments) =>
  (Array.isArray(attachments) ? attachments : [])
    .slice(0, 1)
    .map((attachment) => ({
      url: String(attachment.url || ""),
      publicId: String(attachment.publicId || ""),
      resourceType: String(attachment.resourceType || "raw"),
      format: String(attachment.format || ""),
      fileName: sanitizeFileName(attachment.fileName),
      mimeType: String(attachment.mimeType || ""),
      size: Number(attachment.size || 0),
    }))
    .filter(
      (attachment) =>
        attachment.url &&
        attachment.publicId &&
        allowedAttachmentTypes.has(attachment.mimeType) &&
        attachment.size > 0 &&
        attachment.size <= maxAttachmentSizeBytes
    );

const canChatWith = (currentUser, otherUser) => {
  if (!otherUser || !otherUser.isActive) return false;
  if (currentUser.accountType === "Candidate" || otherUser.accountType === "Candidate") return false;
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
    $or: [{ type: "direct" }, { type: { $exists: false } }],
    participants: { $all: participantIds, $size: 2 },
  }).sort({ lastMessageAt: -1, updatedAt: -1 });

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

const populateConversation = (conversationId) =>
  Conversation.findById(conversationId)
    .populate("participants", userSelect)
    .populate("createdBy", userSelect)
    .populate({
      path: "lastMessage",
      select: "text attachments sender receiver receivers createdAt readAt",
    });

exports.uploadAttachment = async (req, res) => {
  try {
    const { dataUrl, fileName, mimeType, size } = req.body;
    const fileSize = Number(size || 0);

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary is not configured",
      });
    }

    if (
      !allowedAttachmentTypes.has(mimeType) ||
      !fileSize ||
      fileSize > maxAttachmentSizeBytes ||
      !isValidDataUrl(dataUrl, mimeType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Upload an image or PDF up to 5 MB",
      });
    }

    const uploadResult = await cloudinary.uploader.upload(dataUrl, {
      public_id: buildCloudinaryPublicId(fileName, mimeType),
      resource_type: mimeType === "application/pdf" ? "raw" : "image",
      unique_filename: true,
    });

    return res.status(201).json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
        format: uploadResult.format,
        fileName: sanitizeFileName(fileName),
        mimeType,
        size: fileSize,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload attachment",
      error: error.message,
    });
  }
};

exports.listChatUsers = async (req, res) => {
  try {
    const filter = {
      _id: { $ne: req.user.id },
      isActive: true,
      accountType: { $ne: "Candidate" },
    };

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
      accountType: { $ne: "Candidate" },
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

    const populated = await populateConversation(conversation._id);

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

exports.updateGroupMembers = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can manage groups",
      });
    }

    const { conversationId } = req.params;
    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
    const uniqueMemberIds = [...new Set(memberIds.map(String))].filter(
      (id) => id && id !== String(req.user.id)
    );

    if (uniqueMemberIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Select at least one member",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const members = await User.find({
      _id: { $in: uniqueMemberIds },
      isActive: true,
      accountType: { $ne: "Candidate" },
    }).select("_id");

    if (members.length !== uniqueMemberIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected members are invalid",
      });
    }

    const previousParticipantIds = conversation.participants.map(String);
    const participantIds = [String(req.user.id), ...uniqueMemberIds];

    conversation.participants = participantIds;
    await conversation.save();

    const populated = await populateConversation(conversation._id);
    const notifyUserIds = [...new Set([...previousParticipantIds, ...participantIds])];
    const io = req.app.get("io");

    if (io) {
      notifyUserIds.forEach((userId) => {
        io.to(`user:${userId}`).emit("chat:group_updated", populated);
      });
    }

    return res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update group members",
      error: error.message,
    });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete groups",
      });
    }

    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const participantIds = conversation.participants.map(String);
    await Message.deleteMany({ conversation: conversation._id });
    await Conversation.deleteOne({ _id: conversation._id });

    const io = req.app.get("io");
    if (io) {
      participantIds.forEach((userId) => {
        io.to(`user:${userId}`).emit("chat:group_deleted", {
          conversationId: String(conversation._id),
        });
      });
    }

    return res.status(200).json({
      success: true,
      data: { conversationId: String(conversation._id) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete group",
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
        select: "text attachments sender receiver receivers createdAt readAt",
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const visibleConversations = conversations.filter((conversation) =>
      conversation.type === "group" || !conversation.participants.some((participant) => participant?.accountType === "Candidate")
    );

    const conversationsWithUnread = await Promise.all(
      visibleConversations.map(async (conversation) => {
        const conversationObject = conversation.toObject();
        const isGroup = conversationObject.type === "group";
        const unreadFilter = isGroup
          ? {
              conversation: conversation._id,
              sender: { $ne: req.user.id },
              receivers: req.user.id,
              readBy: {
                $not: {
                  $elemMatch: { user: new mongoose.Types.ObjectId(req.user.id) },
                },
              },
            }
          : {
              conversation: conversation._id,
              sender: { $ne: req.user.id },
              receiver: req.user.id,
              readAt: { $exists: false },
            };

        conversationObject.unreadCount = await Message.countDocuments(unreadFilter);
        return conversationObject;
      })
    );

    return res.status(200).json({
      success: true,
      data: conversationsWithUnread,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

exports.markGroupRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      participants: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const readAt = new Date();
    const unreadMessages = await Message.find({
      conversation: conversation._id,
      sender: { $ne: req.user.id },
      receivers: req.user.id,
      readBy: {
        $not: {
          $elemMatch: { user: new mongoose.Types.ObjectId(req.user.id) },
        },
      },
    }).select("_id");

    const messageIds = unreadMessages.map((message) => message._id);
    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt,
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        messageIds: messageIds.map(String),
        readAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark group messages as read",
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
    const conversations = await Conversation.find({
      $or: [{ type: "direct" }, { type: { $exists: false } }],
      participants: {
        $all: [
          new mongoose.Types.ObjectId(req.user.id),
          new mongoose.Types.ObjectId(userId),
        ],
        $size: 2,
      },
    }).select("_id");
    const conversationIds = conversations.map((item) => item._id);
    const messages = await Message.find({ conversation: { $in: conversationIds } })
      .populate("sender", userSelect)
      .populate("receiver", userSelect)
      .populate("receivers", userSelect)
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
    const { receiverId, conversationId, text, attachments } = req.body;
    const messageText = normalizeMessageText(text);
    const messageAttachments = normalizeAttachments(attachments);

    if ((!receiverId && !conversationId) || (!messageText && messageAttachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Receiver or conversation and message or attachment are required",
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

      if (conversation.type !== "group") {
        const otherParticipantId = conversation.participants.find(
          (participantId) => String(participantId) !== String(req.user.id)
        );
        const otherParticipant = await User.findById(otherParticipantId).select(userSelect);
        if (!canChatWith(req.user, otherParticipant)) {
          return res.status(403).json({ success: false, message: "You cannot chat with this user" });
        }
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
      attachments: messageAttachments,
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
    const conversations = await Conversation.find({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(req.user.id),
          new mongoose.Types.ObjectId(userId),
        ],
        $size: 2,
      },
      $or: [{ type: "direct" }, { type: { $exists: false } }],
    }).select("_id");

    if (conversations.length === 0) {
      return res.status(200).json({ success: true, data: { modifiedCount: 0 } });
    }

    const conversationIds = conversations.map((conversation) => conversation._id);
    const readAt = new Date();
    const unreadMessages = await Message.find({
      conversation: { $in: conversationIds },
      sender: userId,
      receiver: req.user.id,
      readAt: { $exists: false },
    }).select("_id");

    const result = await Message.updateMany(
      {
        conversation: { $in: conversationIds },
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
        conversationId: String(conversationIds[0]),
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
