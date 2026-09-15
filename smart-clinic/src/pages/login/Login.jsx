import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";
import {
  LogIn, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff,
  Smartphone, ShieldCheck, HeartPulse, Clock, UserPlus
} from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  // Pre-fill remembered login ID if available
  useEffect(() => {
    const savedId = localStorage.getItem("smart_clinic_login_id");
    if (savedId) {
      setLoginId(savedId);
    }
  }, []);

  // Detect whether input looks like a phone number or email
  const isPhoneInput =
    loginId.trim().length > 0 &&
    !loginId.includes("@") &&
    /^[0-9+ \-]+$/.test(loginId.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanId = loginId.trim();
    if (!cleanId || !password) {
      setError("Please enter your email or phone number and password.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userInfo = await login(cleanId, password);

      if (rememberMe) {
        localStorage.setItem("smart_clinic_login_id", cleanId);
      } else {
        localStorage.removeItem("smart_clinic_login_id");
      }

      setSuccess(`Welcome back, ${userInfo?.first_name || "User"}! Redirecting...`);
      setTimeout(() => navigate(from, { replace: true }), 700);
    } catch (err) {
      if (typeof err === "string") {
        setError(err);
      } else if (typeof err === "object" && err !== null) {
        const msg = Object.values(err).flat().join(" ") || "Invalid credentials. Please check your email or password.";
        setError(msg);
      } else {
        setError("Invalid email/phone or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-100/70">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* ================= LEFT / TOP BRANDING PANEL ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg font-black text-xl">
                <HeartPulse size={22} />
              </div>
              <div>
                <div className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  Smart Clinic <span className="text-primary font-bold text-xs bg-primary/20 px-2 py-0.5 rounded-full">v2.4</span>
                </div>
                <div className="text-[11px] text-slate-400">Bangladesh Digital Healthcare Platform</div>
              </div>
            </div>

            <div className="space-y-2 pt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live System Active
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
                One Unified Sign-In for Everyone
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Whether you are a Patient checking live queue numbers, a Doctor managing chamber consultations, or Clinic Staff settling daily counter cash.
              </p>
            </div>

            {/* Platform Highlights */}
            <div className="space-y-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Smartphone size={14} />
                </div>
                <span>Sign in with <strong>Email or Phone Number</strong></span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Clock size={14} />
                </div>
                <span>Real-time Live Queue Tracker with Audio Chime</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <span>HIPAA Compliant & 256-Bit Encrypted EMR</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <Link to="/privacy" className="hover:text-primary transition-colors underline">
              Privacy & Data Policy
            </Link>
            <span>© {new Date().getFullYear()} Smart Clinic BD</span>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL (Simple Facebook-style) ================= */}
        <div className="lg:col-span-7 p-7 sm:p-10 space-y-6 bg-white flex flex-col justify-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Log In to Smart Clinic
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your email address or phone number and password to continue.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error text-white text-xs font-bold rounded-2xl shadow-sm animate-in fade-in flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success text-white text-xs font-bold rounded-2xl shadow-sm animate-in fade-in flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {isPhoneInput ? (
                    <Smartphone size={17} className="text-primary" />
                  ) : (
                    <Mail size={17} />
                  )}
                </div>
                <input
                  name="loginId"
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setError("");
                  }}
                  className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white text-sm font-medium rounded-xl border-slate-300"
                  placeholder="Email or phone number"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={17} />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="input input-bordered w-full pl-10 pr-10 bg-slate-50 focus:bg-white text-sm rounded-xl border-slate-300"
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Help */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-xs rounded-sm"
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/privacy"
                className="text-slate-500 hover:text-primary transition-colors text-xs"
              >
                Need help?
              </Link>
            </div>

            {/* Log In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full shadow-md text-white font-extrabold text-sm sm:text-base rounded-xl gap-2 h-11"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <LogIn size={18} /> Log In
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Facebook-style Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">
                or
              </span>
            </div>
          </div>

          {/* Create New Account Button (Facebook style CTA) */}
          <div className="text-center">
            <Link
              to="/register"
              className="btn btn-success text-white font-extrabold text-xs sm:text-sm rounded-xl gap-1.5 px-6 h-10 shadow-xs"
            >
              <UserPlus size={16} /> Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}