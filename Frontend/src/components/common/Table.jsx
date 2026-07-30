import Spinner from "./Spinner";
import EmptyState from "../ui/EmptyState";

export default function Table({ columns, data = [], loading, emptyText = "No records found", className = "" }) {
  if (loading) return <Spinner />;
  if (!data.length) return <EmptyState message={emptyText} />;

  return (
    <div className={`theme-table w-full overflow-x-auto rounded-xl border shadow-[0_14px_36px_rgba(0,0,0,0.2)] ${className}`}>
      <table className="min-w-[44rem] divide-y divide-white/10 text-sm md:min-w-full">
        <thead className="bg-slate-900/85">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-400 sm:px-4">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {data.map((row, i) => (
            <tr key={row._id || i} className="motion-row transition hover:bg-cyan-300/[0.04]">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-4 align-top text-slate-300 sm:px-4">
                  {c.render ? c.render(row) : row[c.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
