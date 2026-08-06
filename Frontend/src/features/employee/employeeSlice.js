import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../service/authService";
import { dashboardService } from "../../service/dashboardService";
import { getApiError } from "../../utils/apiError";

// List + create + deactivate
export const fetchEmployees = createAsyncThunk("employee/list", async (_, { rejectWithValue }) => {
  try { return await authService.getAllEmployees(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const createEmployee = createAsyncThunk("employee/create", async (payload, { rejectWithValue }) => {
  try { return await authService.createEmployee(payload); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const deactivateEmployee = createAsyncThunk("employee/deactivate", async ({ id, ...payload }, { rejectWithValue }) => {
  try { return await authService.deactivateEmployee(id, payload); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const reactivateEmployee = createAsyncThunk("employee/reactivate", async (id, { rejectWithValue }) => {
  try { return await authService.reactivateEmployee(id); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const resetEmployeePassword = createAsyncThunk("employee/resetPassword", async ({ id, temporaryPassword }, { rejectWithValue }) => {
  try { return await authService.resetEmployeePassword(id, temporaryPassword); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const updateEmployeeEmail = createAsyncThunk("employee/updateEmail", async ({ id, email }, { rejectWithValue }) => {
  try { return await authService.updateUserEmail(id, email); } catch (e) { return rejectWithValue(getApiError(e)); }
});

// Detail bundle (Overview tab)
export const fetchEmployeeDetail = createAsyncThunk("employee/detail", async (id, { rejectWithValue }) => {
  try { return await dashboardService.getEmployeeDetail(id); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchEmployeeDashboard = createAsyncThunk("employee/dashboard", async (id, { rejectWithValue }) => {
  try { return await dashboardService.getEmployeeDashboard(id); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchEmployeeTimeline = createAsyncThunk("employee/timeline", async (payload, { rejectWithValue }) => {
  const { id, month } = typeof payload === "object" ? payload : { id: payload };
  try { return await dashboardService.getEmployeeTimeline(id, month); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchEmployeeDayDetail = createAsyncThunk("employee/dayDetail", async ({ id, date }, { rejectWithValue }) => {
  try { return await dashboardService.getEmployeeDayDetail(id, date); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const slice = createSlice({
  name: "employee",
  initialState: {
    list: [],
    selected: null,    // detail bundle: { employee, attendance, activeBreak, breaks }
    dashboard: null,   // leaves/payroll summary
    timeline: [],
    dayDetail: null,
    loading: false,
    detailLoading: false,
    timelineLoading: false,
    error: null,
  },
  reducers: { clearSelectedEmployee: (s) => { s.selected = null; s.dashboard = null; s.timeline = []; s.dayDetail = null; } },
  extraReducers: (b) => {
    b.addCase(fetchEmployees.pending, (s) => { s.loading = true; })
     .addCase(fetchEmployees.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; })
     .addCase(fetchEmployees.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createEmployee.fulfilled, (s, a) => { s.list.unshift(a.payload.data); })
     .addCase(deactivateEmployee.fulfilled, (s, a) => {
        const u = a.payload.data; s.list = s.list.map((e) => e._id === u._id ? { ...e, ...u } : e);
     })
     .addCase(reactivateEmployee.fulfilled, (s, a) => {
        const u = a.payload.data; s.list = s.list.map((e) => e._id === u._id ? { ...e, ...u } : e);
     })
     .addCase(resetEmployeePassword.fulfilled, (s, a) => {
        const u = a.payload.data; s.list = s.list.map((e) => e._id === u._id ? { ...e, ...u } : e);
     })
     .addCase(updateEmployeeEmail.fulfilled, (s, a) => {
        const u = a.payload.data; s.list = s.list.map((e) => e._id === u._id ? { ...e, ...u } : e);
     })
     .addCase(fetchEmployeeDetail.pending, (s) => { s.detailLoading = true; s.selected = null; })
     .addCase(fetchEmployeeDetail.fulfilled, (s, a) => { s.detailLoading = false; s.selected = a.payload.data; })
     .addCase(fetchEmployeeDetail.rejected, (s, a) => { s.detailLoading = false; s.error = a.payload; })
     .addCase(fetchEmployeeDashboard.fulfilled, (s, a) => { s.dashboard = a.payload.data; })
     .addCase(fetchEmployeeTimeline.pending, (s) => { s.timelineLoading = true; })
     .addCase(fetchEmployeeTimeline.fulfilled, (s, a) => { s.timelineLoading = false; s.timeline = a.payload.data; })
     .addCase(fetchEmployeeTimeline.rejected, (s, a) => { s.timelineLoading = false; s.error = a.payload; })
     .addCase(fetchEmployeeDayDetail.pending, (s) => { s.detailLoading = true; s.dayDetail = null; })
     .addCase(fetchEmployeeDayDetail.fulfilled, (s, a) => { s.detailLoading = false; s.dayDetail = a.payload.data; })
     .addCase(fetchEmployeeDayDetail.rejected, (s, a) => { s.detailLoading = false; s.error = a.payload; });
  },
});

export const { clearSelectedEmployee } = slice.actions;
export const selectEmployee = (s) => s.employee;
export default slice.reducer;
