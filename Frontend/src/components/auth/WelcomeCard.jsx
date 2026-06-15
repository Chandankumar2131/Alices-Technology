import { useEffect, useState } from "react";

const HEADLINE = "Welcome back ! Let's make today productive.";

const FEATURES = [
  { icon: "👥", text: "Manage your team in one place" },
  { icon: "📊", text: "Track attendance & performance" },
  { icon: "🗓️", text: "Plan leaves and schedules easily" },
];

export default function WelcomeCard() {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTyped(HEADLINE.slice(0, i));
      if (i >= HEADLINE.length) clearInterval(timer);
    }, 70);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative w-full max-w-lg overflow-hidden rounded-3xl p-10
                 bg-slate-900/60 bg-gradient-to-br from-cyan-500/5 via-slate-900/20 to-indigo-600/5
                 border border-white/5 backdrop-blur-xl animate-fade-up
                 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
    >
      {/* top accent glow line (dimmer) */}
      <div className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />

      {/* floating gradient orbs (dimmed) */}
      <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl animate-float-slow" />

      <div className="relative z-10">
        <span className="inline-flex items-center rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300/90 ring-1 ring-cyan-300/15">
          ✨ HR made simple
        </span>

        <h2 className="mt-6 min-h-[5.5rem] text-4xl font-extrabold leading-tight bg-gradient-to-r from-cyan-300/90 via-sky-200/90 to-indigo-300/90 bg-clip-text text-transparent">
          {typed}
          <span
            className="ml-0.5 inline-block w-[3px] animate-blink bg-cyan-300/80 align-middle"
            style={{ height: "1em" }}
          />
        </h2>

        <p className="mt-4 text-slate-400">
          Everything your team needs, in one streamlined dashboard.
        </p>

        <ul className="mt-10 space-y-4">
          {FEATURES.map((f, idx) => (
            <li
              key={f.text}
              className="flex items-center gap-3 text-slate-300 animate-slide-in opacity-0"
              style={{ animationDelay: `${0.6 + idx * 0.25}s` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg ring-1 ring-white/10">
                {f.icon}
              </span>
              <span className="text-sm">{f.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
