import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createSubmission,
  fetchMySubmissions,
  updateSubmission,
  selectSubmission,
} from "../../features/submission/submissionSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import { PORTALS, SUBMISSION_STATUS } from "../../constants/enums";
import { fmtDate } from "../../utils/helpers";
import notify from "../../utils/toast";

const empty = {
  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",
  jobTitle: "",
  portal: "LinkedIn",
};

export default function MySubmissions() {
  const dispatch = useDispatch();
  const { mySubmissions, loading } = useSelector(selectSubmission);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => { dispatch(fetchMySubmissions()); }, [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.candidateName || !form.candidateEmail || !form.candidatePhone || !form.jobTitle) {
      notify.error("All fields are required");
      return;
    }
    setBusy(true);
    const res = await dispatch(createSubmission(form));
    setBusy(false);
    if (createSubmission.fulfilled.match(res)) {
      notify.success("Submission created");
      setOpen(false);
      setForm(empty);
    } else notify.error(res.payload);
  };

  const handleStatus = async (submissionId, status) => {
    const res = await dispatch(updateSubmission({ submissionId, status }));
    if (updateSubmission.fulfilled.match(res)) notify.success("Status updated");
    else notify.error(res.payload);
  };

  const columns = [
    { key: "candidateName", header: "Candidate" },
    { key: "candidateEmail", header: "Email" },
    { key: "candidatePhone", header: "Phone" },
    { key: "jobTitle", header: "Job Title" },
    { key: "portal", header: "Portal" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => handleStatus(r._id, e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-medium text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40"
        >
          {SUBMISSION_STATUS.map((s) => (
            <option key={s} value={s} className="bg-slate-800 text-slate-100">
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: "createdAt", header: "Date", render: (r) => fmtDate(r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <Card title="My Submissions" action={<Button onClick={() => setOpen(true)}>+ New Submission</Button>}>
        <Table columns={columns} data={mySubmissions} loading={loading} emptyText="No submissions yet" />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Submission"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={busy}>Create</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Candidate Name" name="candidateName" value={form.candidateName} onChange={handleChange} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Email" type="email" name="candidateEmail" value={form.candidateEmail} onChange={handleChange} />
            <Input label="Phone" name="candidatePhone" value={form.candidatePhone} onChange={handleChange} />
          </div>
          <Input label="Job Title" name="jobTitle" value={form.jobTitle} onChange={handleChange} />
          <Select label="Portal" name="portal" options={PORTALS} value={form.portal} onChange={handleChange} />
        </form>
      </Modal>
    </div>
  );
}
