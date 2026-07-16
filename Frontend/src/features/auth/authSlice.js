import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../service/authService";
import { getApiError } from "../../utils/apiError";
import { ROLES } from "../../constants/enums";

const userLS = localStorage.getItem("user");

const initialState = {
  user: userLS ? JSON.parse(userLS) : null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,
};

// THUNKS
export const login = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.login(payload); // { success, user }
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.logout();
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.getProfile(); // { success, data }
      return res.data;
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authService.updateProfile(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

export const updateProfileDetails = createAsyncThunk(
  "auth/updateProfileDetails",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.updateProfileDetails(payload);
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.changePassword(payload);
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

export const submitResignation = createAsyncThunk(
  "auth/submitResignation",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authService.submitResignation(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(getApiError(err));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
      state.error = null;
      localStorage.removeItem("user");
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // profile fetch / update keep store + LS in sync
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
        localStorage.removeItem("user");
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(submitResignation.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
        state.error = null;
        localStorage.removeItem("user");
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
        localStorage.removeItem("user");
      });
  },
});

export const { clearSession, clearAuthError } = authSlice.actions;

// SELECTORS
export const selectAuth = (s) => s.auth;
export const selectUser = (s) => s.auth.user;
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated;
export const selectAuthInitialized = (s) => s.auth.initialized;
export const selectRole = (s) => s.auth.user?.accountType;

export const selectIsSuperAdmin = (s) =>
  s.auth.user?.accountType === ROLES.SUPER_ADMIN;
export const selectIsAdmin = (s) =>
  s.auth.user?.accountType === ROLES.ADMIN ||
  s.auth.user?.accountType === ROLES.SUPER_ADMIN; // mirrors backend isAdmin
export const selectIsEmployee = (s) =>
  s.auth.user?.accountType === ROLES.EMPLOYEE;
export const selectIsCandidate = (s) =>
  s.auth.user?.accountType === ROLES.CANDIDATE;

export default authSlice.reducer;
