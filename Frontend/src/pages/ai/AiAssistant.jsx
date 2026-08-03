import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import useAuth from "../../hooks/useAuth";
import { askAiAssistant } from "../../service/aiService";
import { getApiError } from "../../utils/apiError";

const employeeSuggestions = [
  "Summarize my attendance this month.",
  "How many leave requests do I have?",
  "Draft a professional leave request for a family event.",
  "Explain my recent attendance pattern.",
];

const adminSuggestions = [
  "Summarize today's workforce attendance.",
  "Give me a concise monthly workforce overview.",
  "Draft an interview invitation email.",
  "Create interview questions for a React developer.",
];

export default function AiAssistant() {
  const { isAdmin } = useAuth();
  const suggestions = useMemo(
    () => (isAdmin ? adminSuggestions : employeeSuggestions),
    [isAdmin]
  );
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event?.preventDefault();
    const value = prompt.trim();
    if (value.length < 3 || loading) return;

    setMessages((current) => [...current, { role: "user", text: value }]);
    setPrompt("");
    setLoading(true);
    try {
      const response = await askAiAssistant(value);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: response.data.answer },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "error",
          text: getApiError(error),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="motion-page mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Secure workspace assistant
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-50 sm:text-3xl">
          HR Assistant
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Ask about the HRM information available to your role, or draft HR
          communications and interview material. AI answers are advisory and
          never change records.
        </p>
      </div>

      <Card>
        <div className="grid gap-2 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setPrompt(suggestion)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </Card>

      <Card className="min-h-[28rem]">
        <div
          className="mb-5 flex min-h-[18rem] flex-col gap-3"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="m-auto max-w-md text-center text-sm leading-6 text-slate-500">
              Start with one of the suggestions or enter your own request.
              The assistant only receives data permitted for your signed-in role.
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[88%] whitespace-pre-wrap rounded-xl border px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto border-cyan-300/25 bg-cyan-300/10 text-cyan-50"
                  : message.role === "error"
                    ? "border-rose-300/20 bg-rose-500/10 text-rose-200"
                    : "border-white/10 bg-slate-950/40 text-slate-200"
              }`}
            >
              {message.text}
            </div>
          ))}
          {loading && (
            <div className="max-w-[88%] rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-400">
              Reviewing the permitted HRM data…
            </div>
          )}
        </div>

        <form onSubmit={submit} className="border-t border-white/10 pt-4">
          <label htmlFor="ai-prompt" className="sr-only">
            Ask the HR assistant
          </label>
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={2000}
            rows={4}
            className="theme-field w-full resize-y rounded-lg border px-3 py-3 text-sm outline-none ring-2 ring-transparent"
            placeholder="Ask about attendance, leave, workforce summaries, or draft HR content…"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">{prompt.length}/2000</span>
            <Button type="submit" loading={loading} disabled={prompt.trim().length < 3}>
              Ask assistant
            </Button>
          </div>
        </form>
      </Card>

      <p className="text-xs leading-5 text-slate-500">
        Verify important HR, payroll, attendance, and hiring information before
        acting. Do not enter passwords, API keys, or unrelated sensitive data.
      </p>
    </div>
  );
}
