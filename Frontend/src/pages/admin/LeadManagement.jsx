import { useCallback, useEffect, useState } from "react";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import StatCard from "../../components/ui/StatCard";
import { leadService } from "../../service/leadService";
import { fullName } from "../../utils/helpers";
import notify from "../../utils/toast";
import { activityColumns, detailColumns, LEAD_STATUSES, todayIndia } from "../leads/leadShared";

const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong";
export default function LeadManagement() {
  const [rows, setRows] = useState([]); const [activities, setActivities] = useState([]); const [leadEmployees, setLeadEmployees] = useState([]); const [salesEmployees, setSalesEmployees] = useState([]);
  const [filters, setFilters] = useState({ date: todayIndia(), status: "", leadPerson: "", salesPerson: "", search: "" }); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { const [leadResponse, activityResponse] = await Promise.all([leadService.getAll(filters), leadService.getSalesActivities({ date: filters.date, status: filters.status, salesPerson: filters.salesPerson })]); setRows(leadResponse.data || []); setActivities(activityResponse.data || []); } catch (error) { notify.error(errorText(error)); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { const timer = setTimeout(load, filters.search ? 300 : 0); return () => clearTimeout(timer); }, [load, filters.search]);
  useEffect(() => { Promise.all([leadService.getLeadEmployees(), leadService.getSalesEmployees()]).then(([leadResponse, salesResponse]) => { setLeadEmployees(leadResponse.data || []); setSalesEmployees(salesResponse.data || []); }).catch(() => { setLeadEmployees([]); setSalesEmployees([]); }); }, []);
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-slate-50">Lead & Sales Analysis</h1><p className="mt-1 text-sm text-slate-400">Analyze daily Lead Generation and Sales activity.</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Leads Generated" value={rows.length} /><StatCard label="Sales Updates" value={activities.length} /><StatCard label="Follow-Ups" value={activities.filter((row) => row.status === "Follow-UP").length} /><StatCard label="Closed" value={activities.filter((row) => row.status === "Closed").length} /></div>
    <Card title="Lead Generation Records"><div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5"><Input label="Work Date" type="date" value={filters.date} onChange={(event) => setFilters((value) => ({ ...value, date: event.target.value }))} /><Select label="Lead Employee" value={filters.leadPerson} onChange={(event) => setFilters((value) => ({ ...value, leadPerson: event.target.value }))} options={[{ value: "", label: "All Lead employees" }, ...leadEmployees.map((employee) => ({ value: employee._id, label: fullName(employee) }))]} /><Select label="Sales Employee" value={filters.salesPerson} onChange={(event) => setFilters((value) => ({ ...value, salesPerson: event.target.value }))} options={[{ value: "", label: "All Sales employees" }, ...salesEmployees.map((employee) => ({ value: employee._id, label: fullName(employee) }))]} /><Select label="Status" value={filters.status} onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} options={[{ value: "", label: "All statuses" }, ...LEAD_STATUSES]} /><Input label="Search" placeholder="Candidate, email or phone" value={filters.search} onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} /></div><Table columns={detailColumns} data={rows} loading={loading} emptyText="No lead records found for these filters" /></Card>
    <Card title="Sales Activity Records"><Table columns={activityColumns} data={activities} loading={loading} emptyText="No Sales activity found for these filters" /></Card>
  </div>;
}
