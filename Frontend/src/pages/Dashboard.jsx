import useAuth from "../hooks/useAuth";
import AdminDashboard from "./dashboard/AdminDashboard";
import EmployeeDashboard from "./dashboard/EmployeeDashboard";
import CandidateDashboard from "./candidates/CandidateDashboard";

export default function Dashboard() {
  const { isAdmin, isCandidate } = useAuth();
  if (isCandidate) return <CandidateDashboard />;
  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
}
