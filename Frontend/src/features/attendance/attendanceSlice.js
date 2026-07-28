import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { attendanceService } from "../../service/attendanceService";
import { getApiError } from "../../utils/apiError";

export const checkIn = createAsyncThunk("attendance/checkIn", async (_, { rejectWithValue }) => {
  try { return await attendanceService.checkIn(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const checkOut = createAsyncThunk("attendance/checkOut", async (_, { rejectWithValue }) => {
  try { return await attendanceService.checkOut(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchMyAttendance = createAsyncThunk("attendance/my", async (_, { rejectWithValue }) => {
  try { return await attendanceService.getMyAttendance(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchAttendanceByMonth = createAsyncThunk("attendance/month", async ({ month, year }, { rejectWithValue }) => {
  try { return await attendanceService.getByMonth(month, year); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchAttendanceSummary = createAsyncThunk("attendance/summary", async ({ month, year } = {}, { rejectWithValue }) => {
  try { return await attendanceService.getSummary(month, year); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const requestAttendanceCorrection = createAsyncThunk("attendance/requestCorrection", async (payload, { rejectWithValue }) => {
  try { return await attendanceService.requestCorrection(payload); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchMyCorrections = createAsyncThunk("attendance/myCorrections", async (_, { rejectWithValue }) => {
  try { return await attendanceService.getMyCorrections(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchAllCorrections = createAsyncThunk("attendance/allCorrections", async (_, { rejectWithValue }) => {
  try { return await attendanceService.getAllCorrections(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const approveAttendanceCorrection = createAsyncThunk("attendance/approveCorrection", async ({ requestId, adminRemarks }, { rejectWithValue }) => {
  try { return await attendanceService.approveCorrection(requestId, adminRemarks); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const rejectAttendanceCorrection = createAsyncThunk("attendance/rejectCorrection", async ({ requestId, adminRemarks }, { rejectWithValue }) => {
  try { return await attendanceService.rejectCorrection(requestId, adminRemarks); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const markHalfDayAsPresent = createAsyncThunk("attendance/markHalfDayAsPresent", async ({ attendanceId, reason }, { rejectWithValue }) => {
  try { return await attendanceService.markHalfDayAsPresent(attendanceId, reason); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const initialState = {
  history: [],
  calendar: [],
  summary: null,
  myCorrections: [],
  allCorrections: [],
  today: null, // latest check-in/out record from check actions
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(checkIn.fulfilled, (s, a) => { s.today = a.payload.data; })
     .addCase(checkOut.fulfilled, (s, a) => { s.today = a.payload.data; })
     .addCase(fetchMyAttendance.pending, (s) => { s.loading = true; })
     .addCase(fetchMyAttendance.fulfilled, (s, a) => { s.loading = false; s.history = a.payload.data; })
     .addCase(fetchMyAttendance.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchAttendanceByMonth.pending, (s) => { s.loading = true; })
     .addCase(fetchAttendanceByMonth.fulfilled, (s, a) => { s.loading = false; s.calendar = a.payload.data; })
     .addCase(fetchAttendanceByMonth.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchAttendanceSummary.fulfilled, (s, a) => { s.summary = a.payload.data; })
     .addCase(requestAttendanceCorrection.fulfilled, (s, a) => { s.myCorrections.unshift(a.payload.data); })
     .addCase(fetchMyCorrections.fulfilled, (s, a) => { s.myCorrections = a.payload.data; })
     .addCase(fetchAllCorrections.pending, (s) => { s.loading = true; })
     .addCase(fetchAllCorrections.fulfilled, (s, a) => { s.loading = false; s.allCorrections = a.payload.data; })
     .addCase(fetchAllCorrections.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(approveAttendanceCorrection.fulfilled, (s, a) => {
        const u = a.payload.data; s.allCorrections = s.allCorrections.map((r) => r._id === u._id ? { ...r, ...u } : r);
     })
     .addCase(rejectAttendanceCorrection.fulfilled, (s, a) => {
        const u = a.payload.data; s.allCorrections = s.allCorrections.map((r) => r._id === u._id ? { ...r, ...u } : r);
     })
     .addCase(markHalfDayAsPresent.fulfilled, (s, a) => {
        const updated = a.payload.data;
        s.calendar = s.calendar.map((r) => r._id === updated._id ? { ...r, ...updated } : r);
        s.history = s.history.map((r) => r._id === updated._id ? { ...r, ...updated } : r);
     });
  },
});

export const selectAttendance = (s) => s.attendance;
export default slice.reducer;
