import useAuth from "../../hooks/useAuth";

export default function Header() {
  const { user, role } = useAuth();
  const name = user?.firstName || "User";
  const isEmployee = role === "Employee";

  return (
    <header className="flex h-16 items-center border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Hey! Welcome, {name} 👋</h1>
        <p className="text-xs text-slate-400">
          {isEmployee
            ? "Have a good day. Let's get started with your work."
            : "Here's your workspace for today."}
        </p>
      </div>
    </header>
  );
}
