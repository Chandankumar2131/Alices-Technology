import { configureStore } from "@reduxjs/toolkit";
import { setUnauthorizedHandler } from "../lib/api";

import authReducer, { clearSession } from "../features/auth/authSlice";
import attendanceReducer from "../features/attendance/attendanceSlice";
import breakReducer from "../features/break/breakSlice";
import leaveReducer from "../features/leave/leaveSlice";
import salaryReducer from "../features/salary/salarySlice";
import payrollReducer from "../features/payroll/payrollSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import submissionReducer from "../features/submission/submissionSlice";
import employeeReducer from "../features/employee/employeeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    break: breakReducer,
    leave: leaveReducer,
    salary: salaryReducer,
    payroll: payrollReducer,
    dashboard: dashboardReducer,
    submission: submissionReducer,
    employee: employeeReducer,
  },
});

// Wire global 401 -> logout (no circular import)
setUnauthorizedHandler(() => {
  store.dispatch(clearSession());
});

export default store;
