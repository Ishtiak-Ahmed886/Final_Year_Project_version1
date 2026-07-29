import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import apiClient from "../../api/axios";
import { CalendarCheck, Building2, Stethoscope, Clock, FileText, CheckCircle2, AlertCircle, ArrowLeft, DollarSign } from "lucide-react";

export default function BookAppointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedClinic = searchParams.get("clinic") || "";
  const preselectedDoctor = searchParams.get("doctor") || "";

  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [formData, setFormData] = useState({
    clinic_id: preselectedClinic,
    doctor_id: preselectedDoctor,
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "09:00",
    problem_description: "",
  });

  const [selectedDoctorObj, setSelectedDoctorObj] = useState(null);
  const [consultationFee, setConsultationFee] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Available time slots
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  // Fetch initial clinics list
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await apiClient.get("/clinics/");
        setClinics(res.results || res || []);
      } catch (err) {
        setError("Failed to load clinics.");
      }
    };
    fetchClinics();
  }, []);

  // Fetch doctors whenever clinic_id changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!formData.clinic_id) {
        // If no clinic selected, fetch all doctors
        try {
          const res = await apiClient.get("/doctors/");
          setDoctors(res.results || res || []);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await apiClient.get(`/doctors/?clinic_id=${formData.clinic_id}`);
        setDoctors(res.results || res || []);
      } catch (err) {
        setError("Failed to load doctors for selected clinic.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [formData.clinic_id]);

  // Update consultation fee calculation
  useEffect(() => {
    if (formData.doctor_id && doctors.length > 0) {
      const doc = doctors.find((d) => d.id === formData.doctor_id);
      setSelectedDoctorObj(doc || null);

      if (doc && doc.doctor_clinics) {
        const mapping = doc.doctor_clinics.find(
          (dc) => dc.clinic?.id === formData.clinic_id || dc.clinic_id === formData.clinic_id
        );
        if (mapping) {
          setConsultationFee(mapping.consultation_fee);
        } else if (doc.doctor_clinics.length > 0) {
          setConsultationFee(doc.doctor_clinics[0].consultation_fee);
        }
      }
    } else {
      setSelectedDoctorObj(null);
      setConsultationFee(null);
    }
  }, [formData.doctor_id, formData.clinic_id, doctors]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clinic_id || !formData.doctor_id || !formData.appointment_date || !formData.appointment_time) {
      return setError("Please complete all required fields.");
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiClient.post("/appointments/", {
        clinic_id: formData.clinic_id,
        doctor_id: formData.doctor_id,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        problem_description: formData.problem_description,
      });

      setSuccess("Appointment booked successfully! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      if (typeof err === "object") {
        const msg = Object.values(err).flat().join(" ") || "Failed to book appointment.";
        setError(msg);
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

      <div className="bg-base-100 border border-base-200 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center gap-4 border-b border-base-200 pb-6">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary font-bold">
            <CalendarCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-base-content">
              Book Your Consultation
            </h1>
            <p className="text-sm text-base-content/60">
              Select clinic, doctor, and preferred time slot for your appointment
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

            {/* Time Slot Picker */}
            <div>
              <label className="label text-sm font-bold flex items-center gap-1">
                <Clock size={16} className="text-primary" /> Preferred Time Slot *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setFormData({ ...formData, appointment_time: slot })}
                    className={`btn btn-sm ${
                      formData.appointment_time === slot
                        ? "btn-primary shadow-sm"
                        : "btn-outline border-base-300"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
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

          {/* Consultation Fee Summary Card */}
          {consultationFee && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-base-content/60">Consultation Fee</div>
                <div className="text-sm font-bold text-base-content">
                  Dr. {selectedDoctorObj?.full_name}
                </div>
              </div>
              <div className="text-2xl font-extrabold text-primary flex items-center">
                <DollarSign size={20} />
                {consultationFee}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full shadow-lg text-base gap-2"
            >
              {submitting ? (
                <span className="loading loading-spinner"></span>
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
