import useAuth from "../../hooks/useAuth";

export default function Header({ onMenuClick }) {
  const { user, role } = useAuth();
  const name = user?.firstName || "User";
  const isEmployee = role === "Employee";
  const roleLabel = role === "SuperAdmin" ? "Super Admin" : role || "User";
  const title = isEmployee ? `Welcome back, ${name}` : `${roleLabel} Workspace`;
  const subtitle = isEmployee
    ? "Your attendance, leaves, and payroll are ready."
    : "Track today's records, approvals, and team activity from one place.";

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-white/10 bg-slate-950/72 px-3 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-5 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-xs font-semibold uppercase tracking-[0.08em] text-slate-200 transition hover:border-cyan-300/40 hover:bg-slate-800 md:hidden"
        aria-label="Open navigation"
      >
        Menu
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="break-words text-base font-semibold leading-tight text-slate-50 sm:text-lg">{title}</h1>
        <p className="mt-0.5 text-xs leading-snug text-slate-400 sm:text-sm">{subtitle}</p>
      </div>
      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-100 sm:flex">
        {roleLabel}
      </div>
    </header>
  );
}
