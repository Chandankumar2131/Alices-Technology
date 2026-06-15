import useAuth from "../hooks/useAuth";
import AdminDashboard from "./dashboard/AdminDashboard";
import EmployeeDashboard from "./dashboard/EmployeeDashboard";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
}
