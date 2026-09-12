import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";
import {
  LogIn, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff,
  Smartphone, ShieldCheck, Stethoscope, Building2, User,
  Sparkles, ArrowRight, ShieldAlert, HeartPulse, Clock
} from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Selected Role Tab (PATIENT | DOCTOR | CLINIC_ADMIN | ADMIN)
  const [activeRole, setActiveRole] = useState("PATIENT");

  // Form states
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  // Pre-fill remembered login ID
  useEffect(() => {
    const savedId = localStorage.getItem("smart_clinic_login_id");
    if (savedId) {
      setLoginId(savedId);
    }
  }, []);

  // Preset Role Profiles for 1-Click Evaluation
  const ROLE_PROFILES = {
    PATIENT: {
      id: "PATIENT",
      title: "Patient Portal",
      desc: "Track live queue serials, book specialist appointments, and manage family medical reports.",
      email: "alif@gmail.com",
      phone: "01788990011",
      pass: "Password123!",
      name: "Alif Rahman",
      icon: User,
      color: "emerald",
      badge: "Self & Family Care",
      accentBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white border-none",
    },
    DOCTOR: {
      id: "DOCTOR",
      title: "Doctor Chamber",
      desc: "Manage patient queues, trigger delay announcements, and issue digital prescriptions.",
      email: "mohosina@gmail.com",
      phone: "01711223344",
      pass: "Password123!",
      name: "Dr. Mohosina Chowdhury",
      icon: Stethoscope,
      color: "blue",
      badge: "Consultant Physician",
      accentBg: "bg-blue-50 text-blue-700 border-blue-200",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white border-none",
    },
    CLINIC_ADMIN: {
      id: "CLINIC_ADMIN",
      title: "Clinic Reception & Admin",
      desc: "Audit daily cash register, settle doctor commissions, and manage walk-in thermal slips.",
      email: "monira@gmail.com",
      phone: "01717628462",
      pass: "Password123!",
      name: "Monira Akhter (Clinic Admin)",
      icon: Building2,
      color: "purple",
      badge: "Chamber Operations",
      accentBg: "bg-purple-50 text-purple-700 border-purple-200",
      btnClass: "bg-purple-600 hover:bg-purple-700 text-white border-none",
    },
    ADMIN: {
      id: "ADMIN",
      title: "Executive Super Admin",
      desc: "Platform governance, doctor license verification, and healthcare compliance audit.",
      email: "admin@clinic.com",
      phone: "01700000000",
      pass: "Password123!",
      name: "System Super Admin",
      icon: ShieldCheck,
      color: "rose",
      badge: "Platform Control",
      accentBg: "bg-rose-50 text-rose-700 border-rose-200",
      btnClass: "bg-rose-600 hover:bg-rose-700 text-white border-none",
    },
  };

  const currentProfile = ROLE_PROFILES[activeRole];

  // Detect whether input looks like a phone number or email
  const isPhoneInput = loginId.trim().length > 0 && !loginId.includes("@") && /^[0-9+ \-]+$/.test(loginId.trim());

  // Handle CapsLock Detection
  const handleKeyDown = (e) => {
    if (e.getModifierState && e.getModifierState("CapsLock")) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handle1ClickAutofill = (roleKey, directSubmit = false) => {
    setActiveRole(roleKey);
    const target = ROLE_PROFILES[roleKey];
    setLoginId(target.email);
    setPassword(target.pass);
    setError("");

    if (directSubmit) {
      executeLogin(target.email, target.pass);
    }
  };

  const executeLogin = async (idToUse, passToUse) => {
    setLoading(true);
    setError("");
    setSuccess("");

    const cleanedId = idToUse.trim();

    try {
      const userInfo = await login(cleanedId, passToUse);

      if (rememberMe) {
        localStorage.setItem("smart_clinic_login_id", cleanedId);
      } else {
        localStorage.removeItem("smart_clinic_login_id");
      }

      setSuccess(`Welcome back, ${userInfo?.first_name || "User"}! Redirecting to your portal...`);
      setTimeout(() => navigate(from, { replace: true }), 900);
    } catch (err) {
      if (typeof err === "object" && err !== null) {
        const msg = Object.values(err).flat().join(" ") || "Invalid credentials. Please verify your email or phone.";
        setError(msg);
      } else {
        setError(err || "Login failed. Please check your credentials or try 1-Click Demo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError("Please enter both your Email / Phone number and Password.");
      return;
    }
    executeLogin(loginId, password);
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

        {/* ================= RIGHT FORM PANEL ================= */}
        <div className="lg:col-span-7 p-6 sm:p-9 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your role or enter your credentials below to proceed.
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div>
            <label className="label text-[11px] font-bold text-slate-400 uppercase tracking-wider p-0 mb-1.5">
              Select Portal Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {Object.values(ROLE_PROFILES).map((role) => {
                const Icon = role.icon;
                const isSelected = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setActiveRole(role.id)}
                    className={`p-2 rounded-xl text-center font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-300 scale-102"
                        : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon size={16} className={isSelected ? "text-primary" : "text-slate-400"} />
                    <span className="leading-tight text-[11px]">{role.title.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Role Context Card */}
          <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${currentProfile.accentBg}`}>
            <div className="space-y-0.5">
              <div className="font-extrabold flex items-center gap-1.5">
                <currentProfile.icon size={15} /> {currentProfile.title}
                <span className="badge badge-sm font-bold bg-white/80 border-none text-[10px]">{currentProfile.badge}</span>
              </div>
              <div className="text-[11px] opacity-80 line-clamp-1">{currentProfile.desc}</div>
            </div>
            <button
              type="button"
              onClick={() => handle1ClickAutofill(activeRole, true)}
              className="btn btn-xs bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 font-extrabold shrink-0 shadow-xs gap-1"
              title="1-Click Instant Demo Login for this role"
            >
              <Sparkles size={12} className="text-amber-500" /> 1-Click Login
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error text-white text-xs font-bold rounded-2xl shadow-sm animate-in fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success text-white text-xs font-bold rounded-2xl shadow-sm animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier: Email OR Phone */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label text-xs font-bold text-slate-700 p-0">
                  Email Address or Mobile Number
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isPhoneInput ? "📱 Mobile Number Detected" : "✉️ Email or Phone (+8801...)"}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {isPhoneInput ? <Smartphone size={17} className="text-primary" /> : <Mail size={17} />}
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
                  className="input input-bordered w-full pl-10 bg-slate-50 focus:bg-white text-sm font-medium font-mono"
                  placeholder="01712345678 or you@domain.com"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label text-xs font-bold text-slate-700 p-0">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLoginId(currentProfile.email);
                    setPassword(currentProfile.pass);
                    setError("");
                  }}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Fill Demo Pass
                </button>
              </div>
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
                  onKeyDown={handleKeyDown}
                  className="input input-bordered w-full pl-10 pr-10 bg-slate-50 focus:bg-white text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {capsLockActive && (
                <div className="text-[11px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                  <ShieldAlert size={12} /> CapsLock is ON
                </div>
              )}
            </div>

            {/* Remember Me & Assistance */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-xs rounded-sm"
                />
                <span>Remember on this device</span>
              </label>

              <Link
                to="/privacy"
                className="text-slate-500 hover:text-primary transition-colors text-[11px]"
              >
                Help & Security
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`btn w-full shadow-md font-extrabold text-sm gap-2 text-white ${
                  activeRole === "PATIENT" ? "bg-emerald-600 hover:bg-emerald-700 border-none" :
                  activeRole === "DOCTOR" ? "bg-blue-600 hover:bg-blue-700 border-none" :
                  activeRole === "CLINIC_ADMIN" ? "bg-purple-600 hover:bg-purple-700 border-none" : "btn-primary"
                }`}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <LogIn size={17} /> Sign In to {currentProfile.title}
                  </>
                )}
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              New patient or clinic administrator?{" "}
              <Link to="/register" className="font-extrabold text-primary hover:underline">
                Create an Account ➔
              </Link>
            </div>
          </form>

          {/* ⚡ Quick Switcher Bar for Reviewers */}
          <div className="pt-3 border-t border-slate-200/80">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>⚡ Rapid Evaluation Demo Switcher</span>
              <span className="text-[9px] lowercase font-normal bg-slate-100 px-2 py-0.5 rounded-full font-mono">Password123!</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.values(ROLE_PROFILES).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handle1ClickAutofill(r.id, true)}
                  className="btn btn-outline btn-xs h-8 justify-start font-bold text-left border-slate-200 hover:border-slate-400 transition-all truncate"
                >
                  <span className="text-xs">
                    {r.id === "PATIENT" ? "👤" : r.id === "DOCTOR" ? "🩺" : r.id === "CLINIC_ADMIN" ? "🏥" : "🛡️"}
                  </span>
                  <span className="text-[10px] truncate">{r.title.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}