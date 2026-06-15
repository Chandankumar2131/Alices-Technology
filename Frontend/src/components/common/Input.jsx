export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-300">{label}</label>
      )}
      <input
        className={`w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 ${error ? "border-rose-500/60" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
