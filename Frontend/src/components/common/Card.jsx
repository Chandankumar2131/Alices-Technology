export default function Card({ children, className = "", title, action }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
          {action && <div className="w-full sm:w-auto">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
