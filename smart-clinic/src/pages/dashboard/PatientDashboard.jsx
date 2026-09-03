import { useState, useEffect } from "react";
import { Link } from "react-router";
import apiClient from "../../api/axios";
import {
  Calendar, Clock, MapPin, Stethoscope, XCircle, CheckCircle,
  AlertCircle, CreditCard, Users, Plus, Heart, Phone, FastForward, Navigation, Bell
} from "lucide-react";

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [chamberSessions, setChamberSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("BKASH");
  const [trxId, setTrxId] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Add Family Member Modal State
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [familyFormData, setFamilyFormData] = useState({
    full_name: "",
    relationship: "FATHER",
    phone: "",
    age: "",
    gender: "MALE",
    blood_group: "B+",
    medical_notes: "",
  });
  const [submittingFamily, setSubmittingFamily] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/appointments/");
      const list = res.results || res || [];
      setAppointments(list);

      // Fetch live chamber session for today's appointments
      const todayApts = list.filter(a => a.appointment_date === todayStr);
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
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchFamilyMembers();

    // Auto-refresh live queue tracker every 20 seconds
    const interval = setInterval(() => {
      fetchAppointments();
    }, 20000);
    return () => clearInterval(interval);
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

  const openPaymentModal = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentMethod("BKASH");
    setTrxId("");
    setPaymentModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setProcessingPayment(true);
    setError("");
    try {
      const paymentRes = await apiClient.post("/payments/", {
        appointment_id: selectedAppointment.id,
        payment_method: paymentMethod,
      });

      const finalTrxId = paymentMethod === "CASH" 
        ? `CASH_CHAMBER_${Date.now()}` 
        : (trxId.trim() || `TRX_${paymentMethod}_${Date.now()}`);

      await apiClient.post(`/payments/${paymentRes.id}/process/`, {
        transaction_id: finalTrxId,
      });

      setActionMessage(`Payment via ${paymentMethod} successful! Appointment confirmed.`);
      setPaymentModalOpen(false);
      fetchAppointments();
    } catch {
      setError("Payment processing failed. Please check details and try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    setSubmittingFamily(true);
    setError("");
    try {
      await apiClient.post("/accounts/family-members/", familyFormData);
      setActionMessage("Family member added successfully!");
      setFamilyModalOpen(false);
      setFamilyFormData({
        full_name: "",
        relationship: "FATHER",
        phone: "",
        age: "",
        gender: "MALE",
        blood_group: "B+",
        medical_notes: "",
      });
      fetchFamilyMembers();
    } catch {
      setError("Failed to add family member. Check inputs.");
    } finally {
      setSubmittingFamily(false);
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold text-base-content">Patient Dashboard</h1>
          <p className="text-sm text-base-content/60">Live serial tracker, appointments, & family care</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFamilyModalOpen(true)}
            className="btn btn-outline btn-primary shadow-sm gap-2"
          >
            <Plus size={18} /> Add Family Member
          </button>
          <Link to="/book" className="btn btn-primary shadow-md gap-2">
            <Calendar size={18} /> Book Appointment
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-base-200 gap-4">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "appointments"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60 hover:text-base-content"
          }`}
        >
          <Calendar size={18} /> My Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab("family")}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "family"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60 hover:text-base-content"
          }`}
        >
          <Users size={18} /> Family Profiles ({familyMembers.length})
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
              <h3 className="text-lg font-bold text-base-content">No Booked Appointments</h3>
              <p className="text-sm text-base-content/60 mt-1">You haven't scheduled any doctor consultations yet.</p>
              <Link to="/book" className="btn btn-primary btn-outline btn-sm mt-4">
                Book an Appointment Now
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
                      isYourTurn ? "border-success bg-success/5 shadow-2xl ring-2 ring-success" :
                      isNearTurn ? "border-warning bg-warning/5 shadow-xl" : "border-base-200"
                    }`}
                  >
                    {/* ====== LIVE QUEUE TRACKER WIDGET FOR TODAY ====== */}
                    {isToday && (
                      <div className="bg-gradient-to-r from-primary/10 via-base-200/50 to-secondary/10 p-4 rounded-2xl border border-primary/20 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary font-black text-xs">LIVE SERIAL TRACKER</span>
                            <span className={`badge font-bold text-xs ${
                              session?.status === "IN_CHAMBER" ? "badge-success text-white animate-pulse" :
                              session?.status === "IN_TRANSIT" ? "badge-warning" : "badge-ghost"
                            }`}>
                              Doctor Status: {session?.status || "NOT_STARTED"}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-base-content/60">
                            Refreshes automatically ⏱️
                          </div>
                        </div>

                        {/* Progress Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center">
                            <div className="text-[11px] font-semibold text-base-content/60 uppercase">Currently Called</div>
                            <div className="text-2xl font-black text-primary">#{currentSerial}</div>
                          </div>

                          <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center">
                            <div className="text-[11px] font-semibold text-base-content/60 uppercase">Your Serial #</div>
                            <div className="text-2xl font-black text-secondary">#{yourSerial}</div>
                          </div>

                          <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center">
                            <div className="text-[11px] font-semibold text-base-content/60 uppercase">Patients Ahead</div>
                            <div className="text-2xl font-black text-base-content">
                              {currentSerial >= yourSerial ? 0 : patientsAhead}
                            </div>
                          </div>

                          <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center">
                            <div className="text-[11px] font-semibold text-base-content/60 uppercase">Est. Wait</div>
                            <div className="text-lg font-bold text-success mt-1">
                              {currentSerial >= yourSerial ? "Your Turn!" : `~${patientsAhead * 15} mins`}
                            </div>
                          </div>
                        </div>

                        {/* PROXIMITY ALERT BANNER */}
                        {isYourTurn && (
                          <div className="alert alert-success text-white font-extrabold text-sm flex items-center gap-2 shadow-md animate-bounce">
                            <Bell className="w-5 h-5 shrink-0" />
                            <span>🎉 IT'S YOUR TURN! Please proceed into Dr. {apt.doctor?.full_name}'s consultation room now.</span>
                          </div>
                        )}

                        {isNearTurn && (
                          <div className="alert alert-warning text-warning-content font-bold text-xs flex items-center gap-2 shadow-sm">
                            <Bell className="w-4 h-4 shrink-0" />
                            <span>🔔 GET READY: You are only {patientsAhead} patient(s) away! Please report to clinic waiting lounge.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Appointment Information Card */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-1">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="badge badge-lg badge-secondary font-black">
                            Serial #{apt.serial_number || 1}
                          </span>
                          <h3 className="font-extrabold text-lg text-base-content">
                            Dr. {apt.doctor?.full_name}
                          </h3>
                          {getStatusBadge(apt.status)}
                          {apt.family_member && (
                            <span className="badge badge-secondary badge-soft font-bold gap-1 text-xs">
                              <Heart size={12} /> For: {apt.family_member.full_name} ({apt.family_member.relationship_display})
                            </span>
                          )}
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
                        <div className="text-xl font-extrabold text-primary flex items-center">
                          ৳{apt.amount} BDT
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                          {apt.status === "PENDING" && (
                            <button
                              onClick={() => openPaymentModal(apt)}
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
              <h3 className="font-bold text-base-content">Parent Care & Family Profiles</h3>
              <p className="text-xs text-base-content/60">Add parents, spouse, or children to manage their appointments & health history.</p>
            </div>
            <button onClick={() => setFamilyModalOpen(true)} className="btn btn-primary btn-sm gap-1">
              <Plus size={16} /> Add Member
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div className="text-center py-12 bg-base-100 rounded-3xl border border-base-200">
              <Users size={40} className="mx-auto text-base-content/30 mb-3" />
              <h4 className="font-bold text-base-content">No Family Members Added</h4>
              <p className="text-xs text-base-content/60 mt-1">Add your parents or dependents to book appointments for them easily.</p>
              <button onClick={() => setFamilyModalOpen(true)} className="btn btn-primary btn-outline btn-sm mt-4">
                Add Family Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="bg-base-100 border border-base-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-base-content text-lg">{member.full_name}</h4>
                      <span className="badge badge-primary badge-soft text-xs font-bold mt-1">
                        {member.relationship_display}
                      </span>
                    </div>
                    {member.blood_group && (
                      <span className="badge badge-error badge-soft font-black text-xs">
                        Blood: {member.blood_group}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-base-content/70 mt-3 pt-3 border-t border-base-200">
                    <div><span className="font-semibold">Age:</span> {member.age ? `${member.age} yrs` : 'N/A'}</div>
                    <div><span className="font-semibold">Gender:</span> {member.gender}</div>
                    {member.phone && (
                      <div className="col-span-2 flex items-center gap-1">
                        <Phone size={12} className="text-primary" /> {member.phone}
                      </div>
                    )}
                  </div>

                  {member.medical_notes && (
                    <div className="mt-3 text-xs bg-base-200/50 p-2.5 rounded-xl text-base-content/80">
                      <span className="font-semibold">Medical History: </span>{member.medical_notes}
                    </div>
                  )}

                  <div className="mt-4 pt-2 flex justify-end">
                    <Link to={`/book?family_member=${member.id}`} className="btn btn-primary btn-sm btn-outline gap-1">
                      <Calendar size={14} /> Book Appointment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====== PAYMENT MODAL (bKash, Nagad, Rocket, Cash) ====== */}
      {paymentModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-base-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                <CreditCard className="text-primary" size={20} /> Process Payment
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex justify-between items-center">
              <div>
                <div className="text-xs text-base-content/60">Amount Payable</div>
                <div className="text-sm font-bold">Dr. {selectedAppointment.doctor?.full_name}</div>
              </div>
              <div className="text-2xl font-black text-primary">
                ৳{selectedAppointment.amount} BDT
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="label text-xs font-bold">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "BKASH", name: "bKash", color: "bg-pink-600 text-white" },
                    { id: "NAGAD", name: "Nagad", color: "bg-orange-600 text-white" },
                    { id: "ROCKET", name: "Rocket", color: "bg-purple-600 text-white" },
                    { id: "CASH", name: "Cash at Chamber", color: "bg-emerald-600 text-white" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl font-bold text-sm transition-all border-2 text-center ${
                        paymentMethod === m.id
                          ? `${m.color} border-transparent shadow-md scale-98`
                          : "bg-base-200 border-base-300 text-base-content hover:border-primary/50"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== "CASH" ? (
                <div className="space-y-2 bg-base-200/50 p-4 rounded-2xl">
                  <div className="text-xs text-base-content/70">
                    Send <strong>৳{selectedAppointment.amount}</strong> to Merchant Number: <strong className="text-primary font-mono">01700000000</strong> ({paymentMethod})
                  </div>
                  <label className="label text-xs font-bold">Enter Transaction ID (TrxID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK89201AX"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="input input-bordered w-full font-mono text-sm uppercase"
                  />
                </div>
              ) : (
                <div className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 p-4 rounded-2xl">
                  <strong>Cash at Chamber Selected:</strong> You will pay ৳{selectedAppointment.amount} directly at the clinic reception on your appointment day.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="btn btn-success flex-1 text-white shadow-md"
                >
                  {processingPayment ? "Confirming..." : "Confirm Payment"}
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
                <Users className="text-primary" size={20} /> Add Family Member Profile
              </h3>
              <button onClick={() => setFamilyModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="space-y-4">
              <div>
                <label className="label text-xs font-bold">Full Name *</label>
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
                  <label className="label text-xs font-bold">Relationship *</label>
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
                  <label className="label text-xs font-bold">Phone Number (BD)</label>
                  <input
                    type="text"
                    placeholder="01712345678"
                    value={familyFormData.phone}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, phone: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs font-bold">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 62"
                    value={familyFormData.age}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, age: e.target.value })}
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold">Gender</label>
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
                  <label className="label text-xs font-bold">Blood Group</label>
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
                <label className="label text-xs font-bold">Medical Notes / History</label>
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
                  onClick={() => setFamilyModalOpen(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFamily}
                  className="btn btn-primary flex-1 shadow-md"
                >
                  {submittingFamily ? "Saving..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
