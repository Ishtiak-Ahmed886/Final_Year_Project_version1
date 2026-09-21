import React, { useState, useEffect } from "react";
import apiClient from "../../../../api/axios";
import {
  Tv,
  AlertTriangle,
  UserPlus,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Pause,
  FastForward,
  Play,
  Users,
  Printer,
  CheckCircle2,
} from "lucide-react";

export default function ChamberReceptionTab({
  clinic,
  assignedDoctors = [],
  selectedDoctorId,
  setSelectedDoctorId,
  receptionSearchQuery,
  setReceptionSearchQuery,
  receptionDeptFilter,
  setReceptionDeptFilter,
  appointments = [],
  chamberSession,
  setChamberSession,
  updatingChamber,
  handleReceptionChamberAction,
  fetchReceptionChamberSession,
  liveSyncEnabled = true,
  setLiveSyncEnabled,
  isLiveSyncing = false,
  lastSyncedTime = null,
  refreshDeskData,
  delayModalOpen,
  setDelayModalOpen,
  receptionDelayMins,
  setReceptionDelayMins,
  receptionNotice,
  setReceptionNotice,
  handleBroadcastReceptionDelay,
  broadcastingDelay,
  walkInModalOpen,
  setWalkInModalOpen,
  walkInForm,
  setWalkInForm,
  submittingWalkIn,
  handleCreateWalkIn,
  setPrintTokenData,
  t = (k) => k,
}) {
  if (!clinic) {
    return (
      <div className="p-6 bg-warning/10 border border-warning/30 rounded-3xl flex items-start gap-4">
        <AlertTriangle className="text-warning shrink-0 mt-1" size={20} />
        <div>
          <h3 className="font-bold text-base-content">No Clinic Registered</h3>
          <p className="text-sm text-base-content/70 mt-1">
            Register your clinic first to manage live queue sessions.
          </p>
        </div>
      </div>
    );
  }

  if (assignedDoctors.length === 0) {
    return (
      <div className="p-6 bg-info/10 border border-info/30 rounded-3xl flex items-start gap-4">
        <AlertTriangle className="text-info shrink-0 mt-1" size={20} />
        <div>
          <h3 className="font-bold text-base-content">No Active Doctors</h3>
          <p className="text-sm text-base-content/70 mt-1">
            Invite and get at least one doctor accepted before managing live queues.
          </p>
        </div>
      </div>
    );
  }

  const todayDateStr = new Date().toISOString().split("T")[0];

  // Smart Patient Lookup State for Walk-in Modal
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [foundPatient, setFoundPatient] = useState(null);

  useEffect(() => {
    if (!walkInModalOpen) {
      setFoundPatient(null);
      setSearchingPatient(false);
      return;
    }
    const phone = (walkInForm?.walk_in_phone || "").trim();
    if (phone.length >= 11) {
      setSearchingPatient(true);
      const timer = setTimeout(async () => {
        try {
          const res = await apiClient.get(
            `/clinics/reception/patient-lookup/?phone=${encodeURIComponent(phone)}`
          );
          if (res?.found && res.patient) {
            setFoundPatient(res.patient);
            if (!walkInForm.walk_in_name && setWalkInForm) {
              setWalkInForm((prev) => ({
                ...prev,
                walk_in_name: res.patient.full_name || prev.walk_in_name,
              }));
            }
          } else {
            setFoundPatient(null);
          }
        } catch {
          setFoundPatient(null);
        } finally {
          setSearchingPatient(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setFoundPatient(null);
      setSearchingPatient(false);
    }
  }, [walkInForm?.walk_in_phone, walkInModalOpen, setWalkInForm]);

  const activeReceptionDoc =
    assignedDoctors.find((d) => String(d.id) === String(selectedDoctorId)) ||
    assignedDoctors[0];

  // Filter roster doctors based on search & department
  const filteredRosterDoctors = assignedDoctors.filter((d) => {
    const q = (receptionSearchQuery || "").toLowerCase().trim();
    const docName = (d.full_name || "").toLowerCase();
    const deptName = (d.department_name || d.department || "").toLowerCase();
    const room = (d.room_number || "").toLowerCase();
    const matchesQ =
      !q || docName.includes(q) || deptName.includes(q) || room.includes(q);
    const matchesDept =
      receptionDeptFilter === "ALL" ||
      String(d.department) === String(receptionDeptFilter) ||
      String(d.department_name) === String(receptionDeptFilter);
    return matchesQ && matchesDept;
  });

  // Today's appointments specifically for the active selected doctor
  const docTodayAppointments = appointments.filter(
    (a) =>
      a.appointment_date === todayDateStr &&
      (String(a.doctor) === String(selectedDoctorId) ||
        String(a.doctor_id) === String(selectedDoctorId))
  );
  const docSeenCount = docTodayAppointments.filter(
    (a) => a.status === "COMPLETED"
  ).length;
  const docWaitingCount = docTodayAppointments.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED"
  ).length;

  const emergencyWaitingPatients = docTodayAppointments.filter(
    (a) => a.is_emergency && a.status === "CONFIRMED" && a.id !== chamberSession?.active_emergency
  );

  const handleToggleEmergency = async (apt) => {
    try {
      await apiClient.post(`/appointments/${apt.id}/emergency/`, {
        is_emergency: !apt.is_emergency,
        emergency_reason: !apt.is_emergency ? "Flagged by Front Desk" : "",
      });
      if (refreshDeskData) refreshDeskData();
      if (fetchReceptionChamberSession) fetchReceptionChamberSession();
    } catch (err) {
      alert(err?.response?.data?.error || err?.detail || "Failed to update emergency status.");
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Roster Filter Toolbar */}
      <div className="bg-base-100 border border-base-200 p-5 rounded-3xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Tv size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-base-content flex items-center gap-2">
                Live Reception Command Desk
                <span className="badge badge-primary badge-sm font-bold">
                  {assignedDoctors.length} Doctors Active
                </span>
              </h2>
              <p className="text-xs text-base-content/60">
                Manage chamber serials and real-time patient arrivals across all doctors without switching tabs
              </p>
            </div>
          </div>

          {/* Action buttons & Live Sync controls */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Live Sync Status Toggle */}
            <button
              type="button"
              onClick={() => setLiveSyncEnabled && setLiveSyncEnabled(!liveSyncEnabled)}
              className={`btn btn-xs rounded-xl gap-1.5 font-bold transition-all border cursor-pointer ${
                liveSyncEnabled
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-base-200 text-base-content/60 border-base-300 hover:bg-base-300"
              }`}
              title={
                liveSyncEnabled
                  ? "Auto-sync (15s) is active. Click to pause."
                  : "Auto-sync is paused. Click to resume."
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  liveSyncEnabled
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-base-content/40"
                }`}
              />
              <span>{liveSyncEnabled ? "Live Sync: ON" : "Live Sync: PAUSED"}</span>
            </button>

            {lastSyncedTime && (
              <span className="text-[11px] font-mono text-base-content/50 hidden lg:inline" title="Last synced time">
                {lastSyncedTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}

            <button
              onClick={() =>
                refreshDeskData
                  ? refreshDeskData(false)
                  : fetchReceptionChamberSession()
              }
              disabled={isLiveSyncing}
              className="btn btn-ghost btn-sm gap-1 text-xs cursor-pointer"
              title="Refresh queue and appointments instantly"
            >
              <RotateCcw
                size={14}
                className={isLiveSyncing ? "animate-spin text-primary" : ""}
              />
              <span>{isLiveSyncing ? "Syncing..." : "Sync"}</span>
            </button>

            <button
              onClick={() => {
                setWalkInForm((prev) => ({
                  ...prev,
                  doctor_id:
                    selectedDoctorId || (assignedDoctors[0]?.id || ""),
                }));
                setWalkInModalOpen(true);
              }}
              className="btn btn-primary btn-sm gap-1.5 shadow-md font-bold flex-1 sm:flex-initial cursor-pointer"
              title="Issue instant walk-in token"
            >
              <UserPlus size={15} /> + Walk-in Token
            </button>
          </div>
        </div>

        {/* Search and Department Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 border-t border-base-200">
          <div className="relative flex-1 w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
            />
            <input
              type="text"
              value={receptionSearchQuery}
              onChange={(e) => setReceptionSearchQuery(e.target.value)}
              placeholder="Search doctor by name, room # or department..."
              className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs"
            />
          </div>
          <select
            value={receptionDeptFilter}
            onChange={(e) => setReceptionDeptFilter(e.target.value)}
            className="select select-bordered select-sm rounded-xl text-xs w-full sm:w-56 font-medium"
          >
            <option value="ALL">
              All Departments ({assignedDoctors.length})
            </option>
            {clinic?.departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Scalable Doctor Carousel Strip */}
      <div className="relative">
        <button
          onClick={() => {
            document
              .getElementById("receptionDoctorStrip")
              ?.scrollBy({ left: -260, behavior: "smooth" });
          }}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-base-100 border border-base-300 shadow-lg flex items-center justify-center text-base-content z-10 hover:bg-primary hover:text-white transition-all hidden sm:flex cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          id="receptionDoctorStrip"
          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth no-scrollbar px-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {filteredRosterDoctors.length === 0 ? (
            <div className="p-4 text-xs text-base-content/50 italic bg-base-100 rounded-2xl border border-base-200 w-full text-center">
              No doctors match your search or filter.
            </div>
          ) : (
            filteredRosterDoctors.map((d) => {
              const isSelected = String(d.id) === String(selectedDoctorId);
              const docApts = appointments.filter(
                (a) =>
                  a.appointment_date === todayDateStr &&
                  (String(a.doctor) === String(d.id) ||
                    String(a.doctor_id) === String(d.id))
              );
              const docSeen = docApts.filter(
                (a) => a.status === "COMPLETED"
              ).length;
              const docTotal = docApts.length;

              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDoctorId(d.id);
                    setChamberSession(null);
                  }}
                  className={`flex-shrink-0 w-64 text-left p-3.5 rounded-2xl border transition-all duration-150 relative cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-md ring-1 ring-primary"
                      : "bg-base-100 border-base-200 hover:border-primary/50 hover:bg-base-200/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      {(d.full_name || "D")[0].toUpperCase()}
                    </div>
                    <span className="badge badge-xs badge-neutral font-bold">
                      {d.room_number ? `Room ${d.room_number}` : "Chamber"}
                    </span>
                  </div>
                  <div className="font-extrabold text-xs text-base-content truncate">
                    {d.full_name?.startsWith("Dr.")
                      ? d.full_name
                      : `Dr. ${d.full_name}`}
                  </div>
                  <div className="text-[11px] text-base-content/60 truncate mt-0.5">
                    {d.department_name ||
                      d.qualification ||
                      "General Practice"}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-200/80 text-[11px]">
                    <span className="text-success font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      Active
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {docSeen}/{docTotal} seen
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={() => {
            document
              .getElementById("receptionDoctorStrip")
              ?.scrollBy({ left: 260, behavior: "smooth" });
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-base-100 border border-base-300 shadow-lg flex items-center justify-center text-base-content z-10 hover:bg-primary hover:text-white transition-all hidden sm:flex cursor-pointer"
          title="Scroll Right"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 3. Main Split-Screen Workspace (Left: Chamber Control | Right: Live Patient Queue) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Chamber & Serial Control */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-base-100 border border-base-200 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Stethoscope size={20} />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-base-content truncate">
                  {activeReceptionDoc?.full_name?.startsWith("Dr.")
                    ? activeReceptionDoc.full_name
                    : `Dr. ${activeReceptionDoc?.full_name}`}
                </div>
                <div className="text-xs text-base-content/60 truncate">
                  {activeReceptionDoc?.room_number
                    ? `Room ${activeReceptionDoc.room_number}`
                    : "Chamber Desk"}{" "}
                  · Fee: ৳{activeReceptionDoc?.consultation_fee || "—"}
                </div>
              </div>
            </div>
            {selectedDoctorId && clinic && (
              <a
                href={`/queue-display/${clinic.id}/${selectedDoctorId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-xs gap-1 shrink-0 font-bold"
                title="Open TV screen for waiting room"
              >
                <Tv size={12} /> TV Screen ↗
              </a>
            )}
          </div>

          {chamberSession ? (
            <div className="space-y-4">
              {(chamberSession.delay_minutes > 0 ||
                chamberSession.announcement_note) && (
                <div className="p-3.5 bg-warning/15 border border-warning/40 rounded-2xl flex items-start gap-2.5">
                  <AlertTriangle
                    className="text-warning shrink-0 mt-0.5"
                    size={16}
                  />
                  <div className="text-xs">
                    {chamberSession.delay_minutes > 0 && (
                      <span className="font-bold text-warning-content">
                        ⏱ +{chamberSession.delay_minutes} min delay broadcast.{" "}
                      </span>
                    )}
                    {chamberSession.announcement_note && (
                      <span className="text-base-content/80">
                        {chamberSession.announcement_note}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Large "Now Serving" Display Box */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-center">
                <div className="text-xs font-black tracking-widest uppercase text-indigo-300 mb-1">
                  Currently In Chamber
                </div>
                <div className="text-5xl font-black font-mono tracking-tight my-2">
                  #{chamberSession.current_serial || 0}
                </div>
                <div className="text-xs text-indigo-200/80 font-medium">
                  Status:{" "}
                  <span className="font-bold text-white uppercase">
                    {chamberSession.status?.replace("_", " ") || "ACTIVE"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10">
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-xs text-indigo-200 font-bold">
                      Total
                    </div>
                    <div className="text-lg font-black">
                      {chamberSession.total_serials ||
                        docTodayAppointments.length}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-xs text-indigo-200 font-bold">
                      Waiting
                    </div>
                    <div className="text-lg font-black text-warning">
                      {docWaitingCount}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <div className="text-xs text-indigo-200 font-bold">
                      Completed
                    </div>
                    <div className="text-lg font-black text-success">
                      {docSeenCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skipped / Held Serials */}
              {chamberSession.skipped_serials?.length > 0 && (
                <div className="bg-base-100 border border-base-200 p-3.5 rounded-2xl shadow-sm">
                  <div className="text-xs font-bold text-base-content/70 mb-2 flex items-center gap-1.5">
                    <Pause size={13} className="text-warning" /> Skipped Serials
                    (Click to Recall):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {chamberSession.skipped_serials.map((sn) => (
                      <button
                        key={sn}
                        onClick={() =>
                          handleReceptionChamberAction(
                            "RECALL_SERIAL",
                            null,
                            sn
                          )
                        }
                        disabled={updatingChamber}
                        className="badge badge-warning badge-sm font-bold cursor-pointer hover:badge-error"
                        title={`Recall Serial #${sn}`}
                      >
                        #{sn} Recall
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Emergency In Chamber Banner */}
              {chamberSession.active_emergency && (
                <div className="bg-rose-500/10 border-2 border-rose-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping mt-1 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-error text-white font-black text-xs">
                          🚨 ACTIVE EMERGENCY IN CHAMBER
                        </span>
                        <span className="font-mono font-black text-sm">
                          Serial #{chamberSession.active_emergency_details?.serial_number || "—"}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-base-content mt-1">
                        {chamberSession.active_emergency_details?.patient_name || "Emergency Patient"}
                      </div>
                      {chamberSession.active_emergency_details?.emergency_reason && (
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                          Reason: {chamberSession.active_emergency_details.emergency_reason}
                        </div>
                      )}
                      {chamberSession.held_patient_details && (
                        <div className="text-[11px] text-warning font-semibold mt-1">
                          ⏸️ Serial #{chamberSession.held_patient_details.serial_number} ({chamberSession.held_patient_details.patient_name}) is paused and will resume next.
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleReceptionChamberAction("COMPLETE_EMERGENCY")}
                    disabled={updatingChamber}
                    className="btn btn-error btn-sm text-white font-black shrink-0 cursor-pointer"
                  >
                    ✓ Complete Emergency
                  </button>
                </div>
              )}

              {/* Held Patient Paused Banner */}
              {chamberSession.held_patient && !chamberSession.active_emergency && (
                <div className="bg-amber-500/10 border-2 border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-warning text-black font-black text-xs">
                        ⏸️ HELD PATIENT PAUSED
                      </span>
                      <span className="font-mono font-black text-sm">
                        Serial #{chamberSession.held_patient_details?.serial_number || "—"}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-base-content mt-1">
                      {chamberSession.held_patient_details?.patient_name || "Held Patient"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleReceptionChamberAction("RESUME_HELD")}
                    disabled={updatingChamber}
                    className="btn btn-warning text-black btn-sm font-black shrink-0 cursor-pointer"
                  >
                    ▶️ Resume Held Patient
                  </button>
                </div>
              )}

              {/* Emergency Priority Queue Tray */}
              {emergencyWaitingPatients.length > 0 && (
                <div className="bg-rose-500/5 border border-rose-500/30 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> Emergency Priority Queue ({emergencyWaitingPatients.length})</span>
                    <span className="text-[10px] text-base-content/50 font-normal">Holds current serial on admit</span>
                  </div>
                  <div className="space-y-1.5">
                    {emergencyWaitingPatients.map((a) => (
                      <div key={a.id} className="bg-base-100 border border-rose-500/20 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="badge badge-error badge-xs font-black text-white shrink-0">#{a.serial_number}</span>
                            <span className="font-bold truncate">{a.patient_name || a.patient?.first_name || "Patient"}</span>
                          </div>
                          {a.emergency_reason && <div className="text-[10px] text-rose-500 truncate">{a.emergency_reason}</div>}
                        </div>
                        <button
                          onClick={() => handleReceptionChamberAction("ADMIT_EMERGENCY", null, null, { appointment_id: a.id, hold_current: true })}
                          disabled={updatingChamber || !!chamberSession.active_emergency}
                          className="btn btn-error btn-xs text-white font-bold shrink-0 cursor-pointer"
                          title={chamberSession.active_emergency ? "Chamber busy with emergency" : "Admit to chamber"}
                        >
                          Admit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fast Queue Actions */}
              <div className="bg-base-100 border border-base-200 p-5 rounded-3xl shadow-md space-y-4">
                <div className="text-xs font-black uppercase tracking-wider text-base-content/60">
                  Queue Actions
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() =>
                      handleReceptionChamberAction("NEXT_SERIAL")
                    }
                    disabled={updatingChamber || !!chamberSession.active_emergency || !!chamberSession.held_patient}
                    className="btn btn-primary gap-2 col-span-2 shadow-md font-extrabold text-sm cursor-pointer"
                    title={
                      chamberSession.active_emergency
                        ? "Cannot call next serial while emergency patient is in chamber"
                        : chamberSession.held_patient
                        ? "Resume held patient first"
                        : "Call Next Serial"
                    }
                  >
                    <FastForward size={16} /> Call Next Serial
                  </button>
                  <button
                    onClick={() =>
                      handleReceptionChamberAction("SKIP_SERIAL")
                    }
                    disabled={updatingChamber || !chamberSession.current_serial || !!chamberSession.active_emergency || !!chamberSession.held_patient}
                    className="btn btn-warning btn-sm gap-1.5 font-bold cursor-pointer"
                  >
                    <Pause size={14} /> Skip &amp; Hold
                  </button>
                  <button
                    onClick={() => handleReceptionChamberAction("RESET")}
                    disabled={updatingChamber || !!chamberSession.active_emergency || !!chamberSession.held_patient}
                    className="btn btn-ghost btn-outline btn-sm gap-1.5 text-xs cursor-pointer"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>

                {/* Doctor Status Quick Switch */}
                <div className="pt-2 border-t border-base-200">
                  <div className="text-[11px] font-bold text-base-content/50 uppercase tracking-wide mb-2">
                    Chamber State
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: "🏥 In Chamber",
                        status: "IN_CHAMBER",
                        cls: "btn-success",
                      },
                      {
                        label: "🕌 Break",
                        status: "PRAYER_BREAK",
                        cls: "btn-warning",
                      },
                      {
                        label: "⏸ Paused",
                        status: "PAUSED",
                        cls: "btn-ghost btn-outline",
                      },
                      {
                        label: "✅ Done",
                        status: "COMPLETED",
                        cls: "btn-neutral",
                      },
                    ].map((b) => (
                      <button
                        key={b.status}
                        onClick={() =>
                          handleReceptionChamberAction(
                            "UPDATE_STATUS",
                            b.status
                          )
                        }
                        disabled={
                          updatingChamber || chamberSession.status === b.status
                        }
                        className={`btn btn-xs gap-1 cursor-pointer ${b.cls} ${
                          chamberSession.status === b.status
                            ? "ring-2 ring-offset-1 ring-primary"
                            : ""
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delay Notice Button */}
                <div className="pt-1">
                  <button
                    onClick={() => setDelayModalOpen(true)}
                    className="btn btn-outline btn-xs gap-1.5 w-full text-base-content/70 cursor-pointer"
                  >
                    <AlertTriangle size={13} /> Broadcast Delay / Notice
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-base-100 border border-base-200 rounded-3xl p-8 text-center space-y-3 shadow-md">
              <Tv size={36} className="mx-auto text-base-content/25" />
              <div className="text-sm font-bold text-base-content">
                No active queue session found for today.
              </div>
              <p className="text-xs text-base-content/50 max-w-xs mx-auto">
                Start today&apos;s live chamber session for this doctor to enable serial call and TV screen sync.
              </p>
              <button
                onClick={() =>
                  handleReceptionChamberAction("UPDATE_STATUS", "NOT_STARTED")
                }
                disabled={updatingChamber}
                className="btn btn-primary btn-sm gap-2 font-bold cursor-pointer"
              >
                <Play size={14} /> Start Chamber Session
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Today's Live Patient Queue */}
        <div className="xl:col-span-7 bg-base-100 border border-base-200 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Today&apos;s Live Patient Queue
                <span className="badge badge-primary badge-sm font-bold">
                  {docTodayAppointments.length}
                </span>
              </h3>
              <p className="text-xs text-base-content/55 mt-0.5">
                Patients scheduled for Dr. {activeReceptionDoc?.full_name || "Doctor"} today
              </p>
            </div>
            <div className="text-xs font-bold text-base-content/60">
              {docSeenCount} Completed · {docWaitingCount} Waiting
            </div>
          </div>

          {docTodayAppointments.length === 0 ? (
            <div className="text-center py-12 text-xs text-base-content/50 space-y-2">
              <Users size={32} className="mx-auto text-base-content/20" />
              <div>No appointments booked for this doctor today.</div>
              <button
                onClick={() => {
                  setWalkInForm((prev) => ({
                    ...prev,
                    doctor_id:
                      selectedDoctorId || (assignedDoctors[0]?.id || ""),
                  }));
                  setWalkInModalOpen(true);
                }}
                className="btn btn-outline btn-xs gap-1 font-bold text-primary cursor-pointer"
              >
                <UserPlus size={13} /> + Issue Walk-in Token
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {docTodayAppointments.map((apt, index) => {
                const isCompleted = apt.status === "COMPLETED";
                const isCancelled = apt.status === "CANCELLED";
                const isInChamber =
                  chamberSession &&
                  chamberSession.current_serial ===
                    (apt.serial_number || index + 1);

                return (
                  <div
                    key={apt.id || index}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isInChamber
                        ? "bg-success/10 border-success/40 shadow-sm"
                        : isCompleted
                        ? "bg-base-200/30 border-base-200 opacity-65"
                        : "bg-base-100 border-base-200 hover:border-primary/40 hover:bg-base-200/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl font-mono font-black text-sm flex items-center justify-center shrink-0 ${
                          isInChamber
                            ? "bg-success text-white shadow-sm"
                            : isCompleted
                            ? "bg-base-300 text-base-content/60"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        #{apt.serial_number || index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-base-content truncate flex items-center gap-1.5">
                          {apt.patient_name || apt.user_name || "Patient"}
                          {isInChamber && (
                            <span className="badge badge-success badge-xs font-bold text-white">
                              In Chamber
                            </span>
                          )}
                          {apt.is_emergency && (
                            <span className="badge badge-error badge-xs font-black text-white gap-1 animate-pulse">
                              <AlertTriangle size={10} /> Emergency
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-base-content/60 truncate">
                          📞 {apt.patient_phone || apt.phone || "—"} · ⏰{" "}
                          {apt.appointment_time || "Morning"}
                          {apt.is_emergency && apt.emergency_reason && (
                            <span className="text-error font-medium ml-1">
                              · {apt.emergency_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleEmergency(apt)}
                        className={`btn btn-ghost btn-xs btn-circle cursor-pointer ${
                          apt.is_emergency ? "text-error" : "text-base-content/40 hover:text-error"
                        }`}
                        title={apt.is_emergency ? "Remove Emergency Priority" : "Flag as Emergency Priority"}
                      >
                        <AlertTriangle size={13} />
                      </button>
                      {setPrintTokenData && (
                        <button
                          onClick={() => setPrintTokenData(apt)}
                          className="btn btn-ghost btn-xs btn-circle cursor-pointer text-base-content/60 hover:text-primary hover:bg-primary/10"
                          title="Print / Reprint Thermal Token Slip"
                        >
                          <Printer size={13} />
                        </button>
                      )}
                      <span
                        className={`badge badge-sm font-bold ${
                          isCompleted
                            ? "badge-ghost"
                            : isCancelled
                            ? "badge-error"
                            : isInChamber
                            ? "badge-success text-white"
                            : "badge-info"
                        }`}
                      >
                        {isCompleted
                          ? "Completed"
                          : isCancelled
                          ? "Cancelled"
                          : isInChamber
                          ? "Serving"
                          : "Waiting"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Delay Modal */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-base-content flex items-center gap-2">
                <AlertTriangle className="text-warning" size={20} /> Broadcast Delay &amp; Notice
              </h3>
              <button
                onClick={() => setDelayModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-base-content/60">
              This will immediately push a delay notice to all patient waiting room displays for this doctor&apos;s queue.
            </p>
            <form
              onSubmit={handleBroadcastReceptionDelay}
              className="space-y-4"
            >
              <div>
                <label className="label text-xs font-semibold">
                  Delay (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={receptionDelayMins}
                  onChange={(e) => setReceptionDelayMins(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="label text-xs font-semibold">
                  Announcement Message (optional)
                </label>
                <textarea
                  value={receptionNotice}
                  onChange={(e) => setReceptionNotice(e.target.value)}
                  className="textarea textarea-bordered w-full"
                  placeholder="e.g. Doctor is in surgery, please wait..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={broadcastingDelay}
                  className="btn btn-warning flex-1 gap-2"
                >
                  {broadcastingDelay ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <AlertTriangle size={15} />
                  )}
                  Broadcast Now
                </button>
                <button
                  type="button"
                  onClick={() => setDelayModalOpen(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Walk-in Patient Entry Modal */}
      {walkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary font-bold">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-base-content">
                    {t("walkInModalTitle") || "Register Walk-in Patient"}
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Issue instant serial token for walk-in patient at clinic counter
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWalkInModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Mobile Number *</span>
                    {searchingPatient && (
                      <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
                        <span className="loading loading-spinner loading-xs" /> Searching...
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    required
                    value={walkInForm.walk_in_phone}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        walk_in_phone: e.target.value,
                      })
                    }
                    className="input input-bordered w-full font-medium"
                    placeholder="e.g. 01712345678"
                  />
                  {foundPatient ? (
                    <div className="mt-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>
                        <strong>Registered:</strong> {foundPatient.full_name} ({foundPatient.clinic_visits_count} past visits)
                      </span>
                    </div>
                  ) : (
                    walkInForm.walk_in_phone?.length >= 11 && !searchingPatient && (
                      <div className="mt-1 text-[11px] text-base-content/50">
                        New walk-in patient profile
                      </div>
                    )
                  )}
                </div>

                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkInForm.walk_in_name}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        walk_in_name: e.target.value,
                      })
                    }
                    className="input input-bordered w-full font-medium"
                    placeholder="e.g. Md. Rafiqul Islam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">
                    Doctor *
                  </label>
                  <select
                    required
                    value={walkInForm.doctor_id}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        doctor_id: e.target.value,
                      })
                    }
                    className="select select-bordered w-full"
                  >
                    <option value="">-- Select Doctor --</option>
                    {assignedDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs font-bold uppercase tracking-wider">
                    Time Slot (Optional)
                  </label>
                  <input
                    type="time"
                    value={walkInForm.appointment_time}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        appointment_time: e.target.value,
                      })
                    }
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold uppercase tracking-wider">
                  Chief Complaint / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={walkInForm.problem_description}
                  onChange={(e) =>
                    setWalkInForm({
                      ...walkInForm,
                      problem_description: e.target.value,
                    })
                  }
                  className="input input-bordered w-full text-xs"
                  placeholder="e.g. High fever for 3 days, headache"
                />
              </div>

              {/* Emergency / Urgent Priority */}
              <div className="p-3 bg-error/10 border border-error/20 rounded-2xl space-y-2">
                <label className="label cursor-pointer justify-start gap-3 p-0">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-error"
                    checked={walkInForm.is_emergency || false}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        is_emergency: e.target.checked,
                      })
                    }
                  />
                  <div>
                    <span className="label-text font-black text-error flex items-center gap-1">
                      <AlertTriangle size={15} /> Urgent / Emergency Patient (জরুরি অগ্রাধিকার)
                    </span>
                    <div className="text-[11px] text-base-content/60">
                      Flags patient for chamber priority without changing serial numbering.
                    </div>
                  </div>
                </label>
                {walkInForm.is_emergency && (
                  <div>
                    <input
                      type="text"
                      className="input input-sm input-bordered border-error/50 w-full text-xs"
                      placeholder="Emergency Reason (e.g. Chest pain, severe trauma, respiratory distress)"
                      value={walkInForm.emergency_reason || ""}
                      onChange={(e) =>
                        setWalkInForm({
                          ...walkInForm,
                          emergency_reason: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-base-200/60 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-base-content">
                  <span>Payment Mode:</span>
                  <span className="text-success font-black">
                    {t("cashAtCounterInstant") || "Cash at Counter (Instant Paid)"}
                  </span>
                </div>
                <div className="text-[11px] text-base-content/60">
                  Appointment will be immediately confirmed, serial token assigned, and cash transaction recorded.
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="btn btn-primary flex-1 gap-2 font-bold shadow-md"
                >
                  {submittingWalkIn ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Printer size={16} />
                  )}
                  Confirm &amp; Issue Token Slip
                </button>
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
