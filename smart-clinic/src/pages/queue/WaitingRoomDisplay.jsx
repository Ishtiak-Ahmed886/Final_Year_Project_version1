import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router";
import apiClient from "../../api/axios";
import {
  Volume2, VolumeX, Maximize2, Minimize2, Stethoscope, Clock,
  MapPin, AlertTriangle, Users, FastForward, CheckCircle2,
  Building2, Sparkles, ArrowLeft
} from "lucide-react";

// Synthesize pleasant two-tone chime via Web Audio API
const playChimeSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Ding - Dong harmony
    playTone(587.33, 0.0, 0.4); // D5
    playTone(880.00, 0.2, 0.6); // A5
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

export default function WaitingRoomDisplay() {
  const { clinicId: paramClinicId, doctorId: paramDoctorId } = useParams();

  const [clinicId, setClinicId] = useState(() => {
    return paramClinicId || localStorage.getItem("kiosk_clinic_id") || "";
  });
  const [doctorId, setDoctorId] = useState(() => {
    return paramDoctorId || localStorage.getItem("kiosk_doctor_id") || "";
  });
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [session, setSession] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastAnnouncedSerial, setLastAnnouncedSerial] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  const prevSerialRef = useRef(null);

  // Sync state changes with localStorage for instant reboot recovery
  const handleClinicChange = (id) => {
    setClinicId(id);
    localStorage.setItem("kiosk_clinic_id", id);
  };

  const handleDoctorChange = (id) => {
    setDoctorId(id);
    localStorage.setItem("kiosk_doctor_id", id);
  };

  // Fetch clinics and doctors for selector if not in URL params
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [cRes, dRes] = await Promise.all([
          apiClient.get("/clinics/").catch(() => []),
          apiClient.get("/doctors/").catch(() => []),
        ]);
        const cList = cRes.results || cRes || [];
        const dList = dRes.results || dRes || [];
        setClinics(cList);
        setDoctors(dList);

        if (!clinicId && cList.length > 0) {
          const initialCId = cList[0].id;
          setClinicId(initialCId);
          localStorage.setItem("kiosk_clinic_id", initialCId);
        }
        if (!doctorId && dList.length > 0) {
          const initialDId = dList[0].id;
          setDoctorId(initialDId);
          localStorage.setItem("kiosk_doctor_id", initialDId);
        }
      } catch {}
    };
    loadCatalogs();
  }, []);


  // Poll chamber session & today's appointments
  useEffect(() => {
    if (!clinicId || !doctorId) return;

    const fetchQueueData = async () => {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const res = await apiClient.get(
          `/doctors/chamber-session/?doctor_id=${doctorId}&clinic_id=${clinicId}&date=${todayStr}`
        );
        setSession(res);
        setIsConnected(true);
        setLastSyncTime(new Date());

        // Fetch appointments for this doctor & clinic
        try {
          const aptRes = await apiClient.get(
            `/appointments/?doctor_id=${doctorId}&clinic_id=${clinicId}&appointment_date=${todayStr}`
          );
          setAppointments(aptRes.results || aptRes || []);
        } catch {}

        // Audio & Voice trigger on new serial
        if (res.current_serial > 0 && prevSerialRef.current !== null && res.current_serial !== prevSerialRef.current) {
          if (soundEnabled) playChimeSound();

          if (voiceEnabled && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const text = `Serial Number ${res.current_serial}. Please proceed to ${res.room_number || "doctor's chamber"}.`;
            const utter = new SpeechSynthesisUtterance(text);
            utter.rate = 0.9;
            utter.pitch = 1.05;
            window.speechSynthesis.speak(utter);
          }
          setLastAnnouncedSerial(res.current_serial);
        }
        prevSerialRef.current = res.current_serial;
      } catch (err) {
        console.error("Queue fetch error", err);
        setIsConnected(false);
      }
    };

    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000); // 5 sec live polling
    return () => clearInterval(interval);
  }, [clinicId, doctorId, soundEnabled, voiceEnabled]);


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "IN_CHAMBER":
        return { text: "IN CHAMBER / রোগী দেখা হচ্ছে", bg: "bg-emerald-500 text-white animate-pulse" };
      case "IN_TRANSIT":
        return { text: "IN TRANSIT / ডাক্তার পথে আছেন", bg: "bg-amber-500 text-black font-extrabold" };
      case "PRAYER_BREAK":
        return { text: "PRAYER BREAK / নামাজের বিরতি", bg: "bg-blue-600 text-white" };
      case "EMERGENCY":
        return { text: "EMERGENCY ROUND / জরুরী রাউন্ড", bg: "bg-rose-600 text-white animate-pulse" };
      case "PAUSED":
        return { text: "TEMPORARY BREAK / সাময়িক বিরতি", bg: "bg-purple-600 text-white" };
      case "ENDED":
        return { text: "SESSION COMPLETED / চেম্বার সমাপ্ত", bg: "bg-slate-700 text-white" };
      default:
        return { text: "NOT STARTED / শুরু হয়নি", bg: "bg-slate-600 text-white" };
    }
  };

  const currentSerial = session?.current_serial || 0;
  const currentPatient = appointments.find((a) => a.serial_number === currentSerial);
  const statusInfo = getStatusDisplay(session?.status);

  // Next 4 upcoming serials
  const upcomingSerials = appointments
    .filter((a) => a.serial_number > currentSerial && a.status !== "CANCELLED")
    .sort((a, b) => a.serial_number - b.serial_number)
    .slice(0, 4);

  // Skipped list
  const skippedList = session?.skipped_serials || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Bar / Header */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="btn btn-ghost btn-circle btn-sm text-slate-400 hover:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xl tracking-wide">
            <Building2 className="w-7 h-7" />
            <span>SMART CLINIC BD</span>
          </div>
          <span className="hidden sm:inline-block text-xs uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-bold border border-slate-700">
            Live Chamber TV Kiosk
          </span>
        </div>

        {/* Connection Heartbeat & Kiosk Indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`badge badge-sm font-black gap-1 text-[11px] px-2.5 py-1 ${
              isConnected
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`}></span>
            {isConnected ? "LIVE / সংযুক্ত" : "RECONNECTING... / সংযোগ বিচ্ছিন্ন"}
          </span>
        </div>

        {/* Doctor & Clinic Selectors (if not locked via route) */}
        {clinics.length > 0 && doctors.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={clinicId}
              onChange={(e) => handleClinicChange(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 border border-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>

            <select
              value={doctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 border border-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.full_name} ({d.qualification || "Consultant"})
                </option>
              ))}
            </select>
          </div>
        )}


        {/* Control toggles: Chime, Voice, Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChimeSound();
            }}
            className={`btn btn-sm rounded-xl border border-slate-700 gap-1.5 ${
              soundEnabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400"
            }`}
            title="Toggle Bell Chime"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="text-xs font-bold hidden md:inline">Chime</span>
          </button>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`btn btn-sm rounded-xl border border-slate-700 gap-1.5 ${
              voiceEnabled ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-slate-800 text-slate-400"
            }`}
            title="Toggle Voice Call Announcement"
          >
            <Sparkles size={16} />
            <span className="text-xs font-bold hidden md:inline">Voice Call</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn btn-sm rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            title="Full Screen Display Mode"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Broadcast Announcement Bar (Traffic delay, prayer pause, etc.) */}
      {(session?.delay_minutes > 0 || session?.announcement_note) && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-black py-3 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 text-sm md:text-base mx-auto animate-pulse">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <span>
              CHAMBER NOTICE:{" "}
              {session.delay_minutes > 0 && `Doctor is delayed by approximately ${session.delay_minutes} minutes. `}
              {session.announcement_note}
            </span>
          </div>
        </div>
      )}

      {/* Main Waiting Room Layout */}
      <main className="flex-1 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column (8 cols): Currently Called Mega Card & Doctor Banner */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          {/* Doctor Chamber Information Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                <Stethoscope size={18} />
                <span>Consultant Chamber</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                Dr. {session?.doctor_name || "Specialist Physician"}
              </h1>
              <p className="text-slate-400 text-sm font-medium">
                {session?.doctor_qualification || "MBBS, Specialist Practitioner"}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
              <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow ${statusInfo.bg}`}>
                {statusInfo.text}
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-700">
                <MapPin size={16} className="text-emerald-400" />
                <span>{session?.room_number || "Room 302, 3rd Floor"}</span>
              </div>
            </div>
          </div>

          {/* Huge Token / Serial Number Called Display */}
          <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-4 border-emerald-500/40 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden ring-4 ring-emerald-500/10">
            <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs uppercase px-3 py-1 rounded-full font-black tracking-widest animate-pulse">
              ● Active Serial Calling
            </div>

            <span className="text-sm md:text-base font-black tracking-widest text-slate-400 uppercase mb-2">
              Now Calling Into Chamber / এখন চেম্বারে আসুন
            </span>

            {/* Giant Number */}
            <div className="text-8xl sm:text-9xl md:text-[11rem] font-black tracking-tight text-white drop-shadow-[0_10px_35px_rgba(16,185,129,0.4)] my-2">
              <span className="text-emerald-400">#</span>
              {currentSerial > 0 ? currentSerial : "—"}
            </div>

            {/* Patient Name / Family member (if available) */}
            <div className="mt-4 bg-slate-800/80 border border-slate-700 px-6 py-3 rounded-2xl shadow-inner max-w-lg w-full">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Patient Name
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-white truncate">
                {currentPatient
                  ? currentPatient.family_member?.full_name ||
                    `${currentPatient.patient?.first_name} ${currentPatient.patient?.last_name}`
                  : currentSerial > 0
                  ? `Serial Holder #${currentSerial}`
                  : "Chamber session waiting to call"}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs md:text-sm text-slate-400 font-medium">
              <Clock size={16} className="text-emerald-400" />
              <span>
                Avg. consultation: {session?.estimated_mins_per_patient || 12} mins per patient
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Next In Line & Skipped Serials */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
          {/* Upcoming Serials Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-base uppercase tracking-wider">
                <FastForward size={18} />
                <span>Next in Line (পরবর্তী সিরিয়াল)</span>
              </div>
              <span className="badge bg-cyan-950 text-cyan-300 border-cyan-800 font-mono font-bold text-xs">
                {upcomingSerials.length} Next
              </span>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-around">
              {upcomingSerials.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No subsequent appointments scheduled for today.
                </div>
              ) : (
                upcomingSerials.map((apt, idx) => (
                  <div
                    key={apt.id}
                    className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-xl flex items-center justify-center border border-cyan-500/30">
                        #{apt.serial_number}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white truncate max-w-[150px]">
                          {apt.family_member?.full_name || `${apt.patient?.first_name} ${apt.patient?.last_name}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          {idx === 0 ? "👉 Up Next" : `${idx + 1} patients away`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs text-slate-300 font-bold bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800">
                      ~{(apt.serial_number - currentSerial) * (session?.estimated_mins_per_patient || 12)}m
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skipped / On Hold Serials Card */}
          {skippedList.length > 0 && (
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-3">
                <AlertTriangle size={15} />
                <span>On Hold / Skipped (পরে ডাকা হবে)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skippedList.map((sn) => (
                  <span
                    key={sn}
                    className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-sm border border-amber-500/40"
                  >
                    Serial #{sn}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                If your number was skipped, please contact reception desk.
              </p>
            </div>
          )}

          {/* Footer stats widget */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-400" />
              <span>Total Booked Today: <strong>{appointments.length}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 size={14} />
              <span>Live Synced</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Ticker / Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
        <div>
          {session?.clinic_name || "Smart Clinic Bangladesh"} • {session?.clinic_address || "Dhaka, Bangladesh"}
        </div>
        <div className="font-mono text-slate-500">
          Auto-updating in real-time • Powered by Smart Clinic Token System
        </div>
      </footer>
    </div>
  );
}
