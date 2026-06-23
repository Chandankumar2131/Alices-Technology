import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployeeDetail,
  fetchEmployeeDashboard,
  fetchEmployeeTimeline,
  clearSelectedEmployee,
  selectEmployee,
} from "../../features/employee/employeeSlice";
import { fetchEmployeePayroll, selectPayroll } from "../../features/payroll/payrollSlice";
import { fetchEmployeeSalary, selectSalary } from "../../features/salary/salarySlice";
import { markHalfDayAsPresent } from "../../features/attendance/attendanceSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { fmtDate, fmtTime, fmtMoney, fmtHours, fullName, monthName } from "../../utils/helpers";
import notify from "../../utils/toast";

const TABS = ["Overview", "Attendance", "Leaves", "Payroll", "Salary"];

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tab, setTab] = useState("Overview");

  const { selected, dashboard, timeline, detailLoading } = useSelector(selectEmployee);
  const { selected: payroll } = useSelector(selectPayroll);
  const { selected: salary } = useSelector(selectSalary);

  useEffect(() => {
    dispatch(fetchEmployeeDetail(id));
    dispatch(fetchEmployeeDashboard(id));
    return () => dispatch(clearSelectedEmployee());
  }, [dispatch, id]);

  useEffect(() => {
    if (tab === "Attendance") dispatch(fetchEmployeeTimeline(id));
    if (tab === "Payroll") dispatch(fetchEmployeePayroll(id));
    if (tab === "Salary") dispatch(fetchEmployeeSalary(id));
  }, [dispatch, tab, id]);

  if (detailLoading || !selected) return <Spinner full />;

  const emp = selected.employee;
  const profile = emp.additionalDetails || {};

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <img
            src={emp.image}
            alt=""
            className="h-16 w-16 rounded-full border border-slate-700 bg-slate-800 object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-100">{fullName(emp)}</h2>
            <p className="text-sm text-slate-400">
              {emp.designation || "-"} · {emp.department || "-"}
            </p>
            <p className="text-xs text-slate-500">
              {emp.email} · {emp.employeeId}
            </p>
          </div>
          <div className="w-full sm:ml-auto sm:w-auto">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-b-2 border-cyan-400 text-cyan-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview selected={selected} dashboard={dashboard} profile={profile} />}
      {tab === "Attendance" && <AttendanceTab timeline={timeline} employeeId={id} />}
      {tab === "Leaves" && <LeavesTab dashboard={dashboard} />}
      {tab === "Payroll" && <PayrollTab payroll={payroll} />}
      {tab === "Salary" && <SalaryTab salary={salary} />}
    </div>
  );
}

function Overview({ selected, dashboard, profile }) {
  const { attendance, activeBreak, breaks } = selected;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Today's Attendance">
        {attendance ? (
          <div className="space-y-2 text-sm">
            <Row label="Status" value={<Badge status={attendance.status} />} />
            <Row label="Check In" value={fmtTime(attendance.checkIn)} />
            <Row label="Check Out" value={fmtTime(attendance.checkOut)} />
            <Row label="Productive Hours" value={fmtHours(attendance.productiveHours)} />
            <Row label="On Break" value={activeBreak ? "Yes" : "No"} />
          </div>
        ) : (
          <p className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
            Not checked in today.
          </p>
        )}
      </Card>

      <Card title="Personal Details">
        <div className="space-y-2 text-sm">
          <Row label="Gender" value={profile.gender || "-"} />
          <Row label="Contact" value={profile.contactNumber || "-"} />
          <Row label="Blood Group" value={profile.bloodGroup || "-"} />
          <Row label="City" value={profile.city || "-"} />
          <Row label="Emergency Contact" value={profile.emergencyContactNumber || "-"} />
        </div>
      </Card>

      {dashboard && (
        <Card title="Summary">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <MiniStat label="Total Leaves" value={dashboard.leaves?.total ?? 0} />
            <MiniStat label="Approved" value={dashboard.leaves?.approved ?? 0} />
            <MiniStat label="Pending" value={dashboard.leaves?.pending ?? 0} />
          </div>
        </Card>
      )}

      <Card title="Today's Breaks">
        {breaks?.length ? (
          <div className="space-y-2 text-sm">
            {breaks.map((item) => (
              <div
                key={item._id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-300 sm:grid-cols-3"
              >
                <span>{item.reason}</span>
                <span className="text-slate-500">
                  {fmtTime(item.breakStart)} - {fmtTime(item.breakEnd)}
                </span>
                <span className="text-right">{item.duration ? `${item.duration}m` : "-"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
            No breaks today.
          </p>
        )}
      </Card>
    </div>
  );
}

function AttendanceTab({ timeline, employeeId }) {
  const dispatch = useDispatch();
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const confirmOverride = async () => {
    if (!overrideTarget) return;

    setBusy(true);
    const res = await dispatch(
      markHalfDayAsPresent({
        attendanceId: overrideTarget._id,
        reason,
      })
    );
    setBusy(false);

    if (markHalfDayAsPresent.fulfilled.match(res)) {
      notify.success("Half day marked present");
      setOverrideTarget(null);
      setReason("");
      dispatch(fetchEmployeeTimeline(employeeId));
    } else {
      notify.error(res.payload);
    }
  };

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <Link
          to={`/employees/${employeeId}/attendance/${r.attendanceDate}`}
          className="font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          {fmtDate(r.date)}
        </Link>
      ),
    },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "checkIn", header: "In", render: (r) => fmtTime(r.checkIn) },
    { key: "checkOut", header: "Out", render: (r) => fmtTime(r.checkOut) },
    { key: "totalHours", header: "Total Hrs", render: (r) => fmtHours(r.totalHours) },
    { key: "productiveHours", header: "Productive", render: (r) => fmtHours(r.productiveHours) },
    { key: "lateArrival", header: "Late", render: (r) => (r.lateArrival ? "Yes" : "No") },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "Half Day" ? (
          <Button
            variant="success"
            className="!px-2 !py-1"
            onClick={() => {
              setOverrideTarget(r);
              setReason("");
            }}
          >
            Mark Present
          </Button>
        ) : (
          <span className="text-xs text-slate-500">-</span>
        ),
    },
  ];
  return (
    <>
      <Card title="Attendance History">
        <Table columns={columns} data={timeline} emptyText="No attendance records" />
      </Card>

      <Modal
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        title="Mark Half Day as Present"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOverrideTarget(null)}>
              Cancel
            </Button>
            <Button variant="success" loading={busy} onClick={confirmOverride}>
              Mark Present
            </Button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40"
            placeholder="Example: Approved by manager"
          />
        </div>
      </Modal>
    </>
  );
}

function LeavesTab({ dashboard }) {
  if (!dashboard) return <Spinner />;
  const leaves = dashboard.leaves || {};

  return (
    <Card title="Leave Summary">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total", leaves.total],
          ["Approved", leaves.approved],
          ["Pending", leaves.pending],
          ["Rejected", leaves.rejected],
        ].map(([label, value]) => (
          <MiniStat key={label} label={label} value={value ?? 0} />
        ))}
      </div>
    </Card>
  );
}

function PayrollTab({ payroll }) {
  const columns = [
    { key: "period", header: "Period", render: (r) => `${monthName(r.month)} ${r.year}` },
    { key: "presentDays", header: "Present" },
    { key: "halfDays", header: "Half Day", render: (r) => r.halfDays || 0 },
    { key: "holidayDays", header: "Holiday", render: (r) => r.holidayDays || 0 },
    { key: "absentDays", header: "Absent" },
    { key: "netSalary", header: "Net", render: (r) => fmtMoney(r.netSalary) },
    { key: "paymentStatus", header: "Status", render: (r) => <Badge status={r.paymentStatus} /> },
  ];
  return (
    <Card title="Payroll History">
      <Table columns={columns} data={payroll || []} emptyText="No payroll records" />
    </Card>
  );
}

function SalaryTab({ salary }) {
  if (!salary) {
    return (
      <Card title="Salary Structure">
        <EmptyState message="No salary structure assigned" />
      </Card>
    );
  }

  const rows = [
    ["Basic Salary", salary.basicSalary],
    ["HRA", salary.hra],
    ["Special Allowance", salary.specialAllowance],
    ["Bonus", salary.bonus],
    ["Provident Fund", salary.pf],
    ["Professional Tax", salary.professionalTax],
    ["Other Deductions", salary.otherDeductions],
  ];

  return (
    <Card title="Salary Structure">
      <div className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={fmtMoney(value)} />
        ))}
        <div className="border-t border-slate-800 pt-2">
          <Row label="Gross Salary" value={fmtMoney(salary.grossSalary)} bold />
          <Row label="Net Salary" value={fmtMoney(salary.netSalary)} bold accent="text-emerald-300" />
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, bold, accent = "text-slate-100" }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${accent}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
