import api, { unwrap } from "../lib/api";

export const submissionService = {
  create: (payload) => api.post("/submission/create", payload).then(unwrap),
  getMySubmissions: () =>
    api.get("/submission/my-submissions").then(unwrap),
  update: (submissionId, status) =>
    api.put(`/submission/update/${submissionId}`, { status }).then(unwrap),
  // Admin
  getAll: () => api.get("/submission/all").then(unwrap),
  getById: (submissionId) =>
    api.get(`/submission/${submissionId}`).then(unwrap),
  remove: (submissionId) =>
    api.delete(`/submission/${submissionId}`).then(unwrap),
};
