import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { leaveService } from "../../service/leaveService";
import { getApiError } from "../../utils/apiError";

export const applyLeave = createAsyncThunk("leave/apply", async (payload, { rejectWithValue }) => {
  try { return await leaveService.apply(payload); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchMyLeaves = createAsyncThunk("leave/my", async (_, { rejectWithValue }) => {
  try { return await leaveService.getMyLeaves(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchMyLeaveBucket = createAsyncThunk("leave/myBucket", async (_, { rejectWithValue }) => {
  try { return await leaveService.getMyBucket(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchAllLeaves = createAsyncThunk("leave/all", async (_, { rejectWithValue }) => {
  try { return await leaveService.getAll(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const approveLeave = createAsyncThunk("leave/approve", async ({ leaveId, adminRemarks }, { rejectWithValue }) => {
  try { return await leaveService.approve(leaveId, adminRemarks); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const rejectLeave = createAsyncThunk("leave/reject", async ({ leaveId, adminRemarks }, { rejectWithValue }) => {
  try { return await leaveService.reject(leaveId, adminRemarks); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const slice = createSlice({
  name: "leave",
  initialState: { myLeaves: [], allLeaves: [], myBucket: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMyLeaves.pending, (s) => { s.loading = true; })
     .addCase(fetchMyLeaves.fulfilled, (s, a) => { s.loading = false; s.myLeaves = a.payload.data; })
     .addCase(fetchMyLeaves.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchMyLeaveBucket.fulfilled, (s, a) => { s.myBucket = a.payload.data; })
     .addCase(fetchAllLeaves.pending, (s) => { s.loading = true; })
     .addCase(fetchAllLeaves.fulfilled, (s, a) => { s.loading = false; s.allLeaves = a.payload.data; })
     .addCase(fetchAllLeaves.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(approveLeave.fulfilled, (s, a) => {
        const u = a.payload.data; s.allLeaves = s.allLeaves.map((l) => l._id === u._id ? { ...l, ...u } : l);
     })
     .addCase(rejectLeave.fulfilled, (s, a) => {
        const u = a.payload.data; s.allLeaves = s.allLeaves.map((l) => l._id === u._id ? { ...l, ...u } : l);
     });
  },
});

export const selectLeave = (s) => s.leave;
export default slice.reducer;
