import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  checkIn,
  checkOut,
  fetchAttendanceByMonth,
  fetchAttendanceSummary,
  fetchMyCorrections,
  requestAttendanceCorrection,
  selectAttendance,
} from "../../features/attendance/attendanceSlice";
import {
  startBreak,
  endBreak,
  fetchTodayBreaks,
  selectBreak,
} from "../../features/break/breakSlice";
import { fetchMyDashboard, selectDashboard } from "../../features/dashboard/dashboardSlice";
import { selectUser } from "../../features/auth/authSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import StatCard from "../../components/ui/StatCard";
import AttendanceCalendar from "./AttendanceCalendar";
import { BREAK_REASONS } from "../../constants/enums";
import { fmtHours, fmtTime, toOfficeDateTimeInputValue } from "../../utils/helpers";
import notify from "../../utils/toast";
import { useAttendanceRealtime } from "../../hooks/useAttendanceRealtime";

export default function MyAttendance() {
  const dispatch = useDispatch();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [breakReason, setBreakReason] = useState("Lunch");
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({ requestedCheckIn: "", reason: "" });
  const [correctionBusy, setCorrectionBusy] = useState(false);
  const [breakBusy, setBreakBusy] = useState(false);

  const { calendar, summary, myCorrections, loading } = useSelector(selectAttendance);
  const { today: todayBreaks, activeBreak } = useSelector(selectBreak);
  const { myDashboard } = useSelector(selectDashboard);
  const currentUser = useSelector(selectUser);
  const currentUserId = currentUser?._id || currentUser?.id;
  const todayAtt = myDashboard?.attendance;

  useEffect(() => {
    dispatch(fetchMyDashboard());
    dispatch(fetchTodayBreaks());
    dispatch(fetchAttendanceSummary());
    dispatch(fetchMyCorrections());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAttendanceByMonth({ month, year }));
  }, [dispatch, month, year]);

  const refreshToday = useCallback(() => {
    dispatch(fetchMyDashboard());
    dispatch(fetchTodayBreaks());
    dispatch(fetchAttendanceByMonth({ month, year }));
  }, [dispatch, month, year]);

  const refreshAttendancePage = useCallback(() => {
    refreshToday();
    dispatch(fetchAttendanceSummary());
    dispatch(fetchMyCorrections());
  }, [dispatch, refreshToday]);

  useAttendanceRealtime(refreshAttendancePage, { employeeId: currentUserId });

  const handleCheckIn = async () => {
    const res = await dispatch(checkIn());
    if (checkIn.fulfilled.match(res)) { notify.success("Checked in"); refreshToday(); }
    else notify.error(res.payload);
  };

  const handleCheckOut = async () => {
    if (activeBreak) {
      const breakRes = await dispatch(endBreak());
      if (!endBreak.fulfilled.match(breakRes)) {
        notify.error(breakRes.payload || "Please end your active break before checking out");
        return;
      }
    }

    const res = await dispatch(checkOut());
    if (checkOut.fulfilled.match(res)) { notify.success(activeBreak ? "Break ended and checked out" : "Checked out"); refreshToday(); }
    else notify.error(res.payload);
  };

  const handleStartBreak = async () => {
    if (breakBusy) return;
    setBreakBusy(true);
    const res = await dispatch(startBreak(breakReason));
    setBreakBusy(false);
    if (startBreak.fulfilled.match(res)) { notify.success("Break started"); dispatch(fetchTodayBreaks()); }
    else notify.error(res.payload);
  };

  const handleEndBreak = async () => {
    if (breakBusy) return;
    setBreakBusy(true);
    const res = await dispatch(endBreak());
    setBreakBusy(false);
    if (endBreak.fulfilled.match(res)) { notify.success("Break ended"); refreshToday(); }
    else notify.error(res.payload);
  };

  const isCheckedIn = !!todayAtt?.checkIn;
  const isCheckedOut = !!todayAtt?.checkOut;
  const canRequestCorrection = isCheckedIn && !isCheckedOut;

  const openCorrection = () => {
    if (!canRequestCorrection) {
      notify.error(
        isCheckedOut
          ? "Attendance correction is not allowed after check-out"
          : "Please check in before requesting a correction"
      );
      return;
    }

    const current = todayAtt?.checkIn || new Date();
    setCorrectionForm({ requestedCheckIn: toOfficeDateTimeInputValue(current), reason: "" });
    setCorrectionOpen(true);
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!canRequestCorrection) {
      notify.error("Attendance correction is not allowed after check-out");
      setCorrectionOpen(false);
      return;
    }

    if (!correctionForm.requestedCheckIn || !correctionForm.reason) {
      notify.error("Requested time and reason are required");
      return;
    }

    setCorrectionBusy(true);
    const res = await dispatch(
      requestAttendanceCorrection({
        attendanceId: todayAtt._id,
        requestedCheckIn: correctionForm.requestedCheckIn,
        reason: correctionForm.reason,
      })
    );
    setCorrectionBusy(false);

    if (requestAttendanceCorrection.fulfilled.match(res)) {
      notify.success("Correction request submitted");
      setCorrectionOpen(false);
      dispatch(fetchMyCorrections());
    } else notify.error(res.payload);
  };

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString("en", { month: "long" }) }));
  const years = Array.from({ length: 5 }, (_, i) => ({ value: now.getFullYear() - i, label: String(now.getFullYear() - i) }));
  return (
    <div className="space-y-6">
      {/* Today controls */}
      <Card title="Today" className="min-h-[19rem] sm:min-h-[14rem]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm">
            <p className="text-slate-400">Check In</p>
            <p className="font-semibold">{fmtTime(todayAtt?.checkIn)}</p>
          </div>
          <div className="text-sm">
            <p className="text-slate-400">Check Out</p>
            <p className="font-semibold">{fmtTime(todayAtt?.checkOut)}</p>
          </div>
          <div className="text-sm">
            <p className="text-slate-400">Working Hours</p>
            <p className="font-semibold">{fmtHours(myDashboard?.liveProductiveHours)}</p>
          </div>
          {todayAtt?.status && <Badge status={todayAtt.status} />}

          <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
            <Button onClick={handleCheckIn} disabled={isCheckedIn} variant="primary">Check In</Button>
            <Button onClick={openCorrection} disabled={!canRequestCorrection} variant="secondary">Request Correction</Button>
            <Button onClick={handleCheckOut} disabled={!isCheckedIn || isCheckedOut} variant="danger">Check Out</Button>
          </div>
        </div>

        {/* Break controls */}
        {isCheckedIn && !isCheckedOut && (
          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/15 pt-4">
            {activeBreak ? (
              <Button onClick={handleEndBreak} loading={breakBusy} disabled={breakBusy} variant="primary">End Break</Button>
            ) : (
              <>
                <div className="w-48">
                  <Select label="Break Reason" options={BREAK_REASONS} value={breakReason} onChange={(e) => setBreakReason(e.target.value)} />
                </div>
                <Button onClick={handleStartBreak} loading={breakBusy} disabled={breakBusy} variant="secondary">Start Break</Button>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Today's breaks */}
      <Card title="Today's Breaks" className="min-h-[13rem]">
        {todayBreaks?.length ? (
          <div className="space-y-2 text-sm">
            {todayBreaks.map((b) => (
              <div key={b._id} className="flex flex-col gap-1 border-b border-white/10 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">{b.reason}</span>
                <span className="text-slate-400">{fmtTime(b.breakStart)} - {fmtTime(b.breakEnd)}</span>
                <span>{b.duration ? `${b.duration} min` : "—"}</span>
                <Badge status={b.status === "Active" ? "On Break" : "Checked Out"}>{b.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No breaks today.</p>
        )}
      </Card>

      <Card title="Attendance Correction Requests" className="min-h-[13rem]">
        {myCorrections?.length ? (
          <div className="space-y-2 text-sm">
            {myCorrections.map((item) => (
              <div
                key={item._id}
                className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-slate-300 md:grid-cols-[1fr_8rem_2fr_auto] md:items-center"
              >
                <span className="whitespace-nowrap font-medium text-slate-200">
                  {fmtTime(item.currentCheckIn)} to {fmtTime(item.requestedCheckIn)}
                </span>
                <span className="text-slate-400">{item.attendance?.attendanceDate || "-"}</span>
                <span className="min-w-0 break-words">{item.reason}</span>
                <span className="justify-self-start md:justify-self-end">
                  <Badge status={item.status}>{item.status}</Badge>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No correction requests yet.</p>
        )}
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard label="Present Days" value={summary.presentDays} icon="✅" accent="text-green-600" />
          <StatCard label="Half Days" value={summary.halfDays || 0} icon="½" accent="text-amber-600" />
          <StatCard label="Absent Days" value={summary.absentDays} icon="❌" accent="text-red-600" />
          <StatCard label="Leave Days" value={summary.leaveDays} icon="🌴" accent="text-blue-600" />
          <StatCard label="Holidays" value={summary.holidayDays || 0} icon="H" accent="text-violet-600" />
          <StatCard label="Late Days" value={summary.lateDays} icon="⏰" accent="text-orange-600" />
        </div>
      )}

      {/* Calendar */}
      <Card
        title="Monthly Calendar"
        action={
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              aria-label="Attendance calendar month"
              options={months}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
            <Select
              aria-label="Attendance calendar year"
              options={years}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        }
      >
        <AttendanceCalendar calendar={calendar} loading={loading} month={month} year={year} />
      </Card>

      <Modal
        open={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        title="Request Check-In Correction"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCorrectionOpen(false)}>Cancel</Button>
            <Button onClick={handleCorrectionSubmit} loading={correctionBusy}>Submit Request</Button>
          </>
        }
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4">
          <Input
            label="Requested Check-In Time"
            type="datetime-local"
            value={correctionForm.requestedCheckIn}
            onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckIn: e.target.value })}
          />
          <div>
            <label htmlFor="correction-reason" className="mb-1 block text-sm font-medium text-slate-300">Reason</label>
            <textarea
              id="correction-reason"
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40"
              placeholder="Example: I reached office on time but forgot to check in."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
