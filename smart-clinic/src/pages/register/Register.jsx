import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";
import apiClient from "../../api/axios";
import {
  UserPlus, Mail, Lock, User, Phone, AlertCircle, CheckCircle2,
  Stethoscope, Award, BookOpen, ChevronRight, ArrowLeft, Loader
} from "lucide-react";

const ROLES = [
  { value: "PATIENT", label: "Patient", desc: "Book appointments & consult doctors" },
  { value: "DOCTOR", label: "Doctor", desc: "Register & manage your consultations" },
  { value: "CLINIC_ADMIN", label: "Clinic Admin", desc: "Create & manage your clinic" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Step 1 = account info, Step 2 = doctor profile (only for DOCTOR role)
  const [step, setStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "PATIENT",
    password: "",
    password_confirm: "",
  });

  // Doctor profile fields (Step 2)
  const [doctorProfile, setDoctorProfile] = useState({
    full_name: "",
    qualification: "",
    experience_years: 0,
    bio: "",
    certificate_url: "",
    specialization_ids: [],
  });
  const [specializations, setSpecializations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch specializations list for doctor profile step
  useEffect(() => {
    if (step === 2) {
      apiClient.get("/doctors/specializations/")
        .then((res) => setSpecializations(res.results || res || []))
        .catch(() => {});
    }
  }, [step]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleDoctorChange = (e) => {
    setDoctorProfile({ ...doctorProfile, [e.target.name]: e.target.value });
    setError("");
  };

  const toggleSpecialization = (id) => {
    setDoctorProfile((prev) => ({
      ...prev,
      specialization_ids: prev.specialization_ids.includes(id)
        ? prev.specialization_ids.filter((s) => s !== id)
        : [...prev.specialization_ids, id],
    }));
  };

  // Step 1: Account registration
  const handleRegisterAccount = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const user = await register(formData);
      setRegisteredUser(user);

      if (formData.role === "DOCTOR") {
        // Pre-fill full_name from account
        setDoctorProfile((prev) => ({
          ...prev,
          full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        }));
        setStep(2);
        setSuccess("");
      } else {
        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
      }
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

  // Step 2: Doctor profile setup
  const handleDoctorProfileSetup = async (e) => {
    e.preventDefault();
    if (formData.role !== "DOCTOR" && registeredUser?.role !== "DOCTOR") {
      setError("Only Doctor accounts can set up a doctor profile.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await apiClient.post("/doctors/setup-profile/", {
        full_name: doctorProfile.full_name,
        qualification: doctorProfile.qualification,
        experience_years: parseInt(doctorProfile.experience_years, 10) || 0,
        bio: doctorProfile.bio,
        certificate_url: doctorProfile.certificate_url,
        specialization_ids: doctorProfile.specialization_ids,
      });

      setSuccess("Profile complete! Welcome, Doctor. Redirecting to your dashboard...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      if (typeof err === "object") {
        const msg = Object.entries(err)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
          .join(" ");
        setError(msg || "Failed to save profile.");
      } else {
        setError(err || "Failed to save profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-base-200/50">
      <div className="max-w-xl w-full space-y-8 bg-base-100 p-8 rounded-2xl shadow-xl border border-base-200">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            {step === 2 ? <Stethoscope className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-base-content">
            {step === 2 ? "Complete Your Doctor Profile" : "Create Your Account"}
          </h2>
          <p className="mt-2 text-sm text-base-content/60">
            {step === 2
              ? "Set up your professional profile so patients can find and book with you"
              : "Join Smart Clinic as a Patient, Doctor, or Clinic Admin"}
          </p>
        </div>

        {/* Step indicator for doctors */}
        {formData.role === "DOCTOR" && (
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${step >= 1 ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/50"}`}>
              <span>1</span> <span>Account</span>
            </div>
            <ChevronRight size={16} className="text-base-content/30" />
            <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${step >= 2 ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/50"}`}>
              <span>2</span> <span>Doctor Profile</span>
            </div>
          </div>
        )}

        {/* Alert messages */}
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

        {/* ============ STEP 1: Account Registration ============ */}
        {step === 1 && (
          <form className="mt-4 space-y-4" onSubmit={handleRegisterAccount}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label text-sm font-semibold">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                    <User size={18} />
                  </div>
                  <input
                    name="first_name" type="text" required
                    value={formData.first_name} onChange={handleChange}
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
                    name="last_name" type="text" required
                    value={formData.last_name} onChange={handleChange}
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
                    name="email" type="email" required
                    value={formData.email} onChange={handleChange}
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
                    name="phone" type="text"
                    value={formData.phone} onChange={handleChange}
                    className="input input-bordered w-full pl-10"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="label text-sm font-semibold">Register As</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setFormData({ ...formData, role: r.value }); setError(""); }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.role === r.value
                        ? "border-primary bg-primary/5"
                        : "border-base-200 hover:border-primary/40"
                    }`}
                  >
                    <div className="font-bold text-sm text-base-content">{r.label}</div>
                    <div className="text-xs text-base-content/60 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label text-sm font-semibold">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                    <Lock size={18} />
                  </div>
                  <input
                    name="password" type="password" required minLength={8}
                    value={formData.password} onChange={handleChange}
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
                    name="password_confirm" type="password" required
                    value={formData.password_confirm} onChange={handleChange}
                    className="input input-bordered w-full pl-10"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="btn btn-primary w-full shadow-lg">
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    {formData.role === "DOCTOR" ? "Continue to Profile Setup" : "Create Account"}
                    {formData.role === "DOCTOR" && <ChevronRight size={16} />}
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
        )}

        {/* ============ STEP 2: Doctor Profile Setup ============ */}
        {step === 2 && (
          <form className="mt-4 space-y-5" onSubmit={handleDoctorProfileSetup}>
            <div className="p-4 bg-success/10 border border-success/30 rounded-xl text-sm text-success font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} />
              Account created! Now complete your professional profile.
            </div>

            <div>
              <label className="label text-sm font-semibold flex items-center gap-1">
                <User size={14} className="text-primary" /> Full Name (as it appears to patients)
              </label>
              <input
                name="full_name" type="text" required
                value={doctorProfile.full_name} onChange={handleDoctorChange}
                className="input input-bordered w-full"
                placeholder="Dr. John Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label text-sm font-semibold flex items-center gap-1">
                  <Award size={14} className="text-primary" /> Qualification
                </label>
                <input
                  name="qualification" type="text" required
                  value={doctorProfile.qualification} onChange={handleDoctorChange}
                  className="input input-bordered w-full"
                  placeholder="MBBS, MD Cardiology"
                />
              </div>
              <div>
                <label className="label text-sm font-semibold flex items-center gap-1">
                  <BookOpen size={14} className="text-primary" /> Years of Experience
                </label>
                <input
                  name="experience_years" type="number" min={0} max={60}
                  value={doctorProfile.experience_years} onChange={handleDoctorChange}
                  className="input input-bordered w-full"
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <label className="label text-sm font-semibold flex items-center gap-1">
                <Stethoscope size={14} className="text-primary" /> Bio / Professional Summary
              </label>
              <textarea
                name="bio" rows={3}
                value={doctorProfile.bio} onChange={handleDoctorChange}
                className="textarea textarea-bordered w-full"
                placeholder="Brief description of your expertise and approach to patient care..."
              />
            </div>

            <div>
              <label className="label text-sm font-semibold flex items-center gap-1">
                <Award size={14} className="text-primary" /> Medical License / Certificate URL *
              </label>
              <input
                name="certificate_url" type="url" required
                value={doctorProfile.certificate_url} onChange={handleDoctorChange}
                className="input input-bordered w-full"
                placeholder="https://res.cloudinary.com/... or link to certificate document"
              />
              <div className="text-xs text-base-content/60 mt-1">Admin will verify your certificate before approving your profile.</div>
            </div>

            {/* Specializations */}
            {specializations.length > 0 && (
              <div>
                <label className="label text-sm font-semibold">Specializations (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-1 max-h-36 overflow-y-auto p-2 border border-base-200 rounded-xl">
                  {specializations.map((spec) => {
                    const selected = doctorProfile.specialization_ids.includes(spec.id);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => toggleSpecialization(spec.id)}
                        className={`badge badge-md cursor-pointer transition-all py-3 px-3 ${
                          selected ? "badge-primary" : "badge-outline border-base-300"
                        }`}
                      >
                        {selected && <CheckCircle2 size={12} className="mr-1" />}
                        {spec.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError(""); }}
                className="btn btn-outline gap-2"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary flex-1 gap-2 shadow-lg">
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    <Stethoscope size={18} /> Complete Registration
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
