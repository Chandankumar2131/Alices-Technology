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
const RESIGNATION_STATUSES = new Set(["Submitted", "Approved", "Rejected"]);
const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong";

export default function Resignations() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [review, setReview] = useState(null);
  const [details, setDetails] = useState(null);
  const [remarks, setRemarks] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await resignationService.getAll({ status });
      setRows((response.data || []).filter((employee) =>
        RESIGNATION_STATUSES.has(employee.resignation?.status)
      ));
    } catch (error) {
      notify.error(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => ({
    submitted: rows.filter((row) => row.resignation?.status === "Submitted").length,
    approved: rows.filter((row) => row.resignation?.status === "Approved").length,
    rejected: rows.filter((row) => row.resignation?.status === "Rejected").length,
  }), [rows]);

  const confirmReview = async () => {
    if (!review) return;
    setBusy("review");
    try {
      await resignationService.review(review.employee._id, {
        status: review.status,
        adminRemarks: remarks,
      });
      notify.success(`Resignation ${review.status.toLowerCase()}`);
      setReview(null);
      setRemarks("");
      await load();
    } catch (error) {
      notify.error(errorText(error));
    } finally {
      setBusy("");
    }
  };

  const completeHandover = async (employee, field) => {
    setBusy(`${employee._id}-${field}`);
    try {
      await resignationService.updateHandover(employee._id, { [field]: true });
      notify.success("Handover status updated");
      await load();
    } catch (error) {
      notify.error(errorText(error));
    } finally {
      setBusy("");
    }
  };

  const openReview = (employee, nextStatus) => {
    setReview({ employee, status: nextStatus });
    setRemarks("");
  };

  const columns = [
    { key: "employee", header: "Employee", render: (row) => <EmployeeLink employee={row} /> },
    { key: "department", header: "Department", render: (row) => row.department || "—" },
    {
      key: "reason",
      header: "Reason",
      render: (row) => (
        <div className="max-w-64">
          <p className="line-clamp-2 whitespace-normal text-sm leading-5 text-slate-300">
            {row.resignation?.reason || "No reason provided"}
          </p>
          <button
            type="button"
            onClick={() => setDetails(row)}
            className="mt-1.5 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            View details
          </button>
        </div>
      ),
    },
    { key: "submitted", header: "Submitted", render: (row) => fmtDate(row.resignation?.resignationDate) },
    { key: "lastWorkingDay", header: "Last Working Day", render: (row) => fmtDate(row.resignation?.lastWorkingDay) },
    { key: "status", header: "Status", render: (row) => <Badge status={row.resignation?.status} /> },
    {
      key: "handover",
      header: "Handover",
      render: (row) => {
        const resignation = row.resignation || {};
        if (resignation.status !== "Approved") {
          return <span className="text-xs text-slate-500">Available after approval</span>;
        }
        return (
          <div className="flex min-w-40 flex-col gap-2">
            <Button
              variant={resignation.knowledgeTransferCompleted ? "success" : "outline"}
              className="min-h-8 px-2 py-1 text-xs"
              disabled={resignation.knowledgeTransferCompleted}
              loading={busy === `${row._id}-knowledgeTransferCompleted`}
              onClick={() => completeHandover(row, "knowledgeTransferCompleted")}
            >
              KT {resignation.knowledgeTransferCompleted ? "Completed" : "Pending"}
            </Button>
            <Button
              variant={resignation.assetsReturned ? "success" : "outline"}
              className="min-h-8 px-2 py-1 text-xs"
              disabled={resignation.assetsReturned}
              loading={busy === `${row._id}-assetsReturned`}
              onClick={() => completeHandover(row, "assetsReturned")}
            >
              Assets {resignation.assetsReturned ? "Returned" : "Pending"}
            </Button>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => row.resignation?.status === "Submitted" ? (
        <div className="flex gap-2">
          <Button variant="success" className="min-h-8 px-2 py-1 text-xs" onClick={() => openReview(row, "Approved")}>Approve</Button>
          <Button variant="danger" className="min-h-8 px-2 py-1 text-xs" onClick={() => openReview(row, "Rejected")}>Reject</Button>
        </div>
      ) : (
        <span className="block max-w-52 whitespace-normal text-xs leading-5 text-slate-400">
          {row.resignation?.adminRemarks || "Reviewed"}
        </span>
      ),
    },
  ];

  return (
    <div className="motion-page space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Employee offboarding</p>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-50 sm:text-3xl">Resignation Management</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">
            Review submitted resignations and monitor knowledge transfer and asset-return milestones.
          </p>
        </div>
        <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs text-cyan-100">
          Only employees with a resignation request are shown
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Awaiting Review" value={stats.submitted} icon="⌛" accent="text-amber-300" />
        <StatCard label="Approved" value={stats.approved} icon="✓" accent="text-emerald-300" />
        <StatCard label="Rejected" value={stats.rejected} icon="×" accent="text-rose-300" />
      </div>

      <Card
        title="Resignation Requests"
        action={(
          <div className="w-full sm:w-52">
            <Select aria-label="Filter resignation status" options={FILTERS} value={status} onChange={(event) => setStatus(event.target.value)} />
          </div>
        )}
      >
        <Table
          columns={columns}
          data={rows}
          loading={loading}
          emptyText={status ? `No ${status.toLowerCase()} resignation requests` : "No resignation requests have been submitted"}
        />
      </Card>

      <Modal
        open={!!details}
        onClose={() => setDetails(null)}
        title="Resignation Details"
        size="lg"
        footer={<Button variant="secondary" onClick={() => setDetails(null)}>Close</Button>}
      >
        {details && (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Employee</p><p className="mt-1 font-semibold text-slate-100">{details.firstName} {details.lastName}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Department</p><p className="mt-1 text-slate-200">{details.department || "—"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Submitted</p><p className="mt-1 text-slate-200">{fmtDate(details.resignation?.resignationDate)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Last working day</p><p className="mt-1 text-slate-200">{fmtDate(details.resignation?.lastWorkingDay)}</p></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Employee reason</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-200">{details.resignation?.reason || "No reason provided"}</p>
            </div>
            {details.resignation?.adminRemarks && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Admin remarks</p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-200">{details.resignation.adminRemarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title={`${review?.status || "Review"} Resignation`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setReview(null)}>Cancel</Button>
            <Button variant={review?.status === "Approved" ? "success" : "danger"} loading={busy === "review"} onClick={confirmReview}>{review?.status}</Button>
          </>
        )}
      >
        <div>
          <p className="mb-4 text-sm leading-6 text-slate-400">
            Reviewing the resignation for <span className="font-semibold text-slate-100">{review?.employee?.firstName} {review?.employee?.lastName}</span>. Handover remains pending after approval until knowledge transfer and assets are confirmed separately.
          </p>
          <label htmlFor="resignation-remarks" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Admin Remarks</label>
          <textarea id="resignation-remarks" rows={4} maxLength={2000} value={remarks} onChange={(event) => setRemarks(event.target.value)} className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none" />
        </div>
      </Modal>
    </div>
  );
}
