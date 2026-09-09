import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import apiClient from "../../api/axios";
import {
  Calendar, Clock, MapPin, Stethoscope, XCircle, CheckCircle,
  AlertCircle, CreditCard, Users, Plus, Heart, Phone, FastForward, Navigation, Bell,
  FileText, Printer, CheckCircle2, FolderHeart, ExternalLink, Trash2, Upload, Pencil, Smartphone, Building2,
  Tv, Volume2, AlertTriangle
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

const DOB_MONTHS = [
  { value: "01", label: "01 - Jan" },
  { value: "02", label: "02 - Feb" },
  { value: "03", label: "03 - Mar" },
  { value: "04", label: "04 - Apr" },
  { value: "05", label: "05 - May" },
  { value: "06", label: "06 - Jun" },
  { value: "07", label: "07 - Jul" },
  { value: "08", label: "08 - Aug" },
  { value: "09", label: "09 - Sep" },
  { value: "10", label: "10 - Oct" },
  { value: "11", label: "11 - Nov" },
  { value: "12", label: "12 - Dec" },
];

const CURRENT_YEAR = new Date().getFullYear();
const DOB_YEARS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => (CURRENT_YEAR - i).toString());
const DOB_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

export default function PatientDashboard() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [chamberSessions, setChamberSessions] = useState({});
  const [medicalReports, setMedicalReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Filter for reports
  const [reportFilterMember, setReportFilterMember] = useState("");

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("SSLCOMMERZ");
  const [trxId, setTrxId] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Family Member Modal & CRUD States
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [editingFamilyMember, setEditingFamilyMember] = useState(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deletingFamily, setDeletingFamily] = useState(false);
  const [familyFormData, setFamilyFormData] = useState({
    full_name: "",
    relationship: "FATHER",
    phone: "",
    date_of_birth: "",
    age: "",
    gender: "MALE",
    blood_group: "B+",
    medical_notes: "",
  });
  const [submittingFamily, setSubmittingFamily] = useState(false);

  // Prescription View Modal State
  const [rxViewModalOpen, setRxViewModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [loadingRx, setLoadingRx] = useState(false);

  // Upload Medical Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    title: "",
    report_type: "BLOOD_TEST",
    diagnostic_center: "Popular Diagnostic Center",
    test_date: new Date().toISOString().split("T")[0],
    file_url: "",
    summary_notes: "",
    family_member_id: "",
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/appointments/");
      const list = res.results || res || [];
      setAppointments(list);

      // Fetch live chamber session for today's appointments
      const todayApts = list.filter((a) => a.appointment_date === todayStr);
      const sessionMap = {};
      await Promise.all(
        todayApts.map(async (apt) => {
          if (apt.doctor?.id && apt.clinic?.id) {
            try {
              const sessionRes = await apiClient.get(
                `/doctors/chamber-session/?doctor_id=${apt.doctor.id}&clinic_id=${apt.clinic.id}&date=${todayStr}`
              );
              sessionMap[apt.id] = sessionRes;
            } catch {}
          }
        })
      );
      setChamberSessions(sessionMap);
    } catch {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const res = await apiClient.get("/accounts/family-members/");
      setFamilyMembers(res.results || res || []);
    } catch {}
  };

  const fetchMedicalReports = async () => {
    setLoadingReports(true);
    try {
      const res = await apiClient.get("/prescriptions/reports/");
      setMedicalReports(res.results || res || []);
    } catch {}
    finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchFamilyMembers();
    fetchMedicalReports();

    const interval = setInterval(() => {
      fetchAppointments();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Listen to payment callback redirect params (e.g. from SSLCommerz or Checkout)
  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    if (paymentParam === "success") {
      setActionMessage("🎉 Payment completed successfully via SSLCommerz! Your appointment is now Confirmed.");
      fetchAppointments();
    } else if (paymentParam === "fail") {
      setError("Payment failed or was declined by the gateway. Please try again.");
    } else if (paymentParam === "cancel") {
      setActionMessage("Payment was cancelled. You can complete payment anytime before consultation.");
    }
  }, [searchParams]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await apiClient.post(`/appointments/${id}/cancel/`);
      setActionMessage("Appointment cancelled successfully.");
      fetchAppointments();
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to cancel appointment.");
    }
  };

  const openPaymentModal = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentMethod("SSLCOMMERZ");
    setPaymentModalOpen(true);
  };

  const openPrescriptionView = async (aptId) => {
    setLoadingRx(true);
    setSelectedRx(null);
    setRxViewModalOpen(true);
    try {
      const res = await apiClient.get(`/prescriptions/appointment/${aptId}/`);
      setSelectedRx(res);
    } catch {
      setError("Prescription not found or not issued yet.");
      setRxViewModalOpen(false);
    } finally {
      setLoadingRx(false);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setProcessingPayment(true);
    setError("");
    try {
      if (paymentMethod === "CASH") {
        // Direct cash-at-chamber confirmation
        const paymentRes = await apiClient.post("/payments/", {
          appointment_id: selectedAppointment.id,
          payment_method: "CASH",
        });

        await apiClient.post(`/payments/${paymentRes.id}/process/`, {
          transaction_id: `CASH_CHAMBER_${Date.now()}`,
        });

        setActionMessage("Appointment confirmed with Cash at Chamber option! Please pay at clinic reception.");
        setPaymentModalOpen(false);
        fetchAppointments();
      } else {
        // SSLCOMMERZ Hosted Gateway Initiation & Direct Redirect
        const res = await apiClient.post("/payments/initiate-sslcommerz/", {
          appointment_id: selectedAppointment.id,
        });

        if (res?.redirect_url) {
          window.location.href = res.redirect_url;
        } else {
          setError("Failed to generate payment gateway session.");
        }
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "Payment initiation failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const initialFamilyForm = {
    full_name: "",
    relationship: "FATHER",
    phone: "",
    date_of_birth: "",
    age: "",
    gender: "MALE",
    blood_group: "B+",
    medical_notes: "",
  };

  const openAddFamilyModal = () => {
    setEditingFamilyMember(null);
    setFamilyFormData(initialFamilyForm);
    setError("");
    setFamilyModalOpen(true);
  };

  const openEditFamilyModal = (member) => {
    setEditingFamilyMember(member);
    setFamilyFormData({
      full_name: member.full_name || "",
      relationship: member.relationship || "OTHER",
      phone: member.phone || "",
      date_of_birth: member.date_of_birth || "",
      age: member.age || "",
      gender: member.gender || "MALE",
      blood_group: member.blood_group || "B+",
      medical_notes: member.medical_notes || "",
    });
    setError("");
    setFamilyModalOpen(true);
  };

  const openDeleteConfirm = (member) => {
    setMemberToDelete(member);
    setDeleteConfirmModalOpen(true);
  };

  const [dobYear, dobMonth, dobDay] = (familyFormData.date_of_birth || "").split("-");

  const handleDobChange = (part, val) => {
    let y = part === "year" ? val : (dobYear || "");
    let m = part === "month" ? val : (dobMonth || "");
    let d = part === "day" ? val : (dobDay || "");

    if (y && m && d) {
      const formatted = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      const birthDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      calculatedAge = Math.max(0, calculatedAge);

      setFamilyFormData((prev) => ({
        ...prev,
        date_of_birth: formatted,
        age: calculatedAge.toString(),
      }));
    } else {
      const formatted = [y, m, d].some(Boolean) ? `${y}-${m}-${d}` : "";
      setFamilyFormData((prev) => ({
        ...prev,
        date_of_birth: formatted,
      }));
    }
  };

  const handleSaveFamilyMember = async (e) => {
    e.preventDefault();

    if (familyFormData.phone) {
      const bdPhoneRegex = /^01[3-9]\d{8}$/;
      if (!bdPhoneRegex.test(familyFormData.phone)) {
        setError("Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).");
        return;
      }
    }

    setSubmittingFamily(true);
    setError("");
    try {
      const payload = {
        full_name: familyFormData.full_name,
        relationship: familyFormData.relationship,
        phone: familyFormData.phone || "",
        date_of_birth: familyFormData.date_of_birth || null,
        age: familyFormData.age ? parseInt(familyFormData.age, 10) : null,
        gender: familyFormData.gender,
        blood_group: familyFormData.blood_group,
        medical_notes: familyFormData.medical_notes,
      };

      if (editingFamilyMember) {
        const updated = await apiClient.patch(`/accounts/family-members/${editingFamilyMember.id}/`, payload);
        // Immediate UI update without page refresh
        setFamilyMembers((prev) =>
          prev.map((m) => (m.id === editingFamilyMember.id ? { ...m, ...updated } : m))
        );
        setActionMessage(`${familyFormData.full_name}'s profile updated successfully!`);
      } else {
        const created = await apiClient.post("/accounts/family-members/", payload);
        // Immediate UI update without page refresh
        setFamilyMembers((prev) => [created, ...prev]);
        setActionMessage("Family member added successfully!");
      }
      setFamilyModalOpen(false);
      setEditingFamilyMember(null);
      setFamilyFormData(initialFamilyForm);
    } catch (err) {
      if (typeof err === "object") {
        setError(Object.values(err).flat().join(" ") || "Failed to save family member. Check inputs.");
      } else {
        setError(err || "Failed to save family member. Check inputs.");
      }
    } finally {
      setSubmittingFamily(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeletingFamily(true);
    setError("");
    try {
      await apiClient.delete(`/accounts/family-members/${memberToDelete.id}/`);
      // Immediately remove from UI without page refresh
      setFamilyMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      setActionMessage(`${memberToDelete.full_name} removed from family profiles.`);
      setDeleteConfirmModalOpen(false);
      setMemberToDelete(null);
    } catch (err) {
      setError("Failed to delete family member.");
    } finally {
      setDeletingFamily(false);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    setError("");
    try {
      await apiClient.post("/prescriptions/reports/", {
        ...reportFormData,
        family_member: reportFormData.family_member_id || null,
      });
      setActionMessage("Medical report uploaded to vault successfully!");
      setReportModalOpen(false);
      setReportFormData({
        title: "",
        report_type: "BLOOD_TEST",
        diagnostic_center: "Popular Diagnostic Center",
        test_date: new Date().toISOString().split("T")[0],
        file_url: "",
        summary_notes: "",
        family_member_id: "",
      });
      fetchMedicalReports();
    } catch {
      setError("Failed to save report. Check details.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Delete this medical report from your vault?")) return;
    try {
      await apiClient.delete(`/prescriptions/reports/${id}/`);
      setActionMessage("Report removed from vault.");
      fetchMedicalReports();
    } catch {
      setError("Failed to delete report.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span className="badge badge-warning badge-soft font-bold">{t("pendingPayment")}</span>;
      case "CONFIRMED":
        return <span className="badge badge-success badge-soft font-bold">{t("confirmed")}</span>;
      case "COMPLETED":
        return <span className="badge badge-info badge-soft font-bold">{t("completed")}</span>;
      case "CANCELLED":
        return <span className="badge badge-error badge-soft font-bold">{t("cancelled")}</span>;
      default:
        return <span className="badge badge-ghost font-bold">{status}</span>;
    }
  };

  const filteredReports = medicalReports.filter((r) => {
    if (!reportFilterMember) return true;
    if (reportFilterMember === "self") return !r.family_member;
    return r.family_member === reportFilterMember || r.family_member?.id === reportFilterMember;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold text-base-content">{t("patientDashboard")}</h1>
          <p className="text-sm text-base-content/60">{t("patientDashboardSubtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReportModalOpen(true)}
            className="btn btn-outline btn-secondary shadow-sm gap-2"
          >
            <Upload size={18} /> {t("uploadLabReport")}
          </button>
          <button
            onClick={() => setFamilyModalOpen(true)}
            className="btn btn-outline btn-primary shadow-sm gap-2"
          >
            <Plus size={18} /> {t("addFamilyMember")}
          </button>
          <Link to="/book" className="btn btn-primary shadow-md gap-2">
            <Calendar size={18} /> {t("bookAppointment")}
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-base-200 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "appointments"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60 hover:text-base-content"
          }`}
        >
          <Calendar size={18} /> {t("myAppointments")} ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab("family")}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "family"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60 hover:text-base-content"
          }`}
        >
          <Users size={18} /> {t("familyProfiles")} ({familyMembers.length})
        </button>
        <button
          onClick={() => { setActiveTab("reports"); fetchMedicalReports(); }}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "reports"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60 hover:text-base-content"
          }`}
        >
          <FolderHeart size={18} /> {t("medicalReportVault")} ({medicalReports.length})
        </button>
      </div>

      {actionMessage && (
        <div className="alert alert-success text-sm py-3 px-4 shadow-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error text-sm py-3 px-4 shadow-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: APPOINTMENTS & LIVE SERIAL TRACKER */}
      {activeTab === "appointments" && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-32 w-full rounded-2xl"></div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 bg-base-100 rounded-3xl border border-base-200">
              <Calendar size={48} className="mx-auto text-base-content/30 mb-4" />
              <h3 className="text-lg font-bold text-base-content">{t("noAppointments")}</h3>
              <p className="text-sm text-base-content/60 mt-1">{t("noAppointmentsHint")}</p>
              <Link to="/book" className="btn btn-primary btn-outline btn-sm mt-4">
                {t("bookNow")}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {appointments.map((apt) => {
                const session = chamberSessions[apt.id];
                const isToday = apt.appointment_date === todayStr;
                const currentSerial = session?.current_serial || 0;
                const yourSerial = apt.serial_number || 1;
                const patientsAhead = Math.max(0, yourSerial - currentSerial);
                const isNearTurn = isToday && patientsAhead > 0 && patientsAhead <= 3 && session?.status === "IN_CHAMBER";
                const isYourTurn = isToday && currentSerial === yourSerial && session?.status === "IN_CHAMBER";

                return (
                  <div
                    key={apt.id}
                    className={`bg-base-100 border-2 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all space-y-4 ${
                      isYourTurn
                        ? "border-success bg-success/5 shadow-2xl ring-2 ring-success"
                        : isNearTurn
                        ? "border-warning bg-warning/5 shadow-xl"
                        : "border-base-200"
                    }`}
                  >
                    {/* ====== LIVE QUEUE TRACKER WIDGET FOR TODAY ====== */}
                    {isToday && (
                      <div className="bg-gradient-to-r from-primary/10 via-base-200/50 to-secondary/10 p-5 rounded-2xl border-2 border-primary/30 space-y-3.5 shadow-md">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-primary font-black text-xs">{t("liveSerialTracker")}</span>
                            <span
                              className={`badge font-bold text-xs ${
                                session?.status === "IN_CHAMBER"
                                  ? "badge-success text-white animate-pulse"
                                  : session?.status === "IN_TRANSIT"
                                  ? "badge-warning font-black text-black"
                                  : session?.status === "PRAYER_BREAK"
                                  ? "badge-info text-white font-bold"
                                  : session?.status === "EMERGENCY"
                                  ? "badge-error text-white font-black animate-pulse"
                                  : "badge-ghost"
                              }`}
                            >
                              {session?.status === "IN_CHAMBER"
                                ? "🟢 In Chamber (রোগী দেখা হচ্ছে)"
                                : session?.status === "IN_TRANSIT"
                                ? "🟡 In Transit (ডাক্তার পথে আছেন)"
                                : session?.status === "PRAYER_BREAK"
                                ? "🔵 Namaz Break (নামাজের বিরতি)"
                                : session?.status === "EMERGENCY"
                                ? "🔴 Emergency Round / OT"
                                : session?.status === "PAUSED"
                                ? "⏸️ Paused (সাময়িক বিরতি)"
                                : "⚪ Session Not Started"}
                            </span>

                            {session?.room_number && (
                              <span className="badge badge-ghost font-bold text-xs gap-1">
                                <MapPin size={11} className="text-primary" /> {session.room_number}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`/queue-display/${apt.clinic?.id}/${apt.doctor?.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline btn-secondary btn-xs font-bold gap-1 shadow-xs"
                              title="Open Waiting Room Live TV Screen"
                            >
                              <Tv size={12} /> Open TV Board ↗
                            </a>
                            <div className="text-[11px] font-semibold text-base-content/60">
                              {t("refreshesAuto")}
                            </div>
                          </div>
                        </div>

                        {/* Broadcast Notice or Delay Alert from Doctor / Clinic */}
                        {(session?.delay_minutes > 0 || session?.announcement_note) && (
                          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 p-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>
                              {session.delay_minutes > 0 && `Chamber is delayed by ~${session.delay_minutes} minutes. `}
                              {session.announcement_note || "Doctor is held up in road traffic/emergency round."}
                            </span>
                          </div>
                        )}

                        {/* Skipped Serial Warning */}
                        {session?.skipped_serials?.includes(yourSerial) && (
                          <div className="alert alert-warning text-warning-content font-bold text-xs flex items-center gap-2 shadow-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                              ⚠️ Serial #{yourSerial} was temporarily held/skipped. Please inform the receptionist to recall your turn!
                            </span>
                          </div>
                        )}

                        {/* Progress Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center shadow-xs">
                            <div className="text-[11px] font-semibold text-base-content/60 uppercase">
                              {t("currentlyCalled")}
                            </div>
                            <div className="text-3xl font-black text-primary">#{currentSerial}</div>
                          </div>

                          <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center shadow-xs">
                            <div className="text-[11px] font-semibold text-base-content/60 uppercase">
                              {t("yourSerial")}
                            </div>
                            <div className="text-3xl font-black text-secondary">#{yourSerial}</div>
                          </div>

                          <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center shadow-xs">
                            <div className="text-[11px] font-semibold text-base-content/60 uppercase">
                              {t("patientsAhead")}
                            </div>
                            <div className="text-3xl font-black text-base-content">
                              {currentSerial >= yourSerial ? 0 : patientsAhead}
                            </div>
                          </div>

                          <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center shadow-xs">
                            <div className="text-[11px] font-semibold text-base-content/60 uppercase">
                              {t("estWait")}
                            </div>
                            <div className="text-base font-extrabold text-success mt-1">
                              {currentSerial >= yourSerial ? t("yourTurn") : `~${patientsAhead * (session?.estimated_mins_per_patient || 12)} mins`}
                            </div>
                          </div>
                        </div>

                        {/* PROXIMITY ALERT BANNER */}
                        {isYourTurn && (
                          <div className="alert alert-success text-white font-extrabold text-sm flex items-center gap-2 shadow-md animate-bounce">
                            <Bell className="w-5 h-5 shrink-0" />
                            <span>
                              {t("itsYourTurn")} {apt.doctor?.full_name} {session?.room_number ? `(${session.room_number})` : t("consultationRoom")}!
                            </span>
                          </div>
                        )}

                        {isNearTurn && (
                          <div className="alert alert-warning text-warning-content font-bold text-xs flex items-center gap-2 shadow-sm">
                            <Bell className="w-4 h-4 shrink-0" />
                            <span>
                              {t("getReady")} {patientsAhead} {t("patientsAway")} - Please wait right near {session?.room_number || "the chamber entrance"}!
                            </span>
                          </div>
                        )}
                      </div>
                    )}


                    {/* Appointment Information Card */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-1">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="badge badge-lg badge-secondary font-black">
                            {t("serialBadge")}{apt.serial_number || 1}
                          </span>
                          <Link
                            to={`/doctors?specialization_id=${apt.doctor?.specializations?.[0]?.id || ""}`}
                            className="font-extrabold text-lg text-base-content hover:text-primary transition-colors flex items-center gap-1 group"
                            title="View Doctor details"
                          >
                            Dr. {apt.doctor?.full_name}
                            <span className="text-xs opacity-0 group-hover:opacity-100 text-primary transition-opacity">↗</span>
                          </Link>
                          {getStatusBadge(apt.status)}
                          {apt.family_member && (
                            <span className="badge badge-secondary badge-soft font-bold gap-1 text-xs">
                              <Heart size={12} /> {t("forPatient")} {apt.family_member.full_name} ({apt.family_member.relationship_display})
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                          <Link
                            to={`/clinics/${apt.clinic?.id}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors font-medium group"
                            title="View Clinic Details & Location"
                          >
                            <MapPin size={16} className="text-primary shrink-0" />
                            <span>{apt.clinic?.name}</span>
                            <span className="text-xs opacity-0 group-hover:opacity-100 text-primary transition-opacity">↗</span>
                          </Link>
                          <div className="flex items-center gap-1">
                            <Calendar size={16} className="text-primary" />
                            <span>{apt.appointment_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={16} className="text-primary" />
                            <span>{apt.appointment_time}</span>
                          </div>
                        </div>

                        {apt.problem_description && (
                          <div className="text-xs bg-base-200/60 p-3 rounded-xl text-base-content/80 mt-2">
                            <span className="font-semibold">Notes: </span>
                            {apt.problem_description}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
                        <div className="text-xl font-extrabold text-primary flex items-center">
                          ৳{apt.amount} BDT
                        </div>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                          {apt.status === "COMPLETED" && (
                            <button
                              onClick={() => openPrescriptionView(apt.id)}
                              className="btn btn-secondary btn-sm gap-1 text-white shadow-sm flex-1 md:flex-initial"
                            >
                              <FileText size={16} /> {t("viewPrescription")}
                            </button>
                          )}

                          {apt.status === "PENDING" && (
                            <button
                              onClick={() => openPaymentModal(apt)}
                              className="btn btn-success btn-sm gap-1 text-white shadow-sm flex-1 md:flex-initial"
                            >
                              <CreditCard size={16} /> {t("payAndConfirm")}
                            </button>
                          )}

                          {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleCancel(apt.id)}
                              className="btn btn-outline btn-error btn-sm gap-1 flex-1 md:flex-initial"
                            >
                              <XCircle size={16} /> {t("cancel")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: FAMILY MEMBERS */}
      {activeTab === "family" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/20">
            <div>
              <h3 className="font-bold text-base-content">{t("parentCareTitle")}</h3>
              <p className="text-xs text-base-content/60">{t("parentCareSubtitle")}</p>
            </div>
            <button onClick={openAddFamilyModal} className="btn btn-primary btn-sm gap-1">
              <Plus size={16} /> {t("addMember")}
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-3xl border border-base-200">
              <Users size={40} className="mx-auto text-base-content/30 mb-3" />
              <h4 className="font-bold text-base-content">{t("noFamilyMembers")}</h4>
              <p className="text-xs text-base-content/60 mt-1">{t("noFamilyHint")}</p>
              <button onClick={openAddFamilyModal} className="btn btn-primary btn-outline btn-sm mt-4">
                {t("addMember")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-base-100 border border-base-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-base-content text-lg">{member.full_name}</h4>
                      <span className="badge badge-primary badge-soft text-xs font-bold mt-1">
                        {member.relationship_display || member.relationship}
                      </span>
                    </div>
                    {member.blood_group && (
                      <span className="badge badge-error badge-soft font-black text-xs">
                        Blood: {member.blood_group}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-base-content/70 mt-3 pt-3 border-t border-base-200">
                    <div>
                      <span className="font-semibold">{t("age")}:</span> {member.age ? `${member.age} yrs` : "N/A"}
                      {member.date_of_birth && <span className="text-[11px] text-base-content/50 block">DOB: {member.date_of_birth}</span>}
                    </div>
                    <div>
                      <span className="font-semibold">{t("gender")}:</span> {member.gender}
                    </div>
                    {member.phone && (
                      <div className="col-span-2 flex items-center gap-1">
                        <Phone size={12} className="text-primary" /> {member.phone}
                      </div>
                    )}
                  </div>

                  {member.medical_notes && (
                    <div className="mt-3 text-xs bg-base-200/50 p-2.5 rounded-xl text-base-content/80">
                      <span className="font-semibold">{t("medicalNotes")}: </span>
                      {member.medical_notes}
                    </div>
                  )}

                  <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-base-200">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditFamilyModal(member)}
                        className="btn btn-ghost btn-xs text-primary gap-1 border border-primary/20 hover:bg-primary/10"
                        title="Edit Member"
                      >
                        <Pencil size={12} /> {t("editMember") || "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(member)}
                        className="btn btn-ghost btn-xs text-error gap-1 border border-error/20 hover:bg-error/10"
                        title="Delete Member"
                      >
                        <Trash2 size={12} /> {t("deleteMember") || "Delete"}
                      </button>
                    </div>

                    <Link
                      to={`/book?family_member=${member.id}`}
                      className="btn btn-primary btn-xs btn-outline gap-1"
                    >
                      <Calendar size={12} /> {t("bookAppointment")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEDICAL REPORT VAULT */}
      {activeTab === "reports" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/5 p-4 rounded-2xl border border-secondary/20">
            <div>
              <h3 className="font-bold text-base-content flex items-center gap-2">
                <FolderHeart className="text-secondary" size={20} /> {t("medicalReportVault")}
              </h3>
              <p className="text-xs text-base-content/60">{t("medicalReportVaultSubtitle")}</p>
            </div>
            <button onClick={() => setReportModalOpen(true)} className="btn btn-secondary btn-sm text-white gap-1 shadow-md">
              <Upload size={16} /> {t("uploadLabReport")}
            </button>
          </div>

          {/* Sub-Filter: By Family Member */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setReportFilterMember("")}
              className={`btn btn-xs rounded-lg ${!reportFilterMember ? "btn-primary font-bold" : "btn-ghost border border-base-300"}`}
            >
              All Reports ({medicalReports.length})
            </button>
            <button
              onClick={() => setReportFilterMember("self")}
              className={`btn btn-xs rounded-lg ${reportFilterMember === "self" ? "btn-primary font-bold" : "btn-ghost border border-base-300"}`}
            >
              Myself ({medicalReports.filter((r) => !r.family_member).length})
            </button>
            {familyMembers.map((fm) => {
              const count = medicalReports.filter((r) => r.family_member === fm.id || r.family_member?.id === fm.id).length;
              return (
                <button
                  key={fm.id}
                  onClick={() => setReportFilterMember(fm.id)}
                  className={`btn btn-xs rounded-lg ${reportFilterMember === fm.id ? "btn-primary font-bold" : "btn-ghost border border-base-300"}`}
                >
                  {fm.full_name} ({count})
                </button>
              );
            })}
          </div>

          {/* Reports Grid */}
          {loadingReports ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-36 w-full rounded-2xl"></div>
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16 bg-base-100 rounded-3xl border border-base-200 space-y-3">
              <FolderHeart size={44} className="mx-auto text-base-content/30" />
              <h4 className="font-bold text-base-content">{t("noReportsFound")}</h4>
              <p className="text-xs text-base-content/60 max-w-sm mx-auto">{t("noReportsHint")}</p>
              <button onClick={() => setReportModalOpen(true)} className="btn btn-secondary btn-outline btn-sm">
                <Upload size={14} /> {t("uploadLabReport")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-base-100 border border-base-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="badge badge-sm badge-primary badge-soft font-bold text-[10px]">
                        {report.report_type_display || report.report_type}
                      </span>
                      <h4 className="font-extrabold text-base-content text-base mt-1 leading-snug">
                        {report.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="btn btn-ghost btn-xs text-error btn-circle"
                      title="Delete report"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="text-xs text-base-content/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Center:</span>
                      <span className="text-base-content font-bold">{report.diagnostic_center || "Diagnostic Center"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Date:</span>
                      <span>{report.test_date}</span>
                    </div>
                    {report.family_member_name && (
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Patient:</span>
                        <span className="badge badge-xs badge-secondary">{report.family_member_name}</span>
                      </div>
                    )}
                  </div>

                  {report.summary_notes && (
                    <div className="text-xs bg-base-200/60 p-2.5 rounded-xl text-base-content/80">
                      <span className="font-semibold">Findings: </span>
                      {report.summary_notes}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <a
                      href={report.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-xs btn-outline gap-1"
                    >
                      <ExternalLink size={12} /> {t("viewDocument")}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====== DIGITAL PRESCRIPTION SHEET MODAL ====== */}
      {rxViewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-base-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                <FileText className="text-secondary" size={20} /> {t("officialPrescription")}
              </h3>
              <div className="flex gap-2">
                {selectedRx && (
                  <button onClick={() => window.print()} className="btn btn-outline btn-sm gap-1">
                    <Printer size={16} /> {t("printPdf")}
                  </button>
                )}
                <button onClick={() => setRxViewModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
              </div>
            </div>

            {loadingRx ? (
              <div className="py-12 text-center text-base-content/60">Loading prescription details...</div>
            ) : selectedRx ? (
              <div className="space-y-6 bg-white p-6 rounded-2xl text-slate-800 border border-slate-200 shadow-inner" id="prescription-sheet">
                {/* Doctor & Clinic Header */}
                <div className="flex justify-between items-start border-b-2 border-primary/40 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-primary">Dr. {selectedRx.doctor?.full_name}</h2>
                    <p className="text-xs text-slate-600 font-bold">{selectedRx.doctor?.qualification || "Medical Specialist"}</p>
                    <p className="text-xs text-slate-500 mt-1">Exp: {selectedRx.doctor?.experience_years} Years</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-800">{selectedRx.appointment?.clinic?.name}</div>
                    <div className="text-xs text-slate-500">{selectedRx.appointment?.clinic?.city}</div>
                    <div className="text-xs text-slate-400 mt-1">Date: {selectedRx.created_at?.split("T")[0]}</div>
                  </div>
                </div>

                {/* Patient Information */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold">Patient:</span>{" "}
                    <strong className="text-slate-800">
                      {selectedRx.family_member ? selectedRx.family_member.full_name : `${selectedRx.patient?.first_name} ${selectedRx.patient?.last_name}`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Serial:</span>{" "}
                    <strong>#{selectedRx.appointment?.serial_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Diagnosis:</span>{" "}
                    <strong className="text-primary">{selectedRx.diagnosis}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">BP:</span>{" "}
                    <strong>{selectedRx.vitals?.bp || "N/A"}</strong>
                  </div>
                </div>

                {/* Prescribed Medications (Rx Table) */}
                <div className="space-y-2">
                  <h4 className="font-black text-sm text-primary uppercase tracking-wider flex items-center gap-1">
                    {t("prescribedMedicines")}
                  </h4>

                  <table className="table table-xs w-full border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th>#</th>
                        <th>Medicine</th>
                        <th>Dose</th>
                        <th>Timing</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRx.medications?.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50 border-b border-slate-100">
                          <td className="font-bold">{i + 1}</td>
                          <td className="font-extrabold text-slate-900">{m.medication_name}</td>
                          <td className="font-mono text-primary font-bold">{m.dosage}</td>
                          <td>{m.timing}</td>
                          <td className="font-medium">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Diagnostic Lab Orders & Advice */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {selectedRx.diagnostic_tests && (
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                      <strong className="text-amber-900 uppercase block mb-1">{t("recommendedTests")}</strong>
                      <p className="text-slate-700 whitespace-pre-line">{selectedRx.diagnostic_tests}</p>
                    </div>
                  )}

                  {selectedRx.advice && (
                    <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                      <strong className="text-blue-900 uppercase block mb-1">{t("doctorAdvice")}</strong>
                      <p className="text-slate-700 whitespace-pre-line">{selectedRx.advice}</p>
                    </div>
                  )}
                </div>

                {/* QR Code Verification Footer */}
                <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 size={14} /> Official Digital E-Prescription
                    </div>
                    <div className="text-slate-400 font-mono text-[10px]">
                      Token: {selectedRx.qr_token}
                    </div>
                  </div>

                  <Link
                    to={`/verify-prescription/${selectedRx.qr_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-center bg-emerald-50 hover:bg-emerald-100 p-2.5 rounded-xl border border-emerald-200 font-mono text-[10px] text-emerald-800 transition flex flex-col items-center gap-0.5 shadow-xs"
                    title="Open public verification page for pharmacies & labs"
                  >
                    <div className="font-bold flex items-center gap-1">
                      {t("qrVerified")} <ExternalLink size={10} />
                    </div>
                    <div className="text-emerald-600 text-[9px]">{t("scanToVerify")}</div>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ====== PAYMENT MODAL (SSLCommerz Gateway & Cash at Chamber) ====== */}
      {paymentModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-base-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                <CreditCard className="text-primary" size={20} /> {t("processPayment") || "Process Payment"}
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex justify-between items-center">
              <div>
                <div className="text-xs text-base-content/60">{t("amountPayable") || "Amount Payable"}</div>
                <div className="text-sm font-bold">Dr. {selectedAppointment.doctor?.full_name}</div>
                <div className="text-xs text-base-content/50">{selectedAppointment.clinic?.name}</div>
              </div>
              <div className="text-2xl font-black text-primary">
                ৳{selectedAppointment.amount} BDT
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="label text-xs font-bold">{t("selectPaymentMethod") || "Choose Payment Method"}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* OPTION 1: SSLCommerz Online Gateway */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("SSLCOMMERZ")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      paymentMethod === "SSLCOMMERZ"
                        ? "border-primary bg-primary/5 shadow-md scale-101"
                        : "border-base-300 bg-base-100 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-sm text-base-content flex items-center gap-1.5">
                        <Smartphone className="text-primary" size={16} /> Pay Online
                      </div>
                      <span className="badge badge-primary badge-sm font-bold">SSLCommerz</span>
                    </div>
                    <div className="text-xs text-base-content/70 mt-1">
                      bKash, Nagad, Rocket, Cards
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="badge bg-[#E2136E] text-white border-none text-[10px] font-bold px-1.5 py-0.5">bKash</span>
                      <span className="badge bg-[#F7941D] text-white border-none text-[10px] font-bold px-1.5 py-0.5">Nagad</span>
                      <span className="badge bg-[#8C3494] text-white border-none text-[10px] font-bold px-1.5 py-0.5">Rocket</span>
                      <span className="badge bg-slate-700 text-white border-none text-[10px] font-bold px-1.5 py-0.5">Cards</span>
                    </div>
                  </button>

                  {/* OPTION 2: Cash at Chamber */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      paymentMethod === "CASH"
                        ? "border-emerald-600 bg-emerald-50/70 shadow-md scale-101"
                        : "border-base-300 bg-base-100 hover:border-emerald-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-sm text-base-content flex items-center gap-1.5">
                        <Building2 className="text-emerald-600" size={16} /> Cash at Chamber
                      </div>
                      <span className="badge badge-success badge-soft badge-sm font-bold text-emerald-800">চেম্বারে নগদ</span>
                    </div>
                    <div className="text-xs text-base-content/70 mt-1">
                      Pay cash at clinic desk
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-3 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Instant confirmation
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod === "SSLCOMMERZ" ? (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl text-xs space-y-1.5 text-base-content/80">
                  <div className="font-bold text-primary flex items-center gap-1">
                    <ExternalLink size={14} /> Official Payment Gateway Redirect
                  </div>
                  <p>
                    You will be redirected to the secure <strong>SSLCommerz</strong> gateway to pay directly with your <strong>bKash App, Nagad, Rocket</strong>, or <strong>Credit/Debit Card</strong>.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs space-y-1 text-emerald-900">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-emerald-700" /> Cash Payment at Reception
                  </div>
                  <p>
                    Your serial number and appointment will be confirmed immediately. Please pay <strong>৳{selectedAppointment.amount} BDT</strong> in cash at the counter before consulting Dr. {selectedAppointment.doctor?.full_name}.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="btn btn-ghost flex-1"
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className={`btn flex-1 text-white shadow-md gap-2 ${
                    paymentMethod === "CASH"
                      ? "btn-success"
                      : "btn-primary"
                  }`}
                >
                  {processingPayment ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : paymentMethod === "CASH" ? (
                    <>
                      <CheckCircle2 size={16} /> Confirm Cash at Chamber
                    </>
                  ) : (
                    <>
                      <ExternalLink size={16} /> Proceed to Payment Gateway ↗
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== ADD FAMILY MEMBER MODAL ====== */}
      {familyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-base-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                <Users className="text-primary" size={20} />{" "}
                {editingFamilyMember
                  ? t("editMember") || "Edit Family Member"
                  : t("addFamilyMember")}
              </h3>
              <button
                onClick={() => {
                  setFamilyModalOpen(false);
                  setEditingFamilyMember(null);
                }}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFamilyMember} className="space-y-4">
              <div>
                <label className="label text-xs font-bold">{t("fullName")} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Abdul Karim"
                  value={familyFormData.full_name}
                  onChange={(e) => setFamilyFormData({ ...familyFormData, full_name: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold">{t("relationship")} *</label>
                  <select
                    value={familyFormData.relationship}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, relationship: e.target.value })}
                    className="select select-bordered w-full text-sm"
                  >
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="CHILD">Child</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold">{t("phone")}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="01712345678"
                    maxLength={11}
                    value={familyFormData.phone}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                    className="input input-bordered w-full font-mono text-sm"
                  />
                  <span className="text-[10px] text-base-content/50 mt-0.5 block">11-digit BD mobile (e.g. 01712345678)</span>
                </div>
              </div>

              {/* Day / Month / Year Dropdown Picker */}
              <div className="space-y-1">
                <label className="label text-xs font-bold flex items-center justify-between pb-0.5">
                  <span>{t("dateOfBirth") || "Date of Birth (Day / Month / Year)"}</span>
                  {familyFormData.age ? (
                    <span className="badge badge-primary badge-sm font-semibold">
                      Calculated: {familyFormData.age} yrs
                    </span>
                  ) : null}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={dobDay || ""}
                    onChange={(e) => handleDobChange("day", e.target.value)}
                    className="select select-bordered select-sm w-full text-xs font-medium"
                  >
                    <option value="">Day</option>
                    {DOB_DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select
                    value={dobMonth || ""}
                    onChange={(e) => handleDobChange("month", e.target.value)}
                    className="select select-bordered select-sm w-full text-xs font-medium"
                  >
                    <option value="">Month</option>
                    {DOB_MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>

                  <select
                    value={dobYear || ""}
                    onChange={(e) => handleDobChange("year", e.target.value)}
                    className="select select-bordered select-sm w-full text-xs font-medium"
                  >
                    <option value="">Year</option>
                    {DOB_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold">{t("age") || "Age"}</label>
                  <input
                    type="number"
                    placeholder="e.g. 62"
                    value={familyFormData.age}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, age: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold">{t("gender")}</label>
                  <select
                    value={familyFormData.gender}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, gender: e.target.value })}
                    className="select select-bordered w-full text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold">{t("bloodGroup")}</label>
                  <select
                    value={familyFormData.blood_group}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, blood_group: e.target.value })}
                    className="select select-bordered w-full text-sm"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold">{t("medicalNotes")}</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Diabetes Type-2, High Blood Pressure"
                  value={familyFormData.medical_notes}
                  onChange={(e) => setFamilyFormData({ ...familyFormData, medical_notes: e.target.value })}
                  className="textarea textarea-bordered w-full text-sm"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFamilyModalOpen(false);
                    setEditingFamilyMember(null);
                  }}
                  className="btn btn-ghost flex-1"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submittingFamily}
                  className="btn btn-primary flex-1 shadow-md"
                >
                  {submittingFamily
                    ? t("saving") || "Saving..."
                    : editingFamilyMember
                    ? t("updateMember") || "Update Member"
                    : t("saveMember") || "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== DELETE FAMILY MEMBER CONFIRMATION MODAL ====== */}
      {deleteConfirmModalOpen && memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-base-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-error">
              <div className="p-3 bg-error/10 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-base-content text-base">
                  {t("deleteMember") || "Delete Member"}
                </h4>
                <p className="text-xs text-base-content/60">
                  {memberToDelete.full_name} ({memberToDelete.relationship_display || memberToDelete.relationship})
                </p>
              </div>
            </div>

            <p className="text-sm text-base-content/80">
              {t("confirmDeleteMember") || "Are you sure you want to remove this family member from your profile?"}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmModalOpen(false);
                  setMemberToDelete(null);
                }}
                disabled={deletingFamily}
                className="btn btn-ghost btn-sm flex-1"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingFamily}
                className="btn btn-error btn-sm flex-1 text-white shadow-md gap-1"
              >
                {deletingFamily ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Trash2 size={14} />
                )}
                {t("deleteMember") || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== UPLOAD MEDICAL REPORT MODAL ====== */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-base-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                <FolderHeart className="text-secondary" size={20} /> {t("uploadLabReport")}
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>

            <form onSubmit={handleUploadReport} className="space-y-4">
              <div>
                <label className="label text-xs font-bold">Report Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) with ESR"
                  value={reportFormData.title}
                  onChange={(e) => setReportFormData({ ...reportFormData, title: e.target.value })}
                  className="input input-bordered w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold">{t("testCategory")} *</label>
                  <select
                    value={reportFormData.report_type}
                    onChange={(e) => setReportFormData({ ...reportFormData, report_type: e.target.value })}
                    className="select select-bordered w-full text-xs font-medium"
                  >
                    <option value="BLOOD_TEST">Blood Test (CBC, Glucose, Lipid)</option>
                    <option value="IMAGING">Imaging (USG, X-Ray, MRI, CT)</option>
                    <option value="CARDIOLOGY">Cardiology (ECG, Echo)</option>
                    <option value="PATHOLOGY">Pathology & Biopsy</option>
                    <option value="PRESCRIPTION_SCAN">Previous Prescription Scan</option>
                    <option value="OTHER">Other Diagnostic Report</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold">For Patient / Member</label>
                  <select
                    value={reportFormData.family_member_id}
                    onChange={(e) => setReportFormData({ ...reportFormData, family_member_id: e.target.value })}
                    className="select select-bordered w-full text-xs"
                  >
                    <option value="">Myself (Account Holder)</option>
                    {familyMembers.map((fm) => (
                      <option key={fm.id} value={fm.id}>
                        {fm.full_name} ({fm.relationship_display})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold">{t("diagnosticCenter")} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Popular Diagnostic Center"
                    value={reportFormData.diagnostic_center}
                    onChange={(e) => setReportFormData({ ...reportFormData, diagnostic_center: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold">{t("testDate")} *</label>
                  <input
                    type="date"
                    required
                    value={reportFormData.test_date}
                    onChange={(e) => setReportFormData({ ...reportFormData, test_date: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold">{t("documentUrl")} *</label>
                <input
                  type="url"
                  required
                  placeholder="https://res.cloudinary.com/.../report.pdf"
                  value={reportFormData.file_url}
                  onChange={(e) => setReportFormData({ ...reportFormData, file_url: e.target.value })}
                  className="input input-bordered w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="label text-xs font-bold">{t("summaryFindings")}</label>
                <textarea
                  rows={2}
                  placeholder="e.g. HbA1c: 7.2%, Fasting Glucose: 6.8 mmol/L, Total Cholesterol: 210 mg/dL"
                  value={reportFormData.summary_notes}
                  onChange={(e) => setReportFormData({ ...reportFormData, summary_notes: e.target.value })}
                  className="textarea textarea-bordered w-full text-xs"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="btn btn-ghost flex-1"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="btn btn-secondary flex-1 text-white shadow-md"
                >
                  {submittingReport ? "Uploading..." : "Save to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
