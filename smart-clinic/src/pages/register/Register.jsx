import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";
import { UserPlus, Mail, Lock, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "PATIENT",
    password: "",
    password_confirm: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await register(formData);
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
    } catch (err) {
      if (typeof err === "object") {
        const msg = Object.entries(err)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
          .join(" ");
        setError(msg || "Registration failed.");
      } else {
        setError(err || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-base-200/50">
      <div className="max-w-xl w-full space-y-8 bg-base-100 p-8 rounded-2xl shadow-xl border border-base-200">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-base-content">
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-base-content/60">
            Join Smart Clinic as a Patient, Doctor, or Clinic Admin
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

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label text-sm font-semibold">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <User size={18} />
                </div>
                <input
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10"
                  placeholder="John"
                />
              </div>
            </div>

            <div>
              <label className="label text-sm font-semibold">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <User size={18} />
                </div>
                <input
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="input input-bordered w-full pl-10"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label text-sm font-semibold">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <Phone size={18} />
                </div>
                <input
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label text-sm font-semibold">Register As</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="select select-bordered w-full"
            >
              <option value="PATIENT">Patient (Book Appointments & Consult)</option>
              <option value="DOCTOR">Doctor (Provide Consultations)</option>
              <option value="CLINIC_ADMIN">Clinic Admin (Manage Clinic & Doctors)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10"
                  placeholder="Min 8 chars"
                />
              </div>
            </div>

            <div>
              <label className="label text-sm font-semibold">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <Lock size={18} />
                </div>
                <input
                  name="password_confirm"
                  type="password"
                  required
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10"
                  placeholder="Repeat password"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full shadow-lg"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <>
                  <UserPlus size={18} /> Create Account
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-base-content/70 pt-2">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
