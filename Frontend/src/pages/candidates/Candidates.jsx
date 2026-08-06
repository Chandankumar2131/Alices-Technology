import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import StatCard from "../../components/ui/StatCard";
import useAuth from "../../hooks/useAuth";
import { authService } from "../../service/authService";
import { candidateService } from "../../service/candidateService";
import { SUBSCRIPTION_STATUSES } from "../../constants/enums";
import { fmtDate, fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

const empty = {
  firstName: "", lastName: "", email: "", password: "", phone: "", location: "",
  primaryJobRole: "", subscriptionStartDate: "", subscriptionEndDate: "",
  subscriptionStatus: "Active", notes: "",
};
const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong";

export default function Candidates() {
  const { isSuperAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [recruiterId, setRecruiterId] = useState("");
  const [resetCandidate, setResetCandidate] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [uploadingResumeId, setUploadingResumeId] = useState("");
  const [createResume, setCreateResume] = useState(null);
  const [allApplications, setAllApplications] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsDate, setAnalyticsDate] = useState("");
  const [currentWorkDate, setCurrentWorkDate] = useState("");
  const [analyticsRecruiter, setAnalyticsRecruiter] = useState("");
  const [analyticsCandidate, setAnalyticsCandidate] = useState("");
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [emailCandidate, setEmailCandidate] = useState(null);
  const [newEmail, setNewEmail] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [candidateRes, employeeRes] = await Promise.all([
        candidateService.getAll({ search, limit: 100 }),
        authService.getAllEmployees(),
      ]);
      setRows(candidateRes.data || []);
      setEmployees(employeeRes.data || []);
    } catch (error) { notify.error(errorText(error)); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await candidateService.getAllApplications();
      setAllApplications(response.data || []);
      setCurrentWorkDate(response.currentWorkDate || "");
      setAnalyticsDate((current) => current || response.currentWorkDate || "");
    } catch (error) { notify.error(errorText(error)); }
    finally { setAnalyticsLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(loadAnalytics, 0); return () => clearTimeout(timer); }, [loadAnalytics]);

  const dailyApplications = useMemo(() => allApplications.filter((application) =>
    (!analyticsDate || application.workDate === analyticsDate) &&
    (!analyticsRecruiter || application.submittedBy?._id === analyticsRecruiter) &&
    (!analyticsCandidate || application.candidate?._id === analyticsCandidate)
  ), [allApplications, analyticsCandidate, analyticsDate, analyticsRecruiter]);

  const analyticsCandidates = useMemo(() => {
    if (!analyticsRecruiter) return rows;
    return rows.filter((candidate) => candidate.assignedRecruiter?._id === analyticsRecruiter);
  }, [analyticsRecruiter, rows]);

  const employeeAnalytics = useMemo(() => employees.map((employee) => {
    const employeeApps = dailyApplications.filter((application) => application.submittedBy?._id === employee._id);
    return { _id: employee._id, employee, applications: employeeApps.length };
  }).filter((item) => {
    if (analyticsRecruiter) return item.employee._id === analyticsRecruiter;
    if (analyticsCandidate) return item.applications > 0;
    return true;
  }).sort((a, b) => b.applications - a.applications), [analyticsCandidate, analyticsRecruiter, dailyApplications, employees]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const createCandidate = async (event) => {
    event.preventDefault();
    const required = ["firstName", "lastName", "email", "password", "primaryJobRole", "subscriptionStartDate", "subscriptionEndDate"];
    if (required.some((field) => !form[field]?.trim())) return notify.error("Please fill all required fields");
    setBusy(true);
    try {
      const response = await candidateService.create(form);
      if (createResume) {
        try {
          const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(createResume); });
          await candidateService.uploadResume(response.data._id, { dataUrl, fileName: createResume.name, mimeType: createResume.type, size: createResume.size });
        } catch (uploadError) {
          notify.error(`Candidate created, but resume upload failed: ${errorText(uploadError)}`);
        }
      }
      notify.success("Candidate and login created");
      setCreateOpen(false); setForm(empty); setCreateResume(null); await load();
    } catch (error) { notify.error(errorText(error)); }
    finally { setBusy(false); }
  };

  const assign = async () => {
    if (!recruiterId) return notify.error("Select an employee");
    setBusy(true);
    try {
      await candidateService.assign(assigning._id, recruiterId);
      notify.success("Candidate assigned");
      setAssigning(null); setRecruiterId(""); await load();
    } catch (error) { notify.error(errorText(error)); }
    finally { setBusy(false); }
  };

  const resetPassword = async () => {
    if (temporaryPassword.length < 6) return notify.error("Temporary password must be at least 6 characters");
    setBusy(true);
    try {
      await candidateService.resetPassword(resetCandidate._id, temporaryPassword);
      notify.success("Candidate password reset"); setResetCandidate(null); setTemporaryPassword("");
    } catch (error) { notify.error(errorText(error)); }
    finally { setBusy(false); }
  };

  const uploadResume = async (candidate, file) => {
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 8 * 1024 * 1024) return notify.error("Select a PDF up to 8 MB");
    setUploadingResumeId(candidate._id);
    try {
      const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      await candidateService.uploadResume(candidate._id, { dataUrl, fileName: file.name, mimeType: file.type, size: file.size });
      notify.success("Latest resume uploaded"); await load();
    } catch (error) { notify.error(errorText(error)); }
    finally { setUploadingResumeId(""); }
  };

  const updateEmail = async () => {
    if (!newEmail.trim()) return notify.error("Enter a valid email address");
    setBusy(true);
    try {
      await authService.updateUserEmail(emailCandidate.user._id, newEmail);
      notify.success("Candidate login email updated");
      setEmailCandidate(null); setNewEmail(""); await load();
    } catch (error) { notify.error(errorText(error)); }
    finally { setBusy(false); }
  };

  const columns = [
    { key: "candidate", header: "Candidate", render: (row) => <><p className="font-semibold text-slate-100">{fullName(row.user)}</p><p className="text-xs text-slate-500">{row.candidateId} · {row.user?.email}</p></> },
    { key: "role", header: "Target role", render: (row) => <><p>{row.primaryJobRole}</p><p className="text-xs text-slate-500">{row.experience || "Experience not specified"}</p></> },
    { key: "subscription", header: "Subscription", render: (row) => <><Badge status={row.subscriptionStatus} /><p className="mt-1 text-xs text-slate-500">Until {fmtDate(row.subscriptionEndDate)}</p></> },
    { key: "resume", header: "Latest Resume", render: (row) => row.resumeFile?.url ? <a href={row.resumeFile.url} target="_blank" rel="noreferrer" className="font-semibold text-cyan-500 hover:underline">{row.resumeFile.fileName || "View PDF"}</a> : <span className="text-slate-500">Not uploaded</span> },
    { key: "recruiter", header: "Recruiter", render: (row) => row.assignedRecruiter ? fullName(row.assignedRecruiter) : <span className="text-amber-500">Unassigned</span> },
    { key: "actions", header: "Actions", render: (row) => <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-8 px-3 py-1 text-xs" onClick={() => { setEmailCandidate(row); setNewEmail(row.user?.email || ""); }}>Change Email</Button><Button variant="outline" className="min-h-8 px-3 py-1 text-xs" onClick={() => { setAssigning(row); setRecruiterId(row.assignedRecruiter?._id || ""); }}>Assign</Button><input id={`resume-${row._id}`} type="file" accept="application/pdf" className="hidden" onChange={(event) => uploadResume(row, event.target.files?.[0])} /><Button variant="secondary" loading={uploadingResumeId === row._id} className="min-h-8 px-3 py-1 text-xs" onClick={() => document.getElementById(`resume-${row._id}`)?.click()}>Upload Resume</Button>{isSuperAdmin && <Button variant="secondary" className="min-h-8 px-3 py-1 text-xs" onClick={() => { setResetCandidate(row); setTemporaryPassword(""); }}>Reset Login</Button>}</div> },
  ];

  const dailyColumns = [
    { key: "candidate", header: "Candidate", render: (row) => fullName(row.candidate?.user) },
    { key: "recruiter", header: "Employee", render: (row) => fullName(row.submittedBy) },
    { key: "workDate", header: "Applied", render: (row) => fmtDate(row.workDate || row.appliedAt) },
    { key: "url", header: "Applied Job URL", render: (row) => <a href={row.appliedUrl} target="_blank" rel="noreferrer" className="font-semibold text-cyan-500 hover:underline">Open job</a> },
  ];

  const employeeColumns = [
    { key: "employee", header: "Employee", render: (row) => <><p className="font-semibold text-slate-100">{fullName(row.employee)}</p><p className="text-xs text-slate-500">{row.employee.employeeId} · {row.employee.designation || "Employee"}</p></> },
    { key: "applications", header: "Jobs Applied", render: (row) => <span className="text-lg font-bold text-cyan-500">{row.applications}</span> },
  ];

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-50">Candidates</h1><p className="mt-1 text-sm text-slate-400">Manage subscriptions, recruiter assignments and application delivery.</p></div>
    <Card title="Candidate Directory" action={isSuperAdmin ? <Button onClick={() => setCreateOpen(true)}>+ Add Candidate</Button> : null}>
      <Input className="mb-4" placeholder="Search candidate, ID, role or location" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Table columns={columns} data={rows} loading={loading} emptyText="No candidates found" />
    </Card>
    <Card title="Daily Application Analytics" action={<div className="flex gap-2"><Button variant="secondary" onClick={() => { setAnalyticsDate(currentWorkDate); setAnalyticsRecruiter(""); setAnalyticsCandidate(""); }}>Today · All</Button><Button variant="outline" onClick={loadAnalytics}>Refresh</Button></div>}>
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3"><Input label="Applied Date" type="date" value={analyticsDate} onChange={(event) => setAnalyticsDate(event.target.value)} /><Select label="Employee / Recruiter" value={analyticsRecruiter} onChange={(event) => { setAnalyticsRecruiter(event.target.value); setAnalyticsCandidate(""); }} options={[{ value: "", label: "All employees" }, ...employees.map((employee) => ({ value: employee._id, label: fullName(employee) }))]} /><Select label="Candidate" value={analyticsCandidate} onChange={(event) => setAnalyticsCandidate(event.target.value)} options={[{ value: "", label: analyticsRecruiter ? "All assigned candidates" : "All candidates" }, ...analyticsCandidates.map((candidate) => ({ value: candidate._id, label: fullName(candidate.user) }))]} /></div>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><StatCard label="Jobs Applied" value={dailyApplications.length} /><StatCard label="Employees Active" value={new Set(dailyApplications.map((item) => item.submittedBy?._id).filter(Boolean)).size} /><StatCard label="Candidates Marketed" value={new Set(dailyApplications.map((item) => item.candidate?._id).filter(Boolean)).size} /></div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><div><h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-300">Employee Analysis</h3><Table columns={employeeColumns} data={employeeAnalytics} loading={analyticsLoading} emptyText="No employee application activity for this date" /></div><div><h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-300">Applied Job Details</h3><Table columns={dailyColumns} data={dailyApplications} loading={analyticsLoading} emptyText="No applied jobs found for this date" /></div></div>
    </Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Candidate & Login" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createCandidate} loading={busy}>Create Candidate</Button></>}>
      <form onSubmit={createCandidate} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="First Name *" name="firstName" value={form.firstName} onChange={change} /><Input label="Last Name *" name="lastName" value={form.lastName} onChange={change} /></div>
        <Input label="Login Email *" type="email" name="email" value={form.email} onChange={change} />
        <Input label="Temporary Password *" type="password" name="password" value={form.password} onChange={change} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="Phone" name="phone" value={form.phone} onChange={change} /><Input label="Location" name="location" value={form.location} onChange={change} /></div>
        <Input label="Primary Job Role *" name="primaryJobRole" value={form.primaryJobRole} onChange={change} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="Subscription Start *" type="date" name="subscriptionStartDate" value={form.subscriptionStartDate} onChange={change} /><Input label="Subscription End *" type="date" name="subscriptionEndDate" value={form.subscriptionEndDate} onChange={change} /></div>
        <Select label="Subscription Status" name="subscriptionStatus" options={SUBSCRIPTION_STATUSES} value={form.subscriptionStatus} onChange={change} />
        <Input label="Resume PDF (optional)" type="file" accept="application/pdf" onChange={(event) => { const file = event.target.files?.[0] || null; if (file && (file.type !== "application/pdf" || file.size > 8 * 1024 * 1024)) { notify.error("Select a PDF up to 8 MB"); event.target.value = ""; setCreateResume(null); } else setCreateResume(file); }} />
        <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300" htmlFor="candidate-notes">Internal Notes</label><textarea id="candidate-notes" rows={3} name="notes" value={form.notes} onChange={change} className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none" /></div>
      </form>
    </Modal>

    <Modal open={!!assigning} onClose={() => setAssigning(null)} title={`Assign ${fullName(assigning?.user)}`} footer={<><Button variant="secondary" onClick={() => setAssigning(null)}>Cancel</Button><Button onClick={assign} loading={busy}>Assign Candidate</Button></>}>
      <Select label="Employee / Recruiter" value={recruiterId} onChange={(event) => setRecruiterId(event.target.value)} options={[{ value: "", label: "Select employee" }, ...employees.filter((employee) => employee.isActive).map((employee) => ({ value: employee._id, label: `${fullName(employee)} · ${employee.designation || employee.employeeId}` }))]} />
      <p className="mt-3 text-xs text-slate-400">Reassignment history is retained automatically.</p>
    </Modal>

    <Modal open={!!resetCandidate} onClose={() => setResetCandidate(null)} title={`Reset Login · ${fullName(resetCandidate?.user)}`} footer={<><Button variant="secondary" onClick={() => setResetCandidate(null)}>Cancel</Button><Button onClick={resetPassword} loading={busy}>Set Password</Button></>}>
      <Input label="Temporary Password" type="password" value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} placeholder="Minimum 6 characters" />
    </Modal>
    <Modal open={!!emailCandidate} onClose={() => setEmailCandidate(null)} title={`Change Login Email · ${fullName(emailCandidate?.user)}`} footer={<><Button variant="secondary" onClick={() => setEmailCandidate(null)}>Cancel</Button><Button onClick={updateEmail} loading={busy}>Save Email</Button></>}>
      <div className="space-y-3"><Input label="New Login Email" type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} /><p className="text-xs text-slate-400">The candidate will be signed out and must use this email for their next login.</p></div>
    </Modal>
  </div>;
}
