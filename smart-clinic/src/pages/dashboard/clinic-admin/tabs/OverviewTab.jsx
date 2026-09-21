import React from "react";
import {
  Stethoscope,
  Activity,
  DollarSign,
  Calendar,
  TrendingUp,
  UserPlus,
  Tv,
  Printer,
  AlertTriangle,
  Send,
  CheckCircle2,
  LineChart,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function OverviewTab({
  clinic,
  overviewStats,
  loadingOverviewStats,
  assignedDoctors = [],
  appointments = [],
  pendingIncomingRequests = [],
  overviewTrendRange = "30d",
  setOverviewTrendRange,
  trendChartType = "line",
  setTrendChartType,
  hoveredTrendIdx,
  setHoveredTrendIdx,
  setActiveTab,
  setWalkInForm,
  setWalkInModalOpen,
  selectedDoctorId,
  language = "en",
  t = (k) => k,
}) {
  return (
    <div className="space-y-5">
      {/* Loading State */}
      {loadingOverviewStats && (
        <div className="flex items-center gap-3 p-4 bg-base-100 border border-base-200 rounded-2xl text-sm text-base-content/60">
          <span className="loading loading-spinner loading-sm text-primary" />
          Loading clinic overview...
        </div>
      )}

      {/* ── B. CLINIC AT A GLANCE ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Doctors",
            value: overviewStats?.doctors?.active ?? assignedDoctors.length,
            sub:
              overviewStats?.doctors?.inactive != null
                ? `${overviewStats.doctors.inactive} inactive`
                : null,
            icon: <Stethoscope size={22} />,
            color: "primary",
            onClick: () => setActiveTab("doctors"),
          },
          {
            label: "Working Today",
            value: overviewStats?.doctors?.working_today ?? "—",
            sub: "Doctors with active sessions",
            icon: <Activity size={22} />,
            color: "success",
            onClick: () => setActiveTab("chamber"),
          },
          {
            label: "Today's Revenue",
            value:
              overviewStats?.financial_snapshot?.today_total != null
                ? `৳${overviewStats.financial_snapshot.today_total.toLocaleString("en-BD")}`
                : "৳0",
            sub:
              overviewStats?.appointments?.completed != null
                ? `${overviewStats.appointments.completed} paid appointment${
                    overviewStats.appointments.completed !== 1 ? "s" : ""
                  }`
                : "No payments yet",
            icon: <DollarSign size={22} />,
            color:
              overviewStats?.financial_snapshot?.today_total > 0
                ? "success"
                : "secondary",
            onClick: () => setActiveTab("finance"),
          },
          {
            label: "Today's Appointments",
            value:
              overviewStats?.appointments?.total_today ??
              appointments.filter(
                (a) =>
                  a.appointment_date ===
                  new Date().toISOString().split("T")[0]
              ).length,
            sub:
              overviewStats?.appointments?.completed != null
                ? `${overviewStats.appointments.completed} completed`
                : null,
            icon: <Calendar size={22} />,
            color: "accent",
            onClick: () => setActiveTab("appointments"),
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={s.onClick}
            className="p-5 bg-base-100 border border-base-200 rounded-2xl shadow-sm flex items-start gap-3 hover:border-primary/40 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div
              className={`p-2.5 bg-${s.color}/10 rounded-xl text-${s.color} shrink-0 group-hover:bg-${s.color}/20 transition-colors`}
            >
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-base-content/60 font-medium">
                {s.label}
              </div>
              <div className="text-2xl font-extrabold text-base-content leading-tight">
                {s.value}
              </div>
              {s.sub && (
                <div className="text-xs text-base-content/50 mt-0.5 truncate">
                  {s.sub}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* ── C. QUICK RECEPTION SHORTCUTS ── */}
      <div className="bg-base-100 border border-base-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-base-content flex items-center gap-2">
            <span>⚡ {t("quickShortcuts") || "Quick Shortcuts"}</span>
            <span className="text-xs text-base-content/50 font-normal">
              ({t("quickShortcutsHint") || "Reception Fast Actions"})
            </span>
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => {
              setWalkInForm((prev) => ({
                ...prev,
                doctor_id:
                  selectedDoctorId || (assignedDoctors[0]?.id || ""),
              }));
              setWalkInModalOpen(true);
            }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-content flex items-center justify-center text-base font-bold shadow-xs shrink-0">
              <UserPlus size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-base-content">
                {t("newWalkIn") || "New Walk-in"}
              </div>
              <div className="text-[11px] text-base-content/60 truncate">
                {t("newWalkInSub") || "Register Counter Patient"}
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("chamber")}
            className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 text-rose-900 transition text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center text-base font-bold shadow-xs shrink-0">
              <Tv size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-base-content">
                {t("waitingRoomTv") || "Live Waiting TV"}
              </div>
              <div className="text-[11px] text-base-content/60 truncate">
                {t("waitingRoomTvSub") || "Fullscreen Token Board"}
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("finance")}
            className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 text-emerald-900 transition text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base font-bold shadow-xs shrink-0">
              <Printer size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-base-content">
                {t("dailyCashAudit") || "Daily Cash Audit"}
              </div>
              <div className="text-[11px] text-base-content/60 truncate">
                {t("dailyCashAuditSub") || "Counters Settlement"}
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("doctors")}
            className="flex items-center gap-3 p-3 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 text-base-content transition text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-base-content text-base-100 flex items-center justify-center text-base font-bold shadow-xs shrink-0">
              <Stethoscope size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-base-content">
                {t("inviteDoctor") || "Invite Doctor"}
              </div>
              <div className="text-[11px] text-base-content/60 truncate">
                {t("inviteDoctorSub") || "Add to Clinic Chamber"}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── D. MAIN 2-COLUMN OPERATIONAL SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Today's Appointments & Real Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Today's Appointment Breakdown */}
          <div className="bg-base-100 border border-base-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-base-content flex items-center gap-1.5">
                <Calendar size={16} className="text-primary" /> Today&apos;s Queue Status
              </h3>
              <span className="text-xs text-base-content/50 font-mono">
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>

            {(() => {
              const todayDateStr = new Date().toISOString().split("T")[0];
              const todayApts = appointments.filter(
                (a) => a.appointment_date === todayDateStr
              );
              const totalBooked =
                overviewStats?.appointments?.total_today ?? todayApts.length;
              const completed =
                overviewStats?.appointments?.completed ??
                todayApts.filter((a) => a.status === "COMPLETED").length;
              const confirmed =
                overviewStats?.appointments?.confirmed_upcoming ??
                todayApts.filter((a) => a.status === "CONFIRMED").length;
              const pending =
                overviewStats?.appointments?.pending ??
                todayApts.filter((a) => a.status === "PENDING").length;
              const cancelled =
                overviewStats?.appointments?.cancelled ??
                todayApts.filter((a) => a.status === "CANCELLED").length;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm pb-2 border-b border-base-200 font-bold">
                    <span className="text-base-content/70">
                      Total Booked (Today)
                    </span>
                    <span className="text-base font-black text-base-content">
                      {totalBooked} Patients
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
                      Visits
                    </span>
                    <span className="font-black text-emerald-700 font-mono">
                      {completed}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-sky-700 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" /> Confirmed in
                      Lobby
                    </span>
                    <span className="font-black text-sky-700 font-mono">
                      {confirmed}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending Cash
                      at Counter
                    </span>
                    <span className="font-black text-amber-700 font-mono">
                      {pending}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Cancelled
                    </span>
                    <span className="font-black text-rose-700 font-mono">
                      {cancelled}
                    </span>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setActiveTab("appointments")}
              className="w-full text-center py-2.5 text-xs font-bold text-primary hover:text-primary-focus bg-primary/5 hover:bg-primary/10 rounded-xl transition mt-2 cursor-pointer"
            >
              View All in Appointments Tab →
            </button>
          </div>

          {/* Real Action Alerts */}
          <div className="bg-base-100 border border-base-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-base-content/70">
                Action Required
              </h4>
            </div>

            {(() => {
              const pending =
                overviewStats?.doctors?.pending_requests ??
                pendingIncomingRequests.length;
              const activeDocsCount =
                overviewStats?.doctors?.active ?? assignedDoctors.length;

              if (pending > 0) {
                return (
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-warning/30 bg-warning/5">
                    <Send size={15} className="text-warning shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-base-content">
                        {pending} doctor request{pending > 1 ? "s" : ""} waiting for review
                      </div>
                      <div className="text-xs text-base-content/60 mt-0.5">
                        Doctor cannot start seeing patients until approved
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("doctors")}
                      className="btn btn-xs btn-warning shrink-0 cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                );
              }

              if (activeDocsCount === 0) {
                return (
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-info/30 bg-info/5">
                    <Stethoscope size={15} className="text-info shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-base-content">
                        No active doctors in clinic
                      </div>
                      <div className="text-xs text-base-content/60 mt-0.5">
                        Invite doctors to begin scheduling appointments
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("doctors")}
                      className="btn btn-xs btn-info shrink-0 cursor-pointer"
                    >
                      Invite
                    </button>
                  </div>
                );
              }

              return (
                <div className="p-3 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-2.5 text-success-content text-xs">
                  <CheckCircle2 size={20} className="text-success shrink-0" />
                  <div>
                    <div className="font-bold text-base-content">
                      Everything is running smoothly
                    </div>
                    <div className="text-[11px] text-base-content/60">
                      0 pending doctor requests • All doctors verified
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT: Appointment Trend Graph (7 cols) */}
        <div className="lg:col-span-7 bg-base-100 border border-base-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          {(() => {
            const trendData = overviewStats?.appointment_trend || [];
            const data =
              overviewTrendRange === "7d" ? trendData.slice(-7) : trendData;
            const totalBookings = data.reduce(
              (s, d) => s + (d.total || 0),
              0
            );
            const totalCompleted = data.reduce(
              (s, d) => s + (d.completed || 0),
              0
            );
            const totalCancelled = data.reduce(
              (s, d) => s + (d.cancelled || 0),
              0
            );
            const completionRate =
              totalBookings > 0
                ? Math.round((totalCompleted / totalBookings) * 100)
                : 100;

            const parseDateInfo = (dStr) => {
              if (!dStr)
                return {
                  day: "",
                  month: "",
                  fullDate: "",
                  formatted: "",
                  weekday: "",
                };
              const parts = dStr.split("-");
              if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                const dateObj = new Date(y, m, d);
                const monthShort = [
                  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                ];
                const monthFull = [
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December",
                ];
                const weekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                return {
                  day: String(d).padStart(2, "0"),
                  dayNum: d,
                  weekday: weekShort[dateObj.getDay()] || "",
                  month: monthShort[m] || "",
                  monthFull: monthFull[m] || "",
                  year: parts[0],
                  formatted: `${d} ${monthShort[m] || ""}`,
                  fullDate: `${d} ${monthFull[m] || ""}, ${parts[0]}`,
                };
              }
              return {
                day: "",
                month: "",
                fullDate: dStr,
                formatted: dStr,
                weekday: "",
              };
            };

            const firstInfo =
              data.length > 0 ? parseDateInfo(data[0].date) : null;
            const lastInfo =
              data.length > 0
                ? parseDateInfo(data[data.length - 1].date)
                : null;
            const monthDisplayTitle = !firstInfo
              ? "Appointment Trends"
              : firstInfo.month === lastInfo?.month
              ? `${firstInfo.monthFull} ${firstInfo.year}`
              : `${firstInfo.monthFull} – ${lastInfo?.monthFull} ${lastInfo?.year}`;

            const half = Math.floor(data.length / 2);
            const firstHalfTotal = data
              .slice(0, half)
              .reduce((s, d) => s + (d.total || 0), 0);
            const secondHalfTotal = data
              .slice(half)
              .reduce((s, d) => s + (d.total || 0), 0);
            const trendDiff = secondHalfTotal - firstHalfTotal;
            const trendPct =
              firstHalfTotal > 0
                ? Math.round((Math.abs(trendDiff) / firstHalfTotal) * 100)
                : secondHalfTotal > 0
                ? 100
                : 0;
            const isUpTrend = trendDiff >= 0;

            let peakMax = 0;
            let peakDateStr = "";
            data.forEach((d) => {
              if ((d.total || 0) > peakMax) {
                peakMax = d.total || 0;
                peakDateStr = d.date;
              }
            });

            const peakCount = Math.max(
              ...data.map((d) => d.total || 0),
              0
            );
            const yMax =
              peakCount <= 4 ? 6 : Math.ceil(peakCount / 4) * 4;
            const yTicks = [
              yMax,
              Math.round(yMax * 0.75),
              Math.round(yMax * 0.5),
              Math.round(yMax * 0.25),
              0,
            ];

            const svgW = 680;
            const svgH = 190;
            const padL = 36;
            const padR = 24;
            const padT = 20;
            const padB = 34;
            const plotW = svgW - padL - padR;
            const plotH = svgH - padT - padB;
            const baseLineY = padT + plotH;
            const nPts = data.length;

            const points = data.map((d, i) => {
              const x =
                padL + (nPts > 1 ? (i / (nPts - 1)) * plotW : plotW / 2);
              const ratio = Math.min((d.total || 0) / yMax, 1);
              const y = padT + plotH - ratio * plotH;
              return { x, y, data: d, idx: i };
            });

            const compPoints = data.map((d, i) => {
              const x =
                padL + (nPts > 1 ? (i / (nPts - 1)) * plotW : plotW / 2);
              const ratio = Math.min((d.completed || 0) / yMax, 1);
              const y = padT + plotH - ratio * plotH;
              return { x, y, val: d.completed || 0 };
            });

            const buildSmoothPath = (pts) => {
              if (!pts || pts.length === 0) return "";
              if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
              let str = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
              for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[i === 0 ? 0 : i - 1];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

                const cp1x = p1.x + (p2.x - p0.x) * 0.18;
                const cp1y = p1.y + (p2.y - p0.y) * 0.18;
                const cp2x = p2.x - (p3.x - p1.x) * 0.18;
                const cp2y = p2.y - (p3.y - p1.y) * 0.18;

                str += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
              }
              return str;
            };

            const linePath = buildSmoothPath(points);
            const areaPath =
              points.length > 1
                ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baseLineY} L ${points[0].x.toFixed(1)} ${baseLineY} Z`
                : "";
            const compLinePath = buildSmoothPath(compPoints);

            const xTickIndices =
              overviewTrendRange === "7d"
                ? [0, 1, 2, 3, 4, 5, 6].filter((idx) => idx < nPts)
                : [
                    0,
                    Math.floor((nPts - 1) * 0.2),
                    Math.floor((nPts - 1) * 0.4),
                    Math.floor((nPts - 1) * 0.6),
                    Math.floor((nPts - 1) * 0.8),
                    nPts - 1,
                  ];

            const activeHoverPoint =
              hoveredTrendIdx !== null && points[hoveredTrendIdx]
                ? points[hoveredTrendIdx]
                : null;

            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-base-content flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" /> Appointment Flow &amp; Trends
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        📅 {monthDisplayTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-base-content/60 flex-wrap">
                      <span>
                        {overviewTrendRange === "7d"
                          ? t("weeklyTrendSubtitle") || "Daily trajectory for this week"
                          : t("monthlyTrendSubtitle") || "30-day comprehensive volume"}
                      </span>
                      {totalBookings > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 font-extrabold text-[11px] px-2 py-0.5 rounded-md ${
                            isUpTrend
                              ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                              : "text-rose-700 bg-rose-50 border border-rose-200"
                          }`}
                        >
                          {isUpTrend ? (
                            <ArrowUpRight size={13} className="stroke-[3]" />
                          ) : (
                            <ArrowDownRight size={13} className="stroke-[3]" />
                          )}
                          {isUpTrend
                            ? `+${trendPct}% ${t("rise") || "Rise"}`
                            : `-${trendPct}% ${t("fall") || "Fall"}`}
                        </span>
                      )}
                      {peakMax > 0 && (
                        <span className="text-[11px] font-mono text-base-content/50">
                          • {language === "bn" ? "সর্বোচ্চ" : "Peak"}: {peakMax}{" "}
                          {language === "bn" ? "অ্যাপয়েন্টমেন্ট" : "appts"} (
                          {parseDateInfo(peakDateStr).formatted})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls: Range + Chart Type */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-base-200/80 p-0.5 rounded-xl border border-base-200">
                      <button
                        type="button"
                        onClick={() => setTrendChartType("line")}
                        title="Up & Down Wave Line Chart"
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                          trendChartType === "line"
                            ? "bg-primary text-primary-content shadow-xs"
                            : "text-base-content/70 hover:text-base-content"
                        }`}
                      >
                        <LineChart size={13} /> Line
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrendChartType("bar")}
                        title="Column Bar Chart"
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                          trendChartType === "bar"
                            ? "bg-primary text-primary-content shadow-xs"
                            : "text-base-content/70 hover:text-base-content"
                        }`}
                      >
                        <BarChart2 size={13} /> Bar
                      </button>
                    </div>

                    <div className="flex bg-base-200/80 p-0.5 rounded-xl border border-base-200">
                      <button
                        type="button"
                        onClick={() => {
                          setOverviewTrendRange("7d");
                          setHoveredTrendIdx(null);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          overviewTrendRange === "7d"
                            ? "bg-primary text-primary-content shadow-xs"
                            : "text-base-content/70 hover:text-base-content"
                        }`}
                      >
                        Weekly (7d)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOverviewTrendRange("30d");
                          setHoveredTrendIdx(null);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          overviewTrendRange === "30d"
                            ? "bg-primary text-primary-content shadow-xs"
                            : "text-base-content/70 hover:text-base-content"
                        }`}
                      >
                        Monthly (30d)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Period Summary KPI Strip */}
                <div className="grid grid-cols-3 gap-3 bg-base-200/30 p-3 rounded-2xl border border-base-200 text-center">
                  <div>
                    <div className="text-[11px] text-base-content/50 font-medium">
                      {overviewTrendRange === "7d"
                        ? "Weekly Volume (7d)"
                        : "Monthly Volume (30d)"}
                    </div>
                    <div className="text-base font-black text-base-content">
                      {totalBookings} Bookings
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-emerald-600 font-medium">
                      {overviewTrendRange === "7d"
                        ? "Weekly Completed (7d)"
                        : "Monthly Completed (30d)"}
                    </div>
                    <div className="text-base font-black text-emerald-600">
                      {totalCompleted} Visits
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-indigo-600 font-medium">
                      Period Success Rate
                    </div>
                    <div className="text-base font-black text-indigo-600">
                      {completionRate}%
                    </div>
                  </div>
                </div>

                {/* CHART AREA */}
                {trendChartType === "line" ? (
                  <div className="relative pt-2 pb-1 select-none">
                    <div className="h-6 flex items-center justify-between px-1 mb-1 text-xs">
                      {activeHoverPoint ? (
                        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-xl shadow-lg">
                          <span className="font-bold text-indigo-200">
                            {parseDateInfo(activeHoverPoint.data.date).weekday},{" "}
                            {parseDateInfo(activeHoverPoint.data.date).fullDate}:
                          </span>
                          <span className="font-extrabold text-white">
                            {activeHoverPoint.data.total || 0} Booked
                          </span>
                          <span className="text-emerald-400 font-semibold">
                            • {activeHoverPoint.data.completed || 0} Done
                          </span>
                          {activeHoverPoint.data.cancelled > 0 && (
                            <span className="text-rose-400 font-semibold">
                              • {activeHoverPoint.data.cancelled} Cancelled
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-base-content/50 italic flex items-center gap-1">
                          {t("trendHoverHint") || "Hover over any point to view details"}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-base-content/40 hidden sm:inline">
                        Range: {firstInfo?.formatted} – {lastInfo?.formatted}
                      </span>
                    </div>

                    <div className="w-full relative overflow-x-auto overflow-y-visible bg-base-200/20 rounded-2xl border border-base-200/60 p-2">
                      <svg
                        viewBox={`0 0 ${svgW} ${svgH}`}
                        className="w-full h-48 block overflow-visible"
                        onMouseLeave={() => setHoveredTrendIdx(null)}
                      >
                        <defs>
                          <linearGradient
                            id="upDownAreaGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#6366f1"
                              stopOpacity="0.38"
                            />
                            <stop
                              offset="60%"
                              stopColor="#6366f1"
                              stopOpacity="0.09"
                            />
                            <stop
                              offset="100%"
                              stopColor="#6366f1"
                              stopOpacity="0.0"
                            />
                          </linearGradient>
                        </defs>

                        {yTicks.map((val, idx) => {
                          const yPos =
                            padT + (idx / (yTicks.length - 1)) * plotH;
                          return (
                            <g key={idx}>
                              <text
                                x={padL - 8}
                                y={yPos + 3.5}
                                textAnchor="end"
                                className="text-[10px] font-mono fill-base-content/40 select-none"
                              >
                                {val}
                              </text>
                              <line
                                x1={padL}
                                y1={yPos}
                                x2={padL + plotW}
                                y2={yPos}
                                stroke="currentColor"
                                className="text-base-200/70"
                                strokeDasharray="4 4"
                                strokeWidth="1"
                              />
                            </g>
                          );
                        })}

                        {areaPath && (
                          <path d={areaPath} fill="url(#upDownAreaGrad)" />
                        )}

                        {compLinePath && (
                          <path
                            d={compLinePath}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeDasharray="5 4"
                            className="opacity-75"
                          />
                        )}

                        {linePath && (
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {xTickIndices.map((idx) => {
                          const pt = points[idx];
                          if (!pt) return null;
                          const info = parseDateInfo(pt.data.date);
                          return (
                            <g key={idx}>
                              <line
                                x1={pt.x}
                                y1={baseLineY}
                                x2={pt.x}
                                y2={baseLineY + 5}
                                stroke="currentColor"
                                className="text-base-300"
                                strokeWidth="1.5"
                              />
                              <text
                                x={pt.x}
                                y={baseLineY + 18}
                                textAnchor="middle"
                                className="text-[10px] font-extrabold fill-base-content/70 font-mono select-none"
                              >
                                {info.formatted}
                              </text>
                              {overviewTrendRange === "7d" && (
                                <text
                                  x={pt.x}
                                  y={baseLineY + 28}
                                  textAnchor="middle"
                                  className="text-[9px] font-bold fill-base-content/40 select-none"
                                >
                                  {info.weekday}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {points.map((pt, i) => {
                          const isPeak =
                            pt.data.total === peakMax && peakMax > 0;
                          const isToday = i === points.length - 1;
                          const isHovered = hoveredTrendIdx === i;
                          return (
                            <g key={i}>
                              {isPeak && (
                                <g transform={`translate(${pt.x}, ${pt.y - 10})`}>
                                  <circle r="3" fill="#f59e0b" />
                                </g>
                              )}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 6 : isPeak || isToday ? 4.5 : 3}
                                fill={
                                  isHovered
                                    ? "#4f46e5"
                                    : isPeak
                                    ? "#f59e0b"
                                    : isToday
                                    ? "#06b6d4"
                                    : "#4f46e5"
                                }
                                stroke="#ffffff"
                                strokeWidth={isHovered ? "2.5" : "1.5"}
                                className="cursor-pointer"
                              />
                            </g>
                          );
                        })}

                        {activeHoverPoint && (
                          <g pointerEvents="none">
                            <line
                              x1={activeHoverPoint.x}
                              y1={padT}
                              x2={activeHoverPoint.x}
                              y2={baseLineY}
                              stroke="#4f46e5"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            <circle
                              cx={activeHoverPoint.x}
                              cy={activeHoverPoint.y}
                              r="7"
                              fill="#4f46e5"
                              stroke="#ffffff"
                              strokeWidth="3"
                            />
                          </g>
                        )}

                        {points.map((pt, i) => {
                          const colW = plotW / Math.max(nPts, 1);
                          return (
                            <rect
                              key={i}
                              x={pt.x - colW / 2}
                              y={padT}
                              width={colW}
                              height={plotH + padB}
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredTrendIdx(i)}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="relative pt-4 pb-2">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-9 pl-7">
                      {yTicks.map((val, idx) => (
                        <div key={idx} className="flex items-center w-full">
                          <span className="text-[10px] font-mono text-base-content/40 w-6 text-right pr-2 select-none -translate-y-1/2">
                            {val}
                          </span>
                          <div className="flex-1 border-b border-dashed border-base-200/70" />
                        </div>
                      ))}
                    </div>

                    {overviewTrendRange === "7d" ? (
                      <div className="relative z-10 pl-7 h-44 flex items-end justify-around gap-2">
                        {data.map((d, i) => {
                          const info = parseDateInfo(d.date);
                          const isToday = i === data.length - 1;
                          const heightPct = Math.round(
                            ((d.total || 0) / yMax) * 100
                          );
                          const completedPct =
                            d.total > 0
                              ? Math.round(
                                  ((d.completed || 0) / d.total) * 100
                                )
                              : 0;

                          return (
                            <div
                              key={d.date}
                              className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                            >
                              <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-xl shadow-xl z-30 whitespace-nowrap pointer-events-none">
                                <span className="font-bold">
                                  {info.weekday}, {info.formatted}
                                </span>
                                <span className="text-indigo-300 font-medium">
                                  {d.total} Booked • {d.completed} Done{" "}
                                  {d.cancelled > 0
                                    ? `• ${d.cancelled} Cancelled`
                                    : ""}
                                </span>
                                <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1 mt-0.5" />
                              </div>

                              <div
                                className={`text-xs font-black mb-1.5 transition-all ${
                                  isToday
                                    ? "text-primary scale-110"
                                    : d.total > 0
                                    ? "text-base-content"
                                    : "text-base-content/30"
                                }`}
                              >
                                {d.total > 0 ? d.total : "0"}
                              </div>

                              <div className="w-full max-w-[36px] flex flex-col justify-end">
                                {d.total > 0 ? (
                                  <div
                                    className={`w-full rounded-t-xl transition-all shadow-xs overflow-hidden flex flex-col justify-end ${
                                      isToday
                                        ? "ring-2 ring-primary ring-offset-1"
                                        : ""
                                    }`}
                                    style={{
                                      height: `${Math.max(heightPct, 12)}%`,
                                    }}
                                  >
                                    {d.cancelled > 0 && (
                                      <div
                                        className="w-full bg-rose-400"
                                        style={{
                                          height: `${Math.round(
                                            (d.cancelled / d.total) * 100
                                          )}%`,
                                        }}
                                      />
                                    )}
                                    <div className="w-full flex-1 bg-gradient-to-t from-indigo-700 to-indigo-500 relative">
                                      {d.completed > 0 && (
                                        <div
                                          className="w-full bg-emerald-500 transition-all"
                                          style={{ height: `${completedPct}%` }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-1.5 bg-base-300 rounded-full mx-auto" />
                                )}
                              </div>

                              <div className="text-center mt-2.5 pt-1 border-t border-base-200 w-full">
                                <div
                                  className={`text-xs font-black ${
                                    isToday
                                      ? "text-primary"
                                      : "text-base-content/80"
                                  }`}
                                >
                                  {info.weekday}
                                </div>
                                <div className="text-[10px] text-base-content/50 font-mono font-bold">
                                  {info.formatted}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <div className="relative z-10 pl-7 h-40 flex items-end gap-1">
                          {data.map((d, i) => {
                            const heightPct = Math.round(
                              ((d.total || 0) / yMax) * 100
                            );
                            const isToday = i === data.length - 1;
                            const info = parseDateInfo(d.date);
                            return (
                              <div
                                key={d.date}
                                className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                              >
                                <div className="absolute -top-9 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-lg shadow-lg z-30 whitespace-nowrap pointer-events-none">
                                  <span className="font-bold">
                                    {info.fullDate}
                                  </span>
                                  <span>
                                    {d.total} appts ({d.completed} done)
                                  </span>
                                </div>

                                <div
                                  className={`w-full rounded-t-sm transition-all ${
                                    isToday
                                      ? "bg-primary shadow-xs ring-1 ring-primary"
                                      : d.total > 0
                                      ? "bg-indigo-500/80 group-hover:bg-indigo-600"
                                      : "bg-base-200"
                                  }`}
                                  style={{
                                    height:
                                      d.total > 0
                                        ? `${Math.max(heightPct, 8)}%`
                                        : "3px",
                                    minHeight: "3px",
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between pl-7 pr-2 pt-2 border-t border-base-200 text-[10px] font-bold font-mono text-base-content/60">
                          {xTickIndices.map((idx) => {
                            const d = data[idx];
                            if (!d) return null;
                            return (
                              <span key={idx}>
                                {parseDateInfo(d.date).formatted}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Legend & Month Details */}
                <div className="flex flex-wrap items-center justify-between text-xs text-base-content/60 pt-2 border-t border-base-200 gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />{" "}
                      Total Volume
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />{" "}
                      Completed
                    </span>
                    {totalCancelled > 0 && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />{" "}
                        Cancelled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-base-content/50">
                    <span>
                      🗓️ Timeline:{" "}
                      <strong className="text-base-content/80">
                        {monthDisplayTitle}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
