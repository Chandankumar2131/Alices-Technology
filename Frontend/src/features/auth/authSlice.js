import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../service/authService";
import { getApiError } from "../../utils/apiError";
import { ROLES } from "../../constants/enums";

// Hydrate from localStorage on boot
const tokenLS = localStorage.getItem("token");
const userLS = localStorage.getItem("user");

const initialState = {
  user: userLS ? JSON.parse(userLS) : null,
  token: tokenLS || null,
  isAuthenticated: !!tokenLS,
  loading: false,
  error: null,
};

// THUNKS
export const login = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.login(payload); // { success, token, user }
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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
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
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // profile fetch / update keep store + LS in sync
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

// SELECTORS
export const selectAuth = (s) => s.auth;
export const selectUser = (s) => s.auth.user;
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated;
export const selectRole = (s) => s.auth.user?.accountType;

export const selectIsSuperAdmin = (s) =>
  s.auth.user?.accountType === ROLES.SUPER_ADMIN;
export const selectIsAdmin = (s) =>
  s.auth.user?.accountType === ROLES.ADMIN ||
  s.auth.user?.accountType === ROLES.SUPER_ADMIN; // mirrors backend isAdmin
export const selectIsEmployee = (s) =>
  s.auth.user?.accountType === ROLES.EMPLOYEE;

export default authSlice.reducer;
