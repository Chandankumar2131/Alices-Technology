import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import Spinner from "../components/common/Spinner";

// Phase 2 will create these pages. Lazy imports keep the bundle lean.
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const MyAttendance = lazy(() => import("../pages/attendance/MyAttendance"));
const AttendanceCorrectionsAdmin = lazy(() => import("../pages/attendance/AttendanceCorrectionsAdmin"));
const MyLeaves = lazy(() => import("../pages/leaves/MyLeaves"));
const LeaveAdmin = lazy(() => import("../pages/leaves/LeaveAdmin"));
const MyPayroll = lazy(() => import("../pages/payroll/MyPayroll"));
const PayrollAdmin = lazy(() => import("../pages/payroll/PayrollAdmin"));
const MySalary = lazy(() => import("../pages/salary/MySalary"));
const SalaryAdmin = lazy(() => import("../pages/salary/SalaryAdmin"));
const Employees = lazy(() => import("../pages/employees/Employees"));
const EmployeeDetail = lazy(() => import("../pages/employees/EmployeeDetail"));
const EmployeeDayAttendance = lazy(() => import("../pages/employees/EmployeeDayAttendance"));
const CreateAdmin = lazy(() => import("../pages/admin/CreateAdmin"));
const Holidays = lazy(() => import("../pages/admin/Holidays"));
const Reports = lazy(() => import("../pages/reports/Reports"));
const Profile = lazy(() => import("../pages/Profile"));
const Chat = lazy(() => import("../pages/chat/Chat"));
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
            <Route path="/attendance/:date" element={<EmployeeDayAttendance />} />
            <Route path="/leaves" element={<MyLeaves />} />
            <Route path="/leave-bucket" element={<Navigate to="/leaves" replace />} />
            <Route path="/payroll" element={<MyPayroll />} />
            <Route path="/salary" element={<MySalary />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat" element={<Chat />} />

            {/* Admin + SuperAdmin */}
            <Route element={<RoleRoute mode="admin" />}>
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
              <Route path="/employees/:id/attendance/:date" element={<EmployeeDayAttendance />} />
              <Route path="/leaves/manage" element={<LeaveAdmin />} />
              <Route path="/attendance/corrections" element={<AttendanceCorrectionsAdmin />} />
              <Route path="/payroll/manage" element={<PayrollAdmin />} />
              <Route path="/salary/manage" element={<SalaryAdmin />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/holidays" element={<Holidays />} />
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
