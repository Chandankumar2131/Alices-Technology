
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const breakRoutes = require("./routes/breakRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const submissionRoutes = require("./routes/submissionRoutes");


require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { dbConnection } = require("./config/database");

const app = express();

// ================================
// Middleware
// ================================

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : "*";
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ================================
// Database Connection
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
app.use("/api/v1/submission", submissionRoutes);
// ================================
// Default Route
// ================================

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "HRM Backend Server Running Successfully",
  });
});

// ================================
// Start Server
// ================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server Started Successfully on PORT ${PORT}`
  );
});