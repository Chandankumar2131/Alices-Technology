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
export const deactivateEmployee = createAsyncThunk("employee/deactivate", async (id, { rejectWithValue }) => {
  try { return await authService.deactivateEmployee(id); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const resetEmployeePassword = createAsyncThunk("employee/resetPassword", async ({ id, temporaryPassword }, { rejectWithValue }) => {
  try { return await authService.resetEmployeePassword(id, temporaryPassword); } catch (e) { return rejectWithValue(getApiError(e)); }
});

// Detail bundle (Overview tab)
export const fetchEmployeeDetail = createAsyncThunk("employee/detail", async (id, { rejectWithValue }) => {
  try { return await dashboardService.getEmployeeDetail(id); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchEmployeeDashboard = createAsyncThunk("employee/dashboard", async (id, { rejectWithValue }) => {
  try { return await dashboardService.getEmployeeDashboard(id); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchEmployeeTimeline = createAsyncThunk("employee/timeline", async (id, { rejectWithValue }) => {
  try { return await dashboardService.getEmployeeTimeline(id); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const slice = createSlice({
  name: "employee",
  initialState: {
    list: [],
    selected: null,    // detail bundle: { employee, attendance, activeBreak, breaks }
    dashboard: null,   // leaves/submissions/payroll summary
    timeline: [],
    loading: false,
    detailLoading: false,
    error: null,
  },
  reducers: { clearSelectedEmployee: (s) => { s.selected = null; s.dashboard = null; s.timeline = []; } },
  extraReducers: (b) => {
    b.addCase(fetchEmployees.pending, (s) => { s.loading = true; })
     .addCase(fetchEmployees.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.data; })
     .addCase(fetchEmployees.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createEmployee.fulfilled, (s, a) => { s.list.unshift(a.payload.data); })
     .addCase(deactivateEmployee.fulfilled, (s, a) => {
        const u = a.payload.data; s.list = s.list.map((e) => e._id === u._id ? { ...e, ...u } : e);
     })
     .addCase(resetEmployeePassword.fulfilled, (s, a) => {
        const u = a.payload.data; s.list = s.list.map((e) => e._id === u._id ? { ...e, ...u } : e);
     })
     .addCase(fetchEmployeeDetail.pending, (s) => { s.detailLoading = true; s.selected = null; })
     .addCase(fetchEmployeeDetail.fulfilled, (s, a) => { s.detailLoading = false; s.selected = a.payload.data; })
     .addCase(fetchEmployeeDetail.rejected, (s, a) => { s.detailLoading = false; s.error = a.payload; })
     .addCase(fetchEmployeeDashboard.fulfilled, (s, a) => { s.dashboard = a.payload.data; })
     .addCase(fetchEmployeeTimeline.fulfilled, (s, a) => { s.timeline = a.payload.data; });
  },
});

export const { clearSelectedEmployee } = slice.actions;
export const selectEmployee = (s) => s.employee;
export default slice.reducer;
