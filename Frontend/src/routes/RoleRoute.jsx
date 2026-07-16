import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// admin: Admin|SuperAdmin, superadmin: SuperAdmin, employee/candidate: exact role,
// workforce: every internal HRM role except Candidate.
export default function RoleRoute({ mode = "admin" }) {
  const { isAdmin, isSuperAdmin, isEmployee, isCandidate } = useAuth();
  const allowed = mode === "superadmin"
    ? isSuperAdmin
    : mode === "employee"
      ? isEmployee
      : mode === "candidate"
        ? isCandidate
        : mode === "workforce"
          ? !isCandidate
          : isAdmin;
  return allowed ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
