import api, { unwrap } from "../lib/api";

export const attendanceService = {
  checkIn: () => api.post("/attendance/checkin").then(unwrap),
  checkOut: () => api.post("/attendance/checkout").then(unwrap),
  getMyAttendance: () => api.get("/attendance/my-attendance").then(unwrap),
  getByMonth: (month, year) =>
    api.get("/attendance/month", { params: { month, year } }).then(unwrap),
  getSummary: () => api.get("/attendance/summary").then(unwrap),
  requestCorrection: (payload) => api.post("/attendance/corrections", payload).then(unwrap),
  getMyCorrections: () => api.get("/attendance/corrections/my").then(unwrap),
  // Admin
  getAll: () => api.get("/attendance/all").then(unwrap),
  getEmployeeAttendance: (employeeId) =>
    api.get(`/attendance/employee/${employeeId}`).then(unwrap),
  getAllCorrections: () => api.get("/attendance/corrections/all").then(unwrap),
  approveCorrection: (requestId, adminRemarks) =>
    api.patch(`/attendance/corrections/approve/${requestId}`, { adminRemarks }).then(unwrap),
  rejectCorrection: (requestId, adminRemarks) =>
    api.patch(`/attendance/corrections/reject/${requestId}`, { adminRemarks }).then(unwrap),
};
