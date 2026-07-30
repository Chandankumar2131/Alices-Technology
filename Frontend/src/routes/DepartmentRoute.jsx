import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function DepartmentRoute({ department }) {
  const { user, isEmployee } = useAuth();
  return isEmployee && user?.department === department ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
