export const fmtMoney = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

export const fmtDateTime = (d) =>
  d ? `${fmtDate(d)}, ${fmtTime(d)}` : "—";

export const fullName = (u) =>
  u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "—";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const monthName = (m) => MONTHS[m - 1] || m;

export const fmtHours = (hours) => {
  const totalMinutes = Math.round(Number(hours || 0) * 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = String(totalMinutes % 60).padStart(2, "0");

  return `${wholeHours}:${minutes} Hrs`;
};
