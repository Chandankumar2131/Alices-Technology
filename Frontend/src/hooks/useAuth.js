import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthInitialized,
  selectRole,
  selectIsAdmin,
  selectIsSuperAdmin,
  selectIsEmployee,
} from "../features/auth/authSlice";

export const useAuth = () => ({
  user: useSelector(selectUser),
  role: useSelector(selectRole),
  isAuthenticated: useSelector(selectIsAuthenticated),
  initialized: useSelector(selectAuthInitialized),
  isAdmin: useSelector(selectIsAdmin),
  isSuperAdmin: useSelector(selectIsSuperAdmin),
  isEmployee: useSelector(selectIsEmployee),
});

export default useAuth;
