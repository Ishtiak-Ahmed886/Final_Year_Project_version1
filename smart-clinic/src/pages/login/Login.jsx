import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";
import { LogIn, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === "email") {
      value = value.toLowerCase().trim();
    }
    setFormData({ ...formData, [e.target.name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await login(formData.email.toLowerCase().trim(), formData.password);
      setSuccess("Logged in successfully! Redirecting...");
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err) {
      if (typeof err === "object") {
        const msg = Object.values(err).flat().join(" ") || "Invalid credentials";
        setError(msg);
      } else {
        setError(err || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-base-200/50">
      <div className="max-w-md w-full space-y-8 bg-base-100 p-8 rounded-2xl shadow-xl border border-base-200">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-base-content">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-base-content/60">
            Sign in to access your Smart Clinic portal
          </p>
        </div>

        {error && (
          <div className="alert alert-error text-sm py-2 px-4 shadow-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success text-sm py-2 px-4 shadow-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="label text-sm font-semibold">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <Mail size={18} />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10 lowercase"
                  placeholder="admin@clinic.com or patient@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label text-sm font-semibold">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full shadow-lg"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-base-content/70">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </div>
        </form>

        {/* ⚡ Quick Demo Accounts Picker for Real-Life Evaluation */}
        <div className="mt-6 pt-6 border-t border-base-200">
          <div className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3 flex items-center justify-between">
            <span>⚡ Quick Demo Login (1-Click)</span>
            <span className="text-[10px] lowercase font-normal bg-base-200 px-2 py-0.5 rounded-full">Pass: Password123!</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData({ email: "alif@gmail.com", password: "Password123!" });
                setError("");
              }}
              className="btn btn-outline btn-xs h-9 justify-start font-semibold text-left border-base-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-all"
            >
              <span className="text-sm">👤</span>
              <div className="truncate">
                <div className="text-[11px] leading-tight font-bold">Patient</div>
                <div className="text-[9px] opacity-60 truncate">alif@gmail.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData({ email: "mohosina@gmail.com", password: "Password123!" });
                setError("");
              }}
              className="btn btn-outline btn-xs h-9 justify-start font-semibold text-left border-base-300 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all"
            >
              <span className="text-sm">🩺</span>
              <div className="truncate">
                <div className="text-[11px] leading-tight font-bold">Doctor</div>
                <div className="text-[9px] opacity-60 truncate">mohosina@gmail.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData({ email: "monira@gmail.com", password: "Password123!" });
                setError("");
              }}
              className="btn btn-outline btn-xs h-9 justify-start font-semibold text-left border-base-300 hover:bg-purple-50 hover:border-purple-500 hover:text-purple-700 transition-all"
            >
              <span className="text-sm">🏥</span>
              <div className="truncate">
                <div className="text-[11px] leading-tight font-bold">Clinic Admin</div>
                <div className="text-[9px] opacity-60 truncate">monira@gmail.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData({ email: "admin@clinic.com", password: "Password123!" });
                setError("");
              }}
              className="btn btn-outline btn-xs h-9 justify-start font-semibold text-left border-base-300 hover:bg-rose-50 hover:border-rose-500 hover:text-rose-700 transition-all"
            >
              <span className="text-sm">🛡️</span>
              <div className="truncate">
                <div className="text-[11px] leading-tight font-bold">Super Admin</div>
                <div className="text-[9px] opacity-60 truncate">admin@clinic.com</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}