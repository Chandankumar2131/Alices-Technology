import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import StatCard from "../../components/ui/StatCard";
import EmployeeLink from "../../components/ui/EmployeeLink";
import { resignationService } from "../../service/resignationService";
import { fmtDate } from "../../utils/helpers";
import notify from "../../utils/toast";

const FILTERS = [{ value: "", label: "All requests" }, "Submitted", "Approved", "Rejected"];
const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong";

export default function Resignations() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [review, setReview] = useState(null);
  const [remarks, setRemarks] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await resignationService.getAll({ status }); setRows(response.data || []); }
    catch (error) { notify.error(errorText(error)); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const stats = useMemo(() => ({
    submitted: rows.filter((row) => row.resignation?.status === "Submitted").length,
    approved: rows.filter((row) => row.resignation?.status === "Approved").length,
    rejected: rows.filter((row) => row.resignation?.status === "Rejected").length,
  }), [rows]);

  const confirmReview = async () => {
    if (!review) return;
    setBusy("review");
    try {
      await resignationService.review(review.employee._id, { status: review.status, adminRemarks: remarks });
      notify.success(`Resignation ${review.status.toLowerCase()}`); setReview(null); setRemarks(""); await load();
    } catch (error) { notify.error(errorText(error)); }
    finally { setBusy(""); }
  };

  const completeHandover = async (employee, field) => {
    setBusy(`${employee._id}-${field}`);
    try { await resignationService.updateHandover(employee._id, { [field]: true }); notify.success("Handover status updated"); await load(); }
    catch (error) { notify.error(errorText(error)); }
    finally { setBusy(""); }
  };

  const columns = [
    { key: "employee", header: "Employee", render: (row) => <EmployeeLink employee={row} /> },
    { key: "department", header: "Department", render: (row) => row.department || "—" },
    { key: "reason", header: "Reason", render: (row) => <span className="block max-w-xs whitespace-normal">{row.resignation?.reason || "—"}</span> },
    { key: "submitted", header: "Submitted", render: (row) => fmtDate(row.resignation?.resignationDate) },
    { key: "lastWorkingDay", header: "Last Working Day", render: (row) => fmtDate(row.resignation?.lastWorkingDay) },
    { key: "status", header: "Status", render: (row) => <Badge status={row.resignation?.status} /> },
    { key: "handover", header: "Handover", render: (row) => {
      const resignation = row.resignation || {};
      if (resignation.status !== "Approved") return <span className="text-xs text-slate-500">Available after approval</span>;
      return <div className="flex min-w-44 flex-col gap-2">
        <Button variant={resignation.knowledgeTransferCompleted ? "success" : "outline"} className="min-h-8 px-2 py-1 text-xs" disabled={resignation.knowledgeTransferCompleted} loading={busy === `${row._id}-knowledgeTransferCompleted`} onClick={() => completeHandover(row, "knowledgeTransferCompleted")}>KT {resignation.knowledgeTransferCompleted ? "Completed" : "Pending"}</Button>
        <Button variant={resignation.assetsReturned ? "success" : "outline"} className="min-h-8 px-2 py-1 text-xs" disabled={resignation.assetsReturned} loading={busy === `${row._id}-assetsReturned`} onClick={() => completeHandover(row, "assetsReturned")}>Assets {resignation.assetsReturned ? "Returned" : "Pending"}</Button>
      </div>;
    } },
    { key: "actions", header: "Actions", render: (row) => row.resignation?.status === "Submitted" ? <div className="flex gap-2"><Button variant="success" className="min-h-8 px-2 py-1 text-xs" onClick={() => { setReview({ employee: row, status: "Approved" }); setRemarks(""); }}>Approve</Button><Button variant="danger" className="min-h-8 px-2 py-1 text-xs" onClick={() => { setReview({ employee: row, status: "Rejected" }); setRemarks(""); }}>Reject</Button></div> : <span className="block max-w-xs whitespace-normal text-xs text-slate-400">{row.resignation?.adminRemarks || "Reviewed"}</span> },
  ];

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-50">Resignations</h1><p className="mt-1 text-sm text-slate-400">Review requests and track employee exit handovers.</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><StatCard label="Pending" value={stats.submitted} /><StatCard label="Approved" value={stats.approved} /><StatCard label="Rejected" value={stats.rejected} /></div>
    <Card title="Resignation Requests" action={<div className="w-48"><Select aria-label="Filter resignation status" options={FILTERS} value={status} onChange={(event) => setStatus(event.target.value)} /></div>}><Table columns={columns} data={rows} loading={loading} emptyText="No resignation requests found" /></Card>
    <Modal open={!!review} onClose={() => setReview(null)} title={`${review?.status || "Review"} Resignation`} footer={<><Button variant="secondary" onClick={() => setReview(null)}>Cancel</Button><Button variant={review?.status === "Approved" ? "success" : "danger"} loading={busy === "review"} onClick={confirmReview}>{review?.status}</Button></>}>
      <div><p className="mb-4 text-sm text-slate-400">Reviewing the resignation for <span className="font-semibold text-slate-100">{review?.employee?.firstName} {review?.employee?.lastName}</span>. Handover remains pending after approval until KT and assets are confirmed separately.</p><label htmlFor="resignation-remarks" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Admin Remarks</label><textarea id="resignation-remarks" rows={4} maxLength={2000} value={remarks} onChange={(event) => setRemarks(event.target.value)} className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none" /></div>
    </Modal>
  </div>;
}
