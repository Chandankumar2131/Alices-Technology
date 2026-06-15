import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { submissionService } from "../../service/submissionService";
import { getApiError } from "../../utils/apiError";

export const createSubmission = createAsyncThunk("submission/create", async (payload, { rejectWithValue }) => {
  try { return await submissionService.create(payload); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchMySubmissions = createAsyncThunk("submission/my", async (_, { rejectWithValue }) => {
  try { return await submissionService.getMySubmissions(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const updateSubmission = createAsyncThunk("submission/update", async ({ submissionId, status }, { rejectWithValue }) => {
  try { return await submissionService.update(submissionId, status); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const fetchAllSubmissions = createAsyncThunk("submission/all", async (_, { rejectWithValue }) => {
  try { return await submissionService.getAll(); } catch (e) { return rejectWithValue(getApiError(e)); }
});
export const deleteSubmission = createAsyncThunk("submission/delete", async (submissionId, { rejectWithValue }) => {
  try { await submissionService.remove(submissionId); return submissionId; } catch (e) { return rejectWithValue(getApiError(e)); }
});

const slice = createSlice({
  name: "submission",
  initialState: { mySubmissions: [], allSubmissions: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(createSubmission.fulfilled, (s, a) => { s.mySubmissions.unshift(a.payload.data); })
     .addCase(fetchMySubmissions.pending, (s) => { s.loading = true; })
     .addCase(fetchMySubmissions.fulfilled, (s, a) => { s.loading = false; s.mySubmissions = a.payload.data; })
     .addCase(fetchMySubmissions.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchAllSubmissions.pending, (s) => { s.loading = true; })
     .addCase(fetchAllSubmissions.fulfilled, (s, a) => { s.loading = false; s.allSubmissions = a.payload.data; })
     .addCase(updateSubmission.fulfilled, (s, a) => {
        const u = a.payload.data;
        s.mySubmissions = s.mySubmissions.map((x) => x._id === u._id ? { ...x, ...u } : x);
        s.allSubmissions = s.allSubmissions.map((x) => x._id === u._id ? { ...x, ...u } : x);
     })
     .addCase(deleteSubmission.fulfilled, (s, a) => {
        s.allSubmissions = s.allSubmissions.filter((x) => x._id !== a.payload);
     });
  },
});

export const selectSubmission = (s) => s.submission;
export default slice.reducer;
