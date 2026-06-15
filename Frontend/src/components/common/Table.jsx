import Spinner from "./Spinner";
import EmptyState from "../ui/EmptyState";

export default function Table({ columns, data = [], loading, emptyText = "No records found" }) {
  if (loading) return <Spinner />;
  if (!data.length) return <EmptyState message={emptyText} />;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-800/60">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-left font-semibold text-slate-400">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.map((row, i) => (
            <tr key={row._id || i} className="transition hover:bg-slate-800/40">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-slate-300">
                  {c.render ? c.render(row) : row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
