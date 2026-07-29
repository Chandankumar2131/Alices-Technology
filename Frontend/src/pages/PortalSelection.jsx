import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import logo from "../assets/1ch.png";

const portals = [
  {
    id: "workforce",
    icon: "👥",
    title: "Employee & Admin Portal",
    description: "Access HRM, attendance, leave, payroll, teams, and company records.",
    action: "Continue to HRM",
    accent: "cyan",
  },
  {
    id: "candidate",
    icon: "🚀",
    title: "Candidate Portal",
    description: "Track job applications, interview progress, assessments, and hiring updates.",
    action: "Continue to Candidate Portal",
    accent: "amber",
  },
];

export default function PortalSelection() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handlePointerMove = (event) => {
    const page = pageRef.current;
    if (!page) return;
    page.style.setProperty("--pointer-x", `${(event.clientX / window.innerWidth) * 100}%`);
    page.style.setProperty("--pointer-y", `${(event.clientY / window.innerHeight) * 100}%`);
  };

  return (
    <main
      ref={pageRef}
      onPointerMove={handlePointerMove}
      className="login-scene relative min-h-screen w-full overflow-hidden bg-animated-gradient bg-[linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]"
    >
      <div className="login-grid pointer-events-none absolute inset-0" />
      <div className="login-spotlight pointer-events-none absolute inset-0" />
      <div className="login-stars pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{
            "--star": index,
            "--star-x": `${(index * 47) % 97}%`,
            "--star-y": `${(index * 71) % 91}%`,
            "--star-size": `${2 + (index % 2)}px`,
            "--star-speed": `${3.5 + (index % 5) * 0.7}s`,
          }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6">
        <section className="relative w-full overflow-hidden rounded-3xl border border-cyan-400/25 bg-slate-900/75 p-6 shadow-[0_30px_100px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="absolute inset-x-10 top-0 h-0.5 bg-gradient-to-r from-cyan-500 via-sky-300 to-amber-400" />
          <div className="pointer-events-none absolute -left-28 -top-28 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-amber-400/8 blur-3xl" />
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10 shadow-[0_0_30px_rgba(34,211,238,.22)] ring-1 ring-cyan-300/25">
              <img
                src={logo}
                alt="Alice's Tech Solutions"
                width="64"
                height="64"
                className="h-full w-full object-contain p-2"
              />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Welcome to Alice&apos;s Tech Solutions</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-100 sm:text-4xl">Access Your Workspace</h1>
            <p className="mt-2 text-sm text-slate-400">Choose your portal to continue securely.</p>
          </div>

          <div className="relative mt-7 grid gap-5 md:grid-cols-2">
            {portals.map((portal) => (
              <button
                key={portal.id}
                type="button"
                onClick={() => navigate(`/login/${portal.id}`)}
                className={`group relative min-h-60 cursor-pointer overflow-hidden rounded-2xl border bg-slate-950/45 p-7 text-left shadow-[0_12px_35px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-1.5 hover:bg-slate-900/90 ${
                  portal.accent === "cyan"
                    ? "border-cyan-400/20 hover:border-cyan-300/60"
                    : "border-amber-400/20 hover:border-amber-300/60"
                }`}
              >
                <span className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl ${
                  portal.accent === "cyan" ? "bg-cyan-400/10" : "bg-amber-400/10"
                }`} />
                <div className="relative flex h-full flex-col">
                <span className={`flex h-13 w-13 items-center justify-center rounded-2xl text-2xl ring-1 ${
                  portal.accent === "cyan"
                    ? "bg-cyan-400/10 ring-cyan-300/25"
                    : "bg-amber-400/10 ring-amber-300/25"
                }`}>{portal.icon}</span>
                <h2 className="mt-5 text-xl font-bold text-slate-100 sm:text-2xl">{portal.title}</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{portal.description}</p>
                <span className={`mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold ${
                  portal.accent === "cyan" ? "text-cyan-300" : "text-amber-400"
                }`}>
                  {portal.action} <span className="transition group-hover:translate-x-1">→</span>
                </span>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Your account type determines which portal you can access.
          </p>
        </section>
      </div>
    </main>
  );
}
