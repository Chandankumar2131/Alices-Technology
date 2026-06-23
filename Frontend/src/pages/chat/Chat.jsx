import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import { selectUser } from "../../features/auth/authSlice";
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

export default function Chat() {
  const currentUser = useSelector(selectUser);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const currentUserId = getId(currentUser);

  const conversationByUser = useMemo(() => {
    const map = new Map();

    conversations.forEach((conversation) => {
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
        setUsers(usersRes.data || []);
        setConversations(conversationsRes.data || []);
        setSelectedUser((usersRes.data || [])[0] || null);
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
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);
      const selectedUserId = getId(selectedUser);

      if (senderId === selectedUserId || receiverId === selectedUserId) {
        setMessages((prev) => {
          if (prev.some((item) => getId(item) === getId(message))) return prev;
          return [...prev, message];
        });
      }

      setConversations((prev) => {
        const otherId = senderId === currentUserId ? receiverId : senderId;
        const existing = prev.find((conversation) =>
          conversation.participants?.some((participant) => getId(participant) === otherId)
        );

        if (!existing) {
          refreshConversations().catch(() => {});
          return prev;
        }

        return prev.map((conversation) =>
          getId(conversation) === getId(existing)
            ? { ...conversation, lastMessage: message, lastMessageAt: message.createdAt }
            : conversation
        );
      });
    };

    const handleSeen = ({ messageIds = [], readAt }) => {
      setMessages((prev) => mergeSeenMessages(prev, messageIds, readAt));
      setConversations((prev) =>
        prev.map((conversation) => {
          const lastMessage = conversation.lastMessage;
          if (!lastMessage || !messageIds.map(String).includes(getId(lastMessage))) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: { ...lastMessage, readAt },
          };
        })
      );
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:seen", handleSeen);

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:seen", handleSeen);
    };
  }, [currentUserId, selectedUser]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        const res = await chatService.getMessages(getId(selectedUser));
        setMessages(res.data?.messages || []);
        const readRes = await chatService.markRead(getId(selectedUser));
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
  }, [selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();

    if (!selectedUser || !text) return;

    try {
      setSending(true);
      setDraft("");
      const res = await chatService.sendMessage({
        receiverId: getId(selectedUser),
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

  if (loadingUsers) {
    return <Spinner full />;
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-4 lg:grid-cols-[20rem_1fr]">
      <aside className="rounded-lg border border-white/10 bg-slate-950/55 p-3 shadow-xl shadow-black/10">
        <div className="px-2 pb-3">
          <h1 className="text-xl font-bold text-slate-50">Chat</h1>
          <p className="mt-1 text-sm text-slate-400">Messages stay saved and sync live.</p>
        </div>

        <div className="space-y-1">
          {orderedUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">
              No chat users found.
            </div>
          ) : (
            orderedUsers.map((user) => {
              const active = getId(user) === getId(selectedUser);
              const lastMessage = conversationByUser.get(getId(user))?.lastMessage;

              return (
                <button
                  type="button"
                  key={getId(user)}
                  onClick={() => setSelectedUser(user)}
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
      </aside>

      <section className="flex min-h-[36rem] flex-col rounded-lg border border-white/10 bg-slate-950/45 shadow-xl shadow-black/10">
        {selectedUser ? (
          <>
            <header className="flex items-center gap-3 border-b border-white/10 p-4">
              <img
                src={selectedUser.image}
                alt=""
                className="h-11 w-11 rounded-lg border border-white/10 object-cover"
              />
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-50">
                  {fullName(selectedUser)}
                </h2>
                <p className="text-sm text-cyan-200/80">{selectedUser.accountType}</p>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.text}
                        </p>
                        <p
                          className={`mt-1 flex items-center justify-end gap-1 text-[0.68rem] ${
                            mine ? "text-slate-700" : "text-slate-500"
                          }`}
                        >
                          <span>{formatTime(message.createdAt)}</span>
                          {mine && (
                            <span className="font-semibold">
                              {message.readAt ? "Seen" : "Sent"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3 border-t border-white/10 p-4">
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
                className="min-h-11 flex-1 resize-none rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/45"
              />
              <Button type="submit" loading={sending} disabled={!draft.trim()}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Select a user to start chatting.
          </div>
        )}
      </section>
    </div>
  );
}
