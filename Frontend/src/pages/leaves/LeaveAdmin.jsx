import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllLeaves,
  approveLeave,
  rejectLeave,
  selectLeave,
} from "../../features/leave/leaveSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import EmployeeLink from "../../components/ui/EmployeeLink";
import { fmtDate } from "../../utils/helpers";
import notify from "../../utils/toast";

export default function LeaveAdmin() {
  const dispatch = useDispatch();
  const { allLeaves, loading } = useSelector(selectLeave);
  const [action, setAction] = useState(null); // { type: 'approve'|'reject', leave }
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { dispatch(fetchAllLeaves()); }, [dispatch]);

  const openAction = (type, leave) => { setAction({ type, leave }); setRemarks(""); };

  const confirm = async () => {
    if (!action) return;
    setBusy(true);
    const { type, leave } = action;
    const thunk = type === "approve" ? approveLeave : rejectLeave;
    const res = await dispatch(thunk({ leaveId: leave._id, adminRemarks: remarks }));
    setBusy(false);
    if (thunk.fulfilled.match(res)) {
      notify.success(`Leave ${type === "approve" ? "approved" : "rejected"}`);
      setAction(null);
    } else notify.error(res.payload);
  };

  const columns = [
    { key: "employee", header: "Employee", render: (r) => <EmployeeLink employee={r.employee} /> },
    { key: "leaveType", header: "Type" },
    { key: "startDate", header: "From", render: (r) => fmtDate(r.startDate) },
    { key: "endDate", header: "To", render: (r) => fmtDate(r.endDate) },
    { key: "totalDays", header: "Days" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "Pending" ? (
          <div className="flex gap-2">
            <Button variant="success" className="!px-2 !py-1" onClick={() => openAction("approve", r)}>Approve</Button>
            <Button variant="danger" className="!px-2 !py-1" onClick={() => openAction("reject", r)}>Reject</Button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Done</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Leave Approvals">
        <Table columns={columns} data={allLeaves} loading={loading} emptyText="No leave requests" />
      </Card>

      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action?.type === "approve" ? "Approve Leave" : "Reject Leave"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
            <Button variant={action?.type === "approve" ? "success" : "danger"} loading={busy} onClick={confirm}>
              {action?.type === "approve" ? "Approve" : "Reject"}
            </Button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Admin Remarks (optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </Modal>
    </div>
  );
}
