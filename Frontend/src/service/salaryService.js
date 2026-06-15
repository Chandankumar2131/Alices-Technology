import api, { unwrap } from "../lib/api";

export const salaryService = {
  // Admin
  create: (payload) => api.post("/salary/create", payload).then(unwrap),
  update: (employeeId, payload) =>
    api.put(`/salary/update/${employeeId}`, payload).then(unwrap),
  getByEmployee: (employeeId) =>
    api.get(`/salary/${employeeId}`).then(unwrap),
  // Employee
  getMySalary: () => api.get("/salary/my-salary").then(unwrap),
};
