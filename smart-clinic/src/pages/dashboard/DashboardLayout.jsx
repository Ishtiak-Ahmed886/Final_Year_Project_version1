import React, { useState, useEffect, Suspense, lazy } from "react";
import { NavLink, useLocation } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";
import { LayoutDashboard, Calendar, Stethoscope, Building2, ShieldCheck, UserCheck, User, Lock } from "lucide-react";

const PatientDashboard = lazy(() => import("./PatientDashboard"));
const DoctorDashboard = lazy(() => import("./DoctorDashboard"));
const ClinicAdminDashboard = lazy(() => import("./ClinicAdminDashboard"));
const SuperAdminDashboard = lazy(() => import("./SuperAdminDashboard"));
const ProfileSettings = lazy(() => import("./ProfileSettings"));
const PrivacyPolicy = lazy(() => import("../legal/PrivacyPolicy"));
const ReceptionistPanel = lazy(() => import("./ReceptionistPanel"));

const DashboardLoader = () => (
  <div className="flex flex-col items-center justify-center p-16 text-center">
    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="mt-3 text-xs font-semibold tracking-wider text-slate-400">Loading dashboard...</span>
  </div>
);

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [currentView, setCurrentView] = useState("overview");

  useEffect(() => {
    const hash = location.hash?.toLowerCase();
    if (hash === "#privacy" || hash === "#terms" || hash === "#security" || hash === "#consent") {
      setCurrentView("privacy");
    }
  }, [location.hash]);


  const renderDashboardView = () => {
    if (!user) return null;
    let content = null;
    switch (user.role) {
      case "DOCTOR":
        content = <DoctorDashboard />;
        break;
      case "CLINIC_ADMIN":
        content = <ClinicAdminDashboard />;
        break;
      case "ADMIN":
        content = <SuperAdminDashboard />;
        break;
      case "RECEPTIONIST":
        content = <ReceptionistPanel />;
        break;
      case "PATIENT":
      default:
        content = <PatientDashboard />;
        break;
    }
    return <Suspense fallback={<DashboardLoader />}>{content}</Suspense>;
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return <span className="badge badge-error badge-sm mt-1">Super Admin</span>;
      case "CLINIC_ADMIN":
        return <span className="badge badge-primary badge-sm mt-1">Clinic Admin</span>;
      case "DOCTOR":
        return <span className="badge badge-secondary badge-sm mt-1">Doctor</span>;
      case "RECEPTIONIST":
        return <span className="badge badge-warning badge-sm mt-1">Receptionist</span>;
      default:
        return <span className="badge badge-accent badge-sm mt-1">Patient</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 sm:pb-24">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 bg-base-100 border border-base-200 p-6 rounded-3xl shadow-lg h-fit space-y-6 shrink-0">
          <div className="flex items-center gap-3 pb-4 border-b border-base-200">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content font-bold flex items-center justify-center text-xl shadow-md">
              {user?.first_name ? user.first_name[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="font-bold text-base-content leading-tight">
                {user?.first_name} {user?.last_name}
              </div>
              {getRoleBadge(user?.role)}
            </div>
          </div>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setCurrentView("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-colors ${
                currentView === "overview"
                  ? "bg-primary text-primary-content shadow-md"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              <LayoutDashboard size={18} /> Overview
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-colors ${
                currentView === "profile"
                  ? "bg-primary text-primary-content shadow-md"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              <User size={18} /> My Profile & Security
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("privacy")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-colors ${
                currentView === "privacy"
                  ? "bg-primary text-primary-content shadow-md"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              <ShieldCheck size={18} /> Privacy & Compliance
            </button>

            {user?.role === "PATIENT" && (
              <NavLink
                to="/book"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-primary-content shadow-md"
                      : "text-base-content/70 hover:bg-base-200"
                  }`
                }
              >
                <Calendar size={18} /> Book Appointment
              </NavLink>
            )}

            {user?.role !== "RECEPTIONIST" && (
              <>
                <NavLink
                  to="/clinics"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-base-content/70 hover:bg-base-200 transition-colors"
                >
                  <Building2 size={18} /> Clinics Directory
                </NavLink>
                
                <NavLink
                  to="/doctors"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-base-content/70 hover:bg-base-200 transition-colors"
                >
                  <Stethoscope size={18} /> Doctors Directory
                </NavLink>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {currentView === "profile" ? (
            <ProfileSettings />
          ) : currentView === "privacy" ? (
            <PrivacyPolicy
              embedded={true}
              initialTab={location.hash ? location.hash.replace("#", "") : "privacy"}
            />
          ) : (
            renderDashboardView()
          )}
        </main>
      </div>
    </div>
  );
}

