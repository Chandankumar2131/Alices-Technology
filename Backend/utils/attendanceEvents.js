const emitAttendanceUpdate = (req, payload = {}) => {
  const io = req.app?.get("io");
  if (!io) return;

  const employeeId = String(payload.employeeId || req.user?.id || "");
  const event = {
    type: payload.type || "attendance",
    employeeId,
    attendanceId: payload.attendanceId ? String(payload.attendanceId) : undefined,
    attendanceDate: payload.attendanceDate,
    at: new Date().toISOString(),
  };

  io.to("role:admin").emit("attendance:updated", event);

  if (employeeId) {
    io.to(`user:${employeeId}`).emit("attendance:updated", event);
  }
};

module.exports = { emitAttendanceUpdate };
