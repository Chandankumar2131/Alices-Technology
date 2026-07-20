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
import { assessmentService } from "../../service/assessmentService";
import { candidateService } from "../../service/candidateService";
import { fmtDate, fmtDateTime, fullName, toOfficeDateTimeInputValue } from "../../utils/helpers";
import notify from "../../utils/toast";

const ROUNDS = ["Screening", "First Round", "Second Round", "Third Round", "Final Round"];
const STATUSES = ["Scheduled", "Completed", "Rescheduled", "Selected", "Rejected", "Cancelled"];
const blankForm = {
  candidateId: "",
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
const blankAssessment = { candidateId: "", receivedDate: "", companyName: "", interviewerEmail: "", notes: "" };

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
  const [candidates, setCandidates] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessmentEditing, setAssessmentEditing] = useState(null);
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState(blankAssessment);

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

  useEffect(() => {
    candidateService.getAll({ limit: 100 }).then((response) => setCandidates(response.data || [])).catch(() => setCandidates([]));
  }, []);

  const loadAssessments = useCallback(async () => {
    setAssessmentLoading(true);
    try {
      const response = await assessmentService.getAll();
      setAssessments(response.data || []);
    } catch (error) { notify.error(errorMessage(error)); }
    finally { setAssessmentLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(loadAssessments, 0); return () => clearTimeout(timer); }, [loadAssessments]);

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
      candidateId: row.candidate?._id || "",
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
    const required = ["candidateId", "emailReceivedDate", "jobTitle", "companyName", "interviewEmail", "scheduledAt"];
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

  const startAssessment = (row = null) => {
    setAssessmentEditing(row);
    setAssessmentForm(row ? {
      candidateId: row.candidate?._id || "",
      receivedDate: row.receivedDate ? String(row.receivedDate).slice(0, 10) : "",
      companyName: row.companyName || "",
      interviewerEmail: row.interviewerEmail || "",
      notes: row.notes || "",
    } : blankAssessment);
    setAssessmentOpen(true);
  };

  const closeAssessment = () => {
    if (assessmentSubmitting) return;
    setAssessmentOpen(false); setAssessmentEditing(null); setAssessmentForm(blankAssessment);
  };

  const submitAssessment = async (event) => {
    event.preventDefault();
    if (!assessmentForm.candidateId || !assessmentForm.receivedDate || !assessmentForm.companyName.trim() || !assessmentForm.interviewerEmail.trim()) return notify.error("Please fill all required assessment fields");
    setAssessmentSubmitting(true);
    try {
      if (assessmentEditing) await assessmentService.update(assessmentEditing._id, assessmentForm);
      else await assessmentService.create(assessmentForm);
      notify.success(assessmentEditing ? "Assessment updated" : "Assessment added");
      setAssessmentSubmitting(false); closeAssessment(); await loadAssessments();
    } catch (error) { notify.error(errorMessage(error)); }
    finally { setAssessmentSubmitting(false); }
  };

  const assessmentColumns = [
    { key: "candidate", header: "Candidate", render: (row) => <span className="font-semibold text-slate-100">{fullName(row.candidate?.user)}</span> },
    ...(canViewAll ? [{ key: "recruiter", header: "Recruiter", render: (row) => fullName(row.recruiter) }] : []),
    { key: "receivedDate", header: "Assessment Mail Received", render: (row) => fmtDate(row.receivedDate) },
    { key: "companyName", header: "Company", render: (row) => row.companyName || "—" },
    { key: "interviewerEmail", header: "Interviewer Email" },
    { key: "notes", header: "Notes", render: (row) => row.notes || "—" },
    { key: "actions", header: "Action", render: (row) => <Button variant="outline" className="min-h-8 px-3 py-1 text-xs" onClick={() => startAssessment(row)}>Edit</Button> },
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

      <Card title={canViewAll ? "All Assessment Records" : "My Assessment Records"} action={<Button onClick={() => startAssessment()}>+ Add Assessment</Button>}>
        <Table columns={assessmentColumns} data={assessments} loading={assessmentLoading} emptyText="No assessment records found" />
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
            <Select label="Assigned Candidate *" name="candidateId" value={form.candidateId} onChange={change} options={[{ value: "", label: candidates.length ? "Select assigned candidate" : "No candidates assigned" }, ...candidates.map((candidate) => ({ value: candidate._id, label: fullName(candidate.user) }))]} disabled={!candidates.length} />
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

      <Modal
        open={assessmentOpen}
        onClose={closeAssessment}
        title={assessmentEditing ? "Update Assessment" : "Add Assessment"}
        footer={<><Button variant="secondary" onClick={closeAssessment}>Cancel</Button><Button onClick={submitAssessment} loading={assessmentSubmitting}>{assessmentEditing ? "Save Changes" : "Add Assessment"}</Button></>}
      >
        <form onSubmit={submitAssessment} className="space-y-4">
          <Input label="Recruiter (automatically assigned)" value={assessmentEditing ? fullName(assessmentEditing.recruiter) : fullName(user)} disabled />
          <Select label="Assigned Candidate *" value={assessmentForm.candidateId} onChange={(event) => setAssessmentForm((formValue) => ({ ...formValue, candidateId: event.target.value }))} options={[{ value: "", label: candidates.length ? "Select assigned candidate" : "No candidates assigned" }, ...candidates.map((candidate) => ({ value: candidate._id, label: fullName(candidate.user) }))]} disabled={!candidates.length} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Assessment Mail Received Date *" type="date" value={assessmentForm.receivedDate} onChange={(event) => setAssessmentForm((formValue) => ({ ...formValue, receivedDate: event.target.value }))} />
            <Input label="Company Name *" value={assessmentForm.companyName} onChange={(event) => setAssessmentForm((formValue) => ({ ...formValue, companyName: event.target.value }))} />
            <Input label="Interviewer Email *" type="email" value={assessmentForm.interviewerEmail} onChange={(event) => setAssessmentForm((formValue) => ({ ...formValue, interviewerEmail: event.target.value }))} />
          </div>
          <div>
            <label htmlFor="assessment-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Notes</label>
            <textarea id="assessment-notes" rows={3} maxLength={2000} value={assessmentForm.notes} onChange={(event) => setAssessmentForm((formValue) => ({ ...formValue, notes: event.target.value }))} className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-inner shadow-black/10 outline-none transition focus:ring-2" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
