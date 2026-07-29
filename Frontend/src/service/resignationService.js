import api, { unwrap } from "../lib/api";

export const resignationService = {
  getAll: (params = {}) => api.get("/resignations", { params }).then(unwrap),
  review: (employeeId, payload) => api.patch(`/resignations/${employeeId}/review`, payload).then(unwrap),
  updateHandover: (employeeId, payload) => api.patch(`/resignations/${employeeId}/handover`, payload).then(unwrap),
};
