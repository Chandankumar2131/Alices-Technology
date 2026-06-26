const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../model/User");

const initSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id accountType isActive");

      if (!user || !user.isActive) {
        return next(new Error("Invalid user"));
      }

      socket.user = {
        id: String(user._id),
        accountType: user.accountType,
      };

      return next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    if (["Admin", "SuperAdmin"].includes(socket.user.accountType)) {
      socket.join("role:admin");
    }
    socket.emit("chat:connected", { userId: socket.user.id });
  });

  return io;
};

module.exports = { initSocket };
