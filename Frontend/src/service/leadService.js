import api, { unwrap } from "../lib/api";

export const leadService = {
  getAll: (params = {}) => api.get("/leads", { params }).then(unwrap),
  getSalesEmployees: () => api.get("/leads/sales-employees").then(unwrap),
  getLeadEmployees: () => api.get("/leads/lead-employees").then(unwrap),
  getSalesActivities: (params = {}) => api.get("/leads/sales-activities", { params }).then(unwrap),
  create: (payload) => api.post("/leads", payload).then(unwrap),
  forward: (leadId, salesEmployeeId) => api.patch(`/leads/${leadId}/forward`, { salesEmployeeId }).then(unwrap),
  updateSales: (leadId, payload) => api.patch(`/leads/${leadId}/sales`, payload).then(unwrap),
};
