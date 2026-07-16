import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import { candidateService } from "../../service/candidateService";
import { fmtDate, fullName } from "../../utils/helpers";
import notify from "../../utils/toast";

const emptyApplication = { candidateId: "", urls: "" };
const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong";

export default function MyCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentWorkDate, setCurrentWorkDate] = useState("");
  const [form, setForm] = useState(emptyApplication);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [candidateRes, applicationRes] = await Promise.all([
        candidateService.getAll({ limit: 100 }), candidateService.getAllApplications(),
      ]);
      setCandidates(candidateRes.data || []); setApplications(applicationRes.data || []);
      setCurrentWorkDate(applicationRes.currentWorkDate || "");
    } catch (error) { notify.error(errorText(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const visibleApplications = useMemo(() => applications.filter((item) =>
    (!selectedId || item.candidate?._id === selectedId) &&
    (!selectedDate || item.workDate === selectedDate)
  ), [applications, selectedDate, selectedId]);
  const parsedUrls = useMemo(() => form.urls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean), [form.urls]);

  const startApplication = (candidate = null) => {
    setForm({ candidateId: candidate?._id || selectedId || candidates[0]?._id || "", urls: "" });
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.candidateId || !parsedUrls.length) return notify.error("Select a candidate and paste at least one job URL");
    setBusy(true);
    try {
      const response = await candidateService.createApplication({ candidateId: form.candidateId, urls: parsedUrls });
      const summary = response.summary || {};
      const extras = [summary.duplicates ? `${summary.duplicates} duplicate skipped` : "", summary.invalid ? `${summary.invalid} invalid skipped` : ""].filter(Boolean).join(" · ");
      notify.success(`${summary.saved || parsedUrls.length} applications saved${extras ? ` · ${extras}` : ""}`);
      setOpen(false); setForm(emptyApplication); await load();
    } catch (error) {
      const summary = error?.response?.data?.summary;
      notify.error(summary ? `${errorText(error)} · ${summary.duplicates || 0} duplicates · ${summary.invalid || 0} invalid` : errorText(error));
    } finally { setBusy(false); }
  };

  const columns = [
    { key: "candidate", header: "Candidate", render: (row) => fullName(row.candidate?.user) },
    { key: "workDate", header: "Applied", render: (row) => fmtDate(row.workDate || row.appliedAt) },
    { key: "url", header: "Applied Job URL", render: (row) => <a className="font-semibold text-cyan-500 hover:underline" href={row.appliedUrl} target="_blank" rel="noreferrer">Open job</a> },
  ];

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-50">My Candidates</h1><p className="mt-1 text-sm text-slate-400">Paste all applied job valid URL.</p></div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {candidates.map((candidate) => {
        const candidateApps = applications.filter((item) => item.candidate?._id === candidate._id);
        const todayCount = candidateApps.filter((item) => item.workDate === currentWorkDate).length;
        return <Card key={candidate._id} title={fullName(candidate.user)} action={<Badge status={candidate.subscriptionStatus} />}>
          <p className="font-semibold text-slate-200">{candidate.primaryJobRole}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm"><div><p className="text-slate-500">Today</p><p className="mt-1 text-xl font-bold text-cyan-400">{todayCount}</p></div><div><p className="text-slate-500">Total</p><p className="mt-1 text-xl font-bold text-slate-100">{candidateApps.length}</p></div></div>
          <Button className="mt-4 w-full" onClick={() => startApplication(candidate)}>Paste Job URLs</Button>
        </Card>;
      })}
      {!loading && !candidates.length && <Card><p className="text-sm text-slate-400">No candidates are assigned to you.</p></Card>}
    </div>
    <Card title="Applied Job History" action={<Button onClick={() => startApplication()} disabled={!candidates.length}>+ Paste URLs</Button>}>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><Select label="Candidate" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} options={[{ value: "", label: "All assigned candidates" }, ...candidates.map((candidate) => ({ value: candidate._id, label: fullName(candidate.user) }))]} /><Input label="Applied Date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
      {selectedDate && <button type="button" onClick={() => setSelectedDate("")} className="mb-3 text-xs font-semibold text-cyan-500 hover:underline">Clear date filter</button>}
      <Table columns={columns} data={visibleApplications} loading={loading} emptyText="No job applications recorded" />
    </Card>
    <Modal open={open} onClose={() => setOpen(false)} title="Paste Applied Job URLs" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={busy}>Save {parsedUrls.length || ""} Application{parsedUrls.length === 1 ? "" : "s"}</Button></>}>
      <form onSubmit={submit} className="space-y-4">
        <Select label="Candidate *" value={form.candidateId} onChange={(event) => setForm((current) => ({ ...current, candidateId: event.target.value }))} options={candidates.map((candidate) => ({ value: candidate._id, label: `${fullName(candidate.user)} · ${candidate.candidateId}` }))} />
        <div><div className="mb-1.5 flex items-center justify-between gap-3"><label htmlFor="job-urls" className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Applied Job URLs *</label><span className="text-xs font-semibold text-cyan-500">{parsedUrls.length} detected</span></div><textarea id="job-urls" rows={12} autoFocus value={form.urls} onChange={(event) => setForm((current) => ({ ...current, urls: event.target.value }))} placeholder={"Paste one URL per line\nhttps://linkedin.com/jobs/view/...\nhttps://www.indeed.com/viewjob?..."} className="theme-field w-full resize-y rounded-lg border px-3.5 py-3 font-mono text-sm leading-6 outline-none" /></div>
        <p className="text-xs leading-5 text-slate-400">Each valid URL becomes a separate application with the current date and time. Empty lines, invalid URLs and duplicates are skipped.</p>
      </form>
    </Modal>
  </div>;
}
