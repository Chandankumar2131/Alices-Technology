import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import useAuth from "../../hooks/useAuth";
import { fullName } from "../../utils/helpers";

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition";
const linkClass = ({ isActive }) =>
  `${linkBase} ${
    isActive
      ? "bg-cyan-300/12 text-cyan-100 ring-1 ring-cyan-300/25 shadow-[0_10px_24px_rgba(8,145,178,0.12)]"
      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
  }`;

const createAdminLinkClass = ({ isActive }) =>
  `group relative mt-2 flex items-center gap-3 overflow-hidden rounded-lg border px-3 py-3 text-sm font-bold transition ${
    isActive
      ? "border-cyan-200/45 bg-cyan-300 text-slate-950 shadow-[0_16px_34px_rgba(34,211,238,0.22)]"
      : "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_12px_28px_rgba(8,145,178,0.14)] hover:border-cyan-200/45 hover:bg-cyan-300/18 hover:text-white"
  }`;

const sectionLabel =
  "px-3 pt-5 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400";

export default function Sidebar({
  chatUnreadCount = 0,
  adminNotifications = {},
  mobileOpen = false,
  onChatClick = () => {},
  onMobileClose = () => {},
}) {
  const { user, role, isAdmin, isSuperAdmin, isCandidate } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isEmployee = role === "Employee";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const renderCount = (count) =>
    count > 0 ? (
      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cyan-300 px-1.5 text-[0.65rem] font-bold text-slate-950">
        {count > 9 ? "9+" : count}
      </span>
    ) : null;

  const content = (
    <>
      <div className="mb-6 flex shrink-0 items-center justify-between gap-3 px-2">
        <div className="min-w-0">
          <div className="truncate text-lg font-bold tracking-tight text-slate-50">
            Alice's Tech Solutions
          </div>
          <div className="mt-0.5 text-xs font-medium text-cyan-200/80">
           HRM - Workforce Portal
          </div>
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-300/30 md:hidden"
          aria-label="Close navigation"
        >
          x
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        <p className={sectionLabel}>Main</p>
        <NavLink to="/dashboard" onClick={onMobileClose} className={linkClass}>Dashboard</NavLink>
        {isCandidate && <NavLink to="/my-applications" onClick={onMobileClose} className={linkClass}>My Applications</NavLink>}
        {!isCandidate && <NavLink to="/attendance" onClick={onMobileClose} className={linkClass}>My Attendance</NavLink>}
        {isEmployee && <NavLink to="/leaves" onClick={onMobileClose} className={linkClass}>Leaves</NavLink>}
        {isEmployee && (
          <>
            <NavLink to="/payroll" onClick={onMobileClose} className={linkClass}>Payroll</NavLink>
            <NavLink to="/salary" onClick={onMobileClose} className={linkClass}>Salary</NavLink>
          </>
        )}
        {isEmployee && <NavLink to="/my-candidates" onClick={onMobileClose} className={linkClass}>My Candidates</NavLink>}
        {!isCandidate && <NavLink to="/profile" onClick={onMobileClose} className={linkClass}>Profile</NavLink>}
        {!isCandidate && <NavLink to="/interviews" onClick={onMobileClose} className={linkClass}>Interviews</NavLink>}
        {!isCandidate && <NavLink
          to="/chat"
          onClick={() => {
            onChatClick();
            onMobileClose();
          }}
          className={linkClass}
        >
          <span className="min-w-0 flex-1">Chat</span>
          {chatUnreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cyan-300 px-1.5 text-[0.65rem] font-bold text-slate-950">
              {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
            </span>
          )}
        </NavLink>}

        {isAdmin && (
          <>
            <p className={sectionLabel}>Admin</p>
            <NavLink to="/employees" onClick={onMobileClose} className={linkClass}>Employees</NavLink>
            <NavLink to="/candidates" onClick={onMobileClose} className={linkClass}>Candidates</NavLink>
            <NavLink to="/leaves/manage" onClick={onMobileClose} className={linkClass}>
              <span className="min-w-0 flex-1">Leave Approvals</span>
              {renderCount(adminNotifications.pendingLeaves || 0)}
            </NavLink>
            <NavLink to="/attendance/corrections" onClick={onMobileClose} className={linkClass}>
              <span className="min-w-0 flex-1">Attendance Corrections</span>
              {renderCount(adminNotifications.pendingAttendanceCorrections || 0)}
            </NavLink>
            <NavLink to="/payroll/manage" onClick={onMobileClose} className={linkClass}>Payroll Admin</NavLink>
            <NavLink to="/salary/manage" onClick={onMobileClose} className={linkClass}>Salary Admin</NavLink>
            <NavLink to="/reports" onClick={onMobileClose} className={linkClass}>Reports</NavLink>
            <NavLink to="/holidays" onClick={onMobileClose} className={linkClass}>Holidays</NavLink>
          </>
        )}

        {isSuperAdmin && (
          <>
            <p className={sectionLabel}>Super Admin</p>
            <NavLink to="/admins/create" onClick={onMobileClose} className={createAdminLinkClass}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-lg leading-none ring-1 ring-white/20">
                +
              </span>
              <span className="min-w-0">
                <span className="block truncate">Create Admin</span>
                <span className="block truncate text-xs font-medium opacity-70">Add privileged user</span>
              </span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="mt-6 shrink-0 border-t border-slate-800 pt-4">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 shadow-inner shadow-black/10">
          {user?.image ? (
            <img
              src={user.image}
              alt=""
              width="40"
              height="40"
              className="h-10 w-10 rounded-lg border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-cyan-300/10 text-sm font-semibold text-cyan-200">
              {(user?.firstName || "U").slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">{fullName(user)}</p>
            {!isCandidate && <p className="text-xs text-cyan-300/85">{role}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg border border-rose-300/15 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-200 transition hover:border-rose-300/30 hover:bg-rose-500/18"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="theme-sidebar hidden h-dvh w-64 shrink-0 border-r p-4 shadow-[12px_0_40px_rgba(0,0,0,0.18)] backdrop-blur-xl md:flex md:flex-col">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={onMobileClose}
            aria-label="Close navigation overlay"
          />
          <aside className="theme-sidebar relative flex h-full w-[min(20rem,85vw)] flex-col border-r p-4 shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
