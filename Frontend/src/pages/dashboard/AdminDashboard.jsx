import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminDashboard,
  fetchLiveEmployees,
  selectDashboard,
} from "../../features/dashboard/dashboardSlice";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import EmployeeLink from "../../components/ui/EmployeeLink";
import Spinner from "../../components/common/Spinner";
import { fmtTime, fmtMoney, fmtHours } from "../../utils/helpers";
import { useAttendanceRealtime } from "../../hooks/useAttendanceRealtime";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { adminStats, liveEmployees, loading } = useSelector(selectDashboard);

  const refreshDashboard = useCallback(() => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchLiveEmployees());
  }, [dispatch]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useAttendanceRealtime(refreshDashboard);

  if (loading && !adminStats) return <Spinner full />;

  const s = adminStats || {};

  const columns = [
    { key: "employee", header: "Employee", render: (r) => <EmployeeLink employee={r.employee} /> },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "checkIn", header: "Check In", render: (r) => fmtTime(r.checkIn) },
    { key: "checkOut", header: "Check Out", render: (r) => fmtTime(r.checkOut) },
    { key: "productiveHours", header: "Productive Hrs", render: (r) => fmtHours(r.productiveHours) },
    { key: "lateArrival", header: "Late", render: (r) => (r.lateArrival ? "⚠️ Yes" : "No") },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={s.totalEmployees ?? 0} icon="👥" />
        <StatCard label="Total Candidates" value={s.totalCandidates ?? 0} icon="🎯" accent="text-cyan-600" />
        <StatCard label="Present Today" value={s.presentToday ?? 0} icon="✅" accent="text-green-600" />
        <StatCard label="Absent Today" value={s.absentToday ?? 0} icon="❌" accent="text-red-600" />
        <StatCard label="On Leave" value={s.leaveToday ?? 0} icon="🌴" accent="text-blue-600" />
        <StatCard label="Active Breaks" value={s.activeBreaks ?? 0} icon="☕" accent="text-amber-600" />
        <StatCard label="Late Today" value={s.lateEmployees ?? 0} icon="⏰" accent="text-orange-600" />
        <StatCard label="Monthly Payroll" value={fmtMoney(s.monthlyPayroll)} icon="💰" accent="text-emerald-600" />
      </div>

      <Card title="Live Employee Status">
        <Table columns={columns} data={liveEmployees} loading={loading && !liveEmployees.length} emptyText="No attendance recorded today" />
      </Card>
    </div>
  );
}
