import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, clearAuthError, selectAuth } from "../features/auth/authSlice";
import useAuth from "../hooks/useAuth";
import WelcomeCard from "../components/auth/WelcomeCard";
import RotatingSubtitle from "../components/auth/RotatingSubtitle";
import notify from "../utils/toast";
import logo from "../assets/1ch.png";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { loading, error } = useSelector(selectAuth);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const res = await dispatch(login(form));
    if (login.fulfilled.match(res)) {
      notify.success("Login successful");
      navigate("/dashboard", { replace: true });
    } else {
      notify.error(res.payload || "Login failed");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-animated-gradient bg-[linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_70%,#0b1020_100%)]">
      {/* Animated background glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-aurora-1 absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="bg-aurora-2 absolute top-1/3 -right-24 h-[30rem] w-[30rem] rounded-full bg-indigo-500/15 blur-[130px]" />
        <div className="bg-aurora-1 absolute -bottom-32 left-1/3 h-[26rem] w-[26rem] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      {/* Centered container holding both halves */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center gap-8 px-6 py-10 lg:gap-16">
        {/* LEFT: welcome panel (hidden on small screens) */}
        <div className="hidden flex-1 justify-end lg:flex">
          <WelcomeCard />
        </div>

        {/* RIGHT: login card */}
        <div className="flex w-full max-w-md flex-1 justify-center lg:justify-start">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900/60 bg-gradient-to-br from-cyan-500/5 via-slate-900/20 to-indigo-600/5 p-8 backdrop-blur-xl border border-white/5 shadow-[0_8px_40px_rgba(0,0,0,0.4)] animate-fade-up">
            {/* top accent glow line (dimmer) */}
            <div className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />

            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-cyan-500/30 animate-pop overflow-hidden ring-1 ring-white/10">
                <img src={logo} alt="Company logo" className="h-full w-full object-contain p-2" />
              </div>

              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
                Alice's Tech HRM System
              </h1>
              <RotatingSubtitle />
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/15 p-4 text-rose-200 animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-white/5 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40"
                />
                {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/5 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40"
                />
                {errors.password && <p className="mt-1 text-xs text-rose-300">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:from-cyan-400 hover:to-indigo-400 hover:-translate-y-0.5 hover:shadow-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/40 border-t-slate-950" />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">Contact your administrator to request an account.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
