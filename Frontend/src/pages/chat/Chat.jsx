import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { selectIsAdmin, selectUser } from "../../features/auth/authSlice";
import { getSocket } from "../../lib/socket";
import { chatService } from "../../service/chatService";
import { fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

const getId = (value) => String(value?._id || value || "");

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
  const bottomRef = useRef(null);

  const currentUserId = getId(currentUser);

  const groups = useMemo(
    () => conversations.filter((conversation) => conversation.type === "group"),
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
        if (other) map.set(getId(other), conversation);
      });

    return map;
  }, [conversations, currentUserId]);

  const orderedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aTime = conversationByUser.get(getId(a))?.lastMessageAt || "";
      const bTime = conversationByUser.get(getId(b))?.lastMessageAt || "";
      return String(bTime).localeCompare(String(aTime));
    });
  }, [conversationByUser, users]);

  const selectedConversation =
    selectedTarget?.type === "group"
      ? selectedTarget.data
      : conversationByUser.get(getId(selectedTarget?.data));

  const refreshConversations = async () => {
    const res = await chatService.getConversations();
    setConversations(res.data || []);
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

    const handleMessage = (message) => {
      const conversationId = getId(message.conversation);
      const selectedConversationId = getId(selectedConversation);
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);
      const selectedUserId =
        selectedTarget?.type === "direct" ? getId(selectedTarget.data) : "";

      if (
        conversationId === selectedConversationId ||
        senderId === selectedUserId ||
        receiverId === selectedUserId
      ) {
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
            ? { ...conversation, lastMessage: message, lastMessageAt: message.createdAt }
            : conversation
        );
      });
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

    socket.on("chat:message", handleMessage);
    socket.on("chat:seen", handleSeen);
    socket.on("chat:group_created", handleGroupCreated);

    return () => {
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
          return;
        }

        const userId = getId(selectedTarget.data);
        const res = await chatService.getDirectMessages(userId);
        setMessages(res.data?.messages || []);
        const readRes = await chatService.markRead(userId);

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
  }, [selectedTarget]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();

    if (!selectedTarget || !text) return;

    try {
      setSending(true);
      setDraft("");
      const res = await chatService.sendMessage({
        receiverId:
          selectedTarget.type === "direct" ? getId(selectedTarget.data) : undefined,
        conversationId:
          selectedTarget.type === "group" ? getId(selectedTarget.data) : undefined,
        text,
      });
      setMessages((prev) => {
        if (prev.some((item) => getId(item) === getId(res.data))) return prev;
        return [...prev, res.data];
      });
      refreshConversations().catch(() => {});
    } catch (error) {
      setDraft(text);
      notify.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
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
      await refreshConversations();
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
                  return (
                    <button
                      type="button"
                      key={getId(conversation)}
                      onClick={() => setSelectedTarget({ type: "group", data: conversation })}
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
                          {conversation.lastMessage?.text || "Group chat"}
                        </span>
                      </span>
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
                  const lastMessage = conversationByUser.get(getId(user))?.lastMessage;

                  return (
                    <button
                      type="button"
                      key={getId(user)}
                      onClick={() => setSelectedTarget({ type: "direct", data: user })}
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
                          {lastMessage?.text || user.accountType}
                        </span>
                      </span>
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

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
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
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.text}
                        </p>
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
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex shrink-0 gap-3 border-t border-white/10 bg-slate-950/80 p-3">
              <textarea
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
                className="min-h-10 flex-1 resize-none rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45"
              />
              <Button type="submit" loading={sending} disabled={!draft.trim()} className="min-h-10 self-end">
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
