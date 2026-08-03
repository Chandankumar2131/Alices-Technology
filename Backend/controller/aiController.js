const mongoose = require("mongoose");
const AiAuditLog = require("../model/AiAuditLog");
const Candidate = require("../model/Candidate");
const { buildAssistantContext } = require("../services/aiContextService");
const {
  askAssistant,
  getAiModel,
  summarizeCandidate,
} = require("../services/openaiService");

const cleanPrompt = (value) =>
  typeof value === "string" ? value.trim().replace(/\0/g, "") : "";

const writeAudit = (data) =>
  AiAuditLog.create(data).catch((error) =>
    console.error("AI audit log failed:", error.message)
  );

const aiError = (error, res) => {
  const configurationError = error.code === "AI_NOT_CONFIGURED";
  const rateLimited = error.status === 429;
  const status = configurationError ? 503 : rateLimited ? 429 : 502;
  return res.status(status).json({
    success: false,
    message: configurationError
      ? "The AI assistant is not configured yet."
      : rateLimited
        ? "The AI service is busy. Please try again shortly."
        : "The AI assistant could not complete this request.",
  });
};

exports.assistant = async (req, res) => {
  const prompt = cleanPrompt(req.body?.prompt);
  if (prompt.length < 3 || prompt.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "Prompt must contain between 3 and 2000 characters.",
    });
  }

  const audit = {
    user: req.user.id,
    accountType: req.user.accountType,
    action: "assistant",
    model: getAiModel(),
    promptCharacters: prompt.length,
  };

  try {
    const context = await buildAssistantContext(req.user);
    const result = await askAssistant({ prompt, context });
    await writeAudit({
      ...audit,
      status: "success",
      responseCharacters: result.text.length,
      requestId: result.requestId,
    });
    return res.status(200).json({
      success: true,
      data: { answer: result.text, requestId: result.requestId },
    });
  } catch (error) {
    await writeAudit({
      ...audit,
      status: "failed",
      errorCode: error.code || String(error.status || "AI_ERROR"),
    });
    console.error("AI assistant error:", error.message);
    return aiError(error, res);
  }
};

exports.candidateSummary = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.candidateId)) {
    return res.status(400).json({ success: false, message: "Invalid candidate ID." });
  }

  const audit = {
    user: req.user.id,
    accountType: req.user.accountType,
    action: "candidate_summary",
    targetId: req.params.candidateId,
    model: getAiModel(),
  };

  try {
    const candidate = await Candidate.findById(req.params.candidateId)
      .select(
        "candidateId primaryJobRole experience skills location resumeStatus notes"
      )
      .populate("user", "firstName lastName")
      .lean();
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found." });
    }

    const result = await summarizeCandidate(candidate);
    await writeAudit({
      ...audit,
      status: "success",
      responseCharacters: result.text.length,
      requestId: result.requestId,
    });
    return res.status(200).json({
      success: true,
      data: { summary: result.text, requestId: result.requestId },
    });
  } catch (error) {
    await writeAudit({
      ...audit,
      status: "failed",
      errorCode: error.code || String(error.status || "AI_ERROR"),
    });
    console.error("AI candidate summary error:", error.message);
    return aiError(error, res);
  }
};
