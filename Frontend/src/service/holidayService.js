import api, { unwrap } from "../lib/api";

export const holidayService = {
  getAll: () => api.get("/holiday").then(unwrap),
  create: (payload) => api.post("/holiday", payload).then(unwrap),
  remove: (id) => api.delete(`/holiday/${id}`).then(unwrap),
};
