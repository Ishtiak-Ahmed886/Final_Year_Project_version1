import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import { useAuth } from "../../Provider/AuthProvider";
import {
  Building2, Stethoscope, Layers, Plus, CheckCircle2, AlertCircle,
  Award, ShieldCheck, Info, Link as LinkIcon, Users, Calendar,
  MapPin, Clock, TrendingUp, XCircle, Send, Check
} from "lucide-react";

export default function ClinicAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const [clinic, setClinic] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Forms
  const [newClinic, setNewClinic] = useState({
    name: "", address: "", city: "", phone: "", email: "",
    subscription_plan: "FREE", latitude: "", longitude: "", certificate_url: "",
  });

  const [inviteForm, setInviteForm] = useState({
    doctor_id: "", department_id: "", consultation_fee: "", room_number: "",
  });

  const [clinicDeptForm, setClinicDeptForm] = useState({ department_id: "" });
  const [newSpec, setNewSpec] = useState({ name: "", description: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes, deptRes, specRes, aptRes, reqRes] = await Promise.all([
        apiClient.get("/clinics/"),
        apiClient.get("/doctors/"),
        apiClient.get("/clinics/departments/"),
        apiClient.get("/doctors/specializations/"),
        apiClient.get("/appointments/"),
        apiClient.get("/doctors/requests/").catch(() => []),
      ]);

      const cList = cRes.results || cRes || [];
      const dList = dRes.results || dRes || [];
      const deptList = deptRes.results || deptRes || [];
      const specList = specRes.results || specRes || [];
      const aptList = aptRes.results || aptRes || [];
      const reqList = reqRes.results || reqRes || [];

      setAllDoctors(dList);
      setDepartments(deptList);
      setSpecializations(specList);
      setRequests(reqList);

      // Find this admin's owned clinic
      const owned = cList.find((c) => c.owner_email === user?.email);
      setClinic(owned || null);

      if (owned) {
        // Active doctors with ACCEPTED mapping
        const acceptedDoctorIds = reqList
          .filter((r) => r.clinic?.id === owned.id && r.status === "ACCEPTED")
          .map((r) => r.doctor?.id || r.doctor);

        const myDoctors = dList.filter((d) =>
          acceptedDoctorIds.includes(d.id) ||
          d.doctor_clinics?.some((dc) => (dc.clinic?.id === owned.id || dc.clinic_id === owned.id) && dc.status === "ACCEPTED")
        );
        setAssignedDoctors(myDoctors);
        setAppointments(aptList);
      } else {
        setAssignedDoctors([]);
        setAppointments([]);
      }
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };
  const showErr = (e) => { setError(e); setTimeout(() => setError(""), 5000); };

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    if (!newClinic.certificate_url) return showErr("Clinic Registration Certificate URL is required.");
    setMsg(""); setError("");
    try {
      const payload = { ...newClinic };
      if (!payload.latitude) delete payload.latitude;
      if (!payload.longitude) delete payload.longitude;
      await apiClient.post("/clinics/", payload);
      showMsg("Clinic registered! Awaiting Admin approval.");
      setNewClinic({ name: "", address: "", city: "", phone: "", email: "", subscription_plan: "FREE", latitude: "", longitude: "", certificate_url: "" });
      loadData();
    } catch (err) {
      if (typeof err === "object") showErr(err.detail || Object.values(err).flat().join(" ") || "Failed to create clinic.");
      else showErr(err || "Failed to create clinic.");
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!clinic) return showErr("You must create a clinic first.");
    if (clinic.verification_status !== "VERIFIED") return showErr("Your clinic registration is pending Admin approval.");
    if (!inviteForm.doctor_id || !inviteForm.consultation_fee) return;

    setMsg(""); setError("");
    try {
      await apiClient.post("/doctors/requests/create/", {
        doctor_id: inviteForm.doctor_id,
        department_id: inviteForm.department_id || null,
        consultation_fee: parseFloat(inviteForm.consultation_fee),
        room_number: inviteForm.room_number || "",
      });
      showMsg("Service request sent to doctor! Waiting for doctor's acceptance.");
      setInviteForm({ doctor_id: "", department_id: "", consultation_fee: "", room_number: "" });
      loadData();
    } catch (err) {
      if (typeof err === "object") showErr(err.detail || Object.values(err).flat().join(" "));
      else showErr("Failed to send request to doctor.");
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    setMsg(""); setError("");
    try {
      await apiClient.patch(`/doctors/requests/${requestId}/respond/`, { action });
      showMsg(`Request ${action === "ACCEPT" ? "accepted" : "rejected"}.`);
      loadData();
    } catch {
      showErr("Failed to respond to request.");
    }
  };

  const handleLinkDept = async (e) => {
    e.preventDefault();
    if (!clinic || !clinicDeptForm.department_id) return;
    if (clinic.verification_status !== "VERIFIED") return showErr("Your clinic is pending Admin approval.");
    setMsg(""); setError("");
    try {
      await apiClient.post(`/clinics/${clinic.id}/departments/`, { department_id: clinicDeptForm.department_id });
      showMsg("Department linked to your clinic.");
      setClinicDeptForm({ department_id: "" });
      loadData();
    } catch { showErr("Failed to link department."); }
  };

  const handleCreateSpec = async (e) => {
    e.preventDefault();
    if (!newSpec.name) return;
    setMsg(""); setError("");
    try {
      await apiClient.post("/doctors/specializations/", newSpec);
      showMsg("Specialization created!");
      setNewSpec({ name: "", description: "" });
      loadData();
    } catch (err) {
      if (typeof err === "object") showErr(err.name || Object.values(err).flat().join(" "));
      else showErr(err || "Specialization name already exists.");
    }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: <TrendingUp size={16} /> },
    { key: "clinic", label: "My Clinic", icon: <Building2 size={16} /> },
    { key: "doctors", label: `Doctors & Requests (${requests.length})`, icon: <Stethoscope size={16} /> },
    { key: "appointments", label: "Appointments", icon: <Calendar size={16} /> },
    { key: "taxonomy", label: "Specializations", icon: <Award size={16} /> },
  ];

  const pendingIncomingRequests = requests.filter(r => r.status === "PENDING_CLINIC_APPROVAL");
  const pendingOutgoingRequests = requests.filter(r => r.status === "PENDING_DOCTOR_APPROVAL");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-base-content flex items-center gap-2">
            <ShieldCheck className="text-primary" /> Clinic Admin Portal
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            {clinic ? `Managing: ${clinic.name} · ${clinic.city}` : "No clinic registered yet — create one below"}
          </p>
        </div>
        <div className="badge badge-primary badge-lg">CLINIC ADMIN</div>
      </div>

      {/* Admin Approval Banner for Clinic */}
      {clinic && clinic.verification_status !== "VERIFIED" && (
        <div className={`p-5 rounded-3xl border flex items-start gap-4 ${
          clinic.verification_status === "REJECTED" ? "bg-error/15 border-error/30 text-error-content" : "bg-warning/15 border-warning/30 text-warning-content"
        }`}>
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">
              {clinic.verification_status === "REJECTED" ? "Clinic Registration Rejected" : "Clinic Registration Pending Admin Verification"}
            </h3>
            <p className="text-xs mt-1">
              {clinic.verification_status === "REJECTED"
                ? "Your registration certificate was rejected by platform Admin. Please update your certificate URL."
                : "Your registration certificate has been submitted and is currently PENDING approval from platform Admin. You can invite doctors and offer services once approved."}
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {msg && <div className="alert alert-success text-sm py-3 px-4 flex items-center gap-2"><CheckCircle2 size={18} /><span>{msg}</span></div>}
      {error && <div className="alert alert-error text-sm py-3 px-4 flex items-center gap-2"><AlertCircle size={18} /><span>{error}</span></div>}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setMsg(""); setError(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${
              activeTab === t.key
                ? "bg-primary text-primary-content border-primary shadow-md"
                : "bg-base-100 border-base-200 text-base-content/70 hover:border-primary/40"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "My Clinic", value: clinic ? 1 : 0, icon: <Building2 size={24} />, color: "primary" },
              { label: "Active Doctors", value: assignedDoctors.length, icon: <Stethoscope size={24} />, color: "secondary" },
              { label: "Pending Doctor Requests", value: pendingIncomingRequests.length, icon: <Send size={24} />, color: "warning" },
              { label: "Appointments", value: appointments.length, icon: <Calendar size={24} />, color: "accent" },
            ].map((s) => (
              <div key={s.label} className="p-5 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-center gap-3">
                <div className={`p-3 bg-${s.color}/10 rounded-2xl text-${s.color}`}>{s.icon}</div>
                <div>
                  <div className="text-xs text-base-content/60 font-medium">{s.label}</div>
                  <div className="text-2xl font-extrabold text-base-content">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {clinic ? (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                  <Building2 className="text-primary" /> {clinic.name}
                </h2>
                <span className={`badge ${
                  clinic.verification_status === "VERIFIED" ? "badge-success" :
                  clinic.verification_status === "REJECTED" ? "badge-error" : "badge-warning"
                } badge-soft font-bold`}>{clinic.verification_status}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-base-content/70"><MapPin size={15} className="text-primary" /> {clinic.address}, {clinic.city}</div>
                <div className="flex items-center gap-2 text-base-content/70"><Users size={15} className="text-primary" /> {assignedDoctors.length} active doctor(s)</div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-warning/10 border border-warning/30 rounded-3xl flex items-start gap-4">
              <Info className="text-warning shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-base-content">No Clinic Registered</h3>
                <p className="text-sm text-base-content/70 mt-1">Go to <strong>My Clinic</strong> tab to register your clinic with certificate proof.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== MY CLINIC TAB ===== */}
      {activeTab === "clinic" && (
        <div className="space-y-6">
          {clinic ? (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-base-200 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-base-content">{clinic.name}</h2>
                  <p className="text-xs text-base-content/60">{clinic.address}, {clinic.city}</p>
                </div>
                <span className={`badge badge-lg ${
                  clinic.verification_status === "VERIFIED" ? "badge-success" :
                  clinic.verification_status === "REJECTED" ? "badge-error" : "badge-warning"
                }`}>{clinic.verification_status}</span>
              </div>

              {clinic.certificate_url && (
                <div className="text-sm">
                  <span className="font-bold">Certificate Document: </span>
                  <a href={clinic.certificate_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold ml-1">
                    View Certificate ↗
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <Plus className="text-primary" /> Register Your Clinic
              </h2>
              <form onSubmit={handleCreateClinic} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Clinic Name *</label>
                    <input type="text" required placeholder="Central Medicare Clinic" value={newClinic.name}
                      onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">City *</label>
                    <input type="text" required placeholder="Dhaka" value={newClinic.city}
                      onChange={(e) => setNewClinic({ ...newClinic, city: e.target.value })} className="input input-bordered w-full" />
                  </div>
                </div>
                <div>
                  <label className="label text-xs font-semibold">Address *</label>
                  <input type="text" required placeholder="123 Health Ave, Suite 400" value={newClinic.address}
                    onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })} className="input input-bordered w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Phone</label>
                    <input type="text" placeholder="+880-01234-56789" value={newClinic.phone}
                      onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Contact Email</label>
                    <input type="email" placeholder="info@clinic.com" value={newClinic.email}
                      onChange={(e) => setNewClinic({ ...newClinic, email: e.target.value })} className="input input-bordered w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Latitude (for nearby search)</label>
                    <input type="number" step="any" placeholder="e.g. 23.8103" value={newClinic.latitude}
                      onChange={(e) => setNewClinic({ ...newClinic, latitude: e.target.value })} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Longitude (for nearby search)</label>
                    <input type="number" step="any" placeholder="e.g. 90.4125" value={newClinic.longitude}
                      onChange={(e) => setNewClinic({ ...newClinic, longitude: e.target.value })} className="input input-bordered w-full" />
                  </div>
                </div>
                <div>
                  <label className="label text-xs font-semibold">Registration Certificate Document URL *</label>
                  <input type="url" required placeholder="https://res.cloudinary.com/... link to registration proof" value={newClinic.certificate_url}
                    onChange={(e) => setNewClinic({ ...newClinic, certificate_url: e.target.value })} className="input input-bordered w-full" />
                  <div className="text-xs text-base-content/60 mt-1">Required for Admin verification before offering services.</div>
                </div>
                <button type="submit" className="btn btn-primary w-full gap-2">
                  <Plus size={16} /> Register Clinic
                </button>
              </form>
            </div>
          )}

          {/* Link Department */}
          {clinic && clinic.verification_status === "VERIFIED" && (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <Layers className="text-primary" /> Link Department to Clinic
              </h2>
              <form onSubmit={handleLinkDept} className="flex flex-col sm:flex-row gap-4">
                <select required value={clinicDeptForm.department_id}
                  onChange={(e) => setClinicDeptForm({ department_id: e.target.value })}
                  className="select select-bordered flex-1">
                  <option value="">-- Choose Department --</option>
                  {departments.filter(d => !clinic.departments?.some(cd => cd.id === d.id)).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-secondary gap-2 shrink-0">
                  <Plus size={16} /> Link
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ===== DOCTORS & REQUESTS TAB ===== */}
      {activeTab === "doctors" && (
        <div className="space-y-6">
          {/* Send Invite Form */}
          {clinic && clinic.verification_status === "VERIFIED" && (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <Send className="text-primary" /> Send Service Request to Doctor
              </h2>
              <p className="text-xs text-base-content/60">Invite a registered, approved doctor to provide services at your clinic. They must accept before becoming active.</p>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Select Doctor *</label>
                    <select required value={inviteForm.doctor_id}
                      onChange={(e) => setInviteForm({ ...inviteForm, doctor_id: e.target.value })}
                      className="select select-bordered w-full">
                      <option value="">-- Choose Doctor --</option>
                      {allDoctors.filter(d => d.verification_status === "VERIFIED").map((d) => (
                        <option key={d.id} value={d.id}>Dr. {d.full_name} ({d.qualification || d.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Consultation Fee ($) *</label>
                    <input type="number" step="0.01" required placeholder="100.00" value={inviteForm.consultation_fee}
                      onChange={(e) => setInviteForm({ ...inviteForm, consultation_fee: e.target.value })}
                      className="input input-bordered w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Department (optional)</label>
                    <select value={inviteForm.department_id}
                      onChange={(e) => setInviteForm({ ...inviteForm, department_id: e.target.value })}
                      className="select select-bordered w-full">
                      <option value="">-- No department --</option>
                      {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Room Number (optional)</label>
                    <input type="text" placeholder="Room 204" value={inviteForm.room_number}
                      onChange={(e) => setInviteForm({ ...inviteForm, room_number: e.target.value })}
                      className="input input-bordered w-full" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full gap-2"><Send size={16} /> Send Service Invite</button>
              </form>
            </div>
          )}

          {/* Incoming Doctor Requests */}
          {pendingIncomingRequests.length > 0 && (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <Info className="text-warning" /> Incoming Join Requests from Doctors ({pendingIncomingRequests.length})
              </h2>
              <div className="space-y-3">
                {pendingIncomingRequests.map((r) => (
                  <div key={r.id} className="p-4 bg-base-200/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-base-content">Dr. {r.doctor?.full_name}</div>
                      <div className="text-xs text-base-content/60">Proposed Fee: ${r.consultation_fee} · Room: {r.room_number || "N/A"}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleRespondRequest(r.id, "ACCEPT")} className="btn btn-success btn-xs text-white">Accept</button>
                      <button onClick={() => handleRespondRequest(r.id, "REJECT")} className="btn btn-error btn-xs text-white">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Doctors */}
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <Stethoscope className="text-primary" /> Active Doctors ({assignedDoctors.length})
            </h2>
            {assignedDoctors.length === 0 ? (
              <div className="text-center py-6 text-xs text-base-content/60">No active doctors linked to your clinic.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assignedDoctors.map((d) => (
                  <div key={d.id} className="p-4 bg-base-200/40 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Stethoscope size={18} /></div>
                    <div>
                      <div className="font-bold text-sm text-base-content">Dr. {d.full_name}</div>
                      <div className="text-xs text-base-content/60">{d.qualification}</div>
                      <div className="text-xs text-success font-semibold mt-1">✓ Active Service Agreement</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== APPOINTMENTS TAB ===== */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <span className="font-bold">Clinic Appointments</span>
            <span className="badge badge-primary ml-auto">{appointments.length}</span>
          </div>
          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-3xl border border-base-200 text-base-content/60">
              No appointments found.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-base-content">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                        <span className={`badge badge-sm ml-2 ${
                          apt.status === "CONFIRMED" ? "badge-success badge-soft" :
                          apt.status === "COMPLETED" ? "badge-info badge-soft" :
                          apt.status === "CANCELLED" ? "badge-error badge-soft" : "badge-warning badge-soft"
                        }`}>{apt.status}</span>
                      </div>
                      <div className="text-sm text-base-content/60 flex flex-wrap gap-3">
                        <span className="flex items-center gap-1"><Stethoscope size={13} className="text-primary" /> Dr. {apt.doctor?.full_name}</span>
                        <span className="flex items-center gap-1"><Calendar size={13} className="text-primary" /> {apt.appointment_date}</span>
                        <span className="flex items-center gap-1"><Clock size={13} className="text-primary" /> {apt.appointment_time}</span>
                      </div>
                    </div>
                    <div className="text-primary font-bold text-lg shrink-0">${apt.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SPECIALIZATIONS TAB ===== */}
      {activeTab === "taxonomy" && (
        <div className="space-y-6">
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <Award className="text-primary" /> Create Medical Specialization
            </h2>
            <form onSubmit={handleCreateSpec} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">Specialization Name *</label>
                <input type="text" required placeholder="e.g. Pediatric Surgery" value={newSpec.name}
                  onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label text-xs font-semibold">Description</label>
                <input type="text" placeholder="Brief description of this specialty" value={newSpec.description}
                  onChange={(e) => setNewSpec({ ...newSpec, description: e.target.value })} className="input input-bordered w-full" />
              </div>
              <button type="submit" className="btn btn-secondary w-full gap-2"><Plus size={16} /> Add Specialization</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
