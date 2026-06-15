const VARIANTS = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 hover:from-cyan-400 hover:to-indigo-400 shadow-lg shadow-cyan-500/20",
  secondary: "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
  success: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
  outline: "border border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/10",
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
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />
      )}
      {children}
    </button>
  );
}
