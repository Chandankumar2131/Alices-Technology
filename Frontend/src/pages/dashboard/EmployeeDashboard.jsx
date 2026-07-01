import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyDashboard, selectDashboard } from "../../features/dashboard/dashboardSlice";
import { selectUser } from "../../features/auth/authSlice";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Table from "../../components/common/Table";
import Spinner from "../../components/common/Spinner";
import { fmtTime, fmtMoney, fmtDate, fmtHours } from "../../utils/helpers";
import { useAttendanceRealtime } from "../../hooks/useAttendanceRealtime";

const getWorkState = ({ attendance, activeBreak }) => {
  if (!attendance) {
    return {
      label: "Not Checked In",
      tone: "border-slate-600 bg-slate-800/60 text-slate-100",
      detail: "No attendance recorded for today",
    };
  }

  if (attendance.status === "Leave") {
    return {
      label: "On Leave",
      tone: "border-blue-400/35 bg-blue-500/10 text-blue-100",
      detail: "Approved leave for today",
    };
  }

  if (attendance.checkOut) {
    return {
      label: "Checked Out",
      tone: "border-slate-500/35 bg-slate-700/50 text-slate-100",
      detail: `Checked out at ${fmtTime(attendance.checkOut)}`,
    };
  }

  if (activeBreak) {
    return {
      label: "On Break",
      tone: "border-amber-300/35 bg-amber-400/10 text-amber-100",
      detail: "Break is currently active",
    };
  }

  return {
    label: "Working",
    tone: "border-emerald-300/35 bg-emerald-400/10 text-emerald-100",
    detail: `Checked in at ${fmtTime(attendance.checkIn)}`,
  };
};

export default function EmployeeDashboard() {
  const dispatch = useDispatch();
  const { myDashboard, loading } = useSelector(selectDashboard);
  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id || currentUser?.id;

  const refreshDashboard = useCallback(() => {
    dispatch(fetchMyDashboard());
  }, [dispatch]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useAttendanceRealtime(refreshDashboard, { employeeId: currentUserId });

  if (loading && !myDashboard) return <Spinner full />;

  const s = myDashboard || {};
  const todayAtt = s.attendance;
  const leaves = s.leaves || {};
  const payroll = s.latestPayroll;
  const workState = getWorkState({ attendance: todayAtt, activeBreak: s.activeBreak });
  const presentThisMonth = s.monthlyAttendance?.present ?? 0;

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <Link
          to={`/attendance/${r.attendanceDate}`}
          className="font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          {fmtDate(r.attendanceDate)}
        </Link>
      ),
    },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "checkIn", header: "Check In", render: (r) => fmtTime(r.checkIn) },
    { key: "checkOut", header: "Check Out", render: (r) => fmtTime(r.checkOut) },
    { key: "productiveHours", header: "Productive Hrs", render: (r) => fmtHours(r.productiveHours) },
  ];

  return (
    <div className="space-y-6">
      <Card className={`border ${workState.tone}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Current Status</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-50">{workState.label}</h2>
            <p className="mt-2 text-sm text-slate-300">{workState.detail}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <p className="text-xs text-slate-400">Check In</p>
              <p className="mt-1 font-semibold">{fmtTime(todayAtt?.checkIn)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <p className="text-xs text-slate-400">Check Out</p>
              <p className="mt-1 font-semibold">{fmtTime(todayAtt?.checkOut)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <p className="text-xs text-slate-400">Breaks</p>
              <p className="mt-1 font-semibold">{Math.round(s.totalBreakMinutes ?? 0)} min</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <p className="text-xs text-slate-400">Work Hours</p>
              <p className="mt-1 font-semibold">{fmtHours(s.liveProductiveHours)}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="This Month Attendance" value={presentThisMonth} icon="✅" accent="text-green-600" />
        <StatCard label="Pending Leaves" value={leaves.pending ?? 0} icon="📝" accent="text-amber-600" />
        <StatCard label="Approved Leaves" value={leaves.approved ?? 0} icon="☑️" accent="text-emerald-600" />
        <StatCard
          label="Last Credited Salary"
          value={fmtMoney(payroll?.netSalary)}
          icon="💰"
          accent="text-emerald-600"
        />
      </div>

      <Card title="Recent Attendance">
        <Table
          columns={columns}
          data={s.recentAttendance || []}
          loading={loading && !s.recentAttendance}
          emptyText="No attendance records found"
        />
      </Card>
    </div>
  );
}
