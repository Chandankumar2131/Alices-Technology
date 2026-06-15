import Spinner from "../../components/common/Spinner";
import { fmtTime } from "../../utils/helpers";

const STATUS_BG = {
  Present: "border-emerald-100 bg-emerald-100",
  Absent: "border-rose-100 bg-rose-100",
  Leave: "border-sky-100 bg-sky-100",
  Weekend: "border-slate-700 bg-slate-800/80",
  "Half Day": "border-amber-100 bg-amber-100",
  Upcoming: "border-rose-100 bg-rose-100",
};

const STATUS_TEXT = {
  Present: "text-emerald-700",
  Absent: "text-red-700",
  Leave: "text-sky-700",
  Weekend: "text-sky-300",
  "Half Day": "text-amber-700",
  Upcoming: "text-red-800",
};

const DATE_TEXT = {
  Present: "text-emerald-800",
  Absent: "text-red-800",
  Leave: "text-sky-800",
  Weekend: "text-sky-300",
  "Half Day": "text-amber-800",
  Upcoming: "text-red-800",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AttendanceCalendar({ calendar = [], loading, month, year }) {
  if (loading) return <Spinner />;
  if (!calendar.length) return <p className="text-sm text-slate-500">No data for this month.</p>;

  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const blanks = Array.from({ length: firstDay });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {blanks.map((_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {calendar.map((day) => {
          const date = new Date(day.date);
          date.setHours(0, 0, 0, 0);
          const isFuture = date > today;
          const visibleStatus = isFuture && day.status === "Absent" ? "Upcoming" : day.status;
          const bg = STATUS_BG[visibleStatus] || "border-slate-800 bg-slate-950/30";
          const text = STATUS_TEXT[visibleStatus] || "text-slate-400";
          const dateText = DATE_TEXT[visibleStatus] || "text-slate-400";

          return (
            <div
              key={day.date}
              className={`min-h-16 rounded-lg border p-2 text-center text-xs shadow-sm ${bg}`}
            >
              <div className="mb-1 flex items-center justify-center">
                <span className={`font-bold ${dateText}`}>{date.getDate()}</span>
              </div>

              {visibleStatus !== "Upcoming" && (
                <p className={`font-medium ${text}`}>{visibleStatus}</p>
              )}

              {day.checkIn && (
                <p className={`mt-1 text-[10px] ${visibleStatus === "Present" ? "text-emerald-700" : "text-slate-500"}`}>
                  {fmtTime(day.checkIn)} - {fmtTime(day.checkOut)}
                </p>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
