import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import apiClient from "../../api/axios";
import {
  CalendarCheck, Building2, Stethoscope, Clock, FileText,
  CheckCircle2, AlertCircle, ArrowLeft, Navigation, Loader,
  ChevronRight, MapPin, Users, Heart, Calendar
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function BookAppointment() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedClinic = searchParams.get("clinic") || "";
  const preselectedDoctor = searchParams.get("doctor") || "";
  const preselectedFamilyMember = searchParams.get("family_member") || "";

  const [clinics, setClinics] = useState([]);
  const [nearbyClinics, setNearbyClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);

  const [formData, setFormData] = useState({
    clinic_id: preselectedClinic,
    doctor_id: preselectedDoctor,
    family_member_id: preselectedFamilyMember,
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "",
    problem_description: "",
  });

  const [selectedDoctorObj, setSelectedDoctorObj] = useState(null);
  const [consultationFee, setConsultationFee] = useState(null);

  // Smart Availability State
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [geoError, setGeoError] = useState("");

  const fallbackTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  // Fetch clinics and family members on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const clinicsRes = await apiClient.get("/clinics/");
        setClinics(clinicsRes.results || clinicsRes || []);

        const familyRes = await apiClient.get("/accounts/family-members/");
        setFamilyMembers(familyRes.results || familyRes || []);
      } catch {
        setError("Failed to load initial data.");
      }
    };
    fetchInitialData();
  }, []);

  // Try geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await apiClient.get(
            `/clinics/nearby/?lat=${latitude}&lng=${longitude}&radius=50`
          );
          setNearbyClinics(res || []);
        } catch {
          // Silently fail
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setGeoError("Location permission denied. Showing all clinics below.");
      },
      { timeout: 8000 }
    );
  }, []);

  // Fetch doctors when clinic changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!formData.clinic_id) {
        try {
          const res = await apiClient.get("/doctors/");
          setDoctors(res.results || res || []);
        } catch {}
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.get(`/doctors/?clinic_id=${formData.clinic_id}`);
        setDoctors(res.results || res || []);
      } catch {
        setError("Failed to load doctors for selected clinic.");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [formData.clinic_id]);

  // Update consultation fee when doctor changes
  useEffect(() => {
    if (formData.doctor_id && doctors.length > 0) {
      const doc = doctors.find((d) => d.id === formData.doctor_id);
      setSelectedDoctorObj(doc || null);
      if (doc?.doctor_clinics) {
        const mapping = doc.doctor_clinics.find(
          (dc) => dc.clinic?.id === formData.clinic_id || dc.clinic_id === formData.clinic_id
        );
        setConsultationFee(mapping?.consultation_fee ?? (doc.doctor_clinics[0]?.consultation_fee ?? null));
      }
    } else {
      setSelectedDoctorObj(null);
      setConsultationFee(null);
    }
  }, [formData.doctor_id, formData.clinic_id, doctors]);

  // Fetch Doctor Availability & Time Slots
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!formData.doctor_id || !formData.clinic_id || !formData.appointment_date) {
        setAvailability(null);
        return;
      }
      setLoadingAvailability(true);
      try {
        const res = await apiClient.get(
          `/doctors/availability/?doctor_id=${formData.doctor_id}&clinic_id=${formData.clinic_id}&date=${formData.appointment_date}`
        );
        setAvailability(res);

        // Preselect first available slot if current time is not available
        if (res?.slots?.length > 0) {
          const firstAvailable = res.slots.find((s) => s.available);
          if (firstAvailable && !formData.appointment_time) {
            setFormData((prev) => ({ ...prev, appointment_time: firstAvailable.time }));
          }
        }
      } catch {
        setAvailability(null);
      } finally {
        setLoadingAvailability(false);
      }
    };
    fetchAvailability();
  }, [formData.doctor_id, formData.clinic_id, formData.appointment_date]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const selectNearbyClinic = (clinicId) => {
    setFormData({ ...formData, clinic_id: clinicId, doctor_id: "" });
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clinic_id || !formData.doctor_id || !formData.appointment_date || !formData.appointment_time) {
      return setError("Please complete all required fields and select an available time slot.");
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await apiClient.post("/appointments/", {
        clinic_id: formData.clinic_id,
        doctor_id: formData.doctor_id,
        family_member_id: formData.family_member_id || null,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        problem_description: formData.problem_description,
      });
      setSuccess("Appointment booked successfully! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      if (typeof err === "object") {
        setError(Object.values(err).flat().join(" ") || "Failed to book appointment.");
      } else {
        setError(err || "Failed to book appointment. Check slot availability.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link to="/clinics" className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-primary font-semibold">
        <ArrowLeft size={16} /> Back
      </Link>

      {/* ====== Nearest Clinics Section ====== */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-xl text-success">
            <Navigation size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-base-content">Clinics Near You</h2>
            <p className="text-xs text-base-content/60">
              {geoLoading
                ? "Detecting your location..."
                : nearbyClinics.length > 0
                ? `Found ${nearbyClinics.length} clinic(s) within 50 km of your location`
                : geoError || "Allow location to see nearby clinics"}
            </p>
          </div>
          {geoLoading && <Loader size={18} className="animate-spin text-primary ml-auto" />}
        </div>

        {geoError && (
          <div className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <AlertCircle size={14} /> {geoError}
          </div>
        )}

        {nearbyClinics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearbyClinics.map((clinic) => {
              const isSelected = formData.clinic_id === clinic.id;
              return (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => selectNearbyClinic(clinic.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-base-200 bg-base-100 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-base-content text-sm leading-tight">{clinic.name}</div>
                    <span className="badge badge-sm badge-success badge-soft shrink-0">
                      {clinic.distance_km} km
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-base-content/60">
                    <MapPin size={11} /> {clinic.city}
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary font-bold">
                      <CheckCircle2 size={12} /> Selected
                    </div>
                  )}
                  {!isSelected && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-base-content/50">
                      <ChevronRight size={12} /> Click to select
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== Booking Form ====== */}
      <div className="bg-base-100 border border-base-200 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center gap-4 border-b border-base-200 pb-6">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary font-bold">
            <CalendarCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-base-content">
              {t("bookAppointment")}
            </h1>
            <p className="text-sm text-base-content/60">
              Select patient, clinic, doctor, and smart available chamber slot
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error text-sm py-3 px-4 shadow-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success text-sm py-3 px-4 shadow-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ====== Patient Selection (Parent Care / Self) ====== */}
          <div className="bg-base-200/50 p-5 rounded-2xl space-y-3">
            <label className="label text-sm font-bold flex items-center gap-1">
              <Users size={16} className="text-primary" /> Who is this appointment for?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, family_member_id: "" })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  !formData.family_member_id
                    ? "border-primary bg-primary/10 font-bold shadow-sm"
                    : "border-base-200 bg-base-100 hover:border-primary/40"
                }`}
              >
                <div className="text-sm font-extrabold">Myself</div>
                <div className="text-xs text-base-content/60">Account Holder</div>
              </button>

              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, family_member_id: member.id })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    formData.family_member_id === member.id
                      ? "border-primary bg-primary/10 font-bold shadow-sm"
                      : "border-base-200 bg-base-100 hover:border-primary/40"
                  }`}
                >
                  <div className="text-sm font-extrabold flex items-center justify-between">
                    <span>{member.full_name}</span>
                    <Heart size={14} className="text-secondary" />
                  </div>
                  <div className="text-xs text-base-content/60">
                    {member.relationship_display} {member.age ? `(${member.age} yrs)` : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clinic Selection */}
            <div>
              <label className="label text-sm font-bold flex items-center gap-1">
                <Building2 size={16} className="text-primary" /> Select Clinic *
              </label>
              <select
                name="clinic_id"
                required
                value={formData.clinic_id}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="">-- Choose a Clinic --</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} ({clinic.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="label text-sm font-bold flex items-center gap-1">
                <Stethoscope size={16} className="text-primary" /> Select Doctor *
              </label>
              <select
                name="doctor_id"
                required
                disabled={loading}
                value={formData.doctor_id}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="">-- Choose a Doctor --</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.full_name} ({doctor.qualification || "Specialist"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor Schedule Days Hint */}
          {availability?.available_days && availability.available_days.length > 0 && (
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-2 text-xs">
              <Calendar size={14} className="text-primary shrink-0" />
              <span>
                <strong>Doctor's Weekly Schedule:</strong> Available on{" "}
                <span className="text-primary font-bold">
                  {availability.available_days.map((d) => DAY_NAMES[d]).join(", ")}
                </span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div>
              <label className="label text-sm font-bold flex items-center gap-1">
                <CalendarCheck size={16} className="text-primary" /> Appointment Date *
              </label>
              <input
                type="date"
                name="appointment_date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.appointment_date}
                onChange={handleChange}
                className="input input-bordered w-full"
              />
            </div>

            {/* Time Slot Picker (Dynamic & Smart) */}
            <div>
              <label className="label text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock size={16} className="text-primary" /> Available Time Slot *
                </span>
                {loadingAvailability && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Loader size={12} className="animate-spin" /> Checking slots...
                  </span>
                )}
              </label>

              {/* Doctor has a schedule for selected day */}
              {availability?.slots && availability.slots.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-base-content/60 flex justify-between">
                    <span>
                      Chamber: {availability.schedule?.start_time?.slice(0, 5)} – {availability.schedule?.end_time?.slice(0, 5)}
                    </span>
                    <span className="text-success font-semibold">
                      {availability.available_count} / {availability.total_slots} open slots
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-base-200/40 rounded-xl border border-base-200">
                    {availability.slots.map((slot) => {
                      const isSelected = formData.appointment_time === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setFormData({ ...formData, appointment_time: slot.time })}
                          className={`btn btn-sm text-xs font-bold transition-all ${
                            isSelected
                              ? "btn-primary shadow-md"
                              : slot.available
                              ? "btn-outline border-base-300 hover:btn-primary"
                              : "btn-disabled opacity-40 line-through bg-base-300"
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : availability?.message ? (
                <div className="p-3 bg-warning/10 text-warning-content border border-warning/20 rounded-xl text-xs space-y-1">
                  <div className="font-bold">⚠️ Doctor not available on this date</div>
                  <div>{availability.message}</div>
                </div>
              ) : (
                /* Fallback standard slots when no custom schedule set */
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {fallbackTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, appointment_time: slot })}
                      className={`btn btn-sm text-xs font-bold ${
                        formData.appointment_time === slot
                          ? "btn-primary shadow-sm"
                          : "btn-outline border-base-300"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Problem Description */}
          <div>
            <label className="label text-sm font-bold flex items-center gap-1">
              <FileText size={16} className="text-primary" /> Symptoms / Reason for Visit
            </label>
            <textarea
              name="problem_description"
              rows={3}
              placeholder="Briefly describe your symptoms or medical concern..."
              value={formData.problem_description}
              onChange={handleChange}
              className="textarea textarea-bordered w-full"
            ></textarea>
          </div>

          {/* Consultation Fee Summary */}
          {consultationFee && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-base-content/60">Consultation Fee</div>
                <div className="text-sm font-bold text-base-content">
                  Dr. {selectedDoctorObj?.full_name}
                </div>
              </div>
              <div className="text-2xl font-extrabold text-primary flex items-center">
                ৳{consultationFee} BDT
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || (availability?.slots && availability.available_count === 0)}
              className="btn btn-primary w-full shadow-lg text-base gap-2"
            >
              {submitting ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <CalendarCheck size={20} /> Confirm Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
