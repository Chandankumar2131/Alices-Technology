import { useCallback, useEffect, useState } from "react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import StatCard from "../../components/ui/StatCard";
import useAuth from "../../hooks/useAuth";
import { leadService } from "../../service/leadService";
import { fullName } from "../../utils/helpers";
import notify from "../../utils/toast";
import { detailColumns, LEAD_STATUSES, todayIndia } from "./leadShared";

const blank = { candidateName: "", contactNumber: "", email: "", linkedin: "", graduationYear: "", visaStatus: "", leadComment: "", callDate: "", callTime: "" };
const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong";

export default function LeadGeneration() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]); const [salesEmployees, setSalesEmployees] = useState([]);
  const [filters, setFilters] = useState({ date: todayIndia(), status: "" });
  const [form, setForm] = useState(blank); const [open, setOpen] = useState(false); const [forwarding, setForwarding] = useState(null); const [salesEmployeeId, setSalesEmployeeId] = useState("");
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const response = await leadService.getAll(filters); setRows(response.data || []); } catch (error) { notify.error(errorText(error)); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  useEffect(() => { leadService.getSalesEmployees().then((response) => setSalesEmployees(response.data || [])).catch(() => setSalesEmployees([])); }, []);
  const submit = async (event) => { event.preventDefault(); if (!form.candidateName.trim()) return notify.error("Candidate name is required"); setBusy(true); try { await leadService.create(form); notify.success("Lead created"); setOpen(false); setForm(blank); await load(); } catch (error) { notify.error(errorText(error)); } finally { setBusy(false); } };
  const forward = async () => { if (!salesEmployeeId) return notify.error("Select a Sales employee"); setBusy(true); try { await leadService.forward(forwarding._id, salesEmployeeId); notify.success("Lead forwarded to Sales"); setForwarding(null); setSalesEmployeeId(""); await load(); } catch (error) { notify.error(errorText(error)); } finally { setBusy(false); } };
  const columns = [...detailColumns, { key: "action", header: "Action", render: (row) => <Button variant="outline" className="min-h-8 px-2 py-1 text-xs" onClick={() => { setForwarding(row); setSalesEmployeeId(row.assignedSales?._id || ""); }}>{row.assignedSales ? "Reassign" : "Forward to Sales"}</Button> }];
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-50">Lead Generation</h1><p className="mt-1 text-sm text-slate-400">Create candidate leads and forward them to the Sales team.</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><StatCard label="Leads Generated" value={rows.length} /><StatCard label="Forwarded" value={rows.filter((row) => row.assignedSales).length} /><StatCard label="Closed" value={rows.filter((row) => row.status === "Closed").length} /></div>
    <Card
      title="My Lead Records"
      action={<Button onClick={() => setOpen(true)}>+ Add Lead</Button>}
    >
      <div className="mb-5 grid grid-cols-1 items-end gap-4 rounded-xl border border-white/[0.07] bg-slate-950/20 p-4 sm:grid-cols-2">
        <Input
          label="Generated Date"
          type="date"
          value={filters.date}
          onChange={(event) => setFilters((value) => ({ ...value, date: event.target.value }))}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))}
          options={[{ value: "", label: "All statuses" }, ...LEAD_STATUSES]}
        />
      </div>
      <Table
        className="lead-records-table"
        columns={columns}
        data={rows}
        loading={loading}
        emptyText="No leads found for the selected date"
      />
    </Card>
    <Modal size="lg" open={open} onClose={() => setOpen(false)} title="Add Lead" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={submit}>Save Lead</Button></>}><form onSubmit={submit} className="space-y-4"><Input label="Lead Person (automatically assigned)" value={fullName(user)} disabled /><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="Candidate Name *" value={form.candidateName} onChange={(event) => setForm({ ...form, candidateName: event.target.value })} /><Input label="Contact Number" value={form.contactNumber} onChange={(event) => setForm({ ...form, contactNumber: event.target.value })} /><Input label="Email ID" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><Input label="LinkedIn" type="url" value={form.linkedin} onChange={(event) => setForm({ ...form, linkedin: event.target.value })} /><Input label="Graduation Year" value={form.graduationYear} onChange={(event) => setForm({ ...form, graduationYear: event.target.value })} /><Input label="Visa Status" value={form.visaStatus} onChange={(event) => setForm({ ...form, visaStatus: event.target.value })} /><Input label="Call Date" type="date" value={form.callDate} onChange={(event) => setForm({ ...form, callDate: event.target.value })} /><Input label="Call Time" type="time" value={form.callTime} onChange={(event) => setForm({ ...form, callTime: event.target.value })} /></div><div><label htmlFor="lead-comment" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Lead Comment</label><textarea id="lead-comment" rows={3} maxLength={2000} value={form.leadComment} onChange={(event) => setForm({ ...form, leadComment: event.target.value })} className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none" /></div></form></Modal>
    <Modal open={!!forwarding} onClose={() => setForwarding(null)} title="Forward Lead to Sales" footer={<><Button variant="secondary" onClick={() => setForwarding(null)}>Cancel</Button><Button loading={busy} onClick={forward}>Forward</Button></>}><div className="space-y-4"><p className="text-sm text-slate-400">Forward <span className="font-semibold text-slate-100">{forwarding?.candidateName}</span> to a Sales employee.</p><Select label="Sales Person *" value={salesEmployeeId} onChange={(event) => setSalesEmployeeId(event.target.value)} options={[{ value: "", label: salesEmployees.length ? "Select Sales employee" : "No Sales employees available" }, ...salesEmployees.map((employee) => ({ value: employee._id, label: `${fullName(employee)} · ${employee.employeeId || ""}` }))]} /></div></Modal>
  </div>;
}
