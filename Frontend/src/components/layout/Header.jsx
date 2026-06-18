import useAuth from "../../hooks/useAuth";

export default function Header({ onMenuClick }) {
  const { user, role } = useAuth();
  const name = user?.firstName || "User";
  const isEmployee = role === "Employee";
  const roleLabel = role === "SuperAdmin" ? "Super Admin" : role || "User";
  const title = isEmployee ? `Hey ! Welcome, ${name} 👋` : `Welcome ${roleLabel} 🌟`;
  const subtitle = isEmployee
    ? "Have a good day. Let's get started with your work."
    : "Here are today's records and team updates for you.";

  return (
    <header className="flex min-h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/80 px-3 py-3 backdrop-blur-sm sm:px-5 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 text-slate-200 md:hidden"
        aria-label="Open navigation"
      >
        ☰
      </button>
      <div className="min-w-0">
        <h1 className="break-words text-base font-semibold leading-tight text-slate-100 sm:text-lg">{title}</h1>
        <p className="mt-0.5 text-xs leading-snug text-slate-400">{subtitle}</p>
      </div>
    </header>
  );
}
