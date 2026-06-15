import api, { unwrap } from "../lib/api";

export const attendanceService = {
  checkIn: () => api.post("/attendance/checkin").then(unwrap),
  checkOut: () => api.post("/attendance/checkout").then(unwrap),
  getMyAttendance: () => api.get("/attendance/my-attendance").then(unwrap),
  getByMonth: (month, year) =>
    api.get("/attendance/month", { params: { month, year } }).then(unwrap),
  getSummary: () => api.get("/attendance/summary").then(unwrap),
  // Admin
  getAll: () => api.get("/attendance/all").then(unwrap),
  getEmployeeAttendance: (employeeId) =>
    api.get(`/attendance/employee/${employeeId}`).then(unwrap),
};
