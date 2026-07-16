import api, { unwrap } from "../lib/api";

export const candidateService = {
  getAll: (params = {}) => api.get("/candidates", { params }).then(unwrap),
  getMe: () => api.get("/candidates/me").then(unwrap),
  create: (payload) => api.post("/candidates", payload).then(unwrap),
  update: (id, payload) => api.patch(`/candidates/${id}`, payload).then(unwrap),
  assign: (id, recruiterId) => api.patch(`/candidates/${id}/assign`, { recruiterId }).then(unwrap),
  resetPassword: (id, temporaryPassword) => api.post(`/candidates/${id}/reset-password`, { temporaryPassword }).then(unwrap),
  getApplications: (params = {}) => api.get("/candidates/applications", { params }).then(unwrap),
  getAllApplications: async (params = {}) => {
    const first = await api.get("/candidates/applications", { params: { ...params, page: 1, limit: 2000 } }).then(unwrap);
    const data = [...(first.data || [])];
    const totalPages = first.pagination?.totalPages || 1;
    for (let page = 2; page <= totalPages; page += 1) {
      const response = await api.get("/candidates/applications", { params: { ...params, page, limit: 2000 } }).then(unwrap);
      data.push(...(response.data || []));
    }
    return { ...first, count: data.length, data };
  },
  createApplication: (payload) => api.post("/candidates/applications", payload).then(unwrap),
  uploadResume: (id, payload) => api.post(`/candidates/${id}/resume`, payload).then(unwrap),
  getMyInterviews: () => api.get("/candidates/interviews").then(unwrap),
};
