export default function EmptyState({ message = "Nothing here yet" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="text-3xl opacity-70">📭</div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
