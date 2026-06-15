import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import Spinner from "../components/common/Spinner";

// Phase 2 will create these pages. Lazy imports keep the bundle lean.
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const MyAttendance = lazy(() => import("../pages/attendance/MyAttendance"));
const MyLeaves = lazy(() => import("../pages/leaves/MyLeaves"));
const LeaveAdmin = lazy(() => import("../pages/leaves/LeaveAdmin"));
const MyPayroll = lazy(() => import("../pages/payroll/MyPayroll"));
const PayrollAdmin = lazy(() => import("../pages/payroll/PayrollAdmin"));
const MySalary = lazy(() => import("../pages/salary/MySalary"));
const SalaryAdmin = lazy(() => import("../pages/salary/SalaryAdmin"));
const MySubmissions = lazy(() => import("../pages/submissions/MySubmissions"));
const SubmissionsAdmin = lazy(() => import("../pages/submissions/SubmissionsAdmin"));
const Employees = lazy(() => import("../pages/employees/Employees"));
const EmployeeDetail = lazy(() => import("../pages/employees/EmployeeDetail"));
const CreateAdmin = lazy(() => import("../pages/admin/CreateAdmin"));
const Reports = lazy(() => import("../pages/reports/Reports"));
const Profile = lazy(() => import("../pages/Profile"));
const AppLayout = lazy(() => import("../components/layout/AppLayout"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Spinner full />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Authenticated area */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<MyAttendance />} />
            <Route path="/leaves" element={<MyLeaves />} />
            <Route path="/payroll" element={<MyPayroll />} />
            <Route path="/salary" element={<MySalary />} />
            <Route path="/submissions" element={<MySubmissions />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin + SuperAdmin */}
            <Route element={<RoleRoute mode="admin" />}>
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
              <Route path="/leaves/manage" element={<LeaveAdmin />} />
              <Route path="/payroll/manage" element={<PayrollAdmin />} />
              <Route path="/salary/manage" element={<SalaryAdmin />} />
              <Route path="/submissions/manage" element={<SubmissionsAdmin />} />
              <Route path="/reports" element={<Reports />} />
            </Route>

            {/* SuperAdmin only */}
            <Route element={<RoleRoute mode="superadmin" />}>
              <Route path="/admins/create" element={<CreateAdmin />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
