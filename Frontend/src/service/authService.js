import api, { unwrap } from "../lib/api";

export const authService = {
  login: (payload) => api.post("/auth/login", payload).then(unwrap),
  logout: () => api.post("/auth/logout").then(unwrap),
  createAdmin: (payload) =>
    api.post("/auth/create-admin", payload).then(unwrap),
  createEmployee: (payload) =>
    api.post("/auth/create-employee", payload).then(unwrap),
  getAllEmployees: () => api.get("/auth/employees").then(unwrap),
  deactivateEmployee: (id) =>
    api.patch(`/auth/deactivate/${id}`).then(unwrap),
  resetEmployeePassword: (id, temporaryPassword) =>
    api.post(`/auth/reset-employee-password/${id}`, { temporaryPassword }).then(unwrap),
  getProfile: () => api.get("/auth/profile").then(unwrap),
  updateProfile: (payload) =>
    api.put("/auth/profile/update", payload).then(unwrap),
  updateProfileDetails: (payload) =>
    api.put("/auth/profile/details", payload).then(unwrap),
  changePassword: (payload) =>
    api.post("/auth/change-password", payload).then(unwrap),
};
