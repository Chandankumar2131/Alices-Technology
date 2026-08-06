import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import useAuth from "../../hooks/useAuth";
import { askAiAssistant } from "../../service/aiService";
import { getApiError } from "../../utils/apiError";

const employeeSuggestions = [
  {
    icon: "calendar",
    label: "Attendance",
    title: "Monthly attendance summary",
    prompt: "Summarize my attendance this month and highlight late arrivals or half days.",
  },
  {
    icon: "leave",
    label: "Leave",
    title: "Review my leave information",
    prompt: "Explain my current leave balance and summarize my leave requests.",
  },
  {
    icon: "insight",
    label: "Insights",
    title: "Understand my work pattern",
    prompt: "Explain my recent attendance pattern in a clear and constructive way.",
  },
  {
    icon: "draft",
    label: "Writing",
    title: "Draft an HR request",
    prompt: "Draft a professional leave request for a family event.",
  },
];

const adminSuggestions = [
  {
    icon: "workforce",
    label: "Workforce",
    title: "Today's workforce overview",
    prompt: "Summarize today's workforce attendance and highlight anything that needs attention.",
  },
  {
    icon: "insight",
    label: "Analytics",
    title: "Monthly workforce insights",
    prompt: "Give me a concise monthly workforce overview with attendance and productivity trends.",
  },
  {
    icon: "interview",
    label: "Hiring",
    title: "Prepare interview questions",
    prompt: "Create structured interview questions for a React developer.",
  },
  {
    icon: "draft",
    label: "Communication",
    title: "Draft an interview invitation",
    prompt: "Draft a professional interview invitation email with placeholders for date and time.",
  },
];

export default function AiAssistant() {
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const hasAdminScope = isAdmin || isSuperAdmin;
  const suggestions = useMemo(
    () => (hasAdminScope ? adminSuggestions : employeeSuggestions),
    [hasAdminScope]
  );
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const conversationEndRef = useRef(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

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
        { role: "error", text: getApiError(error) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setPrompt(suggestion.prompt);
    document.getElementById("ai-prompt")?.focus();
  };

  const copyMessage = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const onPromptKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="motion-page mx-auto w-full max-w-6xl space-y-5">
      <section className="theme-accent-border relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 via-slate-900/90 to-violet-500/10 p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/25 bg-cyan-300/15 text-cyan-200 shadow-lg shadow-cyan-950/30">
              <SparklesIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Alice Intelligence
                </p>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  Secure
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                Your intelligent HR workspace
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {hasAdminScope
                  ? "Turn permitted workforce information into concise summaries, insights, and professional HR communication."
                  : "Understand your attendance and leave information, or create polished workplace communication in seconds."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <TrustPill icon={<ShieldIcon />} label="Role-aware" />
            <TrustPill icon={<EyeIcon />} label="Read-only" />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100">Quick actions</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Suggestions personalized for {hasAdminScope ? "administrators" : "employees"}
            </p>
          </div>
          <span className="hidden text-xs text-slate-400 sm:block">Select a card to start</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.title}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className="group min-h-36 rounded-xl border border-white/10 bg-slate-900/70 p-4 text-left shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-cyan-300/[0.07] hover:shadow-cyan-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-cyan-300 transition group-hover:border-cyan-300/25 group-hover:bg-cyan-300/10">
                  <SuggestionIcon name={suggestion.icon} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 group-hover:text-cyan-300">
                  {suggestion.label}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-5 text-slate-200 group-hover:text-white">
                {suggestion.title}
              </p>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-400">
                {suggestion.prompt}
              </p>
            </button>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden !p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/25 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 text-slate-950">
              <SparklesIcon className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-100">HR Assistant</h2>
              <p className="text-xs text-slate-400">
                Signed in as {user?.firstName || (hasAdminScope ? "Administrator" : "Employee")}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              disabled={loading}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-rose-300/25 hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"
            >
              Clear conversation
            </button>
          )}
        </div>

        <div className="flex min-h-[25rem] max-h-[36rem] flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 && !loading && (
            <div className="m-auto max-w-xl py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 to-violet-400/10 text-cyan-300">
                <ChatIcon className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-200">How can I help today?</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Ask a question in your own words or choose a quick action above. I only receive HRM information permitted for your signed-in role.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {(hasAdminScope
                  ? ["Workforce insights", "Hiring support", "HR drafting"]
                  : ["Attendance", "Leave guidance", "HR drafting"]
                ).map((item) => (
                  <span key={item} className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isError = message.role === "error";
            return (
              <div key={`${message.role}-${index}`} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isError ? "bg-rose-400/15 text-rose-300" : "bg-cyan-300/15 text-cyan-300"}`}>
                    {isError ? <AlertIcon /> : <SparklesIcon className="h-4 w-4" />}
                  </span>
                )}
                <div className={`group max-w-[88%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
                  <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 ${isUser ? "text-right" : "text-left"}`}>
                    {isUser ? "You" : isError ? "Unable to respond" : "Alice AI"}
                  </p>
                  <div className={`whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm leading-6 shadow-lg ${
                    isUser
                      ? "rounded-br-md border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
                      : isError
                        ? "rounded-bl-md border-rose-300/20 bg-rose-500/10 text-rose-200"
                        : "rounded-bl-md border-white/10 bg-slate-950/50 text-slate-200"
                  }`}>
                    {message.text}
                  </div>
                  {!isUser && !isError && (
                    <button
                      type="button"
                      onClick={() => copyMessage(message.text, index)}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                    >
                      <CopyIcon /> {copied === index ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-2.5">
              <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/15 text-cyan-300">
                <SparklesIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Alice AI</p>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-slate-950/50 px-4 py-4">
                  {[0, 1, 2].map((item) => (
                    <span key={item} className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" style={{ animationDelay: `${item * 120}ms` }} />
                  ))}
                  <span className="ml-2 text-xs text-slate-400">Reviewing permitted HRM data</span>
                </div>
              </div>
            </div>
          )}
          <div ref={conversationEndRef} />
        </div>

        <form onSubmit={submit} className="border-t border-white/10 bg-slate-950/20 p-4 sm:p-5">
          <div className="rounded-xl border border-white/10 bg-slate-950/55 p-2 shadow-inner shadow-black/20 transition focus-within:border-cyan-300/40 focus-within:ring-2 focus-within:ring-cyan-300/10">
            <label htmlFor="ai-prompt" className="sr-only">Ask the HR assistant</label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={onPromptKeyDown}
              maxLength={2000}
              rows={3}
              className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-400"
              placeholder={hasAdminScope ? "Ask about workforce trends, hiring, or HR communication..." : "Ask about your attendance, leave, or workplace communication..."}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-1 pt-2">
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>{prompt.length}/2000</span>
                <span className="hidden sm:inline">Enter to send · Shift + Enter for new line</span>
              </div>
              <Button type="submit" loading={loading} disabled={prompt.trim().length < 3} className="!min-h-9 !rounded-lg !px-4 !py-1.5">
                <SendIcon /> Ask Alice
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-400">
            <ShieldIcon />
            <p>AI answers are advisory and read-only. Verify important HR, payroll, attendance, and hiring information before acting.</p>
          </div>
        </form>
      </Card>
    </div>
  );
}

function TrustPill({ icon, label }) {
  return (
    <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs font-semibold text-slate-300 backdrop-blur">
      <span className="text-cyan-300">{icon}</span>{label}
    </span>
  );
}

function SuggestionIcon({ name }) {
  const icons = {
    calendar: <CalendarIcon />,
    leave: <LeaveIcon />,
    insight: <InsightIcon />,
    draft: <DraftIcon />,
    workforce: <WorkforceIcon />,
    interview: <InterviewIcon />,
  };
  return icons[name] || <SparklesIcon className="h-4 w-4" />;
}

const Icon = ({ children, className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>
);
const SparklesIcon = ({ className }) => <Icon className={className}><path d="m12 3 1.1 3.4a5 5 0 0 0 3.2 3.2L20 11l-3.7 1.4a5 5 0 0 0-3.2 3.2L12 19l-1.1-3.4a5 5 0 0 0-3.2-3.2L4 11l3.7-1.4a5 5 0 0 0 3.2-3.2L12 3Z"/><path d="m19 3 .4 1.2a2 2 0 0 0 1.3 1.3L22 6l-1.3.5a2 2 0 0 0-1.3 1.3L19 9l-.4-1.2a2 2 0 0 0-1.3-1.3L16 6l1.3-.5a2 2 0 0 0 1.3-1.3L19 3Z"/></Icon>;
const ShieldIcon = () => <Icon><path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></Icon>;
const EyeIcon = () => <Icon><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></Icon>;
const ChatIcon = ({ className }) => <Icon className={className}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/></Icon>;
const CalendarIcon = () => <Icon><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></Icon>;
const LeaveIcon = () => <Icon><path d="M5 21h14M7 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M9 8h6M9 12h6M9 16h3"/></Icon>;
const InsightIcon = () => <Icon><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="m3 7 6-4 6 5 6-5"/></Icon>;
const DraftIcon = () => <Icon><path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9"/><path d="M17.5 2.5a2.1 2.1 0 0 1 3 3L12 14l-4 1 1-4 8.5-8.5Z"/></Icon>;
const WorkforceIcon = () => <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const InterviewIcon = () => <Icon><path d="M8 3h8l2 3v15H6V6l2-3Z"/><path d="M9 11h6M9 15h4M9 7h6"/></Icon>;
const AlertIcon = () => <Icon><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></Icon>;
const CopyIcon = () => <Icon className="h-3.5 w-3.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>;
const SendIcon = () => <Icon><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></Icon>;
