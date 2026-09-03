import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import {
  Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle,
  Stethoscope, Award, BookOpen, Edit3, Save, X, Loader, MapPin,
  Building2, Send, Play, Pause, FastForward, Navigation, ShieldCheck, Heart
} from "lucide-react";

export default function DoctorDashboard() {
  const [tab, setTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [approvedClinics, setApprovedClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // Live Chamber Session State
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [chamberSession, setChamberSession] = useState(null);
  const [updatingChamber, setUpdatingChamber] = useState(false);

  // Profile state
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    qualification: "",
    experience_years: 0,
    bio: "",
    certificate_url: "",
    specialization_ids: [],
  });

  // Request form state
  const [joinClinicForm, setJoinClinicForm] = useState({
    clinic_id: "",
    consultation_fee: "",
    department_id: "",
    room_number: "",
  });

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/appointments/");
      setAppointments(res.results || res || []);
    } catch {
      setError("Failed to load patient schedule.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await apiClient.get("/doctors/setup-profile/");
      setProfile(res);
      setProfileForm({
        full_name: res.full_name || "",
        qualification: res.qualification || "",
        experience_years: res.experience_years || 0,
        bio: res.bio || "",
        certificate_url: res.certificate_url || "",
        specialization_ids: res.specializations?.map((s) => s.id) || [],
      });
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchRequestsAndClinics = async () => {
    try {
      const [reqRes, cRes] = await Promise.all([
        apiClient.get("/doctors/requests/").catch(() => []),
        apiClient.get("/clinics/").catch(() => []),
      ]);
      const reqList = reqRes.results || reqRes || [];
      setRequests(reqList);
      const verifiedList = (cRes.results || cRes || []).filter(c => c.verification_status === "VERIFIED");
      setApprovedClinics(verifiedList);

      // Auto-select first accepted clinic mapping
      const acceptedReq = reqList.find(r => r.status === "ACCEPTED");
      if (acceptedReq && acceptedReq.clinic) {
        setSelectedClinicId(acceptedReq.clinic.id);
      }
    } catch {}
  };

  const fetchChamberSession = async () => {
    if (!profile || !selectedClinicId) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await apiClient.get(
        `/doctors/chamber-session/?doctor_id=${profile.id}&clinic_id=${selectedClinicId}&date=${todayStr}`
      );
      setChamberSession(res);
    } catch {}
  };

  useEffect(() => {
    fetchAppointments();
    fetchProfile();
    fetchRequestsAndClinics();
  }, []);

  useEffect(() => {
    if (profile && selectedClinicId) {
      fetchChamberSession();
    }
  }, [profile, selectedClinicId]);

  const showMsg = (m) => { setActionMsg(m); setTimeout(() => setActionMsg(""), 4000); };
  const showErr = (e) => { setError(e); setTimeout(() => setError(""), 5000); };

  const handleChamberAction = async (action, newStatus = null) => {
    if (!profile || !selectedClinicId) return;
    setUpdatingChamber(true);
    try {
      const payload = {
        doctor_id: profile.id,
        clinic_id: selectedClinicId,
        action: action,
      };
      if (newStatus) payload.status = newStatus;

      const res = await apiClient.post("/doctors/chamber-session/", payload);
      setChamberSession(res);
      showMsg(action === "NEXT_SERIAL" ? `Called Serial #${res.current_serial}!` : `Chamber status updated to ${res.status}`);
    } catch {
      showErr("Failed to update chamber session.");
    } finally {
      setUpdatingChamber(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await apiClient.post(`/appointments/${id}/complete/`);
      showMsg("Appointment marked as completed.");
      fetchAppointments();
    } catch (err) {
      showErr(typeof err === "string" ? err : "Only confirmed appointments can be completed.");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await apiClient.post(`/appointments/${id}/cancel/`);
      showMsg("Appointment cancelled.");
      fetchAppointments();
    } catch {
      showErr("Failed to cancel appointment.");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.certificate_url) return showErr("Medical License / Certificate URL is required.");
    setProfileLoading(true);
    setError("");
    try {
      await apiClient.post("/doctors/setup-profile/", {
        ...profileForm,
        experience_years: parseInt(profileForm.experience_years, 10) || 0,
      });
      await fetchProfile();
      setEditingProfile(false);
      showMsg("Profile updated successfully! Submitted for Admin verification.");
    } catch (err) {
      if (typeof err === "object") {
        showErr(Object.entries(err).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`).join(" "));
      } else {
        showErr(err || "Failed to update profile.");
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSendJoinRequest = async (e) => {
    e.preventDefault();
    if (!profile || profile.verification_status !== "VERIFIED") {
      return showErr("Your doctor profile must be approved by platform Admin before requesting clinic affiliations.");
    }
    if (!joinClinicForm.clinic_id || !joinClinicForm.consultation_fee) return;

    setError(""); setActionMsg("");
    try {
      await apiClient.post("/doctors/requests/create/", {
        clinic_id: joinClinicForm.clinic_id,
        consultation_fee: parseFloat(joinClinicForm.consultation_fee),
        department_id: joinClinicForm.department_id || null,
        room_number: joinClinicForm.room_number || "",
      });
      showMsg("Request sent to clinic! Waiting for clinic admin's approval.");
      setJoinClinicForm({ clinic_id: "", consultation_fee: "", department_id: "", room_number: "" });
      fetchRequestsAndClinics();
    } catch (err) {
      if (typeof err === "object") showErr(err.detail || Object.values(err).flat().join(" "));
      else showErr("Failed to send request to clinic.");
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    setError(""); setActionMsg("");
    try {
      await apiClient.patch(`/doctors/requests/${requestId}/respond/`, { action });
      showMsg(`Request ${action === "ACCEPT" ? "accepted" : "rejected"}.`);
      fetchRequestsAndClinics();
      fetchProfile();
    } catch {
      showErr("Failed to respond to request.");
    }
  };

  const pendingIncomingInvites = requests.filter(r => r.status === "PENDING_DOCTOR_APPROVAL");
  const activeAffiliations = requests.filter(r => r.status === "ACCEPTED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-base-content flex items-center gap-2">
            <Stethoscope className="text-primary" /> Doctor Portal
          </h1>
          <p className="text-sm text-base-content/60 mt-1">Live queue control, appointment management, & clinic affiliations</p>
        </div>

        {/* Active Clinic Switcher */}
        {activeAffiliations.length > 0 && (
          <div className="flex items-center gap-2 bg-base-200/60 p-2.5 rounded-2xl">
            <Building2 size={16} className="text-primary" />
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="select select-sm select-ghost font-bold text-xs"
            >
              {activeAffiliations.map((a) => (
                <option key={a.clinic?.id} value={a.clinic?.id}>
                  {a.clinic?.name} ({a.clinic?.city})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Admin Approval Banner */}
      {profile && profile.verification_status !== "VERIFIED" && (
        <div className={`p-5 rounded-3xl border flex items-start gap-4 ${
          profile.verification_status === "REJECTED" ? "bg-error/15 border-error/30 text-error-content" : "bg-warning/15 border-warning/30 text-warning-content"
        }`}>
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">
              {profile.verification_status === "REJECTED" ? "Medical License / Profile Rejected" : "Doctor Profile Pending Admin Verification"}
            </h3>
            <p className="text-xs mt-1">
              {profile.verification_status === "REJECTED"
                ? "Your license certificate was rejected by platform Admin. Please update your certificate URL in your profile."
                : "Your professional profile & certificate are currently PENDING approval from platform Admin."}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200/60 w-fit rounded-xl p-1 flex-wrap">
        <button
          className={`tab rounded-lg font-semibold transition-all ${tab === "appointments" ? "tab-active" : ""}`}
          onClick={() => { setTab("appointments"); setError(""); setActionMsg(""); }}
        >
          <Calendar size={15} className="mr-1" /> Live Queue & Appointments
        </button>
        <button
          className={`tab rounded-lg font-semibold transition-all ${tab === "affiliations" ? "tab-active" : ""}`}
          onClick={() => { setTab("affiliations"); setError(""); setActionMsg(""); }}
        >
          <Building2 size={15} className="mr-1" /> Clinic Affiliations ({requests.length})
        </button>
        <button
          className={`tab rounded-lg font-semibold transition-all ${tab === "profile" ? "tab-active" : ""}`}
          onClick={() => { setTab("profile"); setError(""); setActionMsg(""); }}
        >
          <User size={15} className="mr-1" /> My Profile
        </button>
      </div>

      {/* Alerts */}
      {actionMsg && (
        <div className="alert alert-success text-sm py-3 px-4 shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error text-sm py-3 px-4 shadow-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ======== APPOINTMENTS & LIVE QUEUE TAB ======== */}
      {tab === "appointments" && (
        <div className="space-y-6">
          {/* ====== LIVE CHAMBER TOKEN CONTROL PANEL ====== */}
          {selectedClinicId && (
            <div className="bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 border-2 border-primary/30 p-6 rounded-3xl shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary font-bold text-xs">Live Chamber Tracker</span>
                    <span className={`badge font-bold text-xs ${
                      chamberSession?.status === "IN_CHAMBER" ? "badge-success text-white animate-pulse" :
                      chamberSession?.status === "IN_TRANSIT" ? "badge-warning" :
                      chamberSession?.status === "PAUSED" ? "badge-secondary" : "badge-ghost"
                    }`}>
                      Status: {chamberSession?.status || "NOT_STARTED"}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-base-content mt-1">
                    Serial Tracker Control
                  </h2>
                </div>

                <div className="bg-base-100 px-6 py-2 rounded-2xl border border-base-200 shadow-sm flex items-center gap-3">
                  <div className="text-xs text-base-content/60 font-semibold uppercase">Currently Called</div>
                  <div className="text-3xl font-black text-primary">
                    #{chamberSession?.current_serial || 0}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => handleChamberAction("NEXT_SERIAL")}
                  disabled={updatingChamber}
                  className="btn btn-primary font-bold gap-2 text-base shadow-md flex-1 md:flex-initial"
                >
                  <FastForward size={18} /> Call Next Serial (#{(chamberSession?.current_serial || 0) + 1})
                </button>

                <button
                  onClick={() => handleChamberAction("UPDATE_STATUS", "IN_TRANSIT")}
                  disabled={updatingChamber}
                  className="btn btn-warning btn-outline font-bold gap-1"
                >
                  <Navigation size={16} /> In Transit
                </button>

                <button
                  onClick={() => handleChamberAction("UPDATE_STATUS", "IN_CHAMBER")}
                  disabled={updatingChamber}
                  className="btn btn-success btn-outline font-bold gap-1"
                >
                  <Play size={16} /> In Chamber
                </button>

                <button
                  onClick={() => handleChamberAction("UPDATE_STATUS", "PAUSED")}
                  disabled={updatingChamber}
                  className="btn btn-secondary btn-outline font-bold gap-1"
                >
                  <Pause size={16} /> Pause
                </button>

                <button
                  onClick={() => handleChamberAction("UPDATE_STATUS", "ENDED")}
                  disabled={updatingChamber}
                  className="btn btn-error btn-outline font-bold gap-1"
                >
                  <XCircle size={16} /> End Session
                </button>
              </div>
            </div>
          )}

          {/* Appointments List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-32 w-full rounded-2xl"></div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 bg-base-100 rounded-3xl border border-base-200">
              <Calendar size={48} className="mx-auto text-base-content/30 mb-4" />
              <h3 className="text-lg font-bold text-base-content">No Scheduled Patients</h3>
              <p className="text-sm text-base-content/60 mt-1">There are no appointments assigned to you currently.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => {
                const isCurrentlyCalled = chamberSession && chamberSession.current_serial === apt.serial_number;
                return (
                  <div
                    key={apt.id}
                    className={`bg-base-100 border-2 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all ${
                      isCurrentlyCalled ? "border-success bg-success/5 shadow-xl scale-[1.01]" : "border-base-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="badge badge-lg badge-primary font-black px-3">
                            Serial #{apt.serial_number}
                          </span>
                          <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                            <User size={18} className="text-primary" />
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </h3>
                          <span className={`badge font-bold ${
                            apt.status === "CONFIRMED" ? "badge-success badge-soft" :
                            apt.status === "COMPLETED" ? "badge-info badge-soft" :
                            apt.status === "CANCELLED" ? "badge-error badge-soft" : "badge-warning badge-soft"
                          }`}>
                            {apt.status}
                          </span>
                          {apt.family_member && (
                            <span className="badge badge-secondary badge-soft font-bold gap-1 text-xs">
                              <Heart size={12} /> Patient: {apt.family_member.full_name} ({apt.family_member.relationship_display})
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} className="text-primary" />
                            <span>{apt.appointment_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={16} className="text-primary" />
                            <span>{apt.appointment_time}</span>
                          </div>
                          {apt.clinic && (
                            <div className="flex items-center gap-1">
                              <MapPin size={16} className="text-primary" />
                              <span>{apt.clinic.name}</span>
                            </div>
                          )}
                        </div>

                        {apt.problem_description && (
                          <div className="text-xs bg-base-200/60 p-3 rounded-xl text-base-content/80 mt-2">
                            <span className="font-semibold">Patient Symptoms: </span>{apt.problem_description}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0 w-full md:w-auto">
                        {apt.status === "CONFIRMED" && (
                          <button
                            onClick={() => handleComplete(apt.id)}
                            className="btn btn-primary btn-sm gap-1 shadow-sm flex-1 md:flex-initial"
                          >
                            <CheckCircle2 size={16} /> Complete Consultation
                          </button>
                        )}
                        {apt.status !== "COMPLETED" && apt.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="btn btn-outline btn-error btn-sm gap-1 flex-1 md:flex-initial"
                          >
                            <XCircle size={16} /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======== CLINIC AFFILIATIONS TAB ======== */}
      {tab === "affiliations" && (
        <div className="space-y-6">
          {profile && profile.verification_status === "VERIFIED" && (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <Send className="text-primary" /> Send Service Request to a Clinic
              </h2>
              <form onSubmit={handleSendJoinRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-semibold">Select Clinic *</label>
                    <select required value={joinClinicForm.clinic_id}
                      onChange={(e) => setJoinClinicForm({ ...joinClinicForm, clinic_id: e.target.value })}
                      className="select select-bordered w-full">
                      <option value="">-- Choose Clinic --</option>
                      {approvedClinics.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-semibold">Proposed Consultation Fee (৳ BDT) *</label>
                    <input type="number" step="1" required placeholder="1000" value={joinClinicForm.consultation_fee}
                      onChange={(e) => setJoinClinicForm({ ...joinClinicForm, consultation_fee: e.target.value })}
                      className="input input-bordered w-full" />
                  </div>
                </div>
                <div>
                  <label className="label text-xs font-semibold">Room Number (optional)</label>
                  <input type="text" placeholder="Room 101" value={joinClinicForm.room_number}
                    onChange={(e) => setJoinClinicForm({ ...joinClinicForm, room_number: e.target.value })}
                    className="input input-bordered w-full" />
                </div>
                <button type="submit" className="btn btn-primary w-full gap-2"><Send size={16} /> Send Join Request</button>
              </form>
            </div>
          )}

          {pendingIncomingInvites.length > 0 && (
            <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
              <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
                <AlertCircle className="text-warning" /> Incoming Clinic Invites ({pendingIncomingInvites.length})
              </h2>
              <div className="space-y-3">
                {pendingIncomingInvites.map((r) => (
                  <div key={r.id} className="p-4 bg-base-200/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-base-content">{r.clinic?.name}</div>
                      <div className="text-xs text-base-content/60">📍 {r.clinic?.city} · Fee: ৳{r.consultation_fee} BDT</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleRespondRequest(r.id, "ACCEPT")} className="btn btn-success btn-xs text-white">Accept Invite</button>
                      <button onClick={() => handleRespondRequest(r.id, "REJECT")} className="btn btn-error btn-xs text-white">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
            <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
              <Building2 className="text-primary" /> Active Clinic Affiliations ({activeAffiliations.length})
            </h2>
            {activeAffiliations.length === 0 ? (
              <div className="text-center py-6 text-xs text-base-content/60">You have no active clinic affiliations yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeAffiliations.map((r) => (
                  <div key={r.id} className="p-4 bg-base-200/40 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Building2 size={18} /></div>
                    <div>
                      <div className="font-bold text-sm text-base-content">{r.clinic?.name}</div>
                      <div className="text-xs text-base-content/60">{r.clinic?.city} · Fee: ৳{r.consultation_fee} BDT</div>
                      <div className="text-xs text-success font-semibold mt-1">✓ Active Service Agreement</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======== PROFILE TAB ======== */}
      {tab === "profile" && (
        <div className="bg-base-100 border border-base-200 rounded-3xl p-6 shadow-md">
          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={32} className="animate-spin text-primary" />
            </div>
          ) : !editingProfile ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-base-content flex items-center gap-2">
                    <Stethoscope className="text-primary" />
                    {profile ? `Dr. ${profile.full_name}` : "Profile Not Set Up"}
                  </h2>
                  {profile && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-primary font-semibold">{profile.qualification}</span>
                      <span className={`badge badge-sm ${
                        profile.verification_status === "VERIFIED" ? "badge-success" :
                        profile.verification_status === "REJECTED" ? "badge-error" : "badge-warning"
                      } badge-soft`}>{profile.verification_status}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditingProfile(true)}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Edit3 size={15} /> {profile ? "Edit Profile" : "Set Up Profile"}
                </button>
              </div>

              {profile && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-base-200/50 rounded-2xl">
                      <div className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Experience</div>
                      <div className="text-lg font-bold text-base-content mt-1 flex items-center gap-2">
                        <BookOpen size={18} className="text-primary" />
                        {profile.experience_years} years
                      </div>
                    </div>
                    <div className="p-4 bg-base-200/50 rounded-2xl">
                      <div className="text-xs text-base-content/60 font-semibold uppercase tracking-wide">Qualification</div>
                      <div className="text-lg font-bold text-base-content mt-1 flex items-center gap-2">
                        <Award size={18} className="text-primary" />
                        {profile.qualification}
                      </div>
                    </div>
                  </div>

                  {profile.certificate_url && (
                    <div className="p-4 bg-base-200/50 rounded-2xl text-sm">
                      <div className="text-xs text-base-content/60 font-semibold uppercase tracking-wide mb-1">License Certificate</div>
                      <a href={profile.certificate_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                        View Uploaded Certificate Document ↗
                      </a>
                    </div>
                  )}

                  {profile.bio && (
                    <div className="p-4 bg-base-200/30 rounded-2xl">
                      <div className="text-xs text-base-content/60 font-semibold uppercase tracking-wide mb-2">Professional Bio</div>
                      <p className="text-sm text-base-content/80">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-extrabold text-base-content">
                  {profile ? "Edit Profile" : "Set Up Doctor Profile"}
                </h2>
                <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-ghost btn-sm">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="label text-sm font-semibold">Full Name</label>
                <input
                  name="full_name" type="text" required
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Dr. John Doe"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm font-semibold">Qualification</label>
                  <input
                    name="qualification" type="text" required
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="MBBS, FCPS Cardiology"
                  />
                </div>
                <div>
                  <label className="label text-sm font-semibold">Experience (Years)</label>
                  <input
                    name="experience_years" type="number" min={0} max={60}
                    value={profileForm.experience_years}
                    onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label text-sm font-semibold">Medical License / Certificate URL *</label>
                <input
                  type="url" required
                  value={profileForm.certificate_url}
                  onChange={(e) => setProfileForm({ ...profileForm, certificate_url: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label text-sm font-semibold">Bio</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="textarea textarea-bordered w-full"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-outline gap-2">
                  <X size={16} /> Cancel
                </button>
                <button type="submit" disabled={profileLoading} className="btn btn-primary flex-1 gap-2">
                  {profileLoading ? <Loader size={18} className="animate-spin" /> : <Save size={16} />} Save Profile
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
