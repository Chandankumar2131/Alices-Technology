import api, { unwrap } from "../lib/api";

export const breakService = {
  start: (reason) => api.post("/break/start", { reason }).then(unwrap),
  end: () => api.post("/break/end").then(unwrap),
  getMyBreaks: () => api.get("/break/my-breaks").then(unwrap),
  getToday: () => api.get("/break/today").then(unwrap),
};
