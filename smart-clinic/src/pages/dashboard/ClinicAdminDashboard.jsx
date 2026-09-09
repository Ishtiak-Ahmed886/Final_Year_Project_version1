import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import { useAuth } from "../../Provider/AuthProvider";
import {
  Building2, Stethoscope, Layers, Plus, CheckCircle2, AlertCircle,
  Award, ShieldCheck, Info, Link as LinkIcon, Users, Calendar,
  MapPin, Clock, TrendingUp, XCircle, Send, Check, Tv, FastForward,
  Play, Pause, Navigation, AlertTriangle, RotateCcw, Printer, CreditCard,
  UserPlus
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

  // Live Chamber & Reception Desk State
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [chamberSession, setChamberSession] = useState(null);
  const [updatingChamber, setUpdatingChamber] = useState(false);
  const [receptionDelayMins, setReceptionDelayMins] = useState(15);
  const [receptionNotice, setReceptionNotice] = useState("");
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [broadcastingDelay, setBroadcastingDelay] = useState(false);

  // Walk-in Counter Patient & Cash Check-in State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  const [checkingInId, setCheckingInId] = useState(null);
  const [printTokenData, setPrintTokenData] = useState(null);
  const [walkInForm, setWalkInForm] = useState({
    walk_in_name: "",
    walk_in_phone: "",
    doctor_id: "",
    appointment_time: "",
    problem_description: "",
  });



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
        if (myDoctors.length > 0) {
          setSelectedDoctorId(myDoctors[0].id);
        }
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

  const fetchReceptionChamberSession = async () => {
    if (!clinic || !selectedDoctorId) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await apiClient.get(
        `/doctors/chamber-session/?doctor_id=${selectedDoctorId}&clinic_id=${clinic.id}&date=${todayStr}`
      );
      setChamberSession(res);
    } catch {}
  };

  useEffect(() => {
    if (clinic && selectedDoctorId) {
      fetchReceptionChamberSession();
    }
  }, [clinic, selectedDoctorId]);

  const handleReceptionChamberAction = async (action, newStatus = null, targetSerial = null) => {
    if (!clinic || !selectedDoctorId) return;
    setUpdatingChamber(true);
    try {
      const payload = {
        doctor_id: selectedDoctorId,
        clinic_id: clinic.id,
        action: action,
      };
      if (newStatus) payload.status = newStatus;
      if (targetSerial !== null) payload.current_serial = targetSerial;

      const res = await apiClient.post("/doctors/chamber-session/", payload);
      setChamberSession(res);
      showMsg(
        action === "NEXT_SERIAL"
          ? `Reception advanced queue to Serial #${res.current_serial}!`
          : action === "SKIP_SERIAL"
          ? `Serial held. Advanced to #${res.current_serial}!`
          : action === "RECALL_SERIAL"
          ? `Recalled Serial #${res.current_serial} into chamber!`
          : action === "RESET"
          ? "Queue reset to Serial #0."
          : `Doctor chamber status set to ${res.status}`
      );
    } catch {
      showErr("Failed to update doctor chamber session.");
    } finally {
      setUpdatingChamber(false);
    }
  };

  const handleBroadcastReceptionDelay = async (e) => {
    e.preventDefault();
    if (!clinic || !selectedDoctorId) return;
    setBroadcastingDelay(true);
    try {
      const payload = {
        doctor_id: selectedDoctorId,
        clinic_id: clinic.id,
        action: "UPDATE_STATUS",
        delay_minutes: parseInt(receptionDelayMins, 10) || 0,
        announcement_note: receptionNotice,
      };
      const res = await apiClient.post("/doctors/chamber-session/", payload);
      setChamberSession(res);
      setDelayModalOpen(false);
      showMsg("Notice & Delay broadcasted to patient waiting displays!");
    } catch {
      showErr("Failed to broadcast delay notice.");
    } finally {
      setBroadcastingDelay(false);
    }
  };

  const handleCreateWalkIn = async (e) => {
    e.preventDefault();
    if (!clinic) return showErr("No clinic registered.");
    if (!walkInForm.doctor_id || !walkInForm.walk_in_name) {
      return showErr("Please enter Patient Name and choose a Doctor.");
    }
    setSubmittingWalkIn(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const currentTime = walkInForm.appointment_time || new Date().toTimeString().split(" ")[0].slice(0, 5);

      const payload = {
        clinic_id: clinic.id,
        doctor_id: walkInForm.doctor_id,
        appointment_date: todayStr,
        appointment_time: currentTime,
        problem_description: walkInForm.problem_description || "Walk-in patient registration",
        is_walk_in: true,
        walk_in_name: walkInForm.walk_in_name,
        walk_in_phone: walkInForm.walk_in_phone || "01700000000",
      };

      const res = await apiClient.post("/appointments/", payload);
      setWalkInModalOpen(false);
      setWalkInForm({
        walk_in_name: "",
        walk_in_phone: "",
        doctor_id: assignedDoctors.length > 0 ? assignedDoctors[0].id : "",
        appointment_time: "",
        problem_description: "",
      });
      loadData();
      fetchReceptionChamberSession();
      setPrintTokenData(res);
      showMsg(`Walk-in Serial #${res.serial_number} confirmed! Cash recorded.`);
    } catch (err) {
      showErr(err?.detail || (typeof err === "object" ? Object.values(err).flat().join(" ") : "Failed to register walk-in patient."));
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const handleCashCheckIn = async (appointmentId) => {
    setCheckingInId(appointmentId);
    try {
      const res = await apiClient.post(`/appointments/${appointmentId}/checkin/`);
      loadData();
      showMsg(`Appointment Serial #${res.serial_number} marked as Paid (Cash) & Checked-in!`);
    } catch {
      showErr("Failed to check-in appointment.");
    } finally {
      setCheckingInId(null);
    }
  };

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
    { key: "chamber", label: "Live Reception Queue & TV", icon: <Tv size={16} /> },
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

      {/* ===== LIVE RECEPTION QUEUE & TV TAB ===== */}
      {activeTab === "chamber" && (
        <div className="space-y-5">
          {!clinic ? (
            <div className="p-6 bg-warning/10 border border-warning/30 rounded-3xl flex items-start gap-4">
              <AlertTriangle className="text-warning shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-base-content">No Clinic Registered</h3>
                <p className="text-sm text-base-content/70 mt-1">Register your clinic first to manage live queue sessions.</p>
              </div>
            </div>
          ) : assignedDoctors.length === 0 ? (
            <div className="p-6 bg-info/10 border border-info/30 rounded-3xl flex items-start gap-4">
              <AlertTriangle className="text-info shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-base-content">No Active Doctors</h3>
                <p className="text-sm text-base-content/70 mt-1">Invite and get at least one doctor accepted before managing live queues.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Doctor Selector + TV Link */}
              <div className="bg-base-100 border border-base-200 p-5 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Tv className="text-primary shrink-0" size={22} />
                  <div>
                    <div className="font-extrabold text-base-content text-base">Live Reception Queue Control</div>
                    <div className="text-xs text-base-content/60">Select a doctor to manage their today's queue session</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => { setSelectedDoctorId(e.target.value); setChamberSession(null); }}
                    className="select select-bordered select-sm w-full sm:w-56"
                  >
                    {assignedDoctors.map((d) => (
                      <option key={d.id} value={d.id}>Dr. {d.full_name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setWalkInForm(prev => ({ ...prev, doctor_id: selectedDoctorId || (assignedDoctors[0]?.id || "") }));
                      setWalkInModalOpen(true);
                    }}
                    className="btn btn-primary btn-sm gap-2 shrink-0 shadow-md font-bold"
                    title="Register walk-in counter patient"
                  >
                    <UserPlus size={15} /> + Walk-in Token
                  </button>
                  {selectedDoctorId && clinic && (
                    <a
                      href={`/queue-display/${clinic.id}/${selectedDoctorId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm gap-2 shrink-0"
                    >
                      <Tv size={14} /> Open TV Screen ↗
                    </a>
                  )}
                  <button
                    onClick={fetchReceptionChamberSession}
                    className="btn btn-ghost btn-sm gap-2 shrink-0"
                    title="Refresh session data"
                  >
                    <RotateCcw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {/* Live Session Metrics */}
              {chamberSession ? (
                <>
                  {/* Delay/Announcement Notice */}
                  {(chamberSession.delay_minutes > 0 || chamberSession.announcement_note) && (
                    <div className="p-4 bg-warning/15 border border-warning/40 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="text-warning shrink-0 mt-0.5" size={18} />
                      <div className="flex-1 text-sm">
                        {chamberSession.delay_minutes > 0 && (
                          <span className="font-bold text-warning-content">⏱ +{chamberSession.delay_minutes} min delay broadcast. </span>
                        )}
                        {chamberSession.announcement_note && (
                          <span className="text-base-content/80">{chamberSession.announcement_note}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Now Serving", value: `#${chamberSession.current_serial}`, color: "primary", icon: <Play size={20} /> },
                      { label: "Total Serials", value: chamberSession.total_serials, color: "secondary", icon: <Users size={20} /> },
                      { label: "Status", value: chamberSession.status?.replace("_", " "), color: chamberSession.status === "IN_CHAMBER" ? "success" : chamberSession.status === "PRAYER_BREAK" ? "warning" : "info", icon: <Clock size={20} /> },
                      { label: "Room", value: chamberSession.room_number || "—", color: "accent", icon: <Navigation size={20} /> },
                    ].map((s) => (
                      <div key={s.label} className="p-4 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-center gap-3">
                        <div className={`p-2 bg-${s.color}/10 rounded-xl text-${s.color}`}>{s.icon}</div>
                        <div>
                          <div className="text-xs text-base-content/60 font-medium">{s.label}</div>
                          <div className="text-xl font-extrabold text-base-content">{s.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skipped Serials */}
                  {chamberSession.skipped_serials?.length > 0 && (
                    <div className="bg-base-100 border border-base-200 p-4 rounded-2xl shadow-sm">
                      <div className="text-xs font-bold text-base-content/70 mb-2 flex items-center gap-2">
                        <Pause size={14} className="text-warning" /> Held / Skipped Serials — Click to Recall
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {chamberSession.skipped_serials.map((sn) => (
                          <button
                            key={sn}
                            onClick={() => handleReceptionChamberAction("RECALL_SERIAL", null, sn)}
                            disabled={updatingChamber}
                            className="badge badge-warning badge-lg font-bold cursor-pointer hover:badge-error transition-all"
                            title={`Recall Serial #${sn} into chamber`}
                          >
                            #{sn} Recall
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Queue Action Buttons */}
                  <div className="bg-base-100 border border-base-200 p-5 rounded-3xl shadow-md space-y-4">
                    <div className="text-sm font-extrabold text-base-content border-b border-base-200 pb-2">Queue Actions</div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleReceptionChamberAction("NEXT_SERIAL")}
                        disabled={updatingChamber}
                        className="btn btn-primary gap-2"
                      >
                        <FastForward size={16} /> Call Next
                      </button>
                      <button
                        onClick={() => handleReceptionChamberAction("SKIP_SERIAL")}
                        disabled={updatingChamber}
                        className="btn btn-warning gap-2"
                      >
                        <Pause size={16} /> Skip &amp; Hold
                      </button>
                      <button
                        onClick={() => handleReceptionChamberAction("RESET")}
                        disabled={updatingChamber}
                        className="btn btn-ghost btn-outline gap-2"
                      >
                        <RotateCcw size={16} /> Reset Queue
                      </button>
                    </div>

                    <div className="text-sm font-extrabold text-base-content border-b border-base-200 pb-2 pt-2">Doctor Status</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "🏥 In Chamber", status: "IN_CHAMBER", cls: "btn-success" },
                        { label: "🕌 Namaz Break", status: "PRAYER_BREAK", cls: "btn-warning" },
                        { label: "🚗 In Transit", status: "IN_TRANSIT", cls: "btn-info" },
                        { label: "🚨 Emergency", status: "EMERGENCY", cls: "btn-error" },
                        { label: "⏸ Pause", status: "PAUSED", cls: "btn-ghost btn-outline" },
                        { label: "✅ End Session", status: "COMPLETED", cls: "btn-neutral" },
                      ].map((b) => (
                        <button
                          key={b.status}
                          onClick={() => handleReceptionChamberAction("UPDATE_STATUS", b.status)}
                          disabled={updatingChamber || chamberSession.status === b.status}
                          className={`btn btn-sm gap-1 ${b.cls} ${chamberSession.status === b.status ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => setDelayModalOpen(true)}
                        className="btn btn-outline btn-sm gap-2"
                      >
                        <AlertTriangle size={14} /> Broadcast Delay / Notice
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-base-100 border border-base-200 rounded-3xl p-10 text-center space-y-3">
                  <Tv size={40} className="mx-auto text-base-content/20" />
                  <div className="text-sm text-base-content/60">No active queue session found for today.</div>
                  <button
                    onClick={() => handleReceptionChamberAction("UPDATE_STATUS", "NOT_STARTED")}
                    disabled={updatingChamber}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <Play size={14} /> Start Today&apos;s Session
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== BROADCAST DELAY MODAL ===== */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                <AlertTriangle className="text-warning" size={20} /> Broadcast Delay &amp; Notice
              </h3>
              <button onClick={() => setDelayModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <p className="text-xs text-base-content/60">
              This will immediately push a delay notice to all patient waiting room displays for this doctor&apos;s queue.
            </p>
            <form onSubmit={handleBroadcastReceptionDelay} className="space-y-4">
              <div>
                <label className="label text-xs font-semibold">Delay (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={receptionDelayMins}
                  onChange={(e) => setReceptionDelayMins(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="label text-xs font-semibold">Announcement Message (optional)</label>
                <textarea
                  value={receptionNotice}
                  onChange={(e) => setReceptionNotice(e.target.value)}
                  className="textarea textarea-bordered w-full"
                  placeholder="e.g. Doctor is in surgery, please wait..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={broadcastingDelay} className="btn btn-warning flex-1 gap-2">
                  {broadcastingDelay ? <span className="loading loading-spinner loading-xs" /> : <AlertTriangle size={15} />}
                  Broadcast Now
                </button>
                <button type="button" onClick={() => setDelayModalOpen(false)} className="btn btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
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
          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <span className="font-bold">Clinic Appointments</span>
              <span className="badge badge-primary">{appointments.length}</span>
            </div>

            <button
              onClick={() => {
                setWalkInForm(prev => ({ ...prev, doctor_id: selectedDoctorId || (assignedDoctors[0]?.id || "") }));
                setWalkInModalOpen(true);
              }}
              className="btn btn-primary btn-sm gap-1.5 shadow-md font-bold"
            >
              <UserPlus size={15} /> + New Walk-in Patient
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-3xl border border-base-200 text-base-content/60">
              No appointments found.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge badge-secondary font-black text-xs">
                          Serial #{apt.serial_number || "—"}
                        </span>
                        <div className="font-bold text-base-content">
                          {apt.patient?.first_name} {apt.patient?.last_name}
                        </div>
                        {apt.patient?.phone && (
                          <span className="text-xs text-base-content/60">({apt.patient.phone})</span>
                        )}
                        <span className={`badge badge-sm ${
                          apt.status === "CONFIRMED" ? "badge-success badge-soft font-bold" :
                          apt.status === "COMPLETED" ? "badge-info badge-soft font-bold" :
                          apt.status === "CANCELLED" ? "badge-error badge-soft" : "badge-warning badge-soft font-bold"
                        }`}>{apt.status}</span>
                      </div>
                      <div className="text-sm text-base-content/60 flex flex-wrap gap-3 pt-1">
                        <span className="flex items-center gap-1"><Stethoscope size={13} className="text-primary" /> Dr. {apt.doctor?.full_name}</span>
                        <span className="flex items-center gap-1"><Calendar size={13} className="text-primary" /> {apt.appointment_date}</span>
                        <span className="flex items-center gap-1"><Clock size={13} className="text-primary" /> {apt.appointment_time}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      <div className="text-primary font-bold text-lg">৳{apt.amount} BDT</div>
                      <div className="flex items-center gap-2">
                        {apt.status === "PENDING" && (
                          <button
                            onClick={() => handleCashCheckIn(apt.id)}
                            disabled={checkingInId === apt.id}
                            className="btn btn-success btn-xs text-white font-bold gap-1 shadow-sm"
                            title="Confirm cash paid at counter & check-in patient"
                          >
                            <CreditCard size={12} />
                            {checkingInId === apt.id ? "Checking in..." : "Mark Paid (Cash)"}
                          </button>
                        )}
                        <button
                          onClick={() => setPrintTokenData(apt)}
                          className="btn btn-outline btn-xs gap-1"
                          title="Print thermal token slip"
                        >
                          <Printer size={12} /> Print Token
                        </button>
                      </div>
                    </div>
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

      {/* ===== WALK-IN PATIENT ENTRY MODAL ===== */}
      {walkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary font-bold">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-base-content">
                    Walk-in Counter Registration (কাউন্টার সিরিয়াল)
                  </h3>
                  <p className="text-xs text-base-content/60">Issue instant serial token for walk-in patient at clinic counter</p>
                </div>
              </div>
              <button onClick={() => setWalkInModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.walk_in_name}
                    onChange={(e) => setWalkInForm({ ...walkInForm, walk_in_name: e.target.value })}
                    className="input input-bordered w-full font-medium"
                    placeholder="e.g. Md. Rafiqul Islam"
                  />
                </div>
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.walk_in_phone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, walk_in_phone: e.target.value })}
                    className="input input-bordered w-full font-medium"
                    placeholder="e.g. 01712345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Doctor *</label>
                  <select
                    required
                    value={walkInForm.doctor_id}
                    onChange={(e) => setWalkInForm({ ...walkInForm, doctor_id: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="">-- Select Doctor --</option>
                    {assignedDoctors.map((d) => (
                      <option key={d.id} value={d.id}>Dr. {d.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Time Slot (Optional)</label>
                  <input
                    type="time"
                    value={walkInForm.appointment_time}
                    onChange={(e) => setWalkInForm({ ...walkInForm, appointment_time: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold uppercase tracking-wider">Chief Complaint / Notes (Optional)</label>
                <input
                  type="text"
                  value={walkInForm.problem_description}
                  onChange={(e) => setWalkInForm({ ...walkInForm, problem_description: e.target.value })}
                  className="input input-bordered w-full text-xs"
                  placeholder="e.g. High fever for 3 days, headache"
                />
              </div>

              <div className="p-3 bg-base-200/60 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-base-content">
                  <span>Payment Mode:</span>
                  <span className="text-success font-black">Cash at Counter (স্বয়ংক্রিয় পরিশোধিত)</span>
                </div>
                <div className="text-[11px] text-base-content/60">
                  Appointment will be immediately confirmed, serial token assigned, and cash transaction recorded.
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="btn btn-primary flex-1 gap-2 font-bold shadow-md"
                >
                  {submittingWalkIn ? <span className="loading loading-spinner loading-xs" /> : <Printer size={16} />}
                  Confirm & Issue Token Slip
                </button>
                <button type="button" onClick={() => setWalkInModalOpen(false)} className="btn btn-ghost flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== PRINTABLE THERMAL TOKEN SLIP MODAL ===== */}
      {printTokenData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 print:hidden">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Printer size={15} /> Thermal Token Preview
              </span>
              <button onClick={() => setPrintTokenData(null)} className="btn btn-ghost btn-xs btn-circle">✕</button>
            </div>

            {/* Printable Slip Container */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3 font-mono text-xs bg-slate-50">
              <div className="space-y-0.5 border-b border-slate-200 pb-2">
                <div className="font-black text-sm uppercase tracking-wide">{clinic?.name || "Smart Clinic BD"}</div>
                <div className="text-[10px] text-slate-500">{clinic?.address || ""}, {clinic?.city || "Dhaka"}</div>
                <div className="text-[10px] text-slate-500">Phone: {clinic?.phone || "01700-000000"}</div>
              </div>

              <div className="py-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">PATIENT SERIAL TOKEN</div>
                <div className="text-5xl font-black text-emerald-600 my-1">
                  #{printTokenData.serial_number || 1}
                </div>
                <div className="text-[10px] text-slate-400">Date: {printTokenData.appointment_date}</div>
              </div>

              <div className="text-left space-y-1 bg-white p-3 rounded-xl border border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold">{printTokenData.patient?.first_name} {printTokenData.patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold">Dr. {printTokenData.doctor?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee:</span>
                  <span className="font-bold text-emerald-600">৳{printTokenData.amount} BDT (PAID)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time:</span>
                  <span className="font-bold">{printTokenData.appointment_time}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                Please wait in lobby until your serial is called on the TV screen.
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="btn btn-primary btn-sm flex-1 gap-1.5 font-bold shadow-md"
              >
                <Printer size={15} /> Print Slip
              </button>
              <button
                onClick={() => setPrintTokenData(null)}
                className="btn btn-ghost btn-sm flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

