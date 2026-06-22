export default function Select({ label, options = [], error, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</label>
      )}
      <select
        className={`theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-inner shadow-black/10 outline-none transition focus:ring-2 ${error ? "border-rose-400/70 focus:border-rose-300/80 focus:ring-rose-400/15" : ""} ${className}`}
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
