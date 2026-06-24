import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { selectIsAdmin, selectUser } from "../../features/auth/authSlice";
import { getSocket } from "../../lib/socket";
import { chatService } from "../../service/chatService";
import { fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

const getId = (value) => String(value?._id || value?.id || value || "");

const formatTime = (date) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const mergeSeenMessages = (items, messageIds, readAt) => {
  const seenIds = new Set(messageIds.map(String));
  return items.map((message) =>
    seenIds.has(getId(message)) ? { ...message, readAt } : message
  );
};

const targetId = (target) => `${target?.type || ""}:${getId(target?.data)}`;

const formatUnreadCount = (count = 0) => (count > 9 ? "9+" : String(count));
const ATTACH_ICON = "\u{1F4CE}";
const IMAGE_ICON = "\u{1F5BC}\u{FE0F}";
const PDF_ICON = "\u{1F4C4}";
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${bytes} B`;
};

const attachmentLabel = (attachment) =>
  attachment?.mimeType === "application/pdf" ? "PDF" : "Image";

const attachmentPreviewText = (message) => {
  const firstAttachment = message?.attachments?.[0];
  if (!firstAttachment) return "";
  return `${attachmentLabel(firstAttachment)}: ${firstAttachment.fileName}`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const CHAT_EMOJI_OPTIONS = [
  "\u{1F600}",
  "\u{1F602}",
  "\u{1F60A}",
  "\u{1F60D}",
  "\u{1F929}",
  "\u{1F60E}",
  "\u{1F914}",
  "\u{1F44D}",
  "\u{1F44F}",
  "\u{1F64F}",
  "\u{1F64C}",
  "\u{1F91D}",
  "\u{1F389}",
  "\u{1F525}",
  "\u{2728}",
  "\u{2705}",
  "\u{1F4AF}",
  "\u{1F680}",
  "\u{1F4AA}",
  "\u{2764}\u{FE0F}",
  "\u{1F499}",
  "\u{1F49A}",
  "\u{1F49B}",
  "\u{1F4AC}",
  "\u{1F44B}",
  "\u{1F44C}",
  "\u{1F973}",
  "\u{1F970}",
  "\u{1F618}",
  "\u{1F609}",
  "\u{1F633}",
  "\u{1F62E}",
  "\u{1F62D}",
  "\u{1F621}",
  "\u{1F634}",
  "\u{2615}",
  "\u{1F355}",
  "\u{1F382}",
  "\u{1F381}",
  "\u{1F4CC}",
  "\u{1F4C5}",
  "\u{1F4DE}",
  "\u{1F4BB}",
  "\u{1F4A1}",
  "\u{1F4B0}",
  "\u{1F514}",
  "\u{23F0}",
  "\u{1F3C6}",
  "\u{1F31F}",
  "\u{1F4DD}",
];

export default function Chat() {
  const currentUser = useSelector(selectUser);
  const canCreateGroup = useSelector(selectIsAdmin);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupComposerOpen, setGroupComposerOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const refreshInFlightRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  const currentUserId = getId(currentUser);

  const groups = useMemo(
    () =>
      conversations
        .filter((conversation) => conversation.type === "group")
        .sort((a, b) => {
          const aTime =
            a.lastMessage?.createdAt || a.lastMessageAt || a.updatedAt || "";
          const bTime =
            b.lastMessage?.createdAt || b.lastMessageAt || b.updatedAt || "";
          return String(bTime).localeCompare(String(aTime));
        }),
    [conversations]
  );

  const conversationByUser = useMemo(() => {
    const map = new Map();

    conversations
      .filter((conversation) => conversation.type !== "group")
      .forEach((conversation) => {
        const other = conversation.participants?.find(
          (participant) => getId(participant) !== currentUserId
        );
        if (!other) return;

        const otherId = getId(other);
        const existing = map.get(otherId);
        const existingTime =
          existing?.lastMessage?.createdAt ||
          existing?.lastMessageAt ||
          existing?.updatedAt ||
          "";
        const nextTime =
          conversation?.lastMessage?.createdAt ||
          conversation?.lastMessageAt ||
          conversation?.updatedAt ||
          "";

        if (!existing || String(nextTime).localeCompare(String(existingTime)) > 0) {
          map.set(otherId, conversation);
        }
      });

    return map;
  }, [conversations, currentUserId]);

  const orderedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aConversation = conversationByUser.get(getId(a));
      const bConversation = conversationByUser.get(getId(b));
      const aTime =
        aConversation?.lastMessage?.createdAt ||
        aConversation?.lastMessageAt ||
        aConversation?.updatedAt ||
        "";
      const bTime =
        bConversation?.lastMessage?.createdAt ||
        bConversation?.lastMessageAt ||
        bConversation?.updatedAt ||
        "";
      if (aTime || bTime) return String(bTime).localeCompare(String(aTime));
      return fullName(a).localeCompare(fullName(b));
    });
  }, [conversationByUser, users]);

  const selectedConversation =
    selectedTarget?.type === "group"
      ? selectedTarget.data
      : conversationByUser.get(getId(selectedTarget?.data));

  const refreshConversations = async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && now - lastRefreshAtRef.current < 2500) return;
    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;
    lastRefreshAtRef.current = now;
    try {
      const res = await chatService.getConversations();
      setConversations(res.data || []);
    } finally {
      refreshInFlightRef.current = false;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingUsers(true);
        const [usersRes, conversationsRes] = await Promise.all([
          chatService.getUsers(),
          chatService.getConversations(),
        ]);
        const nextUsers = usersRes.data || [];
        const nextConversations = conversationsRes.data || [];

        setUsers(nextUsers);
        setConversations(nextConversations);
        setSelectedTarget(null);
      } catch (error) {
        notify.error(error?.response?.data?.message || "Failed to load chat");
      } finally {
        setLoadingUsers(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    if (!socket.connected) socket.connect();
    queueMicrotask(() => {
      setSocketStatus(socket.connected ? "connected" : "connecting");
    });

    const handleConnect = () => setSocketStatus("connected");
    const handleDisconnect = () => setSocketStatus("disconnected");
    const handleConnectError = () => {
      if (!socket.connected) {
        setSocketStatus("error");
      }
    };

    const handleMessage = (message) => {
      if (socket.connected) {
        setSocketStatus("connected");
      }

      const conversationId = getId(message.conversation);
      const selectedConversationId = getId(selectedConversation);
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);
      const receiverIds = [
        receiverId,
        ...(message.receivers || []).map((receiver) => getId(receiver)),
      ].filter(Boolean);
      const selectedUserId =
        selectedTarget?.type === "direct" ? getId(selectedTarget.data) : "";
      const isMine = senderId === currentUserId;
      const isOpenDirect =
        selectedTarget?.type === "direct" &&
        ((senderId === selectedUserId && receiverIds.includes(currentUserId)) ||
          (senderId === currentUserId && receiverIds.includes(selectedUserId)));
      const isOpenGroup =
        selectedTarget?.type === "group" && conversationId === selectedConversationId;
      const isOpen = isOpenDirect || isOpenGroup;

      if (isOpen) {
        setMessages((prev) => {
          if (prev.some((item) => getId(item) === getId(message))) return prev;
          return [...prev, message];
        });
      }

      setConversations((prev) => {
        const existing = prev.find(
          (conversation) => getId(conversation) === conversationId
        );

        if (!existing) {
          refreshConversations().catch(() => {});
          return prev;
        }

        return prev.map((conversation) =>
          getId(conversation) === conversationId
            ? {
                ...conversation,
                lastMessage: message,
                lastMessageAt: message.createdAt,
                unreadCount:
                  isMine || isOpen
                    ? conversation.unreadCount || 0
                    : (conversation.unreadCount || 0) + 1,
              }
            : conversation
        );
      });

      if (!isMine && !isOpen) {
        refreshConversations().catch(() => {});
      }
    };

    const handleSeen = ({ messageIds = [], readAt }) => {
      const seenMessageIds = messageIds.map(String);
      setMessages((prev) => mergeSeenMessages(prev, seenMessageIds, readAt));
      setConversations((prev) =>
        prev.map((conversation) => {
          const lastMessage = conversation.lastMessage;
          if (!lastMessage || !seenMessageIds.includes(getId(lastMessage))) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: { ...lastMessage, readAt },
          };
        })
      );
    };

    const handleGroupCreated = (conversation) => {
      setConversations((prev) => {
        if (prev.some((item) => getId(item) === getId(conversation))) return prev;
        return [conversation, ...prev];
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("chat:message", handleMessage);
    socket.on("chat:seen", handleSeen);
    socket.on("chat:group_created", handleGroupCreated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("chat:message", handleMessage);
      socket.off("chat:seen", handleSeen);
      socket.off("chat:group_created", handleGroupCreated);
    };
  }, [currentUserId, selectedConversation, selectedTarget]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedTarget) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);

        if (selectedTarget.type === "group") {
          const res = await chatService.getConversationMessages(
            getId(selectedTarget.data)
          );
          setMessages(res.data?.messages || []);
          await chatService.markGroupRead(getId(selectedTarget.data));
          setConversations((prev) =>
            prev.map((conversation) =>
              getId(conversation) === getId(selectedTarget.data)
                ? { ...conversation, unreadCount: 0 }
                : conversation
            )
          );
          return;
        }

        const userId = getId(selectedTarget.data);
        const res = await chatService.getDirectMessages(userId);
        setMessages(res.data?.messages || []);
        const readRes = await chatService.markRead(userId);
        setConversations((prev) =>
          prev.map((conversation) => {
            const other = conversation.participants?.find(
              (participant) => getId(participant) !== currentUserId
            );

            return getId(other) === userId
              ? { ...conversation, unreadCount: 0 }
              : conversation;
          })
        );

        if (readRes.data?.messageIds?.length) {
          setMessages((prev) =>
            mergeSeenMessages(prev, readRes.data.messageIds, readRes.data.readAt)
          );
          refreshConversations().catch(() => {});
        }
      } catch (error) {
        notify.error(error?.response?.data?.message || "Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentUserId, selectedTarget]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!emojiPickerOpen) return undefined;

    const handleOutsidePointerDown = (event) => {
      const target = event.target;

      if (
        emojiPickerRef.current?.contains(target) ||
        emojiButtonRef.current?.contains(target)
      ) {
        return;
      }

      setEmojiPickerOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setEmojiPickerOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [emojiPickerOpen]);

  const addEmoji = (emoji) => {
    setDraft((prev) => `${prev}${emoji}`);
    messageInputRef.current?.focus();
  };

  const clearPendingAttachment = () => {
    setPendingAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type) || file.size > MAX_ATTACHMENT_SIZE) {
      notify.error("Upload an image or PDF up to 5 MB");
      clearPendingAttachment();
      return;
    }

    try {
      setUploadingAttachment(true);
      const dataUrl = await readFileAsDataUrl(file);
      const res = await chatService.uploadAttachment({
        dataUrl,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });
      setPendingAttachment(res.data);
    } catch (error) {
      notify.error(error?.response?.data?.message || "Failed to upload file");
      clearPendingAttachment();
    } finally {
      setUploadingAttachment(false);
      messageInputRef.current?.focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    const attachments = pendingAttachment ? [pendingAttachment] : [];

    if (!selectedTarget || (!text && attachments.length === 0) || uploadingAttachment) return;

    try {
      setSending(true);
      setDraft("");
      setPendingAttachment(null);
      setEmojiPickerOpen(false);
      const res = await chatService.sendMessage({
        receiverId:
          selectedTarget.type === "direct" ? getId(selectedTarget.data) : undefined,
        conversationId:
          selectedTarget.type === "group" ? getId(selectedTarget.data) : undefined,
        text,
        attachments,
      });
      setMessages((prev) => {
        if (prev.some((item) => getId(item) === getId(res.data))) return prev;
        return [...prev, res.data];
      });
      setConversations((prev) =>
        prev.map((conversation) => {
          if (selectedTarget.type === "group") {
            return getId(conversation) === getId(selectedTarget.data)
              ? { ...conversation, unreadCount: 0 }
              : conversation;
          }

          const other = conversation.participants?.find(
            (participant) => getId(participant) !== currentUserId
          );

          return getId(other) === getId(selectedTarget.data)
            ? { ...conversation, unreadCount: 0 }
            : conversation;
        })
      );
      refreshConversations().catch(() => {});
    } catch (error) {
      setDraft(text);
      setPendingAttachment(attachments[0] || null);
      notify.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
      if (fileInputRef.current && attachments.length > 0) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();

    if (!groupName.trim() || selectedMembers.length === 0) {
      notify.error("Enter a group name and select members");
      return;
    }

    try {
      setCreatingGroup(true);
      const res = await chatService.createGroup({
        name: groupName,
        memberIds: selectedMembers,
      });
      setGroupName("");
      setSelectedMembers([]);
      setGroupComposerOpen(false);
      await refreshConversations({ force: true });
      setEmojiPickerOpen(false);
      setSelectedTarget({ type: "group", data: res.data });
      notify.success("Group created");
    } catch (error) {
      notify.error(error?.response?.data?.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectedTitle =
    selectedTarget?.type === "group"
      ? selectedTarget.data.name
      : fullName(selectedTarget?.data);
  const selectedSubtitle =
    selectedTarget?.type === "group"
      ? `${selectedTarget.data.participants?.length || 0} members`
      : selectedTarget?.data?.accountType;

  if (loadingUsers) {
    return <Spinner full />;
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] min-h-[34rem] gap-4 lg:grid-cols-[22rem_1fr]">
      <aside className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-slate-950/55 p-3 shadow-xl shadow-black/10">
        <div className="flex items-start justify-between gap-3 px-2 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">Chat</h1>
            <p className="mt-1 text-sm text-slate-400">Direct messages and groups.</p>
            <p
              className={`mt-1 text-xs font-semibold ${
                socketStatus === "connected"
                  ? "text-lime-300"
                  : socketStatus === "error"
                    ? "text-rose-300"
                    : "text-amber-300"
              }`}
            >
              {socketStatus === "connected"
                ? "Realtime connected"
                : socketStatus === "error"
                  ? "Realtime connection failed"
                  : "Realtime connecting"}
            </p>
          </div>
          {canCreateGroup && (
            <button
              type="button"
              onClick={() => setGroupComposerOpen((open) => !open)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xl font-semibold transition ${
                groupComposerOpen
                  ? "border-cyan-300/45 bg-cyan-300 text-slate-950"
                  : "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/18"
              }`}
              aria-label="Create group"
              title="Create group"
            >
              +
            </button>
          )}
        </div>

        {canCreateGroup && groupComposerOpen && (
          <form
            onSubmit={handleCreateGroup}
            className="mb-4 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] p-3"
          >
            <p className="mb-2 text-sm font-semibold text-slate-100">Create group</p>
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              maxLength={80}
              placeholder="Group name"
              className="mb-2 h-10 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300/45"
            />
            <div className="mb-3 max-h-28 space-y-1 overflow-y-auto">
              {users.map((user) => (
                <label
                  key={getId(user)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(getId(user))}
                    onChange={() => toggleMember(getId(user))}
                  />
                  <span className="truncate">{fullName(user)}</span>
                </label>
              ))}
            </div>
            <Button
              type="submit"
              loading={creatingGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              className="w-full"
            >
              Create Group
            </Button>
          </form>
        )}

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div>
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Groups
            </p>
            <div className="space-y-1">
              {groups.length === 0 ? (
                <p className="px-2 text-sm text-slate-500">No groups yet.</p>
              ) : (
                groups.map((conversation) => {
                  const active = targetId(selectedTarget) === `group:${getId(conversation)}`;
                  const unreadCount = conversation.unreadCount || 0;
                  return (
                    <button
                      type="button"
                      key={getId(conversation)}
                      onClick={() => {
                        setEmojiPickerOpen(false);
                        setSelectedTarget({ type: "group", data: conversation });
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                        active
                          ? "border-cyan-300/35 bg-cyan-300/12"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-cyan-300/10 text-sm font-bold text-cyan-100">
                        #
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-100">
                          {conversation.name}
                        </span>
                        <span className="block truncate text-xs text-slate-400">
                          {conversation.lastMessage?.text ||
                            attachmentPreviewText(conversation.lastMessage) ||
                            "Group chat"}
                        </span>
                      </span>
                      {unreadCount > 0 && (
                        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300 px-2 text-xs font-bold text-slate-950">
                          {formatUnreadCount(unreadCount)}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              People
            </p>
            <div className="space-y-1">
              {orderedUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">
                  No chat users found.
                </div>
              ) : (
                orderedUsers.map((user) => {
                  const active = targetId(selectedTarget) === `direct:${getId(user)}`;
                  const conversation = conversationByUser.get(getId(user));
                  const lastMessage = conversation?.lastMessage;
                  const unreadCount = conversation?.unreadCount || 0;

                  return (
                    <button
                      type="button"
                      key={getId(user)}
                      onClick={() => {
                        setEmojiPickerOpen(false);
                        setSelectedTarget({ type: "direct", data: user });
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                        active
                          ? "border-cyan-300/35 bg-cyan-300/12"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <img
                        src={user.image}
                        alt=""
                        className="h-10 w-10 rounded-lg border border-white/10 object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-100">
                          {fullName(user)}
                        </span>
                        <span className="block truncate text-xs text-slate-400">
                          {lastMessage?.text ||
                            attachmentPreviewText(lastMessage) ||
                            user.accountType}
                        </span>
                      </span>
                      {unreadCount > 0 && (
                        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300 px-2 text-xs font-bold text-slate-950">
                          {formatUnreadCount(unreadCount)}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950/45 shadow-xl shadow-black/10">
        {selectedTarget ? (
          <>
            <header className="flex items-center gap-3 border-b border-white/10 p-4">
              {selectedTarget.type === "group" ? (
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-cyan-300/10 text-lg font-bold text-cyan-100">
                  #
                </span>
              ) : (
                <img
                  src={selectedTarget.data.image}
                  alt=""
                  className="h-11 w-11 rounded-lg border border-white/10 object-cover"
                />
              )}
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-50">
                  {selectedTitle}
                </h2>
                <p className="text-sm text-cyan-200/80">{selectedSubtitle}</p>
              </div>
            </header>

            <div
              ref={messagesContainerRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
            >
              {loadingMessages ? (
                <Spinner />
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Start the conversation.
                </div>
              ) : (
                messages.map((message) => {
                  const mine = getId(message.sender) === currentUserId;

                  return (
                    <div
                      key={getId(message)}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[min(34rem,82%)] rounded-lg px-4 py-2.5 ${
                          mine
                            ? "bg-cyan-300 text-slate-950"
                            : "border border-white/10 bg-white/[0.05] text-slate-100"
                        }`}
                      >
                        {!mine && selectedTarget.type === "group" && (
                          <p className="mb-1 text-xs font-semibold text-cyan-200">
                            {fullName(message.sender)}
                          </p>
                        )}
                        {message.text && (
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.text}
                          </p>
                        )}
                        {message.attachments?.length > 0 && (
                          <div className={message.text ? "mt-3 space-y-2" : "space-y-2"}>
                            {message.attachments.map((attachment) =>
                              attachment.mimeType?.startsWith("image/") ? (
                                <a
                                  key={attachment.publicId || attachment.url}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block overflow-hidden rounded-lg border border-slate-900/15 bg-slate-950/10"
                                >
                                  <img
                                    src={attachment.url}
                                    alt={attachment.fileName}
                                    className="max-h-64 w-full object-cover"
                                  />
                                  <span className="block truncate px-3 py-2 text-xs font-semibold">
                                    {IMAGE_ICON} {attachment.fileName}
                                  </span>
                                </a>
                              ) : (
                                <a
                                  key={attachment.publicId || attachment.url}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                    mine
                                      ? "border-slate-900/15 bg-slate-950/10 hover:bg-slate-950/15"
                                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                                  }`}
                                >
                                  <span className="text-lg">{PDF_ICON}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate">{attachment.fileName}</span>
                                    <span className="block text-xs font-normal opacity-75">
                                      {formatFileSize(attachment.size)}
                                    </span>
                                  </span>
                                </a>
                              )
                            )}
                          </div>
                        )}
                        <p
                          className={`mt-1 flex items-center justify-end gap-1 text-[0.68rem] ${
                            mine ? "text-slate-700" : "text-slate-500"
                          }`}
                        >
                          <span>{formatTime(message.createdAt)}</span>
                          {mine && selectedTarget.type === "direct" && (
                            <span className="font-semibold">
                              {message.readAt ? "Seen" : "Sent"}
                            </span>
                          )}
                          {mine && selectedTarget.type === "group" && (
                            <span className="font-semibold">Sent</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative flex shrink-0 gap-3 border-t border-white/10 bg-slate-950/80 p-3"
            >
              {pendingAttachment && (
                <div className="theme-card absolute bottom-full right-3 mb-2 flex max-w-[min(24rem,calc(100%-1.5rem))] items-center gap-3 rounded-xl border border-cyan-300/20 bg-slate-950/95 p-3 shadow-2xl shadow-cyan-950/40 backdrop-blur">
                  <span className="text-lg">
                    {pendingAttachment.mimeType?.startsWith("image/") ? IMAGE_ICON : PDF_ICON}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-semibold text-slate-100">
                      {pendingAttachment.fileName}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {attachmentLabel(pendingAttachment)} - {formatFileSize(pendingAttachment.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={clearPendingAttachment}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-sm font-bold text-slate-300 transition hover:border-rose-300/45 hover:text-rose-200"
                    aria-label="Remove attachment"
                  >
                    x
                  </button>
                </div>
              )}
              {emojiPickerOpen && (
                <div
                  ref={emojiPickerRef}
                  className="theme-card absolute bottom-full left-3 mb-2 grid max-h-64 w-[min(22rem,calc(100%-1.5rem))] grid-cols-10 gap-1 overflow-y-auto rounded-xl border border-cyan-300/20 bg-slate-950/95 p-2 shadow-2xl shadow-cyan-950/40 backdrop-blur"
                >
                  {CHAT_EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="flex aspect-square items-center justify-center rounded-lg text-lg transition hover:bg-cyan-300/15 focus:bg-cyan-300/15 focus:outline-none"
                      aria-label={`Add ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                onChange={handleAttachmentChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAttachment || sending}
                className="theme-field min-h-10 w-10 self-end rounded-lg border border-white/10 bg-white/[0.06] text-lg transition hover:border-cyan-300/40 hover:bg-cyan-300/10 focus:border-cyan-300/45 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Attach image or PDF"
                title="Attach image or PDF"
              >
                {uploadingAttachment ? "..." : ATTACH_ICON}
              </button>
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={() => setEmojiPickerOpen((open) => !open)}
                className="theme-field min-h-10 w-10 self-end rounded-lg border border-white/10 bg-white/[0.06] text-[0px] transition hover:border-cyan-300/40 hover:bg-cyan-300/10 focus:border-cyan-300/45 focus:outline-none"
                aria-label="Open emoji keyboard"
                aria-expanded={emojiPickerOpen}
              >
                <span className="text-lg">{CHAT_EMOJI_OPTIONS[2]}</span>
                😊
              </button>
              <textarea
                ref={messageInputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Type a message"
                className="theme-field min-h-10 flex-1 resize-none rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45"
              />
              <Button
                type="submit"
                loading={sending}
                disabled={uploadingAttachment || (!draft.trim() && !pendingAttachment)}
                className="min-h-10 self-end"
              >
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="text-base font-semibold text-slate-200">Select a conversation</p>
              <p className="mt-1 text-sm text-slate-400">
                Choose a person or group from the contact list to open messages.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
