import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyLeave, fetchMyLeaves, selectLeave } from "../../features/leave/leaveSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import { LEAVE_TYPES } from "../../constants/enums";
import { fmtDate } from "../../utils/helpers";
import notify from "../../utils/toast";

const empty = { leaveType: "Casual Leave", startDate: "", endDate: "", reason: "" };

export default function MyLeaves() {
  const dispatch = useDispatch();
  const { myLeaves, loading } = useSelector(selectLeave);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { dispatch(fetchMyLeaves()); }, [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) {
      notify.error("All fields are required");
      return;
    }
    setSubmitting(true);
    const res = await dispatch(applyLeave(form));
    setSubmitting(false);
    if (applyLeave.fulfilled.match(res)) {
      notify.success("Leave applied");
      setOpen(false);
      setForm(empty);
      dispatch(fetchMyLeaves());
    } else notify.error(res.payload);
  };

  const columns = [
    { key: "leaveType", header: "Type" },
    { key: "startDate", header: "From", render: (r) => fmtDate(r.startDate) },
    { key: "endDate", header: "To", render: (r) => fmtDate(r.endDate) },
    { key: "totalDays", header: "Days" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "adminRemarks", header: "Remarks", render: (r) => r.adminRemarks || "—" },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="My Leaves"
        action={<Button onClick={() => setOpen(true)}>+ Apply Leave</Button>}
      >
        <Table columns={columns} data={myLeaves} loading={loading} emptyText="No leave requests yet" />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Leave Type" name="leaveType" options={LEAVE_TYPES} value={form.leaveType} onChange={handleChange} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Start Date" type="date" name="startDate" value={form.startDate} onChange={handleChange} />
            <Input label="End Date" type="date" name="endDate" value={form.endDate} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="leave-reason" className="mb-1 block text-sm font-medium text-slate-300">Reason</label>
            <textarea
              id="leave-reason"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
