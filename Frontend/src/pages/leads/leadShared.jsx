import Badge from "../../components/common/Badge";
import { fmtDate, fullName } from "../../utils/helpers";

export const LEAD_STATUSES = ["New", "Forwarded", "Contacted", "Follow Up", "Converted", "Rejected"];
export const todayIndia = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
  const date = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  if (Number(parts.hour) < 5) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

export const detailColumns = [
  { key: "candidateName", header: "Candidate", render: (row) => <div><p className="font-semibold text-slate-100">{row.candidateName}</p><p className="text-xs text-slate-500">{row.email || "No email"}</p></div> },
  { key: "contactNumber", header: "Contact", render: (row) => row.contactNumber || "—" },
  { key: "createdBy", header: "Lead Person", render: (row) => fullName(row.createdBy) },
  { key: "assignedSales", header: "Sales Person", render: (row) => fullName(row.assignedSales) || "Not assigned" },
  { key: "generatedDate", header: "Generated", render: (row) => fmtDate(row.workDate || row.generatedDate) },
  { key: "call", header: "Call", render: (row) => <span>{row.callDate ? fmtDate(row.callDate) : "—"}{row.callTime ? ` · ${row.callTime}` : ""}</span> },
  { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
  { key: "graduationYear", header: "Graduation", render: (row) => row.graduationYear || "—" },
  { key: "visaStatus", header: "Visa", render: (row) => row.visaStatus || "—" },
  { key: "linkedin", header: "LinkedIn", render: (row) => row.linkedin ? <a href={row.linkedin} target="_blank" rel="noreferrer" className="font-semibold text-cyan-500 hover:underline">Open</a> : "—" },
  { key: "leadComment", header: "Lead Comment", render: (row) => <span className="block max-w-xs whitespace-normal">{row.leadComment || "—"}</span> },
  { key: "salesComment", header: "Sales Comment", render: (row) => <span className="block max-w-xs whitespace-normal">{row.salesComment || "—"}</span> },
];

export const activityColumns = [
  { key: "workDate", header: "Work Date", render: (row) => fmtDate(row.workDate) },
  { key: "candidate", header: "Candidate", render: (row) => row.lead?.candidateName || "—" },
  { key: "salesEmployee", header: "Sales Person", render: (row) => fullName(row.salesEmployee) },
  { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
  { key: "call", header: "Call", render: (row) => <span>{row.callDate ? fmtDate(row.callDate) : "—"}{row.callTime ? ` · ${row.callTime}` : ""}</span> },
  { key: "salesComment", header: "Sales Comment", render: (row) => <span className="block max-w-md whitespace-normal">{row.salesComment || "—"}</span> },
];
