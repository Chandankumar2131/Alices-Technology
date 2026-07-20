import api, { unwrap } from "../lib/api";

export const assessmentService = {
  getAll: () => api.get("/assessments").then(unwrap),
  create: (payload) => api.post("/assessments", payload).then(unwrap),
  update: (id, payload) => api.patch(`/assessments/${id}`, payload).then(unwrap),
};
