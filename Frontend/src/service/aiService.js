import api, { unwrap } from "../lib/api";

export const askAiAssistant = async (prompt) =>
  unwrap(await api.post("/ai/assistant", { prompt }));

export const summarizeCandidate = async (candidateId) =>
  unwrap(await api.post(`/ai/candidates/${candidateId}/summary`));
