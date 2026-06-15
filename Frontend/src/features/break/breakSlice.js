import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { breakService } from "../../service/breakService";
import { getApiError } from "../../utils/apiError";

export const startBreak = createAsyncThunk("break/start", async (reason, { rejectWithValue }) => {
  try { return await breakService.start(reason); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const endBreak = createAsyncThunk("break/end", async (_, { rejectWithValue }) => {
  try { return await breakService.end(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchTodayBreaks = createAsyncThunk("break/today", async (_, { rejectWithValue }) => {
  try { return await breakService.getToday(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchMyBreaks = createAsyncThunk("break/my", async (_, { rejectWithValue }) => {
  try { return await breakService.getMyBreaks(); } catch (e) { return rejectWithValue(getApiError(e)); }
});

const slice = createSlice({
  name: "break",
  initialState: { today: [], history: [], activeBreak: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(startBreak.fulfilled, (s, a) => { s.activeBreak = a.payload.data; })
     .addCase(endBreak.fulfilled, (s) => { s.activeBreak = null; })
     .addCase(fetchTodayBreaks.fulfilled, (s, a) => {
        s.today = a.payload.data;
        s.activeBreak = a.payload.data.find((x) => x.status === "Active") || null;
     })
     .addCase(fetchMyBreaks.fulfilled, (s, a) => { s.history = a.payload.data; });
  },
});

export const selectBreak = (s) => s.break;
export default slice.reducer;
