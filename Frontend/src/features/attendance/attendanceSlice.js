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
export const fetchAttendanceSummary = createAsyncThunk("attendance/summary", async (_, { rejectWithValue }) => {
  try { return await attendanceService.getSummary(); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const initialState = {
  history: [],
  calendar: [],
  summary: null,
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
     .addCase(fetchAttendanceSummary.fulfilled, (s, a) => { s.summary = a.payload.data; });
  },
});

export const selectAttendance = (s) => s.attendance;
export default slice.reducer;
