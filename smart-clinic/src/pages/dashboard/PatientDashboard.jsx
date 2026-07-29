import { useState, useEffect } from "react";
import { Link } from "react-router";
import apiClient from "../../api/axios";
import { Calendar, Clock, MapPin, Stethoscope, DollarSign, XCircle, CheckCircle, AlertCircle, CreditCard } from "lucide-react";

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/appointments/");
      setAppointments(res.results || res || []);
    } catch (err) {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

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

  const handlePayNow = async (appointment) => {
    try {
      // Initiate payment
      const payment = await apiClient.post("/payments/", {
        appointment_id: appointment.id,
        payment_method: "STRIPE"
      });

      // Process payment mock
      await apiClient.post(`/payments/${payment.id}/process/`, {
        transaction_id: `TXN_${Date.now()}`
      });

      setActionMessage("Payment successful! Appointment confirmed.");
      fetchAppointments();
    } catch (err) {
      setError("Payment processing failed.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <span className="badge badge-warning badge-soft font-bold">Pending Payment</span>;
      case "CONFIRMED":
        return <span className="badge badge-success badge-soft font-bold">Confirmed</span>;
      case "COMPLETED":
        return <span className="badge badge-info badge-soft font-bold">Completed</span>;
      case "CANCELLED":
        return <span className="badge badge-error badge-soft font-bold">Cancelled</span>;
      default:
        return <span className="badge badge-ghost font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold text-base-content">My Appointments</h1>
          <p className="text-sm text-base-content/60">View and manage your upcoming and past clinic visits</p>
        </div>
        <Link to="/book" className="btn btn-primary shadow-md gap-2">
          <Calendar size={18} /> Book New Appointment
        </Link>
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

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 w-full rounded-2xl"></div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-3xl border border-base-200">
          <Calendar size={48} className="mx-auto text-base-content/30 mb-4" />
          <h3 className="text-lg font-bold text-base-content">No Booked Appointments</h3>
          <p className="text-sm text-base-content/60 mt-1">You haven't scheduled any doctor consultations yet.</p>
          <Link to="/book" className="btn btn-primary btn-outline btn-sm mt-4">
            Book an Appointment Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-base-100 border border-base-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-lg text-base-content">
                      Dr. {apt.doctor?.full_name}
                    </h3>
                    {getStatusBadge(apt.status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-primary" />
                      <span>{apt.clinic?.name}</span>
                    </div>
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
                      <span className="font-semibold">Notes: </span>{apt.problem_description}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
                  <div className="text-lg font-bold text-primary flex items-center">
                    ${apt.amount}
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {apt.status === "PENDING" && (
                      <button
                        onClick={() => handlePayNow(apt)}
                        className="btn btn-success btn-sm gap-1 text-white shadow-sm flex-1 md:flex-initial"
                      >
                        <CreditCard size={16} /> Pay & Confirm
                      </button>
                    )}

                    {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
