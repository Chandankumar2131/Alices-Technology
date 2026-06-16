import useAuth from "../../hooks/useAuth";

export default function Header() {
  const { user, role } = useAuth();
  const name = user?.firstName || "User";
  const isEmployee = role === "Employee";
  const roleLabel = role === "SuperAdmin" ? "Super Admin" : role || "User";
  const title = isEmployee ? `Hey ! Welcome, ${name} 👋` : `Welcome ${roleLabel} 🌟`;
  const subtitle = isEmployee
    ? "Have a good day. Let's get started with your work."
    : "Here are today's records and team updates for you.";

  return (
    <header className="flex h-16 items-center border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </header>
  );
}
