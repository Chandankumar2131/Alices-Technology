export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="min-w-0 text-base font-semibold text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-slate-500 hover:text-slate-300"
          >
            x
          </button>
        </div>
        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-4 py-4 text-slate-200 sm:px-5">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-800 px-4 py-3 sm:flex-row sm:justify-end sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
