import Card from "../common/Card";

export default function StatCard({ label, value, icon, accent = "text-cyan-400" }) {
  return (
    <Card className="flex items-center gap-4">
      {icon && <div className={`text-2xl ${accent}`}>{icon}</div>}
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
      </div>
    </Card>
  );
}
