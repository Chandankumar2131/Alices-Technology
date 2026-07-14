import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import StatCard from "../../components/ui/StatCard";
import useAuth from "../../hooks/useAuth";
import { interviewService } from "../../service/interviewService";
import { fmtDate, fmtDateTime, fullName, toOfficeDateTimeInputValue } from "../../utils/helpers";
import notify from "../../utils/toast";

const ROUNDS = ["Screening", "First Round", "Second Round", "Third Round", "Final Round"];
const STATUSES = ["Scheduled", "Completed", "Rescheduled", "Selected", "Rejected", "Cancelled"];
const blankForm = {
  candidateName: "",
  emailReceivedDate: "",
  jobTitle: "",
  companyName: "",
  interviewEmail: "",
  scheduledAt: "",
  interviewRound: "Screening",
  status: "Scheduled",
  notes: "",
};

const errorMessage = (error) => error?.response?.data?.message || error?.message || "Something went wrong";

export default function Interviews() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const canViewAll = isAdmin || isSuperAdmin;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [filters, setFilters] = useState({ search: "", status: "", round: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await interviewService.getAll({ ...filters, limit: 100 });
      setRows(response.data || []);
    } catch (error) {
      notify.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filters.search]);

  const stats = useMemo(() => ({
    total: rows.length,
    scheduled: rows.filter((row) => ["Scheduled", "Rescheduled"].includes(row.status)).length,
    selected: rows.filter((row) => row.status === "Selected").length,
    rejected: rows.filter((row) => row.status === "Rejected").length,
  }), [rows]);

  const startCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setOpen(true);
  };

  const startEdit = (row) => {
    setEditing(row);
    setForm({
      candidateName: row.candidateName || "",
      emailReceivedDate: row.emailReceivedDate ? String(row.emailReceivedDate).slice(0, 10) : "",
      jobTitle: row.jobTitle || "",
      companyName: row.companyName || "",
      interviewEmail: row.interviewEmail || "",
      scheduledAt: toOfficeDateTimeInputValue(row.scheduledAt),
      interviewRound: row.interviewRound || "Screening",
      status: row.status || "Scheduled",
      notes: row.notes || "",
    });
    setOpen(true);
  };

  const close = () => {
    if (submitting) return;
    setOpen(false);
    setEditing(null);
    setForm(blankForm);
  };

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const required = ["candidateName", "emailReceivedDate", "jobTitle", "companyName", "interviewEmail", "scheduledAt"];
    if (required.some((field) => !form[field]?.trim())) {
      notify.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() };
      if (editing) await interviewService.update(editing._id, payload);
      else await interviewService.create(payload);
      notify.success(editing ? "Interview updated" : "Interview added");
      setSubmitting(false);
      close();
      await load();
    } catch (error) {
      notify.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "candidateName", header: "Candidate", render: (row) => <span className="font-semibold text-slate-100">{row.candidateName}</span> },
    ...(canViewAll ? [{ key: "recruiter", header: "Recruiter", render: (row) => fullName(row.recruiter) }] : []),
    { key: "companyName", header: "Company", render: (row) => <><div>{row.companyName}</div><div className="mt-1 text-xs text-slate-500">{row.jobTitle}</div></> },
    { key: "emailReceivedDate", header: "Email received", render: (row) => fmtDate(row.emailReceivedDate) },
    { key: "scheduledAt", header: "Scheduled", render: (row) => fmtDateTime(row.scheduledAt) },
    { key: "interviewRound", header: "Round", render: (row) => <Badge status={row.interviewRound}>{row.interviewRound}</Badge> },
    { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
    { key: "actions", header: "Action", render: (row) => <Button variant="outline" className="min-h-8 px-3 py-1 text-xs" onClick={() => startEdit(row)}>Edit</Button> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Interviews</h1>
        <p className="mt-1 text-sm text-slate-400">
          {canViewAll ? "Track interviews submitted by every recruiter." : "Track candidates you have marketed and their interview progress."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Selected" value={stats.selected} />
        <StatCard label="Rejected" value={stats.rejected} />
      </div>

      <Card title={canViewAll ? "All Interview Records" : "My Interview Records"} action={<Button onClick={startCreate}>+ Add Interview</Button>}>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input aria-label="Search interviews" placeholder="Search candidate, company, job or email" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
          <Select aria-label="Filter by status" options={[{ value: "", label: "All statuses" }, ...STATUSES]} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} />
          <Select aria-label="Filter by round" options={[{ value: "", label: "All rounds" }, ...ROUNDS]} value={filters.round} onChange={(e) => setFilters((f) => ({ ...f, round: e.target.value }))} />
        </div>
        <Table columns={columns} data={rows} loading={loading} emptyText="No interview records found" />
      </Card>

      <Modal
        open={open}
        onClose={close}
        title={editing ? "Update Interview" : "Add Interview"}
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button onClick={submit} loading={submitting}>{editing ? "Save Changes" : "Add Interview"}</Button></>}
      >
        <form onSubmit={submit} className="space-y-4">
          <Input label="Recruiter (automatically assigned)" value={editing ? fullName(editing.recruiter) : fullName(user)} disabled />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Candidate Name *" name="candidateName" value={form.candidateName} onChange={change} />
            <Input label="Email Received Date *" type="date" name="emailReceivedDate" value={form.emailReceivedDate} onChange={change} />
            <Input label="Job Title *" name="jobTitle" value={form.jobTitle} onChange={change} />
            <Input label="Company Name *" name="companyName" value={form.companyName} onChange={change} />
            <Input label="Interview Email *" type="email" name="interviewEmail" value={form.interviewEmail} onChange={change} />
            <Input label="Scheduled Date & Time *" type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={change} />
            <Select label="Interview Round" name="interviewRound" options={ROUNDS} value={form.interviewRound} onChange={change} />
            <Select label="Status" name="status" options={STATUSES} value={form.status} onChange={change} />
          </div>
          <div>
            <label htmlFor="interview-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Notes</label>
            <textarea id="interview-notes" name="notes" rows={3} maxLength={2000} value={form.notes} onChange={change} className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-inner shadow-black/10 outline-none transition focus:ring-2" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
