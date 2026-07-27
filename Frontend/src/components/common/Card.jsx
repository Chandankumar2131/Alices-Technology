export default function Card({ children, className = "", title, action, titleAs = "h2" }) {
  const TitleTag = titleAs;

  return (
    <section
      className={`theme-card motion-card group rounded-xl border p-4 shadow-[0_16px_45px_rgba(0,0,0,0.24)] ring-1 backdrop-blur-xl transition-colors duration-150 sm:p-5 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          {title && (
            <TitleTag className="text-sm font-semibold tracking-[0.02em] text-slate-200">
              {title}
            </TitleTag>
          )}
          {action && <div className="w-full sm:w-auto">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
