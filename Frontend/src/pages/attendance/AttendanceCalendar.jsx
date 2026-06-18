import Spinner from "../../components/common/Spinner";
import { APP_TIME_ZONE, fmtTime } from "../../utils/helpers";

const STATUS_BG = {
  Present: "border-emerald-100 bg-emerald-100",
  Absent: "border-rose-100 bg-rose-100",
  Leave: "border-sky-100 bg-sky-100",
  Weekend: "border-slate-700 bg-slate-800/80",
  Holiday: "border-violet-100 bg-violet-100",
  "Half Day": "border-amber-100 bg-amber-100",
  Upcoming: "border-rose-100 bg-rose-100",
};

const STATUS_TEXT = {
  Present: "text-emerald-700",
  Absent: "text-red-700",
  Leave: "text-sky-700",
  Weekend: "text-sky-300",
  Holiday: "text-violet-700",
  "Half Day": "text-amber-700",
  Upcoming: "text-red-800",
};

const DATE_TEXT = {
  Present: "text-emerald-800",
  Absent: "text-red-800",
  Leave: "text-sky-800",
  Weekend: "text-sky-300",
  Holiday: "text-violet-800",
  "Half Day": "text-amber-800",
  Upcoming: "text-red-800",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toDateKey = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayNumber = (dateKey) => Number(dateKey.slice(8, 10));

const getTodayKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = byType.year;
  const month = byType.month;
  const day = byType.day;
  return `${year}-${month}-${day}`;
};

export default function AttendanceCalendar({ calendar = [], loading, month, year }) {
  if (loading) return <Spinner />;
  if (!calendar.length) return <p className="text-sm text-slate-500">No data for this month.</p>;

  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const blanks = Array.from({ length: firstDay });
  const todayKey = getTodayKey();

  return (
    <div>
      <div className="overflow-x-auto pb-1">
      <div className="mb-2 grid min-w-[42rem] grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid min-w-[42rem] grid-cols-7 gap-2">
        {blanks.map((_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {calendar.map((day) => {
          const dateKey = day.attendanceDate || toDateKey(day.date);
          const isFuture = dateKey > todayKey;
          const visibleStatus = isFuture && day.status === "Absent" ? "Upcoming" : day.status;
          const bg = STATUS_BG[visibleStatus] || "border-slate-800 bg-slate-950/30";
          const text = STATUS_TEXT[visibleStatus] || "text-slate-400";
          const dateText = DATE_TEXT[visibleStatus] || "text-slate-400";

          return (
            <div
              key={dateKey}
              className={`min-h-16 rounded-lg border p-2 text-center text-xs shadow-sm ${bg}`}
            >
              <div className="mb-1 flex items-center justify-center">
                <span className={`font-bold ${dateText}`}>{getDayNumber(dateKey)}</span>
              </div>

              {visibleStatus !== "Upcoming" && (
                <p className={`font-medium ${text}`}>{day.holidayName || visibleStatus}</p>
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
    </div>
  );
}
