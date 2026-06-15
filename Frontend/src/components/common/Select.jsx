export default function Select({ label, options = [], error, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-300">{label}</label>
      )}
      <select
        className={`w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 ${className}`}
        {...props}
      >
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const labelText = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={value} value={value} className="bg-slate-800 text-slate-100">
              {labelText || "—"}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
