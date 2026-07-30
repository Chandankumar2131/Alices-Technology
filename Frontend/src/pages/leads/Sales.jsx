import { useCallback, useEffect, useState } from "react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import StatCard from "../../components/ui/StatCard";
import { leadService } from "../../service/leadService";
import notify from "../../utils/toast";
import { activityColumns, detailColumns, LEAD_STATUSES, todayIndia } from "./leadShared";

const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong";
export default function Sales() {
  const [rows, setRows] = useState([]); const [activities, setActivities] = useState([]); const [filters, setFilters] = useState({ date: "", status: "" }); const [activityDate, setActivityDate] = useState(todayIndia());
  const [editing, setEditing] = useState(null); const [form, setForm] = useState({ salesComment: "", status: "Contacted", callDate: "", callTime: "" });
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const response = await leadService.getAll(filters); setRows(response.data || []); } catch (error) { notify.error(errorText(error)); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const loadActivities = useCallback(async () => { try { const response = await leadService.getSalesActivities({ date: activityDate }); setActivities(response.data || []); } catch (error) { notify.error(errorText(error)); } }, [activityDate]);
  useEffect(() => { const timer = setTimeout(loadActivities, 0); return () => clearTimeout(timer); }, [loadActivities]);
  const edit = (row) => { setEditing(row); setForm({ salesComment: row.salesComment || "", status: row.status || "Contacted", callDate: row.callDate ? String(row.callDate).slice(0, 10) : "", callTime: row.callTime || "" }); };
  const save = async () => { setBusy(true); try { await leadService.updateSales(editing._id, form); notify.success("Sales activity updated"); setEditing(null); await Promise.all([load(), loadActivities()]); } catch (error) { notify.error(errorText(error)); } finally { setBusy(false); } };
  const columns = [...detailColumns, { key: "action", header: "Action", render: (row) => <Button variant="outline" className="min-h-8 px-2 py-1 text-xs" onClick={() => edit(row)}>Update</Button> }];
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-50">Sales</h1><p className="mt-1 text-sm text-slate-400">Work on leads forwarded to you and record every follow-up.</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><StatCard label="Assigned Leads" value={rows.length} /><StatCard label="Follow Ups" value={rows.filter((row) => row.status === "Follow Up").length} /><StatCard label="Converted" value={rows.filter((row) => row.status === "Converted").length} /></div>
    <Card title="My Sales Leads"><div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="Generated Date" type="date" value={filters.date} onChange={(event) => setFilters((value) => ({ ...value, date: event.target.value }))} /><Select label="Status" value={filters.status} onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} options={[{ value: "", label: "All statuses" }, ...LEAD_STATUSES]} /></div><Table columns={columns} data={rows} loading={loading} emptyText="No assigned leads found" /></Card>
    <Card title="My Daily Sales Activity"><div className="mb-4 max-w-sm"><Input label="Activity Work Date" type="date" value={activityDate} onChange={(event) => setActivityDate(event.target.value)} /></div><Table columns={activityColumns} data={activities} emptyText="No Sales activity recorded for this date" /></Card>
    <Modal open={!!editing} onClose={() => setEditing(null)} title={`Update ${editing?.candidateName || "Lead"}`} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button loading={busy} onClick={save}>Save Activity</Button></>}><div className="space-y-4"><Select label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} options={LEAD_STATUSES.filter((value) => value !== "New")} /><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="Call Date" type="date" value={form.callDate} onChange={(event) => setForm({ ...form, callDate: event.target.value })} /><Input label="Call Time" type="time" value={form.callTime} onChange={(event) => setForm({ ...form, callTime: event.target.value })} /></div><div><label htmlFor="sales-comment" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Sales Comment</label><textarea id="sales-comment" rows={4} maxLength={2000} value={form.salesComment} onChange={(event) => setForm({ ...form, salesComment: event.target.value })} className="theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none" /></div></div></Modal>
  </div>;
}
