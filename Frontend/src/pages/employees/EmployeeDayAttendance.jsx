import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployeeDayDetail, selectEmployee } from "../../features/employee/employeeSlice";
import { fetchMyDayDetail, selectDashboard } from "../../features/dashboard/dashboardSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Table from "../../components/common/Table";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { fmtDate, fmtHours, fmtTime, fullName } from "../../utils/helpers";

export default function EmployeeDayAttendance() {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { dayDetail, detailLoading } = useSelector(selectEmployee);
  const { myDayDetail, loading } = useSelector(selectDashboard);
  const isAdminView = Boolean(id);

  useEffect(() => {
    if (isAdminView) {
      dispatch(fetchEmployeeDayDetail({ id, date }));
    } else {
      dispatch(fetchMyDayDetail(date));
    }
  }, [dispatch, id, date, isAdminView]);

  const detail = isAdminView ? dayDetail : myDayDetail;

  if (detailLoading || loading || !detail) return <Spinner full />;

  const { employee, attendance, breaks = [], totalBreakMinutes = 0 } = detail;
  const columns = [
    { key: "reason", header: "Break Type", render: (row) => row.reason || "-" },
    { key: "breakStart", header: "Start", render: (row) => fmtTime(row.breakStart) },
    { key: "breakEnd", header: "End", render: (row) => fmtTime(row.breakEnd) },
    { key: "duration", header: "Duration", render: (row) => `${Math.round(row.duration || 0)} min` },
    { key: "status", header: "Status", render: (row) => <Badge status={row.status}>{row.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <img
            src={employee.image}
            alt=""
            className="h-14 w-14 rounded-lg border border-white/10 object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-100">{fullName(employee)}</h2>
            <p className="text-sm text-slate-400">
              {fmtDate(date)} · {employee.designation || "-"} · {employee.department || "-"}
            </p>
            <p className="text-xs text-slate-500">{employee.email} · {employee.employeeId}</p>
          </div>
          <div className="w-full sm:ml-auto sm:w-auto">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Day Summary">
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <SummaryItem label="Status" value={<Badge status={attendance.status} />} />
          <SummaryItem label="Check In" value={fmtTime(attendance.checkIn)} />
          <SummaryItem label="Check Out" value={fmtTime(attendance.checkOut)} />
          <SummaryItem label="Total Break" value={`${Math.round(totalBreakMinutes)} min`} />
          <SummaryItem label="Productive" value={fmtHours(attendance.productiveHours)} />
          <SummaryItem label="Total Hours" value={fmtHours(attendance.totalHours)} />
          <SummaryItem label="Late Arrival" value={attendance.lateArrival ? "Yes" : "No"} />
          <SummaryItem label="Early Logout" value={attendance.earlyLogout ? "Yes" : "No"} />
          <SummaryItem label="Source" value={attendance.attendanceSource || "-"} />
          <SummaryItem label="Remarks" value={attendance.remarks || "-"} />
        </div>
      </Card>

      <Card title="Break Details">
        {breaks.length ? (
          <Table columns={columns} data={breaks} emptyText="No breaks recorded" />
        ) : (
          <EmptyState message="No breaks recorded for this day" />
        )}
      </Card>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <div className="mt-2 text-base font-semibold text-slate-100">{value}</div>
    </div>
  );
}
