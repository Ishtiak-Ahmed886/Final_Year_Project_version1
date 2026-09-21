import React from "react";
import {
  Stethoscope,
  ChevronRight,
  Info,
  Send,
} from "lucide-react";

export default function DoctorsTab({
  clinic,
  assignedDoctors = [],
  appointments = [],
  selectedDoctorCard,
  openDoctorCard,
  pendingIncomingRequests = [],
  handleRespondRequest,
  allDoctors = [],
  departments = [],
  inviteForm,
  setInviteForm,
  handleSendInvite,
}) {
  return (
    <div className="space-y-6">
      {/* Active Doctors (Top) */}
      <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
            <Stethoscope className="text-primary" /> Active Doctors
            <span className="badge badge-primary badge-sm font-bold">
              {assignedDoctors.length}
            </span>
          </h2>
          <span className="text-xs text-base-content/40 italic">
            Tap any doctor for full details →
          </span>
        </div>
        {assignedDoctors.length === 0 ? (
          <div className="text-center py-6 text-xs text-base-content/60">
            No active doctors linked to your clinic.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {assignedDoctors.map((d) => {
              const todayStr = new Date().toISOString().split("T")[0];
              const docAptsToday = appointments.filter(
                (a) =>
                  a.appointment_date === todayStr &&
                  (a.doctor === d.id || a.doctor_id === d.id)
              );
              const seenToday = docAptsToday.filter(
                (a) => a.status === "COMPLETED"
              ).length;
              const totalToday = docAptsToday.length;
              const isSelected = selectedDoctorCard?.id === d.id;

              return (
                <button
                  key={d.id}
                  onClick={() => clinic && openDoctorCard(d)}
                  className={`w-full text-left p-4 rounded-2xl border flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-base-200 bg-base-200/40 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-sm">
                    {(d.full_name || "?")[0].toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-base-content truncate">
                      {d.full_name?.startsWith("Dr.")
                        ? d.full_name
                        : `Dr. ${d.full_name}`}
                    </div>
                    <div className="text-xs text-base-content/55 mt-0.5 truncate">
                      {d.qualification || "—"}
                    </div>
                  </div>
                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold text-success flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block"></span>
                      Active
                    </span>
                    {totalToday > 0 ? (
                      <span className="text-xs font-bold text-primary">
                        {seenToday}/{totalToday} seen
                      </span>
                    ) : (
                      <span className="text-xs text-base-content/35">
                        No apts today
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-base-content/30 shrink-0"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Incoming Doctor Requests */}
      {pendingIncomingRequests.length > 0 && (
        <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
          <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
            <Info className="text-warning" /> Incoming Join Requests from Doctors (
            {pendingIncomingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingIncomingRequests.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-base-200/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div>
                  <div className="font-bold text-base-content">
                    {r.doctor?.full_name?.startsWith("Dr.")
                      ? r.doctor?.full_name
                      : `Dr. ${r.doctor?.full_name}`}
                  </div>
                  <div className="text-xs text-base-content/60">
                    Proposed Fee: ৳{r.consultation_fee} · Room:{" "}
                    {r.room_number || "N/A"}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleRespondRequest(r.id, "ACCEPT")}
                    className="btn btn-success btn-xs text-white cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondRequest(r.id, "REJECT")}
                    className="btn btn-error btn-xs text-white cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Invite Form (Bottom) */}
      {clinic && clinic.verification_status === "VERIFIED" && (
        <div className="bg-base-100 border border-base-200 p-6 rounded-3xl shadow-md space-y-4">
          <h2 className="text-lg font-extrabold text-base-content flex items-center gap-2">
            <Send className="text-primary" /> Send Service Request to Doctor
          </h2>
          <p className="text-xs text-base-content/60">
            Invite a registered, approved doctor to provide services at your clinic. They must accept before becoming active.
          </p>

          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label text-xs font-semibold">
                  Select Doctor *
                </label>
                <select
                  required
                  value={inviteForm.doctor_id}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, doctor_id: e.target.value })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="">-- Choose Doctor --</option>
                  {allDoctors
                    .filter((d) => d.verification_status === "VERIFIED")
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name?.startsWith("Dr.")
                          ? d.full_name
                          : `Dr. ${d.full_name}`}{" "}
                        ({d.qualification || d.email})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="label text-xs font-semibold">
                  Consultation Fee (৳ / BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="500.00"
                  value={inviteForm.consultation_fee}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      consultation_fee: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label text-xs font-semibold">
                  Department (optional)
                </label>
                <select
                  value={inviteForm.department_id}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      department_id: e.target.value,
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="">-- No department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs font-semibold">
                  Room Number (optional)
                </label>
                <input
                  type="text"
                  placeholder="Room 204"
                  value={inviteForm.room_number}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      room_number: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full gap-2 font-bold cursor-pointer"
            >
              <Send size={16} /> Send Service Invite
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
