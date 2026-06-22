import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDeptAnalytics,
  fetchLateEmployees,
  fetchOnBreak,
  fetchLiveEmployees,
  selectDashboard,
} from "../../features/dashboard/dashboardSlice";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import EmployeeLink from "../../components/ui/EmployeeLink";
import { fmtHours, fmtTime } from "../../utils/helpers";

export default function Reports() {
  const dispatch = useDispatch();
  const { deptAnalytics, lateEmployees, onBreak, liveEmployees } = useSelector(selectDashboard);

  useEffect(() => {
    dispatch(fetchDeptAnalytics());
    dispatch(fetchLateEmployees());
    dispatch(fetchOnBreak());
    dispatch(fetchLiveEmployees());
  }, [dispatch]);

  const lateCols = [
    { key: "employee", header: "Employee", render: (r) => <EmployeeLink employee={r.employee} /> },
    { key: "checkIn", header: "Check In", render: (r) => fmtTime(r.checkIn) },
    { key: "dept", header: "Department", render: (r) => r.employee?.department || "—" },
  ];

  const breakCols = [
    { key: "employee", header: "Employee", render: (r) => <EmployeeLink employee={r.employee} /> },
    { key: "reason", header: "Reason" },
    { key: "breakStart", header: "Since", render: (r) => fmtTime(r.breakStart) },
  ];

  const activityCols = [
    { key: "employee", header: "Employee", render: (r) => <EmployeeLink employee={r.employee} /> },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "checkIn", header: "Login", render: (r) => fmtTime(r.checkIn) },
    { key: "checkOut", header: "Logout", render: (r) => fmtTime(r.checkOut) },
    {
      key: "totalBreakMinutes",
      header: "Total Break",
      render: (r) => `${Math.round(r.totalBreakMinutes ?? 0)} min`,
    },
    { key: "productiveHours", header: "Productive Hrs", render: (r) => fmtHours(r.productiveHours) },
  ];

  const totalEmployees = deptAnalytics.reduce(
    (sum, dept) => sum + Number(dept.totalEmployees || 0),
    0
  );
  const activeToday = liveEmployees.length;
  const lateToday = lateEmployees.length;
  const breaksNow = onBreak.length;
  const topDepartment = deptAnalytics.reduce(
    (top, dept) =>
      Number(dept.totalEmployees || 0) > Number(top?.totalEmployees || 0) ? dept : top,
    null
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetric label="Total Employees" value={totalEmployees} tone="cyan" />
        <ReportMetric label="Active Today" value={activeToday} tone="emerald" />
        <ReportMetric label="Late Today" value={lateToday} tone="amber" />
        <ReportMetric label="On Break Now" value={breaksNow} tone="indigo" />
      </div>

      <Card
        title="Department Analytics"
        action={
          topDepartment && (
            <span className="theme-report-chip rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              Top: {topDepartment._id || "No Department"}
            </span>
          )
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {deptAnalytics?.length ? deptAnalytics.map((dept) => {
            const count = Number(dept.totalEmployees || 0);
            const percentage = totalEmployees ? Math.round((count / totalEmployees) * 100) : 0;

            return (
              <div
                key={dept._id || "none"}
                className="theme-dept-card rounded-lg border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {dept._id || "No Department"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{percentage}% of team</p>
                  </div>
                  <p className="text-2xl font-bold text-cyan-300">{count}</p>
                </div>
                <div className="theme-dept-track mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          }) : <p className="text-sm text-slate-500">No department data yet.</p>}
        </div>
      </Card>

      <Card title="Today's Employee Activity">
        <Table
          columns={activityCols}
          data={liveEmployees}
          emptyText="No attendance recorded today"
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Late Employees (Today)">
          {lateEmployees.length ? (
            <div className="space-y-3">
              {lateEmployees.map((item) => (
                <div
                  key={item._id || item.employee?._id || item.checkIn}
                  className="theme-late-card flex flex-col gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <EmployeeLink employee={item.employee} />
                    <p className="mt-1 text-xs text-slate-500">
                      {item.employee?.department || "No Department"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="theme-late-time text-sm font-semibold text-amber-300">{fmtTime(item.checkIn)}</p>
                    <p className="text-xs text-slate-500">Check in</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table columns={lateCols} data={lateEmployees} emptyText="No late employees today" />
          )}
        </Card>
        <Card title="Currently On Break">
          <Table columns={breakCols} data={onBreak} emptyText="Nobody on break" />
        </Card>
      </div>
    </div>
  );
}

const metricTone = {
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  indigo: "border-indigo-400/20 bg-indigo-400/10 text-indigo-300",
};

function ReportMetric({ label, value, tone }) {
  return (
    <div className="theme-report-metric rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-3xl font-bold text-slate-100">{value}</p>
        <span className={`rounded-full border px-2 py-1 text-xs ${metricTone[tone]}`}>
          Today
        </span>
      </div>
    </div>
  );
}
