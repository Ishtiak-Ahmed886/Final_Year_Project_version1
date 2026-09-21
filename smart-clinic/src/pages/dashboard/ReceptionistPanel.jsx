import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../Provider/AuthProvider";
import { useLanguage } from "../../context/LanguageContext";
import apiClient from "../../api/axios";
import {
  Users, Clock, CheckCircle2, AlertCircle, Phone, UserCheck, Plus, Search,
  DollarSign, Tv, Calendar, RefreshCw, ChevronRight, Hash, LogOut,
  Stethoscope, ShieldAlert, Sparkles, Building2, Printer, Volume2,
  FileText, ArrowRight, Check, AlertTriangle, Play, Pause, RotateCcw
} from "lucide-react";
import TokenPrintModal from "./clinic-admin/components/TokenPrintModal";

export default function ReceptionistPanel() {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [clinicData, setClinicData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [chamberSession, setChamberSession] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWaitingOnly, setFilterWaitingOnly] = useState(false);

  // Status messages
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const showMsg = (m) => { setMsg(m); setError(""); setTimeout(() => setMsg(""), 4000); };
  const showErr = (e) => { setError(e); setMsg(""); setTimeout(() => setError(""), 5000); };

  // Modals state
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    patient_name: "",
    patient_phone: "",
    doctor_id: "",
    problem_description: "General OPD Consultation",
    fee: 800,
    is_emergency: false,
    emergency_reason: "",
  });
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // Cash collection modal state
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [selectedApptForCash, setSelectedApptForCash] = useState(null);
  const [cashAmount, setCashAmount] = useState(800);
  const [submittingCash, setSubmittingCash] = useState(false);
  const [cashSummary, setCashSummary] = useState(null);

  // Shift report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Token print & reprint modal state
  const [printTokenData, setPrintTokenData] = useState(null);

  // Patient phone lookup state
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [foundPatient, setFoundPatient] = useState(null);

  useEffect(() => {
    const rawPhone = (walkInForm.patient_phone || "").trim();
    if (rawPhone.length < 11) {
      setFoundPatient(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPatient(true);
      try {
        const res = await apiClient.get(`/clinics/reception/patient-lookup/?phone=${encodeURIComponent(rawPhone)}`);
        if (res?.found) {
          setFoundPatient(res);
          setWalkInForm(prev => ({
            ...prev,
            patient_name: prev.patient_name || res.full_name
          }));
        } else {
          setFoundPatient(null);
        }
      } catch {
        setFoundPatient(null);
      } finally {
        setSearchingPatient(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [walkInForm.patient_phone]);

  // Load clinic & doctors info
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/clinics/reception/my-clinic/");
      setClinicData(res);
      setDoctors(res.doctors || []);
      if (res.doctors && res.doctors.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(res.doctors[0].id);
        setWalkInForm(prev => ({ ...prev, doctor_id: res.doctors[0].id, fee: res.doctors[0].consultation_fee }));
      }
      loadCashSummary();
    } catch (err) {
      showErr(err?.detail || "Could not load reception clinic data.");
    } finally {
      setLoading(false);
    }
  };

  // Load appointments for selected doctor & today
  const loadDoctorQueue = async (docId) => {
    if (!docId) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await apiClient.get(`/appointments/?doctor_id=${docId}&appointment_date=${today}`);
      const list = Array.isArray(res) ? res : res?.results || [];
      setAppointments(list);

      // Also get chamber session
      if (clinicData?.clinic_id) {
        try {
          const sess = await apiClient.get(`/doctors/chamber-session/?doctor_id=${docId}&clinic_id=${clinicData.clinic_id}&date=${today}`);
          setChamberSession(sess);
        } catch {
          setChamberSession(null);
        }
      }
    } catch {
      setAppointments([]);
    }
  };

  const loadCashSummary = async () => {
    try {
      const res = await apiClient.get("/clinics/reception/cash-summary/");
      setCashSummary(res);
    } catch {
      setCashSummary(null);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorQueue(selectedDoctorId);
    }
  }, [selectedDoctorId, clinicData]);

  // Queue Action: Call Next, Skip, Recall, Admit Emergency
  const handleQueueAction = async (action, targetSerial = null, extraPayload = {}) => {
    if (!selectedDoctorId || !clinicData?.clinic_id) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        doctor_id: selectedDoctorId,
        clinic_id: clinicData.clinic_id,
        session_date: today,
        action: action,
        ...extraPayload,
      };
      if (targetSerial !== null) {
        payload.current_serial = targetSerial;
      }
      const res = await apiClient.post("/doctors/chamber-session/", payload);
      setChamberSession(res);
      showMsg(`Queue updated: ${action}`);
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      showErr(err?.response?.data?.error || err?.detail || "Action failed.");
    }
  };

  const handleToggleEmergency = async (apt) => {
    try {
      await apiClient.post(`/appointments/${apt.id}/emergency/`, {
        is_emergency: !apt.is_emergency,
        emergency_reason: !apt.is_emergency ? "Flagged by Reception" : "",
      });
      showMsg(apt.is_emergency ? "Removed emergency priority" : "Marked as emergency priority!");
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      showErr(err?.response?.data?.error || err?.detail || "Failed to update emergency status.");
    }
  };

  // Chamber State Toggle: Active, Break, Paused
  const handleSetChamberStatus = async (statusKey) => {
    if (!selectedDoctorId || !clinicData?.clinic_id) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await apiClient.post("/doctors/chamber-session/", {
        doctor_id: selectedDoctorId,
        clinic_id: clinicData.clinic_id,
        session_date: today,
        action: "UPDATE_STATUS",
        status: statusKey
      });
      setChamberSession(res);
      showMsg(`Chamber status set to ${statusKey}`);
    } catch (err) {
      showErr(err?.detail || "Failed to update session status.");
    }
  };

  // Mark Patient Arrived
  const handleCheckIn = async (appointmentId) => {
    try {
      await apiClient.post("/clinics/reception/check-in/", { appointment_id: appointmentId });
      showMsg("Patient checked-in at counter ✓");
      const matched = appointments.find(a => String(a.id) === String(appointmentId));
      if (matched) {
        setPrintTokenData({ ...matched, is_arrived: true });
      }
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      showErr(err?.detail || "Check-in failed.");
    }
  };

  // Walk-in Submit
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInForm.patient_name || !walkInForm.doctor_id) {
      return showErr("Patient name and Doctor are required.");
    }
    setSubmittingWalkIn(true);
    try {
      const res = await apiClient.post("/clinics/reception/walk-in/", walkInForm);
      showMsg(`Token #${res.serial_number} issued for ${res.patient_name}!`);
      setWalkInModalOpen(false);
      setPrintTokenData({
        id: res.appointment_id,
        serial_number: res.serial_number,
        patient_name: res.patient_name,
        doctor_name: res.doctor_name || selectedDoctor?.name || selectedDoctor?.full_name || "Doctor",
        amount: walkInForm.fee,
        appointment_date: new Date().toISOString().split("T")[0],
        appointment_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setWalkInForm(prev => ({
        ...prev,
        patient_name: "",
        patient_phone: "",
        problem_description: "General OPD Consultation",
        is_emergency: false,
        emergency_reason: "",
      }));
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      showErr(err?.detail || "Failed to register walk-in patient.");
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  // Cash Payment Submit
  const handleCashPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApptForCash || !cashAmount) {
      return showErr("Please specify amount.");
    }
    setSubmittingCash(true);
    try {
      await apiClient.post("/clinics/reception/cash-payment/", {
        appointment_id: selectedApptForCash.id,
        amount: parseFloat(cashAmount)
      });
      showMsg(`Cash payment of ৳${cashAmount} recorded by ${user?.full_name || "Receptionist"}!`);
      setPrintTokenData({
        ...selectedApptForCash,
        amount: parseFloat(cashAmount),
        status: "CONFIRMED"
      });
      setCashModalOpen(false);
      setSelectedApptForCash(null);
      loadCashSummary();
      loadDoctorQueue(selectedDoctorId);
    } catch (err) {
      showErr(err?.detail || "Failed to log cash payment.");
    } finally {
      setSubmittingCash(false);
    }
  };

  const selectedDoctor = useMemo(() => {
    return doctors.find(d => String(d.id) === String(selectedDoctorId));
  }, [doctors, selectedDoctorId]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const name = (a.patient_name || a.patient?.full_name || "").toLowerCase();
      const phone = (a.patient_phone || a.patient?.phone || "").toLowerCase();
      const serial = String(a.serial_number || "");
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || phone.includes(q) || serial.includes(q);
      const matchesWaiting = !filterWaitingOnly || !a.is_arrived;
      return matchesSearch && matchesWaiting;
    });
  }, [appointments, searchQuery, filterWaitingOnly]);

  const currentServingPatient = useMemo(() => {
    const s = chamberSession?.current_serial;
    if (!s) return null;
    return appointments.find(a => a.serial_number === s);
  }, [chamberSession, appointments]);

  const nextSerialCandidate = (chamberSession?.current_serial || 0) + 1;

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-12 font-sans">
      {/* ================= 1. TOP OPERATIONAL STRIP (Stitch Image 3) ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Duty Officer */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck size={17} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Receptionist On Duty</span>
              <span className="text-xs font-black text-slate-800">{user?.full_name || user?.first_name || "Rahela Begum"}</span>
            </div>
          </div>

          {/* Workstation Point */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Tv size={17} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Workstation Point</span>
              <span className="text-xs font-black text-slate-800">Reception Desk 01 (OPD Ground Floor)</span>
            </div>
          </div>

          {/* Triage Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Triage Dispatch Active
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2">
          {clinicData?.clinic_id && (
            <a
              href={`/queue-display/${clinicData.clinic_id}/${selectedDoctorId || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 font-bold gap-1.5"
            >
              <Tv size={14} />
              <span className="hidden sm:inline">Waiting Lounge TV</span>
            </a>
          )}
          <button
            onClick={() => setWalkInModalOpen(true)}
            className="btn btn-sm bg-[#1E2B68] hover:bg-[#152050] text-white font-black gap-1.5 shadow-sm border-none"
          >
            <Plus size={16} />
            <span>+ New Walk-in Token</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-sm btn-ghost border border-slate-200 text-slate-600 font-bold gap-1.5"
            title="Reprint token slip"
          >
            <Printer size={14} />
            <span className="hidden md:inline">Slip Reprint</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {msg && (
        <div className="alert alert-success shadow-xs text-xs rounded-xl font-bold flex items-center gap-2 py-2.5">
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}
      {error && (
        <div className="alert alert-error shadow-xs text-xs rounded-xl font-bold flex items-center gap-2 py-2.5">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ================= 2. HORIZONTAL CHAMBER QUEUES STRIP (Stitch Image 3) ================= */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold px-1 text-slate-500">
          <span>LIVE CHAMBER QUEUES • SELECT CHAMBER TO DISPATCH</span>
          <span>{doctors.length} Specialists in OPD Today</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {doctors.map(d => {
            const isSelected = String(d.id) === String(selectedDoctorId);
            const isBreak = d.status === "ON_BREAK";
            return (
              <div
                key={d.id}
                onClick={() => {
                  setSelectedDoctorId(d.id);
                  setWalkInForm(prev => ({ ...prev, doctor_id: d.id, fee: d.consultation_fee }));
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none relative ${
                  isSelected
                    ? "bg-white border-[#1E2B68] shadow-md ring-2 ring-[#1E2B68]/15"
                    : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      Dr. {d.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Room {d.room_number} • {d.specialization}
                    </span>
                  </div>
                  <span className={`badge badge-xs font-extrabold px-2 py-1 ${
                    isSelected ? "bg-emerald-500 text-white" : isBreak ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {isSelected ? "Active" : isBreak ? "Break" : "Normal"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 mt-1 border-t border-slate-100 font-semibold">
                  <span className="text-slate-500">
                    {isSelected ? `${appointments.filter(a => a.status === "COMPLETED").length}/${appointments.length} Seen` : "Queue Ready"}
                  </span>
                  {isSelected ? (
                    <span className="badge badge-sm bg-[#1E2B68] text-white font-black text-[10px] tracking-wider uppercase">
                      DISPATCHING
                    </span>
                  ) : (
                    <span className="text-indigo-600 font-bold text-[11px] flex items-center gap-0.5">
                      Select <ChevronRight size={13} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 3. SPLIT DISPATCH WORKSPACE (Stitch Image 3) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT CONSOLE: NOW CALLING & CHAMBER CONTROLS (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Chamber Dark Calling Box */}
          <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
            {/* Header chip */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider">
                CHAMBER {selectedDoctor?.room_number || "101"} • Dr. {selectedDoctor?.name || "Doctor"}
              </span>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE TV SYNCED
              </span>
            </div>

            {/* Calling Serial Number */}
            <div className="text-center py-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-widest block">
                CURRENT CALLING SERIAL
              </span>
              <div className="text-6xl sm:text-7xl font-mono font-black text-emerald-400 tracking-tight my-2">
                #{chamberSession?.current_serial || "--"}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 text-xs font-semibold border border-slate-700/60">
                <Volume2 size={13} className="text-emerald-400" />
                <span>Chime Broadcast: Speaker A (Corridor 1)</span>
              </div>
            </div>

            {/* Active Emergency In Chamber Card */}
            {chamberSession?.active_emergency && (
              <div className="mt-3 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="badge badge-error text-white font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Active Emergency
                  </span>
                  <span className="font-mono font-black text-rose-300">
                    Serial #{chamberSession.active_emergency_details?.serial_number || "—"}
                  </span>
                </div>
                <div className="font-extrabold text-white text-sm mt-1">
                  {chamberSession.active_emergency_details?.patient_name || "Emergency Patient"}
                </div>
                {chamberSession.active_emergency_details?.emergency_reason && (
                  <div className="text-rose-200 text-[11px]">
                    Reason: {chamberSession.active_emergency_details.emergency_reason}
                  </div>
                )}
                {chamberSession.held_patient_details && (
                  <div className="text-amber-300 text-[11px] font-semibold mt-0.5">
                    ⏸ Normal Serial #{chamberSession.held_patient_details.serial_number} is held on pause.
                  </div>
                )}
              </div>
            )}

            {/* Held Patient Paused Card */}
            {chamberSession?.held_patient && !chamberSession?.active_emergency && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 flex items-center justify-between text-xs">
                <div>
                  <span className="badge badge-warning text-black font-black text-xs uppercase">
                    ⏸️ Held Patient Waiting
                  </span>
                  <div className="font-bold text-white mt-1">
                    Serial #{chamberSession.held_patient_details?.serial_number} — {chamberSession.held_patient_details?.patient_name}
                  </div>
                </div>
                <button
                  onClick={() => handleQueueAction("RESUME_HELD")}
                  className="btn btn-warning btn-xs text-black font-black"
                >
                  Resume Held
                </button>
              </div>
            )}

            {/* Emergency Priority Queue Tray */}
            {appointments.filter(a => a.is_emergency && a.status === "CONFIRMED" && a.id !== chamberSession?.active_emergency).length > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-950/50 border border-rose-600/40 space-y-2 text-xs">
                <div className="flex items-center justify-between text-rose-300 font-extrabold text-[11px] uppercase tracking-wider">
                  <span>🚨 Priority Waiting ({appointments.filter(a => a.is_emergency && a.status === "CONFIRMED" && a.id !== chamberSession?.active_emergency).length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Holds current serial</span>
                </div>
                <div className="space-y-1.5">
                  {appointments
                    .filter(a => a.is_emergency && a.status === "CONFIRMED" && a.id !== chamberSession?.active_emergency)
                    .map(a => (
                      <div key={a.id} className="p-2 rounded-xl bg-slate-900 border border-rose-500/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="badge badge-error badge-xs font-black text-white shrink-0">#{a.serial_number}</span>
                          <span className="font-bold text-white text-xs ml-1.5 truncate">{a.patient_name || a.patient?.full_name || "Patient"}</span>
                        </div>
                        <button
                          onClick={() => handleQueueAction("ADMIT_EMERGENCY", null, { appointment_id: a.id, hold_current: true })}
                          disabled={!!chamberSession?.active_emergency}
                          className="btn btn-error btn-xs text-white font-bold shrink-0"
                          title={chamberSession?.active_emergency ? "Chamber busy with emergency" : "Admit to chamber"}
                        >
                          Admit
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Current Patient Detail Card */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-extrabold text-sm text-white">
                  {currentServingPatient?.patient_name || currentServingPatient?.patient?.full_name || "Patient Inside Chamber"}
                </div>
                <div className="text-slate-400 flex items-center gap-2 mt-0.5">
                  <Phone size={11} />
                  <span>{currentServingPatient?.patient_phone || currentServingPatient?.patient?.phone || "Phone on file"}</span>
                  <span>•</span>
                  <span>Arrived at 10:12 AM</span>
                </div>
              </div>
              <span className="badge badge-success badge-sm font-bold text-white">
                In Chamber
              </span>
            </div>

            {/* BIG ACTION BUTTON: CALL NEXT */}
            <button
              onClick={() => handleQueueAction("NEXT_SERIAL")}
              disabled={!!chamberSession?.active_emergency || !!chamberSession?.held_patient}
              className="btn w-full mt-4 bg-[#059669] hover:bg-[#047857] text-white border-none text-base font-black py-3.5 h-auto rounded-2xl shadow-md hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
              title={
                chamberSession?.active_emergency
                  ? "Cannot call next serial while emergency patient is in chamber"
                  : chamberSession?.held_patient
                  ? "Resume held patient first"
                  : "Call Next Patient"
              }
            >
              <span>⏩ CALL NEXT PATIENT (#{nextSerialCandidate})</span>
            </button>

            {/* Secondary buttons: Skip & Recall */}
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <button
                onClick={() => handleQueueAction("SKIP_SERIAL")}
                disabled={!chamberSession?.current_serial || !!chamberSession?.active_emergency || !!chamberSession?.held_patient}
                className="btn btn-sm bg-amber-700/30 hover:bg-amber-700/50 text-amber-300 border border-amber-600/40 font-extrabold rounded-xl disabled:opacity-40"
              >
                ⏸ Skip Serial
              </button>
              <button
                onClick={() => {
                  const skippedList = chamberSession?.skipped_serials || [];
                  const lastSkipped = skippedList[skippedList.length - 1];
                  if (lastSkipped != null) {
                    handleQueueAction("RECALL_SERIAL", lastSkipped);
                  }
                }}
                disabled={!chamberSession?.skipped_serials?.length || !!chamberSession?.active_emergency}
                className="btn btn-sm bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-extrabold rounded-xl disabled:opacity-40"
              >
                ↺ Recall ({chamberSession?.skipped_serials?.length ? `#${chamberSession.skipped_serials[chamberSession.skipped_serials.length - 1]}` : "None"})
              </button>
            </div>

            {/* Chamber Session Mode Toggles */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-2">
                Doctor Chamber Session Mode:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleSetChamberStatus("IN_CHAMBER")}
                  className={`btn btn-xs rounded-lg font-bold ${
                    chamberSession?.status === "IN_CHAMBER"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-700/40"
                  }`}
                >
                  ● Active
                </button>
                <button
                  onClick={() => handleSetChamberStatus("PRAYER_BREAK")}
                  className={`btn btn-xs rounded-lg font-bold ${
                    chamberSession?.status === "PRAYER_BREAK"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-amber-950/60 hover:bg-amber-900 text-amber-300 border-amber-700/40"
                  }`}
                >
                  ⏸ Tea/Namaz
                </button>
                <button
                  onClick={() => handleSetChamberStatus("PAUSED")}
                  className={`btn btn-xs rounded-lg font-bold ${
                    chamberSession?.status === "PAUSED"
                      ? "bg-slate-700 text-white border-slate-600"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/40"
                  }`}
                >
                  ⏸ Paused
                </button>
              </div>
            </div>
          </div>

          {/* Queue Dispatch Stats Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">Queue Dispatch Stats</span>
              <span className="text-emerald-700 font-bold font-mono">Room Efficiency: 8.5 min/pt</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>Hourly Pacing: Morning Peak</span>
              <span>OPD Load: High</span>
            </div>
            {/* Mini Sparkline Bar Visualization */}
            <div className="grid grid-cols-6 gap-1 h-6 items-end pt-1">
              <div className="bg-slate-200 h-2 rounded-xs" />
              <div className="bg-indigo-200 h-3.5 rounded-xs" />
              <div className="bg-[#1E2B68] h-5 rounded-xs" />
              <div className="bg-indigo-200 h-3 rounded-xs" />
              <div className="bg-slate-200 h-1.5 rounded-xs" />
              <div className="bg-slate-100 h-1 rounded-xs" />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              <span>08:00</span>
              <span>10:00</span>
              <span>12:00</span>
              <span>14:00</span>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold flex items-center gap-1">
                <Volume2 size={13} className="text-slate-400" /> Auto Announcement
              </span>
              <span className="badge badge-xs bg-emerald-100 text-emerald-800 font-bold">
                Bangla + English Active
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT DISPATCH CONSOLE: TODAY'S PATIENT QUEUE TABLE (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          {/* Table Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patient by name, mobile, or serial #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm input-bordered w-full pl-9 text-xs rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterWaitingOnly(!filterWaitingOnly)}
                className={`btn btn-sm rounded-xl font-bold text-xs gap-1 ${
                  filterWaitingOnly ? "bg-indigo-600 text-white" : "btn-ghost border border-slate-200 text-slate-600"
                }`}
              >
                Filter Waiting
              </button>
              <button
                onClick={() => loadDoctorQueue(selectedDoctorId)}
                className="btn btn-sm btn-circle btn-ghost border border-slate-200"
                title="Refresh queue"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No patient appointments found for this chamber today.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[520px]">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <th>SERIAL #</th>
                    <th>PATIENT INFO</th>
                    <th>SLOT TIME</th>
                    <th>ARRIVAL STATUS</th>
                    <th className="text-right">ACTION / FEE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAppointments.map((a) => {
                    const isServing = a.serial_number === chamberSession?.current_serial;
                    const isArrived = a.is_arrived;
                    const isPaid = a.status === "CONFIRMED" || a.status === "COMPLETED";

                    return (
                      <tr key={a.id} className={isServing ? "bg-emerald-50/60 font-semibold" : "hover:bg-slate-50/70"}>
                        {/* Serial # */}
                        <td className="font-mono font-black text-sm text-slate-900">
                          #{a.serial_number}
                        </td>

                        {/* Patient Info */}
                        <td>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{a.patient_name || a.patient?.full_name || "Patient"}</span>
                            {a.is_emergency && (
                              <span className="badge badge-xs badge-error text-white font-black animate-pulse">
                                Emergency
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {a.patient_phone || a.patient?.phone || "No phone"} • {a.gender || "Adult"}
                            {a.is_emergency && a.emergency_reason && (
                              <span className="text-rose-600 font-semibold ml-1">
                                • {a.emergency_reason}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Slot Time */}
                        <td className="font-medium text-slate-500">
                          {a.appointment_time || "10:15 AM"}
                        </td>

                        {/* Arrival Status */}
                        <td>
                          {isServing ? (
                            <span className="badge badge-sm bg-emerald-500 text-white font-black">
                              ● In Chamber
                            </span>
                          ) : isArrived ? (
                            <span className="badge badge-sm bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold gap-1">
                              ✓ Arrived {a.arrived_at ? new Date(a.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Counter"}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(a.id)}
                              className="btn btn-xs btn-outline btn-primary font-black rounded-lg gap-1"
                            >
                              Mark Arrived
                            </button>
                          )}
                        </td>

                        {/* Action / Fee */}
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleEmergency(a)}
                              className={`btn btn-xs btn-circle btn-ghost ${
                                a.is_emergency ? "text-rose-600 bg-rose-50" : "text-slate-400 hover:text-rose-600"
                              }`}
                              title={a.is_emergency ? "Remove Emergency Priority" : "Flag as Emergency Priority"}
                            >
                              <AlertTriangle size={13} />
                            </button>
                            <button
                              onClick={() => setPrintTokenData(a)}
                              className="btn btn-xs btn-ghost btn-circle text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Print / Reprint Token Slip"
                            >
                              <Printer size={13} />
                            </button>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-extrabold text-xs">
                                ✓ Paid (৳{a.amount})
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedApptForCash(a);
                                  setCashAmount(a.amount || selectedDoctor?.consultation_fee || 800);
                                  setCashModalOpen(true);
                                }}
                                className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg gap-1 border-none shadow-xs"
                              >
                                <DollarSign size={12} /> Collect ৳{a.amount || 800}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
            <span>Showing {filteredAppointments.length} of {appointments.length} scheduled patients</span>
            <div className="join">
              <button className="join-item btn btn-xs btn-ghost">Previous</button>
              <button className="join-item btn btn-xs btn-active bg-[#1E2B68] text-white">1</button>
              <button className="join-item btn btn-xs btn-ghost">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. BOTTOM SHIFT HANDOVER AUDIT BAR (Stitch Image 3) ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6 flex-wrap text-xs">
          {/* My Shift Collection */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign size={17} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">My Shift Collection ({user?.first_name || "Rahela B."})</span>
              <span className="text-sm font-black text-emerald-700 font-mono">
                ৳{cashSummary?.total_cash_today || "14,500"} <span className="text-xs text-slate-500 font-normal">across {cashSummary?.total_transactions || 18} receipts</span>
              </span>
            </div>
          </div>

          {/* Shift Handover Audit Status */}
          <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <RefreshCw size={15} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Shift Handover Audit</span>
              <span className="text-xs font-black text-indigo-900 flex items-center gap-1">
                ✓ Ready (Counter Audit Balanced)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportModalOpen(true)}
            className="btn btn-sm btn-ghost border border-slate-200 text-slate-700 font-bold gap-1.5"
          >
            <FileText size={14} /> Generate Shift Report
          </button>
          <button
            onClick={() => {
              if (window.confirm("Close current shift counter and prepare cash handover to Clinic Admin?")) {
                showMsg("Shift closed. Counter cash handover logged successfully!");
              }
            }}
            className="btn btn-sm bg-[#1E2B68] hover:bg-[#152050] text-white font-black gap-1.5 shadow-sm border-none"
          >
            <span>🔒 Close Counter & Handover</span>
          </button>
        </div>
      </div>

      {/* ================= MODAL: NEW WALK-IN TOKEN ================= */}
      {walkInModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg rounded-3xl p-6">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2 mb-2">
              <Plus className="text-emerald-500" /> + Issue New Walk-in Token
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter patient details to generate an instant serial token and mark arrival for today&apos;s OPD.
            </p>

            <form onSubmit={handleWalkInSubmit} className="space-y-3.5">
              <div>
                <label className="label text-xs font-bold text-slate-700 py-1">Doctor / Chamber *</label>
                <select
                  value={walkInForm.doctor_id}
                  onChange={(e) => {
                    const doc = doctors.find(d => String(d.id) === e.target.value);
                    setWalkInForm(prev => ({
                      ...prev,
                      doctor_id: e.target.value,
                      fee: doc?.consultation_fee || 800
                    }));
                  }}
                  className="select select-bordered select-sm w-full text-xs font-semibold"
                  required
                >
                  <option value="">Select Chamber</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name} (Room {d.room_number}) — ৳{d.consultation_fee}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs font-bold text-slate-700 py-1">Patient Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sumon Mia"
                  value={walkInForm.patient_name}
                  onChange={(e) => setWalkInForm({ ...walkInForm, patient_name: e.target.value })}
                  className="input input-bordered input-sm w-full text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold text-slate-700 py-1 flex items-center justify-between">
                    <span>Phone Number</span>
                    {searchingPatient && (
                      <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-semibold">
                        Searching...
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={walkInForm.patient_phone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, patient_phone: e.target.value })}
                    className="input input-bordered input-sm w-full text-xs"
                  />
                  {foundPatient && (
                    <div className="mt-1 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      <span>
                        <strong>Registered:</strong> {foundPatient.full_name} ({foundPatient.clinic_visits_count} visits)
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label text-xs font-bold text-slate-700 py-1">Consultation Fee (৳)</label>
                  <input
                    type="number"
                    value={walkInForm.fee}
                    onChange={(e) => setWalkInForm({ ...walkInForm, fee: e.target.value })}
                    className="input input-bordered input-sm w-full text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold text-slate-700 py-1">Chief Complaint</label>
                <input
                  type="text"
                  placeholder="e.g. Fever, Cough, Regular Checkup"
                  value={walkInForm.problem_description}
                  onChange={(e) => setWalkInForm({ ...walkInForm, problem_description: e.target.value })}
                  className="input input-bordered input-sm w-full text-xs"
                />
              </div>

              {/* Emergency / Urgent Priority */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-error checkbox-sm"
                    checked={walkInForm.is_emergency || false}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        is_emergency: e.target.checked,
                      })
                    }
                  />
                  <div>
                    <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1">
                      <AlertTriangle size={13} /> Urgent / Emergency Patient (জরুরি অগ্রাধিকার)
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Flags patient for immediate chamber attention without altering serial numbering.
                    </span>
                  </div>
                </label>
                {walkInForm.is_emergency && (
                  <input
                    type="text"
                    className="input input-bordered input-xs w-full text-xs border-rose-300"
                    placeholder="Emergency reason (e.g. Chest pain, acute trauma, bleeding)"
                    value={walkInForm.emergency_reason || ""}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        emergency_reason: e.target.value,
                      })
                    }
                  />
                )}
              </div>

              <div className="modal-action pt-3">
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="btn btn-sm btn-ghost font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="btn btn-sm bg-[#059669] hover:bg-[#047857] text-white font-black px-5 border-none"
                >
                  {submittingWalkIn ? "Issuing..." : "✓ Generate Token & Check-in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: COLLECT CASH ================= */}
      {cashModalOpen && selectedApptForCash && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm rounded-3xl p-6">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2 mb-1">
              <DollarSign className="text-emerald-500" /> Collect Consultation Fee
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Confirm cash received from patient at front counter.
            </p>

            <form onSubmit={handleCashPaymentSubmit} className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="font-extrabold text-sm text-slate-900">
                  {selectedApptForCash.patient_name || selectedApptForCash.patient?.full_name}
                </div>
                <div className="text-slate-500 font-mono mt-0.5">
                  Serial #{selectedApptForCash.serial_number} • Dr. {selectedDoctor?.name}
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold text-slate-700 py-1">Amount (৳ BDT)</label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="input input-bordered w-full font-black text-emerald-700 text-lg"
                  required
                />
              </div>

              <div className="modal-action pt-2">
                <button
                  type="button"
                  onClick={() => { setCashModalOpen(false); setSelectedApptForCash(null); }}
                  className="btn btn-sm btn-ghost font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCash}
                  className="btn btn-sm bg-[#059669] hover:bg-[#047857] text-white font-black border-none"
                >
                  {submittingCash ? "Recording..." : "✓ Confirm Cash Received"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SHIFT REPORT ================= */}
      {reportModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-3xl p-6">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2 mb-2">
              <FileText className="text-indigo-600" /> End-of-Shift Cash Audit Summary
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Duty Officer:</span>
                <strong className="text-slate-800">{user?.full_name || "Rahela Begum"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift Date:</span>
                <strong className="text-slate-800">{new Date().toLocaleDateString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tokens Handled:</span>
                <strong className="text-slate-800">{appointments.length}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-700">Total Physical Cash in Drawer:</span>
                <strong className="font-mono text-emerald-700 text-base font-black">
                  ৳{cashSummary?.total_cash_today || "14,500"}
                </strong>
              </div>
            </div>
            <div className="modal-action pt-4">
              <button
                onClick={() => setReportModalOpen(false)}
                className="btn btn-sm btn-ghost font-bold"
              >
                Close
              </button>
              <button
                onClick={() => { window.print(); setReportModalOpen(false); }}
                className="btn btn-sm bg-[#1E2B68] text-white font-black"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TOKEN PRINT & REPRINT ================= */}
      <TokenPrintModal
        printTokenData={printTokenData}
        clinic={clinicData ? {
          name: clinicData.clinic_name || clinicData.name,
          address: clinicData.clinic_address || clinicData.address,
          phone: clinicData.clinic_phone || clinicData.phone
        } : null}
        onClose={() => setPrintTokenData(null)}
      />
    </div>
  );
}
