export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</label>
      )}
      <input
        className={`w-full rounded-lg border border-white/10 bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner shadow-black/10 outline-none transition focus:border-cyan-300/60 focus:bg-slate-950/80 focus:ring-2 focus:ring-cyan-300/15 ${error ? "border-rose-400/70 focus:border-rose-300/80 focus:ring-rose-400/15" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
