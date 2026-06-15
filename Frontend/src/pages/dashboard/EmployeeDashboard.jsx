import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyDashboard, selectDashboard } from "../../features/dashboard/dashboardSlice";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Table from "../../components/common/Table";
import Spinner from "../../components/common/Spinner";
import { fmtTime, fmtMoney, fmtDate, fmtHours } from "../../utils/helpers";

export default function EmployeeDashboard() {
  const dispatch = useDispatch();
  const { myDashboard, loading } = useSelector(selectDashboard);

  useEffect(() => {
    dispatch(fetchMyDashboard());
  }, [dispatch]);

  if (loading && !myDashboard) return <Spinner full />;

  const s = myDashboard || {};
  const todayAtt = s.attendance;
  const leaves = s.leaves || {};
  const payroll = s.latestPayroll;

  const columns = [
    { key: "date", header: "Date", render: (r) => fmtDate(r.attendanceDate) },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "checkIn", header: "Check In", render: (r) => fmtTime(r.checkIn) },
    { key: "checkOut", header: "Check Out", render: (r) => fmtTime(r.checkOut) },
    { key: "productiveHours", header: "Productive Hrs", render: (r) => fmtHours(r.productiveHours) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Leaves" value={leaves.total ?? 0} icon="🌴" accent="text-blue-600" />
        <StatCard label="Approved Leaves" value={leaves.approved ?? 0} icon="✅" accent="text-green-600" />
        <StatCard label="Pending Leaves" value={leaves.pending ?? 0} icon="📝" accent="text-amber-600" />
        <StatCard label="Rejected Leaves" value={leaves.rejected ?? 0} icon="❌" accent="text-red-600" />
        <StatCard label="Total Submissions" value={s.totalSubmissions ?? 0} icon="📄" />
        <StatCard
          label="Last Salary"
          value={fmtMoney(payroll?.netSalary)}
          icon="💰"
          accent="text-emerald-600"
        />
      </div>

      <Card title="Today's Status">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-sm">
            <p className="text-gray-500">Check In</p>
            <p className="font-semibold">{fmtTime(todayAtt?.checkIn)}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Check Out</p>
            <p className="font-semibold">{fmtTime(todayAtt?.checkOut)}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Today's Breaks</p>
            <p className="font-semibold">{Math.round(s.totalBreakMinutes ?? 0)} min</p>
          </div>
          {todayAtt?.status && <Badge status={todayAtt.status} />}
          {s.activeBreak && <Badge status="On Break" />}
          {!todayAtt && <p className="text-sm text-gray-500">No attendance recorded today.</p>}
        </div>
      </Card>

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
