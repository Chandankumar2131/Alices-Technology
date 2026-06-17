import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  approveAttendanceCorrection,
  fetchAllCorrections,
  rejectAttendanceCorrection,
  selectAttendance,
} from "../../features/attendance/attendanceSlice";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import Table from "../../components/common/Table";
import EmployeeLink from "../../components/ui/EmployeeLink";
import { fmtDate, fmtTime } from "../../utils/helpers";
import notify from "../../utils/toast";

export default function AttendanceCorrectionsAdmin() {
  const dispatch = useDispatch();
  const { allCorrections, loading } = useSelector(selectAttendance);
  const [action, setAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchAllCorrections());
  }, [dispatch]);

  const openAction = (type, request) => {
    setAction({ type, request });
    setRemarks("");
  };

  const confirm = async () => {
    if (!action) return;

    setBusy(true);
    const thunk =
      action.type === "approve" ? approveAttendanceCorrection : rejectAttendanceCorrection;
    const res = await dispatch(
      thunk({ requestId: action.request._id, adminRemarks: remarks })
    );
    setBusy(false);

    if (thunk.fulfilled.match(res)) {
      notify.success(
        `Correction ${action.type === "approve" ? "approved" : "rejected"}`
      );
      setAction(null);
    } else notify.error(res.payload);
  };

  const columns = [
    { key: "employee", header: "Employee", render: (r) => <EmployeeLink employee={r.employee} /> },
    { key: "date", header: "Date", render: (r) => fmtDate(r.attendance?.date) },
    { key: "currentCheckIn", header: "Current", render: (r) => fmtTime(r.currentCheckIn) },
    { key: "requestedCheckIn", header: "Requested", render: (r) => fmtTime(r.requestedCheckIn) },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status}>{r.status}</Badge> },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "Pending" ? (
          <div className="flex gap-2">
            <Button variant="success" className="!px-2 !py-1" onClick={() => openAction("approve", r)}>
              Approve
            </Button>
            <Button variant="danger" className="!px-2 !py-1" onClick={() => openAction("reject", r)}>
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">Done</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Attendance Correction Requests">
        <Table
          columns={columns}
          data={allCorrections}
          loading={loading}
          emptyText="No correction requests"
        />
      </Card>

      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action?.type === "approve" ? "Approve Correction" : "Reject Correction"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              variant={action?.type === "approve" ? "success" : "danger"}
              loading={busy}
              onClick={confirm}
            >
              {action?.type === "approve" ? "Approve" : "Reject"}
            </Button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Admin Remarks (optional)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40"
          />
        </div>
      </Modal>
    </div>
  );
}
