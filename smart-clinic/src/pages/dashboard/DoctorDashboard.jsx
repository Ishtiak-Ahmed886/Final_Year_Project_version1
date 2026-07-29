import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle, Stethoscope } from "lucide-react";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const fetchDoctorAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/appointments/");
      setAppointments(res.results || res || []);
    } catch (err) {
      setError("Failed to load patient schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const handleComplete = async (id) => {
    try {
      await apiClient.post(`/appointments/${id}/complete/`);
      setActionMsg("Appointment marked as completed.");
      fetchDoctorAppointments();
    } catch (err) {
      setError(typeof err === "string" ? err : "Only confirmed appointments can be completed.");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await apiClient.post(`/appointments/${id}/cancel/`);
      setActionMsg("Appointment cancelled.");
      fetchDoctorAppointments();
    } catch (err) {
      setError("Failed to cancel appointment.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-md">
        <h1 className="text-2xl font-extrabold text-base-content flex items-center gap-2">
          <Stethoscope className="text-primary" /> Doctor Consultation Schedule
        </h1>
        <p className="text-sm text-base-content/60 mt-1">Manage patient appointments and update consultation statuses</p>
      </div>

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
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-base-100 border border-base-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
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
                  </div>

                  {apt.problem_description && (
                    <div className="text-xs bg-base-200/60 p-3 rounded-xl text-base-content/80 mt-2">
                      <span className="font-semibold">Patient Note: </span>{apt.problem_description}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0 w-full md:w-auto">
                  {apt.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleComplete(apt.id)}
                      className="btn btn-primary btn-sm gap-1 shadow-sm flex-1 md:flex-initial"
                    >
                      <CheckCircle2 size={16} /> Mark Completed
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
          ))}
        </div>
      )}
    </div>
  );
}
