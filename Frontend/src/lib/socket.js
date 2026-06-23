import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (apiUrl.startsWith("http")
    ? apiUrl.replace(/\/api\/v1\/?$/, "")
    : "http://localhost:4000");

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
