export const APP_TIME_ZONE = "America/New_York";
const EMPTY_VALUE = "\u2014";

export const fmtMoney = (n) =>
  "\u20B9" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtDate = (d) => {
  if (!d) return EMPTY_VALUE;

  const dateOnlyMatch = String(d).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(
        Date.UTC(
          Number(dateOnlyMatch[1]),
          Number(dateOnlyMatch[2]) - 1,
          Number(dateOnlyMatch[3]),
          12
        )
      )
    : new Date(d);

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : EMPTY_VALUE;

export const fmtDateTime = (d) =>
  d ? `${fmtDate(d)}, ${fmtTime(d)}` : EMPTY_VALUE;

export const fullName = (u) =>
  u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : EMPTY_VALUE;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
