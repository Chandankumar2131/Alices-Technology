import Card from "../common/Card";

export default function StatCard({ label, value, icon, accent = "text-cyan-400" }) {
  return (
    <Card className="flex min-h-28 items-center gap-4">
      {icon && (
        <div className={`theme-stat-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-2xl ${accent}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
        <p className="mt-1 truncate text-2xl font-bold text-slate-50">{value}</p>
      </div>
    </Card>
  );
}
