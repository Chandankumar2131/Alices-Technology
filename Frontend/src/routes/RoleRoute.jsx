import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// mode: "admin" (Admin|SuperAdmin) | "superadmin" (SuperAdmin only)
export default function RoleRoute({ mode = "admin" }) {
  const { isAdmin, isSuperAdmin } = useAuth();
  const allowed = mode === "superadmin" ? isSuperAdmin : isAdmin;
  return allowed ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
