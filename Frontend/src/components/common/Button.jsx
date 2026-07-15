const VARIANTS = {
  primary:
    "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30 hover:bg-cyan-200",
  secondary: "border border-white/10 bg-slate-900/80 text-slate-100 hover:border-slate-500/70 hover:bg-slate-800",
  danger: "bg-rose-500 text-white shadow-lg shadow-rose-950/25 hover:bg-rose-400",
  success: "bg-lime-300 text-slate-950 shadow-lg shadow-lime-950/20 hover:bg-lime-200",
  outline: "border border-cyan-300/45 bg-cyan-300/5 text-cyan-100 hover:bg-cyan-300/12",
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      data-variant={variant}
      disabled={disabled || loading}
      className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />
      )}
      {children}
    </button>
  );
}
