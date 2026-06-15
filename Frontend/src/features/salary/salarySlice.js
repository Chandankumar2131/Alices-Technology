import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { salaryService } from "../../service/salaryService";
import { getApiError } from "../../utils/apiError";

export const fetchMySalary = createAsyncThunk("salary/my", async (_, { rejectWithValue }) => {
  try { return await salaryService.getMySalary(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchEmployeeSalary = createAsyncThunk("salary/byEmployee", async (employeeId, { rejectWithValue }) => {
  try { return await salaryService.getByEmployee(employeeId); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const createSalary = createAsyncThunk("salary/create", async (payload, { rejectWithValue }) => {
  try { return await salaryService.create(payload); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const updateSalary = createAsyncThunk("salary/update", async ({ employeeId, payload }, { rejectWithValue }) => {
  try { return await salaryService.update(employeeId, payload); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const slice = createSlice({
  name: "salary",
  initialState: { mySalary: null, selected: null, loading: false, error: null },
  reducers: { clearSelectedSalary: (s) => { s.selected = null; } },
  extraReducers: (b) => {
    b.addCase(fetchMySalary.fulfilled, (s, a) => { s.mySalary = a.payload.data; })
     .addCase(fetchEmployeeSalary.pending, (s) => { s.loading = true; s.selected = null; })
     .addCase(fetchEmployeeSalary.fulfilled, (s, a) => { s.loading = false; s.selected = a.payload.data; })
     .addCase(fetchEmployeeSalary.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createSalary.fulfilled, (s, a) => { s.selected = a.payload.data; })
     .addCase(updateSalary.fulfilled, (s, a) => { s.selected = a.payload.data; });
  },
});

export const { clearSelectedSalary } = slice.actions;
export const selectSalary = (s) => s.salary;
export default slice.reducer;
