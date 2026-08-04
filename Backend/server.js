const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const http = require("http");
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const breakRoutes = require("./routes/breakRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const chatRoutes = require("./routes/chatRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const employeeDocumentRoutes = require("./routes/employeeDocumentRoutes");
const resignationRoutes = require("./routes/resignationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const leadRoutes = require("./routes/leadRoutes");
const { startAutoCheckoutJob } = require("./utils/autoCheckout");
const { startAutoOffboardingJob } = require("./utils/autoOffboarding");
const { initSocket } = require("./utils/socket");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const { dbConnection } = require("./config/database");
const { requestMetrics, getMetrics } = require("./middleware/requestMetrics");
const {
  standardLimiter,
  authLimiter,
  writeLimiter,
} = require("./middleware/rateLimiters");

const app = express();

// ================================
// Middleware
// ================================

app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(requestMetrics);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
  : "*";
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use("/api", standardLimiter);
app.use("/api/v1/auth/login", authLimiter);
app.use(["/api/v1/attendance/checkin", "/api/v1/attendance/checkout"], writeLimiter);

// ================================
// Database Connection function
// ================================
dbConnection();

// ================================
// Routes
// ================================
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/break", breakRoutes);
app.use("/api/v1/leave",leaveRoutes);
app.use("/api/v1/salary", salaryRoutes);
app.use("/api/v1/payroll",payrollRoutes);
app.use("/api/v1/dashboard",dashboardRoutes);
app.use("/api/v1/holiday", holidayRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/interviews", interviewRoutes);
app.use("/api/v1/assessments", assessmentRoutes);
app.use("/api/v1/candidates", candidateRoutes);
app.use("/api/v1/documents", employeeDocumentRoutes);
app.use("/api/v1/resignations", resignationRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/leads", leadRoutes);
// ================================
// Default Route
// ================================
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "HRM Backend Server Running Successfully",
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/metrics", (req, res) => {
  return res.status(200).json({
    success: true,
    data: getMetrics(),
  });
});

// ================================
// Start Server
// ================================

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = initSocket(server, allowedOrigins);
app.set("io", io);

startAutoCheckoutJob();
startAutoOffboardingJob(io);

server.listen(PORT, () => {
  console.log(
    `🚀 Server Started Successfully on PORT ${PORT}`
  );
});
