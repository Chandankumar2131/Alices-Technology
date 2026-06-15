import api, { unwrap } from "../lib/api";

export const leaveService = {
  apply: (payload) => api.post("/leave/apply", payload).then(unwrap),
  getMyLeaves: () => api.get("/leave/my-leaves").then(unwrap),
  // Admin
  getAll: () => api.get("/leave/all").then(unwrap),
  approve: (leaveId, adminRemarks) =>
    api.patch(`/leave/approve/${leaveId}`, { adminRemarks }).then(unwrap),
  reject: (leaveId, adminRemarks) =>
    api.patch(`/leave/reject/${leaveId}`, { adminRemarks }).then(unwrap),
  getById: (leaveId) => api.get(`/leave/${leaveId}`).then(unwrap),
};
