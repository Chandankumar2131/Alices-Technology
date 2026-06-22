import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-4">
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-hidden rounded-lg border border-white/10 bg-slate-950/95 shadow-[0_28px_90px_rgba(0,0,0,0.48)] ring-1 ring-white/[0.04]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="min-w-0 text-base font-semibold text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyan-300/35 hover:text-slate-100"
          >
            x
          </button>
        </div>
        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-4 py-4 text-slate-200 sm:px-5">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:justify-end sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
