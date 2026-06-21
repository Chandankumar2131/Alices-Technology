import { STATUS_COLORS } from "../../constants/enums";

export default function Badge({ status, children }) {
  const label = children || status;
  const color = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-white/10 ${color}`}>
      {label}
    </span>
  );
}
