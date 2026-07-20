import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import StatCard from "../../components/ui/StatCard";
import Table from "../../components/common/Table";
import { candidateService } from "../../service/candidateService";
import { fmtDate, fmtDateTime, fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

export default function CandidateDashboard() {
  const location = useLocation();
  const activityPage = location.pathname === "/my-applications";
  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentWorkDate, setCurrentWorkDate] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, appsRes, interviewRes, assessmentRes] = await Promise.all([
        candidateService.getMe(), candidateService.getAllApplications(), candidateService.getMyInterviews(), candidateService.getMyAssessments(),
      ]);
      setCandidate(profileRes.data); setApplications(appsRes.data || []); setInterviews(interviewRes.data || []); setAssessments(assessmentRes.data || []);
      setCurrentWorkDate(appsRes.currentWorkDate || "");
    } catch (error) { notify.error(error?.response?.data?.message || "Failed to load candidate portal"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const todayCount = useMemo(() => applications.filter((item) => item.workDate === currentWorkDate).length, [applications, currentWorkDate]);
  const visibleApplications = useMemo(() => applications.filter((item) => {
    if (!selectedDate) return true;
    return item.workDate === selectedDate;
  }), [applications, selectedDate]);
  const upcomingInterviews = interviews.filter((item) => ["Scheduled", "Rescheduled"].includes(item.status) && new Date(item.scheduledAt) >= new Date()).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const applicationColumns = [
    { key: "workDate", header: "Applied", render: (row) => fmtDate(row.workDate || row.appliedAt) },
    { key: "url", header: "Applied Job URL", render: (row) => <a href={row.appliedUrl} target="_blank" rel="noreferrer" className="font-semibold text-cyan-500 hover:underline">Open job</a> },
  ];
  const interviewColumns = [
    { key: "scheduledAt", header: "Scheduled", render: (row) => fmtDateTime(row.scheduledAt) },
    { key: "companyName", header: "Company" },
    { key: "jobTitle", header: "Job Title" },
    { key: "interviewRound", header: "Round" },
    { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
    { key: "recruiter", header: "Recruiter", render: (row) => fullName(row.recruiter) },
  ];
  const assessmentColumns = [
    { key: "receivedDate", header: "Assessment Mail Received", render: (row) => fmtDate(row.receivedDate) },
    { key: "companyName", header: "Company", render: (row) => row.companyName || "—" },
    { key: "interviewerEmail", header: "Interviewer Email" },
    { key: "recruiter", header: "Recruiter", render: (row) => fullName(row.recruiter) },
    { key: "notes", header: "Notes", render: (row) => row.notes || "—" },
  ];

  if (activityPage) return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-50">My Applications</h1><p className="mt-1 text-sm text-slate-400">View applied jobs and your upcoming interview schedule.</p></div>
    <Card title="Upcoming Interviews"><Table columns={interviewColumns} data={upcomingInterviews} loading={loading} emptyText="No upcoming interviews scheduled" /></Card>
    <Card title="My Assessment Records"><Table columns={assessmentColumns} data={assessments} loading={loading} emptyText="No assessment records received yet" /></Card>
    <Card title="Applied Job History"><div className="mb-4 max-w-sm"><Input label="Filter by Applied Date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />{selectedDate && <button type="button" onClick={() => setSelectedDate("")} className="mt-2 text-xs font-semibold text-cyan-500 hover:underline">Clear date filter</button>}</div><Table columns={applicationColumns} data={visibleApplications} loading={loading} emptyText={selectedDate ? "No applications found for this date" : "No applications have been recorded yet"} /></Card>
  </div>;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-50">My Service Dashboard</h1><p className="mt-1 text-sm text-slate-400">Follow your recruiter, resume and job marketing progress.</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><StatCard label="Applications Today" value={todayCount} /><StatCard label="Total Applications" value={applications.length} /><StatCard label="Upcoming Interviews" value={upcomingInterviews.length} /></div>
    <Card title="Subscription Details"><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Status</p><div className="mt-2"><Badge status={candidate?.subscriptionStatus}>{candidate?.subscriptionStatus || "Not available"}</Badge></div></div><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Enrolled Date</p><p className="mt-2 font-semibold text-slate-100">{fmtDate(candidate?.subscriptionStartDate)}</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Subscription End Date</p><p className="mt-2 font-semibold text-slate-100">{fmtDate(candidate?.subscriptionEndDate)}</p></div></div></Card>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card title="My Recruiter">{candidate?.assignedRecruiter ? <div className="flex items-center gap-4"><img src={candidate.assignedRecruiter.image} alt="" className="h-14 w-14 rounded-xl border border-white/10 object-cover" /><div><p className="font-bold text-slate-100">{fullName(candidate.assignedRecruiter)}</p><p className="text-sm text-slate-400">{candidate.assignedRecruiter.designation || "Recruiter"}</p><p className="text-sm text-cyan-500">{candidate.assignedRecruiter.email}</p></div></div> : <p className="text-sm text-slate-400">A recruiter has not been assigned yet.</p>}</Card>
      <Card title="Download My Resume">{candidate?.resumeFile?.url ? <div><p className="text-sm text-slate-400">Latest resume uploaded {fmtDate(candidate.resumeFile.uploadedAt)}</p><a href={candidate.resumeFile.url} download={candidate.resumeFile.fileName || "resume.pdf"} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-cyan-200">Download Latest Resume</a></div> : <p className="text-sm text-slate-400">Your latest resume has not been uploaded yet.</p>}</Card>
    </div>
  </div>;
}
