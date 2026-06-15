import { STATUS_COLORS } from "../../constants/enums";

export default function Badge({ status, children }) {
  const label = children || status;
  const color = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
