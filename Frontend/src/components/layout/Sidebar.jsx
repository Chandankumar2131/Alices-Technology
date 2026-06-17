import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";
import { fullName } from "../../utils/helpers";

const linkBase = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition";
const linkClass = ({ isActive }) =>
  `${linkBase} ${
    isActive
      ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-200 ring-1 ring-cyan-400/20"
      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
  }`;

const sectionLabel = "px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-600";

export default function Sidebar() {
  const { user, role, isAdmin, isSuperAdmin } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isEmployee = !isAdmin && !isSuperAdmin;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm md:flex md:flex-col">
      <div className="mb-6 px-2 text-xl font-bold bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
        Alice's HRM Portal
      </div>

      <nav className="flex-1 space-y-1">
        <p className={sectionLabel}>Main</p>
        <NavLink to="/dashboard" className={linkClass}>📊 Dashboard</NavLink>
        <NavLink to="/attendance" className={linkClass}>🕒 My Attendance</NavLink>
        {isEmployee && (
          <>
            <NavLink to="/leaves" className={linkClass}>🌴 Leaves</NavLink>
          </>
        )}
        <NavLink to="/submissions" className={linkClass}>📋 Submissions</NavLink>
        {isEmployee && (
          <>
            <NavLink to="/payroll" className={linkClass}>💰 Payroll</NavLink>
            <NavLink to="/salary" className={linkClass}>💵 Salary</NavLink>
          </>
        )}
        <NavLink to="/profile" className={linkClass}>👤 Profile</NavLink>

        {isAdmin && (
          <>
            <p className={sectionLabel}>Admin</p>
            <NavLink to="/employees" className={linkClass}>👥 Employees</NavLink>
            <NavLink to="/leaves/manage" className={linkClass}>✅ Leave Approvals</NavLink>
            <NavLink to="/attendance/corrections" className={linkClass}>⏱ Attendance Corrections</NavLink>
            <NavLink to="/payroll/manage" className={linkClass}>🧾 Payroll Admin</NavLink>
            <NavLink to="/salary/manage" className={linkClass}>⚙️ Salary Admin</NavLink>
            <NavLink to="/submissions/manage" className={linkClass}>🗂️ All Submissions</NavLink>
            <NavLink to="/reports" className={linkClass}>📈 Reports</NavLink>
          </>
        )}

        {isSuperAdmin && (
          <>
            <p className={sectionLabel}>Super Admin</p>
            <NavLink to="/admins/create" className={linkClass}>➕ Create Admin</NavLink>
          </>
        )}
      </nav>

      <div className="mt-6 border-t border-slate-800 pt-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          {user?.image ? (
            <img
              src={user.image}
              alt="avatar"
              className="h-10 w-10 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold text-cyan-300">
              {(user?.firstName || "U").slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">{fullName(user)}</p>
            <p className="text-xs text-cyan-400">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/25"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
