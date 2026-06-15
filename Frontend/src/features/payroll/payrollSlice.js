import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { payrollService } from "../../service/payrollService";
import { getApiError } from "../../utils/apiError";

export const fetchMyPayroll = createAsyncThunk("payroll/my", async (_, { rejectWithValue }) => {
  try { return await payrollService.getMyPayroll(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchAllPayrolls = createAsyncThunk("payroll/all", async (_, { rejectWithValue }) => {
  try { return await payrollService.getAll(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchEmployeePayroll = createAsyncThunk("payroll/byEmployee", async (employeeId, { rejectWithValue }) => {
  try { return await payrollService.getEmployeePayroll(employeeId); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const generatePayroll = createAsyncThunk("payroll/generate", async (payload, { rejectWithValue }) => {
  try { return await payrollService.generate(payload); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const markPayrollPaid = createAsyncThunk("payroll/markPaid", async (payrollId, { rejectWithValue }) => {
  try { return await payrollService.markPaid(payrollId); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const slice = createSlice({
  name: "payroll",
  initialState: { myPayroll: [], allPayrolls: [], selected: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMyPayroll.fulfilled, (s, a) => { s.myPayroll = a.payload.data; })
     .addCase(fetchAllPayrolls.pending, (s) => { s.loading = true; })
     .addCase(fetchAllPayrolls.fulfilled, (s, a) => { s.loading = false; s.allPayrolls = a.payload.data; })
     .addCase(fetchAllPayrolls.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchEmployeePayroll.fulfilled, (s, a) => { s.selected = a.payload.data; })
     .addCase(generatePayroll.fulfilled, (s, a) => { s.allPayrolls.unshift(a.payload.data); })
     .addCase(markPayrollPaid.fulfilled, (s, a) => {
        const u = a.payload.data; s.allPayrolls = s.allPayrolls.map((p) => p._id === u._id ? { ...p, ...u } : p);
     });
  },
});

export const selectPayroll = (s) => s.payroll;
export default slice.reducer;
