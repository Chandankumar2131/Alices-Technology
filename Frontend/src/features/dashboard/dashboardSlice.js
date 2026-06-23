import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dashboardService } from "../../service/dashboardService";
import { getApiError } from "../../utils/apiError";

export const fetchAdminDashboard = createAsyncThunk("dashboard/admin", async (_, { rejectWithValue }) => {
  try { return await dashboardService.getAdmin(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchMyDashboard = createAsyncThunk("dashboard/my", async (_, { rejectWithValue }) => {
  try { return await dashboardService.getMyDashboard(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchMyDayDetail = createAsyncThunk("dashboard/myDayDetail", async (date, { rejectWithValue }) => {
  try { return await dashboardService.getMyDayDetail(date); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchLiveEmployees = createAsyncThunk("dashboard/live", async (_, { rejectWithValue }) => {
  try { return await dashboardService.getLiveEmployees(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchDeptAnalytics = createAsyncThunk("dashboard/dept", async (_, { rejectWithValue }) => {
  try { return await dashboardService.getDepartmentAnalytics(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchLateEmployees = createAsyncThunk("dashboard/late", async (_, { rejectWithValue }) => {
  try { return await dashboardService.getLateEmployees(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchOnBreak = createAsyncThunk("dashboard/onBreak", async (_, { rejectWithValue }) => {
  try { return await dashboardService.getOnBreak(); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const slice = createSlice({
  name: "dashboard",
  initialState: {
    adminStats: null, myDashboard: null, myDayDetail: null, liveEmployees: [],
    deptAnalytics: [], lateEmployees: [], onBreak: [], loading: false, error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAdminDashboard.pending, (s) => { s.loading = true; })
     .addCase(fetchAdminDashboard.fulfilled, (s, a) => { s.loading = false; s.adminStats = a.payload.data; })
     .addCase(fetchAdminDashboard.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchMyDashboard.pending, (s) => { s.loading = true; })
     .addCase(fetchMyDashboard.fulfilled, (s, a) => { s.loading = false; s.myDashboard = a.payload.data; })
     .addCase(fetchMyDashboard.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchMyDayDetail.pending, (s) => { s.loading = true; s.myDayDetail = null; })
     .addCase(fetchMyDayDetail.fulfilled, (s, a) => { s.loading = false; s.myDayDetail = a.payload.data; })
     .addCase(fetchMyDayDetail.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchLiveEmployees.fulfilled, (s, a) => { s.liveEmployees = a.payload.data; })
     .addCase(fetchDeptAnalytics.fulfilled, (s, a) => { s.deptAnalytics = a.payload.data; })
     .addCase(fetchLateEmployees.fulfilled, (s, a) => { s.lateEmployees = a.payload.data; })
     .addCase(fetchOnBreak.fulfilled, (s, a) => { s.onBreak = a.payload.data; });
  },
});

export const selectDashboard = (s) => s.dashboard;
export default slice.reducer;
