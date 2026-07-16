import { useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthInitialized,
  selectRole,
  selectIsAdmin,
  selectIsSuperAdmin,
  selectIsEmployee,
  selectIsCandidate,
} from "../features/auth/authSlice";

export const useAuth = () => ({
  user: useSelector(selectUser),
  role: useSelector(selectRole),
  isAuthenticated: useSelector(selectIsAuthenticated),
  initialized: useSelector(selectAuthInitialized),
  isAdmin: useSelector(selectIsAdmin),
  isSuperAdmin: useSelector(selectIsSuperAdmin),
  isEmployee: useSelector(selectIsEmployee),
  isCandidate: useSelector(selectIsCandidate),
});

export default useAuth;
