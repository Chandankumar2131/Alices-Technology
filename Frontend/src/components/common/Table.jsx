import Spinner from "./Spinner";
import EmptyState from "../ui/EmptyState";

export default function Table({ columns, data = [], loading, emptyText = "No records found" }) {
  if (loading) return <Spinner />;
  if (!data.length) return <EmptyState message={emptyText} />;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-white/10 bg-slate-950/35 shadow-[0_14px_36px_rgba(0,0,0,0.2)]">
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
            <tr key={row._id || i} className="transition hover:bg-cyan-300/[0.04]">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-3.5 align-top text-slate-300 sm:px-4">
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
