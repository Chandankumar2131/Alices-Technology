import api, { unwrap } from "../lib/api";

export const interviewService = {
  getAll: (params = {}) => api.get("/interviews", { params }).then(unwrap),
  getById: (id) => api.get(`/interviews/${id}`).then(unwrap),
  create: (payload) => api.post("/interviews", payload).then(unwrap),
  update: (id, payload) => api.patch(`/interviews/${id}`, payload).then(unwrap),
};
