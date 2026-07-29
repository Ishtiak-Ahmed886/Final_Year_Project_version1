import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import { useAuth } from "../../Provider/AuthProvider";
import {
  Building2,
  Stethoscope,
  Layers,
  Plus,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Award,
  ShieldCheck,
  Info,
  UserPlus,
  Link as LinkIcon,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("clinics");

  const [stats, setStats] = useState({
    clinics: 0,
    doctors: 0,
    departments: 0,
    specializations: 0,
  });

  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Forms State
  const [newClinic, setNewClinic] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    subscription_plan: "FREE",
  });

  const [clinicDeptForm, setClinicDeptForm] = useState({
    clinic_id: "",
    department_id: "",
  });

  // Doctor Creation & Assignment Form (Combined for Clinic Admin / Admin)
  const [doctorForm, setDoctorForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    experience_years: 0,
    bio: "",
    specialization_ids: [],
    clinic_id: "",
    consultation_fee: "",
    department_id: "",
    room_number: "",
  });

  // Quick Assign Existing Doctor Form
  const [assignDoctorForm, setAssignDoctorForm] = useState({
    doctor_id: "",
    clinic_id: "",
    department_id: "",
    consultation_fee: "",
    room_number: "",
  });

  const [newDept, setNewDept] = useState({ name: "", description: "" });
  const [newSpec, setNewSpec] = useState({ name: "", description: "" });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes, deptRes, specRes] = await Promise.all([
        apiClient.get("/clinics/"),
        apiClient.get("/doctors/"),
        apiClient.get("/clinics/departments/"),
        apiClient.get("/doctors/specializations/"),
      ]);

      const cList = cRes.results || cRes || [];
      const dList = dRes.results || dRes || [];
      const deptList = deptRes.results || deptRes || [];
      const specList = specRes.results || specRes || [];

      setClinics(cList);
      setDoctors(dList);
      setDepartments(deptList);
      setSpecializations(specList);

      setStats({
        clinics: cList.length,
        doctors: dList.length,
        departments: deptList.length,
        specializations: specList.length,
      });
    } catch (err) {
      console.error("Failed loading admin dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Check if current user is Clinic Admin and owns a clinic
  const ownedClinic = user?.role === "CLINIC_ADMIN"
    ? clinics.find((c) => c.owner_email === user.email || c.owner === user.id)
    : null;

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await apiClient.post("/clinics/", newClinic);
      setMsg("Clinic registered successfully!");
      setNewClinic({
        name: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        subscription_plan: "FREE",
      });
      loadAllData();
    } catch (err) {
      if (typeof err === "object") {
        const detail = err.detail || err.owner || Object.values(err).flat().join(" ");
        setError(detail || "Failed to create clinic.");
      } else {
        setError(err || "Failed to create clinic.");
      }
    }
  };

  const handleAddDeptToClinic = async (e) => {
    e.preventDefault();
    const targetClinicId = user?.role === "CLINIC_ADMIN" && ownedClinic ? ownedClinic.id : clinicDeptForm.clinic_id;
    if (!targetClinicId || !clinicDeptForm.department_id) return;

    setMsg("");
    setError("");
    try {
      await apiClient.post(`/clinics/${targetClinicId}/departments/`, {
        department_id: clinicDeptForm.department_id,
      });
      setMsg("Department linked to clinic successfully.");
      setClinicDeptForm({ clinic_id: "", department_id: "" });
      loadAllData();
    } catch (err) {
      setError("Failed to link department to clinic.");
    }
  };

  const handleCreateOrAssignDoctor = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const targetClinicId = user?.role === "CLINIC_ADMIN" && ownedClinic ? ownedClinic.id : doctorForm.clinic_id;

      await apiClient.post("/doctors/", {
        ...doctorForm,
        clinic_id: targetClinicId,
        consultation_fee: doctorForm.consultation_fee ? parseFloat(doctorForm.consultation_fee) : null,
      });

      setMsg("Doctor created & assigned to clinic successfully!");
      setDoctorForm({
        full_name: "",
        email: "",
        phone: "",
        qualification: "",
        experience_years: 0,
        bio: "",
        specialization_ids: [],
        clinic_id: "",
        consultation_fee: "",
        department_id: "",
        room_number: "",
      });
      loadAllData();
    } catch (err) {
      if (typeof err === "object") {
        const detail = Object.values(err).flat().join(" ");
        setError(detail || "Failed to create or assign doctor.");
      } else {
        setError(err || "Failed to create or assign doctor.");
      }
    }
  };

  const handleAssignExistingDoctor = async (e) => {
    e.preventDefault();
    const targetClinicId = user?.role === "CLINIC_ADMIN" && ownedClinic ? ownedClinic.id : assignDoctorForm.clinic_id;
    if (!assignDoctorForm.doctor_id || !targetClinicId || !assignDoctorForm.consultation_fee) return;

    setMsg("");
    setError("");
    try {
      await apiClient.post(`/doctors/${assignDoctorForm.doctor_id}/assign-clinic/`, {
        clinic_id: targetClinicId,
        department_id: assignDoctorForm.department_id || null,
        consultation_fee: parseFloat(assignDoctorForm.consultation_fee),
        room_number: assignDoctorForm.room_number || "",
      });
      setMsg("Existing doctor assigned to clinic successfully!");
      setAssignDoctorForm({
        doctor_id: "",
        clinic_id: "",
        department_id: "",
        consultation_fee: "",
        room_number: "",
      });
      loadAllData();
    } catch (err) {
      setError("Failed to assign doctor to clinic.");
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDept.name) return;
    setMsg("");
    setError("");
    try {
      await apiClient.post("/clinics/departments/", newDept);
      setMsg("Department created successfully.");
      setNewDept({ name: "", description: "" });
      loadAllData();
    } catch (err) {
      if (typeof err === "object") {
        setError(err.name || Object.values(err).flat().join(" "));
      } else {
        setError(err || "Failed to create department.");
      }
    }
  };

  const handleCreateSpec = async (e) => {
    e.preventDefault();
    if (!newSpec.name) return;
    setMsg("");
    setError("");
    try {
      await apiClient.post("/doctors/specializations/", newSpec);
      setMsg("Specialization created successfully!");
      setNewSpec({ name: "", description: "" });
      loadAllData();
    } catch (err) {
      if (typeof err === "object") {
        setError(err.name || Object.values(err).flat().join(" "));
      } else {
        setError(err || "Failed to create specialization. Specialization names cannot be duplicated.");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-base-content flex items-center gap-2">
            <ShieldCheck className="text-primary" /> Management Portal
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Manage your clinic, create doctor profiles, assign schedules, and configure medical departments
          </p>
        </div>
        <div className="badge badge-primary badge-lg">{user?.role}</div>
      </div>

      {msg && (
        <div className="alert alert-success text-sm py-3 px-4 shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-sm py-3 px-4 shadow-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Counter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary font-bold">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-xs text-base-content/60 font-medium">Clinics</div>
            <div className="text-xl font-extrabold text-base-content">{stats.clinics}</div>
          </div>
        </div>

        <div className="p-5 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-secondary/10 rounded-2xl text-secondary font-bold">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="text-xs text-base-content/60 font-medium">Doctors</div>
            <div className="text-xl font-extrabold text-base-content">{stats.doctors}</div>
          </div>
        </div>

        <div className="p-5 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-2xl text-accent font-bold">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-xs text-base-content/60 font-medium">Departments</div>
            <div className="text-xl font-extrabold text-base-content">{stats.departments}</div>
          </div>
        </div>

        <div className="p-5 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-info/10 rounded-2xl text-info font-bold">
            <Award size={24} />
          </div>
          <div>
            <div className="text-xs text-base-content/60 font-medium">Specializations</div>
            <div className="text-xl font-extrabold text-base-content">{stats.specializations}</div>
          </div>
        </div>
      </div>

      {/* Action Tabs */}
      <div className="tabs tabs-box bg-base-100 p-2 border border-base-200 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveTab("clinics")}
          className={`tab font-bold gap-2 ${activeTab === "clinics" ? "tab-active bg-primary text-white rounded-xl" : ""}`}
        >
          <Building2 size={16} /> Manage Clinics
        </button>
        <button
          onClick={() => setActiveTab("doctors")}
          className={`tab font-bold gap-2 ${activeTab === "doctors" ? "tab-active bg-primary text-white rounded-xl" : ""}`}
        >
          <Stethoscope size={16} /> Manage Doctors
        </button>
        <button
          onClick={() => setActiveTab("taxonomy")}
          className={`tab font-bold gap-2 ${activeTab === "taxonomy" ? "tab-active bg-primary text-white rounded-xl" : ""}`}
        >
          <Layers size={16} /> Departments & Specializations
        </button>
      </div>

      {/* TAB 1: CLINICS MANAGEMENT */}
      {activeTab === "clinics" && (
        <div className="space-y-6">
          {/* One Clinic Limit Banner for Clinic Admin */}
          {user?.role === "CLINIC_ADMIN" && ownedClinic && (
            <div className="p-6 bg-info/10 border border-info/30 rounded-3xl flex items-start gap-4 text-info-content">
              <Info className="w-6 h-6 shrink-0 text-info mt-1" />
              <div>
                <h3 className="font-extrabold text-lg">Single Clinic Management Policy</h3>
                <p className="text-sm mt-1">
                  You are managing <strong>{ownedClinic.name}</strong> ({ownedClinic.city}). Clinic Admins are restricted to owning and managing 1 clinic.
                </p>
              </div>
            </div>
          )}

          {/* Create Clinic Form (Only if allowed) */}
          {(!ownedClinic || user?.role === "ADMIN") && (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <Plus className="text-primary" /> Create New Clinic
              </h2>

              <form onSubmit={handleCreateClinic} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Clinic Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Central Medicare Clinic"
                      value={newClinic.name}
                      onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="New York"
                      value={newClinic.city}
                      onChange={(e) => setNewClinic({ ...newClinic, city: e.target.value })}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-semibold">Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Health Ave, Suite 400"
                    value={newClinic.address}
                    onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1-555-0199"
                      value={newClinic.phone}
                      onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Contact Email</label>
                    <input
                      type="email"
                      placeholder="info@clinic.com"
                      value={newClinic.email}
                      onChange={(e) => setNewClinic({ ...newClinic, email: e.target.value })}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Subscription Plan</label>
                    <select
                      value={newClinic.subscription_plan}
                      onChange={(e) => setNewClinic({ ...newClinic, subscription_plan: e.target.value })}
                      className="select select-bordered w-full"
                    >
                      <option value="FREE">Free</option>
                      <option value="BASIC">Basic</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full shadow-md gap-2">
                  <Plus size={16} /> Register Clinic
                </button>
              </form>
            </div>
          )}

          {/* Add Department to Clinic */}
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <Layers className="text-primary" /> Link Department to Clinic
            </h2>

            <form onSubmit={handleAddDeptToClinic} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {user?.role !== "CLINIC_ADMIN" && (
                <div>
                  <label className="label text-xs font-semibold">Select Clinic *</label>
                  <select
                    required
                    value={clinicDeptForm.clinic_id}
                    onChange={(e) => setClinicDeptForm({ ...clinicDeptForm, clinic_id: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="">-- Choose Clinic --</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label text-xs font-semibold">Select Department *</label>
                <select
                  required
                  value={clinicDeptForm.department_id}
                  onChange={(e) => setClinicDeptForm({ ...clinicDeptForm, department_id: e.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-secondary shadow-md gap-2">
                <Plus size={16} /> Link Department
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: DOCTORS MANAGEMENT */}
      {activeTab === "doctors" && (
        <div className="space-y-6">
          {/* Create & Assign Doctor to Clinic */}
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <UserPlus className="text-primary" /> Create & Assign Doctor to {ownedClinic ? ownedClinic.name : "Clinic"}
            </h2>
            <p className="text-xs text-base-content/60">
              Creates a doctor profile (or assigns existing doctor if email matches) and maps them to your clinic.
            </p>

            <form onSubmit={handleCreateOrAssignDoctor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-xs font-semibold">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Sarah Jenkins"
                    value={doctorForm.full_name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold">Email Address (Lookup / ID) *</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@clinic.com"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold">Consultation Fee ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120.00"
                    value={doctorForm.consultation_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-xs font-semibold">Qualification</label>
                  <input
                    type="text"
                    placeholder="MBBS, MD Cardiology"
                    value={doctorForm.qualification}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={doctorForm.experience_years}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experience_years: parseInt(e.target.value) || 0 })}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold">Room Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="Room 204"
                    value={doctorForm.room_number}
                    onChange={(e) => setDoctorForm({ ...doctorForm, room_number: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              {user?.role !== "CLINIC_ADMIN" && (
                <div>
                  <label className="label text-xs font-semibold">Select Clinic *</label>
                  <select
                    required
                    value={doctorForm.clinic_id}
                    onChange={(e) => setDoctorForm({ ...doctorForm, clinic_id: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="">-- Choose Clinic --</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label text-xs font-semibold">Specializations (Select Multiple)</label>
                <select
                  multiple
                  className="select select-bordered w-full h-20"
                  value={doctorForm.specialization_ids}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      specialization_ids: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                >
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-full shadow-md gap-2">
                <Plus size={16} /> Save Doctor & Assign to Clinic
              </button>
            </form>
          </div>

          {/* Assign Existing Doctor to Clinic */}
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <LinkIcon className="text-primary" /> Assign Pre-Existing Doctor to {ownedClinic ? ownedClinic.name : "Clinic"}
            </h2>

            <form onSubmit={handleAssignExistingDoctor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-xs font-semibold">Select Doctor *</label>
                  <select
                    required
                    value={assignDoctorForm.doctor_id}
                    onChange={(e) => setAssignDoctorForm({ ...assignDoctorForm, doctor_id: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>Dr. {d.full_name} ({d.email})</option>
                    ))}
                  </select>
                </div>

                {user?.role !== "CLINIC_ADMIN" && (
                  <div>
                    <label className="label text-xs font-semibold">Select Clinic *</label>
                    <select
                      required
                      value={assignDoctorForm.clinic_id}
                      onChange={(e) => setAssignDoctorForm({ ...assignDoctorForm, clinic_id: e.target.value })}
                      className="select select-bordered w-full"
                    >
                      <option value="">-- Choose Clinic --</option>
                      {clinics.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label text-xs font-semibold">Consultation Fee ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="100.00"
                    value={assignDoctorForm.consultation_fee}
                    onChange={(e) => setAssignDoctorForm({ ...assignDoctorForm, consultation_fee: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary w-full shadow-md gap-2">
                <LinkIcon size={16} /> Link Doctor Schedule & Fee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS & SPECIALIZATIONS */}
      {activeTab === "taxonomy" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Department */}
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <Layers className="text-primary" /> Create Medical Department
            </h2>

            <form onSubmit={handleCreateDept} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Cardiology"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label text-xs font-semibold">Description</label>
                <input
                  type="text"
                  placeholder="Heart & Cardiovascular health"
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full shadow-md gap-2">
                <Plus size={16} /> Add Department
              </button>
            </form>
          </div>

          {/* Create Specialization */}
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <Award className="text-primary" /> Create Medical Specialization
            </h2>

            <form onSubmit={handleCreateSpec} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">Specialization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Pediatric Surgery"
                  value={newSpec.name}
                  onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label text-xs font-semibold">Description</label>
                <input
                  type="text"
                  placeholder="Specialized medical care for children"
                  value={newSpec.description}
                  onChange={(e) => setNewSpec({ ...newSpec, description: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <button type="submit" className="btn btn-secondary w-full shadow-md gap-2">
                <Plus size={16} /> Add Specialization
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
