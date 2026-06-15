export default function Spinner({ full = false }) {
  const spinner = (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
  );
  if (full) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        {spinner}
      </div>
    );
  }
  return <div className="flex items-center justify-center p-6">{spinner}</div>;
}
