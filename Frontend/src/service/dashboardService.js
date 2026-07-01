import api, { unwrap } from "../lib/api";

export const dashboardService = {
  // Admin
  getAdmin: () => api.get("/dashboard/admin").then(unwrap),
  getAdminNotifications: () =>
    api.get("/dashboard/admin-notifications").then(unwrap),
  getLiveEmployees: () => api.get("/dashboard/live-employees").then(unwrap),
  getDepartmentAnalytics: () =>
    api.get("/dashboard/department-analytics").then(unwrap),
  getTodayAttendance: () =>
    api.get("/dashboard/today-attendance").then(unwrap),
  getOnBreak: () => api.get("/dashboard/on-break").then(unwrap),
  getLateEmployees: () => api.get("/dashboard/late-employees").then(unwrap),
  getEmployeeDashboard: (employeeId) =>
    api.get(`/dashboard/employee/${employeeId}`).then(unwrap),
  getEmployeeTimeline: (employeeId) =>
    api.get(`/dashboard/employee/${employeeId}/timeline`).then(unwrap),
  getEmployeeDayDetail: (employeeId, date) =>
    api.get(`/dashboard/employee/${employeeId}/day/${date}`).then(unwrap),
  getEmployeeDetail: (employeeId) =>
    api.get(`/dashboard/employee/${employeeId}/detail`).then(unwrap),
  // Employee
  getMyDashboard: () =>
    api.get("/dashboard/employee-dashboard").then(unwrap),
  getMyDayDetail: (date) =>
    api.get(`/dashboard/employee-dashboard/day/${date}`).then(unwrap),
};
