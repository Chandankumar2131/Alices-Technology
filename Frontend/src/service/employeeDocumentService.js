import api, { unwrap } from "../lib/api";

export const employeeDocumentService = {
  getMine: () => api.get("/documents/my").then(unwrap),
  getForEmployee: (employeeId) => api.get(`/documents/employee/${employeeId}`).then(unwrap),
  upload: (payload) => api.post("/documents/my", payload).then(unwrap),
  remove: (id) => api.delete(`/documents/my/${id}`).then(unwrap),
  review: (id, payload) => api.patch(`/documents/${id}/review`, payload).then(unwrap),
  accessUrl: (id) => `${api.defaults.baseURL}/documents/${id}/access`,
};
