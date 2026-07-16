import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { selectUser } from "../../features/auth/authSlice";
import { getSocket } from "../../lib/socket";
import { chatService } from "../../service/chatService";
import { dashboardService } from "../../service/dashboardService";
import { fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

const getId = (value) => String(value?._id || value?.id || value || "");

const countUnread = (conversations = []) =>
  conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);

const messagePreview = (message) => {
  if (message?.text) return message.text;
  const attachment = message?.attachments?.[0];
  if (!attachment) return "Sent you a message";
  return attachment.mimeType === "application/pdf"
    ? `Sent a PDF: ${attachment.fileName}`
    : `Sent an image: ${attachment.fileName}`;
};

export default function AppLayout() {
  const currentUser = useSelector(selectUser);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [adminNotifications, setAdminNotifications] = useState({});
  const originalTitleRef = useRef(document.title || "Alice HRM");
  const currentUserId = getId(currentUser);
  const isChatPage = location.pathname.startsWith("/chat");
  const isAdmin = ["Admin", "SuperAdmin"].includes(currentUser?.accountType);
  const isCandidate = currentUser?.accountType === "Candidate";

  const requestNotificationPermission = () => {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    Notification.requestPermission().catch(() => {});
  };

  useEffect(() => {
    if (isCandidate) return undefined;
    let mounted = true;

    const loadUnreadCount = async () => {
      try {
        const res = await chatService.getConversations();
        if (mounted) setChatUnreadCount(countUnread(res.data || []));
      } catch {
        if (mounted) setChatUnreadCount(0);
      }
    };

    loadUnreadCount();

    return () => {
      mounted = false;
    };
  }, [isCandidate]);

  useEffect(() => {
    if (!isAdmin) {
      setAdminNotifications({});
      return;
    }

    let mounted = true;

    const loadAdminNotifications = async () => {
      try {
        const res = await dashboardService.getAdminNotifications();
        if (mounted) setAdminNotifications(res.data || {});
      } catch {
        if (mounted) setAdminNotifications({});
      }
    };

    loadAdminNotifications();

    return () => {
      mounted = false;
    };
  }, [isAdmin, location.pathname]);

  useEffect(() => {
    if (isChatPage) {
      queueMicrotask(() => {
        setChatUnreadCount(0);
      });
    }
  }, [isChatPage]);

  useEffect(() => {
    const originalTitle = originalTitleRef.current;

    document.title =
      chatUnreadCount > 0
        ? `(${chatUnreadCount}) ${originalTitle}`
        : originalTitle;

    return () => {
      document.title = originalTitle;
    };
  }, [chatUnreadCount]);

  useEffect(() => {
    if (isCandidate) return undefined;
    const socket = getSocket();

    if (!socket.connected) socket.connect();

    const handleMessage = (message) => {
      const isMine = getId(message.sender) === currentUserId;
      if (isMine) return;

      const senderName = fullName(message.sender) || "Someone";
      const preview = messagePreview(message);

      if (!isChatPage) {
        setChatUnreadCount((count) => count + 1);
        notify.success(`${senderName}: ${preview}`);
      }

      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        new Notification(`New message from ${senderName}`, {
          body: preview,
          tag: `chat-${getId(message.conversation) || getId(message.sender)}`,
        });
      }
    };

    socket.on("chat:message", handleMessage);

    return () => {
      socket.off("chat:message", handleMessage);
    };
  }, [currentUserId, isCandidate, isChatPage]);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const refreshAdminNotifications = async () => {
      try {
        const res = await dashboardService.getAdminNotifications();
        setAdminNotifications(res.data || {});
      } catch {
        setAdminNotifications({});
      }
    };

    socket.on("attendance:updated", refreshAdminNotifications);
    socket.on("admin:notifications", refreshAdminNotifications);

    return () => {
      socket.off("attendance:updated", refreshAdminNotifications);
      socket.off("admin:notifications", refreshAdminNotifications);
    };
  }, [isAdmin]);

  return (
    <div className="app-shell flex h-dvh overflow-hidden text-slate-100">
      <Sidebar
        chatUnreadCount={chatUnreadCount}
        adminNotifications={adminNotifications}
        mobileOpen={sidebarOpen}
        onChatClick={requestNotificationPermission}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 md:p-6">
          <div className="motion-page mx-auto w-full max-w-[1500px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
