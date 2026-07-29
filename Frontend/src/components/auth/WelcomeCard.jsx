import { useEffect, useState } from "react";

const CONTENT = {
  workforce: {
    headline: "Welcome to Alice's Tech HRM. Let's make today productive.",
    badge: "✨ HR made simple",
    description: "Everything your team needs, in one streamlined workspace.",
    features: [
      { icon: "👥", text: "Manage your team in one place" },
      { icon: "📊", text: "Track attendance and performance" },
      { icon: "🗓️", text: "Plan leaves and schedules easily" },
    ],
  },
  candidate: {
    headline: "Welcome to the Alice's Tech Candidate Portal.",
    badge: "✨ Your application journey",
    description: "Stay connected with every step of your application journey.",
    features: [
      { icon: "📄", text: "View your applications in one place" },
      { icon: "🎯", text: "Follow interview and hiring progress" },
      { icon: "🔔", text: "Stay updated on next steps" },
    ],
  },
};

export default function WelcomeCard({ portal = "workforce" }) {
  const content = CONTENT[portal] || CONTENT.workforce;
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTyped(content.headline.slice(0, i));
      if (i >= content.headline.length) clearInterval(timer);
    }, 55);
    return () => clearInterval(timer);
  }, [content.headline]);

  return (
    <div className="relative h-full w-full max-w-lg overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 bg-gradient-to-br from-cyan-500/5 via-slate-900/20 to-indigo-600/5 p-10 shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl animate-fade-up">
      <div className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl animate-float-slow" />

      <div className="relative z-10">
        <span className="inline-flex items-center rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300/90 ring-1 ring-cyan-300/15">
          {content.badge}
        </span>
        <h2 className="mt-6 min-h-[7.5rem] text-4xl font-extrabold leading-tight bg-gradient-to-r from-cyan-300/90 via-sky-200/90 to-indigo-300/90 bg-clip-text text-transparent">
          {typed}
          <span className="ml-0.5 inline-block w-[3px] animate-blink bg-amber-400 align-middle" style={{ height: "1em" }} />
        </h2>
        <p className="mt-4 text-slate-400">{content.description}</p>
        <ul className="mt-10 space-y-4">
          {content.features.map((feature, index) => (
            <li
              key={feature.text}
              className="flex items-center gap-3 text-slate-300 animate-slide-in opacity-0"
              style={{ animationDelay: `${0.6 + index * 0.25}s` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border-l-2 border-amber-400 bg-white/5 text-lg ring-1 ring-white/10">
                {feature.icon}
              </span>
              <span className="text-sm">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
