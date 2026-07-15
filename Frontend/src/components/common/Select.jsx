import { useId } from "react";

export default function Select({ label, options = [], error, className = "", ...props }) {
  const generatedId = useId();
  const id = props.id || props.name || generatedId;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={errorId}
        className={`theme-field w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-inner shadow-black/10 outline-none transition focus:ring-2 ${error ? "border-rose-400/70 focus:border-rose-300/80 focus:ring-rose-400/15" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const labelText = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {labelText || "-"}
            </option>
          );
        })}
      </select>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
