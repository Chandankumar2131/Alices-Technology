import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import AppRoutes from "./routes/AppRoutes";
import { fetchProfile } from "./features/auth/authSlice";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  );
}
