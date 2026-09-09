import { useState, useEffect, useRef } from "react";
import apiClient from "../../api/axios";
import {
  Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle,
  Stethoscope, Award, BookOpen, Edit3, Save, X, Loader, MapPin,
  Building2, Send, Play, Pause, FastForward, Navigation, FileText, Plus, Trash2, Heart,
  FolderHeart, ExternalLink, RotateCcw, Tv, AlertTriangle, Printer, Sparkles,
  ShieldAlert, Check, Volume2, RefreshCw
} from "lucide-react";

// Bangladesh Standard Clinical Prescription Presets
const RX_PRESETS = [
  {
    id: "flu",
    name: "জ্বর ও সর্দি (Flu & Fever)",
    icon: "🌡️",
    diagnosis: "Acute Upper Respiratory Tract Infection (URTI) with Fever",
    tests: "CBC with ESR (if fever > 3 days)",
    advice: "পর্যাপ্ত বিশ্রাম নিন। প্রচুর কুসুম গরম পানি ও তরল খাবার খান। ১০১° এর বেশি জ্বর হলে কপালে জলপট্টি দিন।",
    vitals: { bp: "120/80", pulse: "78", temp: "101.2F", weight: "65kg", blood_sugar: "5.8" },
    medications: [
      { medication_name: "Tab. Napa Extra 500mg+65mg (Paracetamol + Caffeine)", dosage: "1 + 0 + 1", timing: "খাবারের পরে", duration: "৫ দিন", instructions: "জ্বর বা ব্যথায়" },
      { medication_name: "Tab. Fexo 120mg (Fexofenadine)", dosage: "0 + 0 + 1", timing: "খাবারের পরে", duration: "৭ দিন", instructions: "রাতে শোবার আগে" },
      { medication_name: "Cap. Seclo 20mg (Omeprazole)", dosage: "1 + 0 + 1", timing: "খাবারের ২০ মিনিট আগে", duration: "৭ দিন", instructions: "" }
    ]
  },
  {
    id: "gerd",
    name: "গ্যাস্ট্রিক ও বুকজ্বালা (Acidity & GERD)",
    icon: "🫄",
    diagnosis: "Gastroesophageal Reflux Disease (GERD) / Dyspepsia",
    tests: "USG of Whole Abdomen (if symptoms persist)",
    advice: "তেল, ঝাল, চর্বিযুক্ত ও ভাজাপোড়া খাবার পরিহার করুন। রাতের খাবার খাওয়ার অন্তত ২ ঘণ্টা পর ঘুমাতে যাবেন। ধূমপান ও চা-কফি পরিহার করুন।",
    vitals: { bp: "120/80", pulse: "74", temp: "98.4F", weight: "68kg", blood_sugar: "5.6" },
    medications: [
      { medication_name: "Tab. Sergel 20mg (Esomeprazole)", dosage: "1 + 0 + 1", timing: "খাবারের ২০ মিনিট আগে", duration: "১৪ দিন", instructions: "সকালে ও রাতে" },
      { medication_name: "Syr. Entacyd Plus 200ml (Magaldrate + Simethicone)", dosage: "২ চামচ করে দিনে ৩ বার", timing: "খাবারের ১ ঘণ্টা পর", duration: "৭ দিন", instructions: "গ্যাসের অস্বস্তিতে" },
      { medication_name: "Tab. Flatuna 40mg (Simethicone)", dosage: "1 + 1 + 1", timing: "খাবারের পরে", duration: "৫ দিন", instructions: "চিবিয়ে খেতে হবে" }
    ]
  },
  {
    id: "cough",
    name: "কাশি ও ব্রঙ্কাইটিস (Cough & Bronchitis)",
    icon: "🫁",
    diagnosis: "Acute Bronchitis / Dry Allergic Cough",
    tests: "Chest X-Ray P/A view, CBC with ESR",
    advice: "ঠান্ডা পানি ও আইসক্রিম পরিহার করুন। গরম পানির ভাপ নিন। ধুলাবালি এড়িয়ে চলুন ও বাইরে মাস্ক ব্যবহার করুন।",
    vitals: { bp: "125/82", pulse: "80", temp: "99.0F", weight: "62kg", blood_sugar: "5.4" },
    medications: [
      { medication_name: "Syr. Miracof 100ml (Butamirate Citrate)", dosage: "২ চামচ করে দিনে ৩ বার", timing: "খাবারের পরে", duration: "৭ দিন", instructions: "" },
      { medication_name: "Tab. Monas 10 10mg (Montelukast)", dosage: "0 + 0 + 1", timing: "খাবারের পরে", duration: "১৪ দিন", instructions: "রাতে শোবার আগে" },
      { medication_name: "Cap. Cef-3 200mg (Cefixime)", dosage: "1 + 0 + 1", timing: "খাবারের পরে", duration: "৭ দিন", instructions: "পুরো কোর্স শেষ করুন" },
      { medication_name: "Cap. Maxpro 20mg (Esomeprazole)", dosage: "1 + 0 + 1", timing: "খাবারের আগে", duration: "৭ দিন", instructions: "" }
    ]
  },
  {
    id: "htn",
    name: "উচ্চ রক্তচাপ (Hypertension)",
    icon: "🩺",
    diagnosis: "Essential Hypertension (Primary High Blood Pressure)",
    tests: "ECG, Serum Creatinine, Serum Electrolytes, Lipid Profile",
    advice: "খাবারে কাঁচা লবণ একেবারেই পরিহার করুন। প্রতিদিন অন্তত ৩০ মিনিট দ্রুত হাঁটার অভ্যাস করুন। মানসিক চাপ মুক্ত থাকুন ও নিয়মিত রক্তচাপ পরিমাপ করুন।",
    vitals: { bp: "145/95", pulse: "84", temp: "98.6F", weight: "74kg", blood_sugar: "6.0" },
    medications: [
      { medication_name: "Tab. Bislol 5mg (Bisoprolol Fumarate)", dosage: "1 + 0 + 0", timing: "সকালে খাবারের পর", duration: "১ মাস", instructions: "নিয়মিত চলবে" },
      { medication_name: "Tab. Cardipin 5mg (Amlodipine Besylate)", dosage: "0 + 0 + 1", timing: "রাতে খাবারের পর", duration: "১ মাস", instructions: "নিয়মিত চলবে" },
      { medication_name: "Tab. A-Card 75mg (Aspirin)", dosage: "0 + 1 + 0", timing: "দুপুরে ভরা পেটে", duration: "১ মাস", instructions: "" }
    ]
  },
  {
    id: "diabetes",
    name: "ডায়াবেটিস (Type 2 Diabetes)",
    icon: "🩸",
    diagnosis: "Type 2 Diabetes Mellitus (Uncontrolled)",
    tests: "HbA1c, Fasting Blood Sugar (FBS), 2 Hours After Breakfast (2HABF), Urine R/M/E",
    advice: "মিষ্টি ও চিনিজাতীয় খাবার সম্পূর্ণ বর্জন করুন। লাল আটার রুটি ও সবুজ শাকসবজি বেশি খান। প্রতিদিন নির্দিষ্ট সময়ে খাবার ও ওষুধ গ্রহণ করুন।",
    vitals: { bp: "130/85", pulse: "76", temp: "98.6F", weight: "72kg", blood_sugar: "9.2" },
    medications: [
      { medication_name: "Tab. Janumet 50mg/500mg (Sitagliptin + Metformin)", dosage: "1 + 0 + 1", timing: "খাবারের সাথে", duration: "১ মাস", instructions: "সকালে ও রাতে" },
      { medication_name: "Tab. Calbo-D (Calcium + Vit D3)", dosage: "0 + 1 + 0", timing: "দুপুরে খাবারের পর", duration: "১ মাস", instructions: "" }
    ]
  },
  {
    id: "pain",
    name: "কোমর ও জয়েন্ট ব্যথা (Back & Joint Pain)",
    icon: "🦴",
    diagnosis: "Lumbago / Mechanical Low Back Pain with Muscle Spasm",
    tests: "X-Ray Lumbosacral Spine (L/S Spine) A/P & Lateral views",
    advice: "ভারী জিনিস তোলা ও সামনে ঝুঁকে কাজ করা বন্ধ রাখুন। শক্ত ও সমান বিছানায় শয়ন করুন। ব্যথার জায়গায় গরম সেক দিন।",
    vitals: { bp: "120/80", pulse: "72", temp: "98.4F", weight: "70kg", blood_sugar: "5.5" },
    medications: [
      { medication_name: "Tab. Rolac 10mg (Ketorolac Tromethamine)", dosage: "1 + 0 + 1", timing: "খাবারের পরে", duration: "৫ দিন", instructions: "ভরা পেটে সেব্য" },
      { medication_name: "Cap. Seclo 20mg (Omeprazole)", dosage: "1 + 0 + 1", timing: "খাবারের আগে", duration: "৭ দিন", instructions: "" },
      { medication_name: "Tab. Coralcal-D (Coral Calcium + Vit D3)", dosage: "0 + 1 + 0", timing: "দুপুরে খাবারের পর", duration: "১ মাস", instructions: "" }
    ]
  }
];

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

  // Patient Stopwatch & Session Time Management
  const [patientSeconds, setPatientSeconds] = useState(0);

  // Delay & Announcement Modal
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [announcementNote, setAnnouncementNote] = useState("");
  const [broadcastingDelay, setBroadcastingDelay] = useState(false);

  // Rx Print Modal
  const [rxPrintModalOpen, setRxPrintModalOpen] = useState(false);
  const [printRxData, setPrintRxData] = useState(null);

  // E-Prescription Modal State
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [selectedRxApt, setSelectedRxApt] = useState(null);
  const [rxFormData, setRxFormData] = useState({
    diagnosis: "",
    vitals: { bp: "120/80", pulse: "72", weight: "", temp: "98.6F", blood_sugar: "" },
    diagnostic_tests: "",
    advice: "Drink plenty of water and rest.",
    medications: [
      { medication_name: "Tab. Napa 500mg (Paracetamol)", dosage: "1 + 0 + 1", timing: "After Meal", duration: "5 Days", instructions: "" }
    ],
  });
  const [medSearchQuery, setMedSearchQuery] = useState("");
  const [dgdaSearchResults, setDgdaSearchResults] = useState([]);
  const [submittingRx, setSubmittingRx] = useState(false);


  // Chamber Schedule State
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    clinic_id: "",
    day_of_week: 0,
    start_time: "10:00",
    end_time: "14:00",
    slot_duration_minutes: 15,
    max_patients: 20,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchSchedules = async () => {
    if (!profile?.id) return;
    try {
      const res = await apiClient.get(`/doctors/schedule/?doctor_id=${profile.id}`);
      setSchedules(res.results || res || []);
    } catch {}
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!profile?.id) return showErr("Doctor profile not found.");
    const targetClinic = scheduleForm.clinic_id || selectedClinicId;
    if (!targetClinic) return showErr("Please choose a clinic for this schedule.");

    setSavingSchedule(true);
    try {
      await apiClient.post("/doctors/schedule/", {
        doctor: profile.id,
        clinic: targetClinic,
        day_of_week: parseInt(scheduleForm.day_of_week, 10),
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        slot_duration_minutes: parseInt(scheduleForm.slot_duration_minutes, 10),
        max_patients: parseInt(scheduleForm.max_patients, 10),
      });
      showMsg("Chamber schedule updated successfully!");
      fetchSchedules();
    } catch {
      showErr("Failed to save chamber schedule.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await apiClient.delete(`/doctors/schedule/${id}/`);
      showMsg("Schedule deactivated.");
      fetchSchedules();
    } catch {
      showErr("Failed to deactivate schedule.");
    }
  };

  // Patient Health Vault Modal State (for Doctors)
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [vaultReports, setVaultReports] = useState([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [selectedVaultApt, setSelectedVaultApt] = useState(null);

  const openHealthVault = async (apt) => {
    setSelectedVaultApt(apt);
    setVaultModalOpen(true);
    setLoadingVault(true);
    try {
      const patientId = apt.patient?.id;
      const familyMemberId = apt.family_member?.id;
      const url = `/prescriptions/reports/?patient_id=${patientId}${familyMemberId ? `&family_member_id=${familyMemberId}` : ''}`;
      const res = await apiClient.get(url);
      setVaultReports(res.results || res || []);
    } catch {
      setVaultReports([]);
    } finally {
      setLoadingVault(false);
    }
  };

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
      fetchSchedules();
    }
  }, [profile, selectedClinicId]);

  // Live Patient Consultation Stopwatch Timer
  useEffect(() => {
    let timer;
    if (chamberSession?.status === "IN_CHAMBER" && (chamberSession?.current_serial || 0) > 0) {
      timer = setInterval(() => {
        setPatientSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setPatientSeconds(0);
    }
    return () => clearInterval(timer);
  }, [chamberSession?.status, chamberSession?.current_serial]);

  // Doctor Chamber Keyboard Hotkeys: [N] Next, [S] Skip & Hold, [P] Pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when user is typing inside an input or textarea or modal is open
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) ||
        rxModalOpen ||
        delayModalOpen ||
        rxPrintModalOpen ||
        tab !== "appointments"
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleChamberAction("NEXT_SERIAL");
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleChamberAction("SKIP_SERIAL");
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        const nextStat = chamberSession?.status === "PAUSED" ? "IN_CHAMBER" : "PAUSED";
        handleChamberAction("UPDATE_STATUS", nextStat);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chamberSession, profile, selectedClinicId, rxModalOpen, delayModalOpen, rxPrintModalOpen, tab]);

  const showMsg = (m) => { setActionMsg(m); setTimeout(() => setActionMsg(""), 4000); };
  const showErr = (e) => { setError(e); setTimeout(() => setError(""), 5000); };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSec.toString().padStart(2, "0")}`;
  };

  const handleChamberAction = async (action, newStatus = null, targetSerial = null) => {
    if (!profile || !selectedClinicId) return;
    setUpdatingChamber(true);
    try {
      const payload = {
        doctor_id: profile.id,
        clinic_id: selectedClinicId,
        action: action,
      };
      if (newStatus) payload.status = newStatus;
      if (targetSerial !== null) payload.current_serial = targetSerial;

      const res = await apiClient.post("/doctors/chamber-session/", payload);
      setChamberSession(res);

      if (action === "NEXT_SERIAL" || action === "RECALL_SERIAL" || action === "SKIP_SERIAL") {
        setPatientSeconds(0);
      }

      showMsg(
        action === "NEXT_SERIAL"
          ? `Called Serial #${res.current_serial}!`
          : action === "SKIP_SERIAL"
          ? `Serial held. Advanced to #${res.current_serial}!`
          : action === "RECALL_SERIAL"
          ? `Recalled Serial #${res.current_serial} into chamber!`
          : action === "RESET"
          ? "Chamber queue reset to start."
          : `Chamber status updated to ${res.status}`
      );
    } catch {
      showErr("Failed to update chamber session.");
    } finally {
      setUpdatingChamber(false);
    }
  };

  const handleBroadcastDelay = async (e) => {
    e.preventDefault();
    if (!profile || !selectedClinicId) return;
    setBroadcastingDelay(true);
    try {
      const payload = {
        doctor_id: profile.id,
        clinic_id: selectedClinicId,
        action: "UPDATE_STATUS",
        delay_minutes: parseInt(delayMinutes, 10) || 0,
        announcement_note: announcementNote,
      };
      const res = await apiClient.post("/doctors/chamber-session/", payload);
      setChamberSession(res);
      setDelayModalOpen(false);
      showMsg("Chamber delay announcement broadcasted to waiting room & patients!");
    } catch {
      showErr("Failed to broadcast delay notice.");
    } finally {
      setBroadcastingDelay(false);
    }
  };

  const applyRxPreset = (preset) => {
    setRxFormData({
      diagnosis: preset.diagnosis,
      vitals: preset.vitals || rxFormData.vitals,
      diagnostic_tests: preset.tests,
      advice: preset.advice,
      medications: preset.medications.map((m) => ({ ...m })),
    });
    showMsg(`Quick Preset applied: "${preset.name}"!`);
  };

  const findDuplicateGenerics = () => {
    const genericCount = {};
    rxFormData.medications.forEach((m) => {
      const match = m.medication_name.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        const gen = match[1].toLowerCase().trim();
        genericCount[gen] = (genericCount[gen] || 0) + 1;
      }
    });
    return Object.entries(genericCount)
      .filter(([_, count]) => count > 1)
      .map(([gen]) => gen);
  };


  const handleSearchDgda = async (query) => {
    setMedSearchQuery(query);
    if (!query || query.length < 2) return setDgdaSearchResults([]);
    try {
      const res = await apiClient.get(`/prescriptions/medications/?search=${encodeURIComponent(query)}`);
      setDgdaSearchResults(res.results || res || []);
    } catch {
      setDgdaSearchResults([]);
    }
  };

  const addMedicationFromDgda = (med) => {
    const medName = `${med.form === 'TABLET' ? 'Tab.' : med.form === 'CAPSULE' ? 'Cap.' : 'Syr.'} ${med.brand_name} ${med.strength} (${med.generic_name})`;
    setRxFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { medication_name: medName, dosage: "1 + 0 + 1", timing: "After Meal", duration: "7 Days", instructions: "" }
      ]
    }));
    setMedSearchQuery("");
    setDgdaSearchResults([]);
  };

  const removeMedication = (index) => {
    setRxFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedicationItem = (index, field, value) => {
    setRxFormData((prev) => {
      const updated = [...prev.medications];
      updated[index][field] = value;
      return { ...prev, medications: updated };
    });
  };

  const openPrescriptionModal = async (apt) => {
    setSelectedRxApt(apt);
    setRxFormData({
      diagnosis: "",
      vitals: { bp: "120/80", pulse: "72", weight: "70kg", temp: "98.6F", blood_sugar: "5.8 mmol/L" },
      diagnostic_tests: "",
      advice: "Take rest, drink clean water, avoid oily food.",
      medications: [
        { medication_name: "Tab. Napa 500mg (Paracetamol)", dosage: "1 + 0 + 1", timing: "After Meal", duration: "5 Days", instructions: "" }
      ],
    });

    // Check if existing Rx exists
    try {
      const existing = await apiClient.get(`/prescriptions/appointment/${apt.id}/`);
      if (existing) {
        setRxFormData({
          diagnosis: existing.diagnosis || "",
          vitals: existing.vitals || { bp: "120/80", pulse: "72", weight: "70kg", temp: "98.6F", blood_sugar: "5.8 mmol/L" },
          diagnostic_tests: existing.diagnostic_tests || "",
          advice: existing.advice || "",
          medications: existing.medications || [],
        });
      }
    } catch {}

    setRxModalOpen(true);
  };

  const openPrintRxModal = async (apt) => {
    try {
      const existing = await apiClient.get(`/prescriptions/appointment/${apt.id}/`);
      if (existing) {
        setPrintRxData({ ...existing, appointment: apt });
        setRxPrintModalOpen(true);
      } else {
        showErr("No prescription written for this appointment yet. Click 'Write E-Prescription'.");
      }
    } catch {
      showErr("Prescription not found. Please click 'Write E-Prescription' first.");
    }
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!selectedRxApt) return;
    setSubmittingRx(true);
    setError("");
    try {
      const res = await apiClient.post("/prescriptions/", {
        appointment_id: selectedRxApt.id,
        diagnosis: rxFormData.diagnosis,
        vitals: rxFormData.vitals,
        diagnostic_tests: rxFormData.diagnostic_tests,
        advice: rxFormData.advice,
        medications: rxFormData.medications,
      });
      showMsg("Digital E-Prescription issued successfully!");
      setRxModalOpen(false);
      fetchAppointments();
      // Auto open print preview
      setPrintRxData({ ...res, appointment: selectedRxApt });
      setRxPrintModalOpen(true);
    } catch {
      showErr("Failed to issue prescription. Check details.");
    } finally {
      setSubmittingRx(false);
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
          <p className="text-sm text-base-content/60 mt-1">Live queue control, E-Prescriptions, & clinic affiliations</p>
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
        <button
          className={`tab rounded-lg font-semibold transition-all ${tab === "schedule" ? "tab-active" : ""}`}
          onClick={() => { setTab("schedule"); setError(""); setActionMsg(""); fetchSchedules(); }}
        >
          <Clock size={15} className="mr-1" /> Chamber Schedule ({schedules.length})
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
          {/* ====== LIVE CHAMBER TOKEN & TIME MANAGEMENT CONTROL PANEL ====== */}
          {selectedClinicId && (
            <div className="bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 border-2 border-primary/40 p-6 rounded-3xl shadow-xl space-y-5">
              {/* Header row */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-base-200 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-primary font-black text-xs uppercase tracking-wider">
                      Live Chamber Control Desk
                    </span>
                    <span
                      className={`badge font-bold text-xs ${
                        chamberSession?.status === "IN_CHAMBER"
                          ? "badge-success text-white animate-pulse"
                          : chamberSession?.status === "IN_TRANSIT"
                          ? "badge-warning font-black text-black"
                          : chamberSession?.status === "PRAYER_BREAK"
                          ? "badge-info text-white font-bold"
                          : chamberSession?.status === "EMERGENCY"
                          ? "badge-error text-white font-black animate-pulse"
                          : chamberSession?.status === "PAUSED"
                          ? "badge-secondary"
                          : "badge-ghost"
                      }`}
                    >
                      {chamberSession?.status === "IN_CHAMBER"
                        ? "🟢 In Chamber (রোগী দেখা হচ্ছে)"
                        : chamberSession?.status === "IN_TRANSIT"
                        ? "🟡 In Transit (ডাক্তার পথে আছেন)"
                        : chamberSession?.status === "PRAYER_BREAK"
                        ? "🔵 Namaz / Prayer Break (নামাজের বিরতি)"
                        : chamberSession?.status === "EMERGENCY"
                        ? "🔴 Emergency Round / OT"
                        : chamberSession?.status === "PAUSED"
                        ? "⏸️ Paused (সাময়িক বিরতি)"
                        : chamberSession?.status === "ENDED"
                        ? "⬛ Session Ended"
                        : "⚪ Not Started"}
                    </span>

                    {chamberSession?.delay_minutes > 0 && (
                      <span className="badge badge-warning badge-outline text-xs font-bold gap-1 animate-pulse">
                        <AlertTriangle size={12} />
                        Delayed: ~{chamberSession.delay_minutes} mins
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-base-content flex items-center gap-2">
                    <span>Token Serial Tracker & Chamber Timekeeper</span>
                  </h2>
                </div>

                {/* TV Display & Broadcast Delay Launcher */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/queue-display/${selectedClinicId}/${profile?.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-secondary btn-sm gap-2 font-bold shadow-sm"
                    title="Launch Waiting Room TV Display in New Window"
                  >
                    <Tv size={16} /> Open Waiting Room TV Screen
                  </a>

                  <button
                    onClick={() => setDelayModalOpen(true)}
                    className="btn btn-outline btn-warning btn-sm gap-1.5 font-bold shadow-sm"
                  >
                    <Clock size={15} /> Broadcast Delay / Note
                  </button>
                </div>
              </div>

              {/* Time Management & Queue Stats Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Active Calling Serial */}
                <div className="bg-base-100 p-3 rounded-2xl border-2 border-primary/40 shadow-sm text-center">
                  <div className="text-[11px] text-base-content/60 font-black uppercase tracking-wider">
                    Calling Serial
                  </div>
                  <div className="text-3xl font-black text-primary mt-0.5">
                    #{chamberSession?.current_serial || 0}
                  </div>
                </div>

                {/* Patient Consultation Stopwatch */}
                <div className={`bg-base-100 p-3 rounded-2xl border shadow-sm text-center ${
                  patientSeconds > 900 ? "border-error bg-error/5" : "border-base-200"
                }`}>
                  <div className="text-[11px] text-base-content/60 font-black uppercase tracking-wider">
                    Current Patient Time
                  </div>
                  <div className={`text-2xl font-black font-mono mt-1 ${
                    patientSeconds > 900 ? "text-error" : "text-secondary"
                  }`}>
                    {formatSeconds(patientSeconds)}
                  </div>
                </div>

                {/* Total Booked */}
                <div className="bg-base-100 p-3 rounded-2xl border border-base-200 shadow-sm text-center">
                  <div className="text-[11px] text-base-content/60 font-black uppercase tracking-wider">
                    Total Booked
                  </div>
                  <div className="text-2xl font-black text-base-content mt-1">
                    {appointments.length}
                  </div>
                </div>

                {/* Remaining In Queue */}
                <div className="bg-base-100 p-3 rounded-2xl border border-base-200 shadow-sm text-center">
                  <div className="text-[11px] text-base-content/60 font-black uppercase tracking-wider">
                    Waiting in Lobby
                  </div>
                  <div className="text-2xl font-black text-info mt-1">
                    {Math.max(0, appointments.filter(a => a.status === "CONFIRMED" && a.serial_number > (chamberSession?.current_serial || 0)).length)}
                  </div>
                </div>

                {/* Skipped / On Hold */}
                <div className="bg-base-100 p-3 rounded-2xl border border-base-200 shadow-sm text-center col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-base-content/60 font-black uppercase tracking-wider">
                    On Hold (Skipped)
                  </div>
                  <div className="text-2xl font-black text-warning mt-1">
                    {chamberSession?.skipped_serials?.length || 0}
                  </div>
                </div>
              </div>

              {/* Skipped Serials Chips (Quick Recall) */}
              {chamberSession?.skipped_serials?.length > 0 && (
                <div className="bg-base-200/50 p-3 rounded-2xl border border-warning/30 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-warning-content flex items-center gap-1">
                    <AlertTriangle size={14} /> Skipped Serials on Hold:
                  </span>
                  {chamberSession.skipped_serials.map((sn) => (
                    <button
                      key={sn}
                      onClick={() => handleChamberAction("RECALL_SERIAL", "IN_CHAMBER", sn)}
                      disabled={updatingChamber}
                      className="btn btn-warning btn-xs font-black gap-1 shadow-sm"
                      title={`Recall Serial #${sn} into Chamber`}
                    >
                      Recall #{sn}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons: Primary Serial Control */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {/* Call Next Serial */}
                  <button
                    onClick={() => handleChamberAction("NEXT_SERIAL")}
                    disabled={updatingChamber}
                    className="btn btn-primary font-black gap-2 text-base shadow-md flex-1 md:flex-initial"
                    title="Call Next Serial (Keyboard Shortcut: N)"
                  >
                    <FastForward size={18} /> Call Next Serial (#{(chamberSession?.current_serial || 0) + 1})
                    <kbd className="kbd kbd-xs bg-primary-focus text-white border-white/30 hidden sm:inline-block">N</kbd>
                  </button>

                  {/* Skip and Hold Current */}
                  <button
                    onClick={() => handleChamberAction("SKIP_SERIAL")}
                    disabled={updatingChamber || (chamberSession?.current_serial || 0) === 0}
                    className="btn btn-warning btn-outline font-bold gap-1.5 flex-1 md:flex-initial"
                    title="Hold current serial and call next patient (Keyboard Shortcut: S)"
                  >
                    <Pause size={16} /> Skip & Hold (#{chamberSession?.current_serial || 0})
                    <kbd className="kbd kbd-xs border-warning hidden sm:inline-block">S</kbd>
                  </button>

                  {/* Previous Serial */}
                  <button
                    onClick={() => handleChamberAction("PREV_SERIAL")}
                    disabled={updatingChamber || (chamberSession?.current_serial || 0) === 0}
                    className="btn btn-ghost btn-outline btn-sm font-bold gap-1"
                    title="Step back to previous serial"
                  >
                    <RotateCcw size={15} /> Prev Serial
                  </button>

                  {/* Reset Queue */}
                  <button
                    onClick={() => {
                      if (window.confirm("Reset chamber queue to Serial #0 for today?")) {
                        handleChamberAction("RESET");
                      }
                    }}
                    disabled={updatingChamber}
                    className="btn btn-ghost btn-xs text-base-content/50 hover:text-error self-center ml-auto"
                    title="Reset chamber session"
                  >
                    Reset Queue
                  </button>
                </div>

                {/* Doctor Chamber Status Presets */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-base-200">
                  <span className="text-xs font-bold text-base-content/60 self-center mr-1">
                    Quick Status:
                  </span>

                  <button
                    onClick={() => handleChamberAction("UPDATE_STATUS", "IN_CHAMBER")}
                    disabled={updatingChamber}
                    className={`btn btn-xs rounded-lg font-bold gap-1 ${
                      chamberSession?.status === "IN_CHAMBER" ? "btn-success text-white" : "btn-outline btn-success"
                    }`}
                  >
                    <Play size={12} /> In Chamber (রোগী দেখা)
                  </button>

                  <button
                    onClick={() => handleChamberAction("UPDATE_STATUS", "PRAYER_BREAK")}
                    disabled={updatingChamber}
                    className={`btn btn-xs rounded-lg font-bold gap-1 ${
                      chamberSession?.status === "PRAYER_BREAK" ? "btn-info text-white" : "btn-outline btn-info"
                    }`}
                  >
                    <Clock size={12} /> Namaz Break (নামাজ)
                  </button>

                  <button
                    onClick={() => handleChamberAction("UPDATE_STATUS", "IN_TRANSIT")}
                    disabled={updatingChamber}
                    className={`btn btn-xs rounded-lg font-bold gap-1 ${
                      chamberSession?.status === "IN_TRANSIT" ? "btn-warning text-black" : "btn-outline btn-warning"
                    }`}
                  >
                    <Navigation size={12} /> In Transit (পথে / জ্যাম)
                  </button>

                  <button
                    onClick={() => handleChamberAction("UPDATE_STATUS", "EMERGENCY")}
                    disabled={updatingChamber}
                    className={`btn btn-xs rounded-lg font-bold gap-1 ${
                      chamberSession?.status === "EMERGENCY" ? "btn-error text-white" : "btn-outline btn-error"
                    }`}
                  >
                    <AlertTriangle size={12} /> Emergency Round
                  </button>

                  <button
                    onClick={() => handleChamberAction("UPDATE_STATUS", "PAUSED")}
                    disabled={updatingChamber}
                    className={`btn btn-xs rounded-lg font-bold gap-1 ${
                      chamberSession?.status === "PAUSED" ? "btn-secondary text-white" : "btn-outline btn-secondary"
                    }`}
                    title="Pause or Resume (Keyboard Shortcut: P)"
                  >
                    <Pause size={12} /> Pause (বিরতি)
                    <kbd className="kbd kbd-xs border-secondary hidden sm:inline-block">P</kbd>
                  </button>


                  <button
                    onClick={() => handleChamberAction("UPDATE_STATUS", "ENDED")}
                    disabled={updatingChamber}
                    className="btn btn-ghost btn-xs text-error font-bold"
                  >
                    End Session (সমাপ্ত)
                  </button>
                </div>
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

                      <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
                        <button
                          onClick={() => openHealthVault(apt)}
                          className="btn btn-outline btn-secondary btn-sm gap-1 flex-1 md:flex-initial"
                        >
                          <FolderHeart size={16} /> Health Vault
                        </button>

                        <button
                          onClick={() => openPrescriptionModal(apt)}
                          className="btn btn-secondary btn-sm gap-1 text-white shadow-sm flex-1 md:flex-initial"
                        >
                          <FileText size={16} /> Write E-Prescription
                        </button>

                        <button
                          onClick={() => openPrintRxModal(apt)}
                          className="btn btn-outline btn-sm gap-1 flex-1 md:flex-initial"
                          title="Print or view Bangladesh standard A4 prescription"
                        >
                          <Printer size={15} /> Print Rx
                        </button>


                        {apt.status === "CONFIRMED" && (
                          <button
                            onClick={() => handleComplete(apt.id)}
                            className="btn btn-primary btn-sm gap-1 shadow-sm flex-1 md:flex-initial"
                          >
                            <CheckCircle2 size={16} /> Complete Visit
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

      {/* ======== CHAMBER SCHEDULE TAB ======== */}
      {tab === "schedule" && (
        <div className="space-y-6">
          <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-base-content flex items-center gap-2">
                <Clock className="text-primary" /> Weekly Chamber Availability Schedule
              </h2>
              <p className="text-xs text-base-content/60 mt-1">
                Configure your recurring consultation days, chamber hours, and patient capacity per clinic.
              </p>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 bg-base-200/50 p-5 rounded-2xl border border-base-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-xs font-bold">Select Clinic *</label>
                  <select
                    value={scheduleForm.clinic_id || selectedClinicId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, clinic_id: e.target.value })}
                    className="select select-bordered select-sm w-full text-xs font-medium"
                    required
                  >
                    <option value="">-- Choose Clinic --</option>
                    {activeAffiliations.map((a) => (
                      <option key={a.clinic?.id} value={a.clinic?.id}>
                        {a.clinic?.name} ({a.clinic?.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold">Day of Week *</label>
                  <select
                    value={scheduleForm.day_of_week}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}
                    className="select select-bordered select-sm w-full text-xs font-bold"
                  >
                    <option value={0}>Monday (সোমবার)</option>
                    <option value={1}>Tuesday (মঙ্গলবার)</option>
                    <option value={2}>Wednesday (বুধবার)</option>
                    <option value={3}>Thursday (বৃহস্পতিবার)</option>
                    <option value={4}>Friday (শুক্রবার)</option>
                    <option value={5}>Saturday (শনিবার)</option>
                    <option value={6}>Sunday (রবিবার)</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold">Consultation Slot Duration</label>
                  <select
                    value={scheduleForm.slot_duration_minutes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, slot_duration_minutes: e.target.value })}
                    className="select select-bordered select-sm w-full text-xs"
                  >
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes (Standard)</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold">Chamber Start Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="input input-bordered input-sm w-full text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold">Chamber End Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="input input-bordered input-sm w-full text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold">Max Patients Per Session</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={scheduleForm.max_patients}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, max_patients: e.target.value })}
                    className="input input-bordered input-sm w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="btn btn-primary btn-sm shadow-md gap-2"
                >
                  {savingSchedule ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} Save Chamber Schedule
                </button>
              </div>
            </form>

            {/* List of Configured Schedules */}
            <div className="space-y-3 pt-2">
              <h3 className="font-extrabold text-sm text-base-content">
                Configured Weekly Schedules ({schedules.length})
              </h3>

              {schedules.length === 0 ? (
                <div className="text-center py-8 text-xs text-base-content/50 bg-base-200/30 rounded-2xl">
                  No schedules configured yet. Add your weekly chamber hours above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {schedules.map((s) => (
                    <div key={s.id} className="p-4 bg-base-100 rounded-2xl border border-base-200 shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="badge badge-primary font-black text-xs">
                          {s.day_of_week_display}
                        </span>
                        <button
                          onClick={() => handleDeleteSchedule(s.id)}
                          className="btn btn-ghost btn-xs text-error btn-circle"
                          title="Remove Schedule"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="font-extrabold text-sm text-base-content">
                        {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                      </div>

                      <div className="text-xs text-base-content/60 flex justify-between">
                        <span>Max: {s.max_patients} patients</span>
                        <span>{s.slot_duration_minutes}m slots</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== WRITE E-PRESCIRPTION MODAL ====== */}
      {rxModalOpen && selectedRxApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-base-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                  <FileText className="text-secondary" size={22} /> Issue Digital E-Prescription (E-Rx)
                </h3>
                <p className="text-xs text-base-content/60">
                  Patient: <strong>{selectedRxApt.family_member ? selectedRxApt.family_member.full_name : `${selectedRxApt.patient?.first_name} ${selectedRxApt.patient?.last_name}`}</strong> (Serial #{selectedRxApt.serial_number})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openHealthVault(selectedRxApt)}
                  className="btn btn-outline btn-secondary btn-xs gap-1"
                >
                  <FolderHeart size={14} /> View Lab Reports
                </button>
                <button onClick={() => setRxModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
              </div>
            </div>

            <form onSubmit={handleSavePrescription} className="space-y-5">
              {/* 1-Click BD Clinical Presets Bar */}
              <div className="bg-gradient-to-r from-primary/10 via-base-200/50 to-secondary/10 p-3.5 rounded-2xl border border-primary/20 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                  <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles size={14} /> 1-Click Prescription Presets (এক ক্লিকে প্রেসক্রিপশন)
                  </span>
                  <span className="text-[11px] text-base-content/60">Auto-fills diagnosis, standard BD medications & advice</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {RX_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyRxPreset(preset)}
                      className="btn btn-xs rounded-xl bg-base-100 hover:bg-primary/20 border border-base-300 font-bold gap-1 text-xs shadow-xs transition-transform active:scale-95"
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duplicate Generic Molecule Warning Alert */}
              {findDuplicateGenerics().length > 0 && (
                <div className="alert alert-warning py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-warning-content" />
                  <span>
                    Duplicate Generic Molecule Detected: <strong>{findDuplicateGenerics().join(", ")}</strong>. Please review selected drugs to avoid accidental double dosage.
                  </span>
                </div>
              )}

              {/* Diagnosis */}
              <div>
                <label className="label text-xs font-bold uppercase tracking-wider">Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Upper Respiratory Tract Infection, Type-2 Diabetes, Hypertension"
                  value={rxFormData.diagnosis}
                  onChange={(e) => setRxFormData({ ...rxFormData, diagnosis: e.target.value })}
                  className="input input-bordered w-full font-medium text-sm"
                />
              </div>

              {/* Patient Vitals */}
              <div className="bg-base-200/50 p-4 rounded-2xl space-y-2">
                <label className="label text-xs font-bold uppercase tracking-wider">Patient Vitals (চেম্বার চেকআপ)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-base-content/60">BP (mmHg)</span>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={rxFormData.vitals.bp || ""}
                      onChange={(e) => setRxFormData({ ...rxFormData, vitals: { ...rxFormData.vitals, bp: e.target.value } })}
                      className="input input-bordered input-sm w-full text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-base-content/60">Weight (kg)</span>
                    <input
                      type="text"
                      placeholder="70kg"
                      value={rxFormData.vitals.weight || ""}
                      onChange={(e) => setRxFormData({ ...rxFormData, vitals: { ...rxFormData.vitals, weight: e.target.value } })}
                      className="input input-bordered input-sm w-full text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-base-content/60">Temp</span>
                    <input
                      type="text"
                      placeholder="98.6F"
                      value={rxFormData.vitals.temp || ""}
                      onChange={(e) => setRxFormData({ ...rxFormData, vitals: { ...rxFormData.vitals, temp: e.target.value } })}
                      className="input input-bordered input-sm w-full text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-base-content/60">Blood Sugar</span>
                    <input
                      type="text"
                      placeholder="6.2 mmol/L"
                      value={rxFormData.vitals.blood_sugar || ""}
                      onChange={(e) => setRxFormData({ ...rxFormData, vitals: { ...rxFormData.vitals, blood_sugar: e.target.value } })}
                      className="input input-bordered input-sm w-full text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* DGDA Bangladesh Drug Search */}
              <div className="space-y-2">
                <label className="label text-xs font-bold uppercase tracking-wider flex justify-between items-center">
                  <span>Prescribed Medications (Rx ওষুধসমূহ)</span>
                  <span className="text-secondary text-[11px] font-bold">Search DGDA Catalog (80+ BD Brands)</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search BD medicines (e.g. Napa, Seclo, Maxpro, Sergel, Cef-3, Fexo, Bislol, Janumet)..."
                    value={medSearchQuery}
                    onChange={(e) => handleSearchDgda(e.target.value)}
                    className="input input-bordered w-full text-sm bg-base-100 shadow-inner"
                  />

                  {dgdaSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-base-100 border border-base-300 rounded-2xl shadow-2xl mt-1 max-h-56 overflow-y-auto divide-y divide-base-200">
                      {dgdaSearchResults.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addMedicationFromDgda(m)}
                          className="w-full text-left p-3 hover:bg-primary/10 transition-colors flex justify-between items-center"
                        >
                          <div>
                            <span className="font-black text-sm text-base-content">
                              {m.form === 'TABLET' ? 'Tab.' : m.form === 'CAPSULE' ? 'Cap.' : m.form === 'SYRUP' ? 'Syr.' : m.form === 'INHALER' ? 'Inhaler' : 'Med.'} {m.brand_name} {m.strength}
                            </span>
                            <span className="text-xs text-base-content/60 ml-2 font-mono">({m.generic_name})</span>
                          </div>
                          <span className="badge badge-sm badge-outline font-semibold">{m.manufacturer}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prescribed Medications Table */}
                <div className="space-y-3 pt-2">
                  {rxFormData.medications.map((item, index) => (
                    <div key={index} className="p-3.5 bg-base-200/60 rounded-2xl border border-base-200 space-y-2.5 shadow-sm">
                      <div className="flex justify-between items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Medicine Brand, Strength & Generic"
                          value={item.medication_name}
                          onChange={(e) => updateMedicationItem(index, "medication_name", e.target.value)}
                          className="input input-bordered input-sm flex-1 font-extrabold text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="btn btn-ghost btn-xs text-error btn-circle"
                          title="Remove this medicine"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-base-content/60 font-bold uppercase">Dose (সকাল+দুপুর+রাত)</span>
                          <input
                            type="text"
                            placeholder="1 + 0 + 1"
                            value={item.dosage}
                            onChange={(e) => updateMedicationItem(index, "dosage", e.target.value)}
                            className="input input-bordered input-sm w-full text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-base-content/60 font-bold uppercase">Timing (কখন খাবে)</span>
                          <input
                            type="text"
                            placeholder="After Meal"
                            value={item.timing}
                            onChange={(e) => updateMedicationItem(index, "timing", e.target.value)}
                            className="input input-bordered input-sm w-full text-xs font-medium"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-base-content/60 font-bold uppercase">Duration (কতদিন)</span>
                          <input
                            type="text"
                            placeholder="7 Days"
                            value={item.duration}
                            onChange={(e) => updateMedicationItem(index, "duration", e.target.value)}
                            className="input input-bordered input-sm w-full text-xs font-medium"
                          />
                        </div>
                      </div>

                      {/* Quick Dosage, Timing & Duration Presets for Bangladesh */}
                      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-base-200/60">
                        <span className="text-[10px] font-bold text-base-content/50 mr-1">Doses:</span>
                        {["1 + 0 + 1", "1 + 1 + 1", "1 + 0 + 0", "0 + 0 + 1", "1 + 1 + 1 + 1", "২ চামচ ৩ বার"].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => updateMedicationItem(index, "dosage", d)}
                            className="btn btn-ghost btn-xs text-[10px] px-1.5 py-0 h-5 min-h-5 rounded-md bg-base-100 border border-base-300 font-mono font-bold"
                          >
                            {d}
                          </button>
                        ))}
                        <span className="text-[10px] font-bold text-base-content/50 ml-2 mr-1">Timing:</span>
                        {["খাবারের আগে", "খাবারের পরে", "ভরা পেটে"].map((tm) => (
                          <button
                            key={tm}
                            type="button"
                            onClick={() => updateMedicationItem(index, "timing", tm)}
                            className="btn btn-ghost btn-xs text-[10px] px-1.5 py-0 h-5 min-h-5 rounded-md bg-base-100 border border-base-300 font-medium"
                          >
                            {tm}
                          </button>
                        ))}
                        <span className="text-[10px] font-bold text-base-content/50 ml-2 mr-1">Duration:</span>
                        {["৩ দিন", "৫ দিন", "৭ দিন", "১৪ দিন", "১ মাস", "চলবে"].map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => updateMedicationItem(index, "duration", dur)}
                            className="btn btn-ghost btn-xs text-[10px] px-1.5 py-0 h-5 min-h-5 rounded-md bg-base-100 border border-base-300 font-medium"
                          >
                            {dur}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setRxFormData((prev) => ({
                      ...prev,
                      medications: [...prev.medications, { medication_name: "", dosage: "1 + 0 + 1", timing: "After Meal", duration: "7 Days", instructions: "" }]
                    }))}
                    className="btn btn-outline btn-secondary btn-xs gap-1"
                  >
                    <Plus size={14} /> Add Custom Medicine Line
                  </button>
                </div>
              </div>

              {/* Diagnostic Tests & Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Diagnostic Tests (Lab Orders)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. CBC with ESR, Lipid Profile, USG of Whole Abdomen, ECG"
                    value={rxFormData.diagnostic_tests}
                    onChange={(e) => setRxFormData({ ...rxFormData, diagnostic_tests: e.target.value })}
                    className="textarea textarea-bordered w-full text-xs"
                  ></textarea>
                </div>

                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">Special Advice & Lifestyle (পরামর্শ)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. পর্যাপ্ত বিশ্রাম নিন, তেল-ঝাল কম খান, দিনে ৩০ মিনিট হাঁটুন"
                    value={rxFormData.advice}
                    onChange={(e) => setRxFormData({ ...rxFormData, advice: e.target.value })}
                    className="textarea textarea-bordered w-full text-xs"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRxModalOpen(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRx}
                  className="btn btn-secondary text-white flex-1 shadow-lg font-bold"
                >
                  {submittingRx ? "Saving E-Prescription..." : "Issue E-Prescription & Complete Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== BROADCAST CHAMBER DELAY & ANNOUNCEMENT MODAL ====== */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-base-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
                <AlertTriangle className="text-warning" size={20} /> Chamber Delay & Notice Broadcast
              </h3>
              <button onClick={() => setDelayModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>

            <p className="text-xs text-base-content/70">
              Broadcast expected delay or real-time chamber status to all patients currently waiting in the clinic lobby and mobile dashboards.
            </p>

            <form onSubmit={handleBroadcastDelay} className="space-y-4">
              <div>
                <label className="label text-xs font-bold uppercase tracking-wider">Expected Delay (Minutes)</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDelayMinutes(mins)}
                      className={`btn btn-sm flex-1 rounded-xl font-bold ${
                        delayMinutes === mins ? "btn-warning text-black" : "btn-outline btn-warning"
                      }`}
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  max="240"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10) || 0)}
                  className="input input-bordered input-sm w-full mt-2 text-xs font-bold"
                  placeholder="Custom delay in minutes"
                />
              </div>

              <div>
                <label className="label text-xs font-bold uppercase tracking-wider">Chamber Notice / Reason (বার্তা)</label>
                <input
                  type="text"
                  placeholder="e.g. Stuck in Mohakhali traffic, arriving at 6:30 PM / Performing Emergency OT"
                  value={announcementNote}
                  onChange={(e) => setAnnouncementNote(e.target.value)}
                  className="input input-bordered w-full text-xs font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDelayMinutes(0);
                    setAnnouncementNote("");
                    handleBroadcastDelay({ preventDefault: () => {} });
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Clear Delay
                </button>
                <button
                  type="submit"
                  disabled={broadcastingDelay}
                  className="btn btn-warning text-black font-bold flex-1 shadow-md"
                >
                  {broadcastingDelay ? "Broadcasting..." : "Broadcast Notice to Patients"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== BANGLADESH STANDARD A4 PRINTABLE E-PRESCRIPTION MODAL ====== */}
      {rxPrintModalOpen && printRxData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 max-w-4xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto animate-in fade-in zoom-in-95">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-base">
                <Printer size={20} />
                <span>Bangladesh Standard E-Prescription Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm font-bold gap-1.5 shadow-md"
                >
                  <Printer size={16} /> Print Prescription (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setRxPrintModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Prescription Body (A4 Styled) */}
            <div className="space-y-6 print:p-0">
              {/* Rx Header: Clinic & Doctor Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-emerald-600 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-emerald-800">
                    Dr. {printRxData.doctor?.full_name || profile?.full_name}
                  </h2>
                  <p className="text-xs font-bold text-slate-700">
                    {printRxData.doctor?.qualification || profile?.qualification || "MBBS, Specialist Physician"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    BMDC Reg. No: {profile?.id?.slice(0, 8).toUpperCase() || "A-78902"}
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-0.5">
                  <h3 className="text-lg font-black text-slate-800">
                    {printRxData.appointment?.clinic?.name || "Smart Clinic BD"}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {printRxData.appointment?.clinic?.address || "Dhaka, Bangladesh"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Serial #{printRxData.appointment?.serial_number || 1} • Date: {printRxData.appointment?.appointment_date || new Date().toISOString().split("T")[0]}
                  </p>
                </div>
              </div>

              {/* Patient Demographics & Vitals Bar */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Patient Name</span>
                  <div className="font-extrabold text-slate-900">
                    {printRxData.appointment?.family_member?.full_name ||
                      `${printRxData.appointment?.patient?.first_name || ""} ${printRxData.appointment?.patient?.last_name || ""}`}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Age / Gender</span>
                  <div className="font-extrabold text-slate-900">
                    {printRxData.appointment?.family_member?.age || "Adult"} yrs / {printRxData.appointment?.family_member?.gender || "Patient"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Blood Pressure</span>
                  <div className="font-mono font-bold text-slate-900">
                    {printRxData.vitals?.bp || "120/80"} mmHg
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Weight / Sugar</span>
                  <div className="font-mono font-bold text-slate-900">
                    {printRxData.vitals?.weight || "—"} | {printRxData.vitals?.blood_sugar || "—"}
                  </div>
                </div>
              </div>

              {/* Clinical Columns: Diagnosis & Tests (Left) vs Medications (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[320px]">
                {/* Left 4 Cols: Findings, Diagnosis, Tests */}
                <div className="md:col-span-4 border-r border-slate-200 pr-4 space-y-4">
                  {printRxData.diagnosis && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b pb-1 mb-1">
                        Clinical Diagnosis
                      </h4>
                      <p className="text-xs font-extrabold text-slate-900">
                        {printRxData.diagnosis}
                      </p>
                    </div>
                  )}

                  {printRxData.diagnostic_tests && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b pb-1 mb-1">
                        Investigations Advised (ল্যাব টেস্ট)
                      </h4>
                      <div className="text-xs text-slate-700 whitespace-pre-line font-medium leading-relaxed">
                        {printRxData.diagnostic_tests}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 text-[11px] text-slate-400">
                    <div>Ref No: {printRxData.id?.slice(0, 8)}</div>
                    <div>Issued: {new Date().toLocaleDateString("en-GB")}</div>
                  </div>
                </div>

                {/* Right 8 Cols: Rx Medications */}
                <div className="md:col-span-8 space-y-4">
                  <div className="text-3xl font-serif font-black text-emerald-700 select-none">
                    ℞
                  </div>

                  <div className="space-y-4">
                    {printRxData.medications?.map((m, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-sm text-slate-900">
                              {idx + 1}. {m.medication_name}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {m.dosage}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-600 mt-1 pl-4">
                          <span>Timing: <strong>{m.timing}</strong></span>
                          <span>Duration: <strong>{m.duration}</strong></span>
                          {m.instructions && <span className="text-slate-500">({m.instructions})</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {printRxData.advice && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-4 space-y-1">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Advice & Instructions (পরামর্শ):
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                        {printRxData.advice}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rx Footer: QR Token Verification & Doctor Signature */}
              <div className="border-t-2 border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-end gap-4">
                <div className="text-left space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">
                    Verification QR Token: {printRxData.qr_token || "AUTHENTICATED"}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    Verify authenticity online at{" "}
                    {printRxData.qr_token ? (
                      <a
                        href={`/verify-prescription/${printRxData.qr_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 underline font-semibold hover:text-emerald-800"
                      >
                        smartclinic.bd/verify/{printRxData.qr_token.slice(0, 8)}... ↗
                      </a>
                    ) : (
                      <span>smartclinic.bd/verify</span>
                    )}
                  </div>
                </div>

                <div className="text-center sm:text-right border-t border-slate-400 pt-1 min-w-[200px]">
                  <div className="font-serif italic text-sm font-bold text-slate-800">
                    Dr. {printRxData.doctor?.full_name || profile?.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    Authorized Medical Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


