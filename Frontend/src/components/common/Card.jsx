export default function Card({ children, className = "", title, action }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
