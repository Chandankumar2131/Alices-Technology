import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/common/Spinner";

export default function ProtectedRoute() {
  const { initialized, isAuthenticated } = useAuth();

  if (!initialized) {
    return <Spinner full />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
