import { Outlet, NavLink } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";
import { LayoutDashboard, Calendar, Stethoscope, Building2 } from "lucide-react";
import PatientDashboard from "./PatientDashboard";
import DoctorDashboard from "./DoctorDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardLayout() {
  const { user } = useAuth();

  const renderDashboardView = () => {
    if (!user) return null;
    switch (user.role) {
      case "DOCTOR":
        return <DoctorDashboard />;
      case "ADMIN":
      case "CLINIC_ADMIN":
        return <AdminDashboard />;
      case "PATIENT":
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
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
              <div className="badge badge-primary badge-sm mt-1">{user?.role}</div>
            </div>
          </div>

          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-content shadow-md"
                    : "text-base-content/70 hover:bg-base-200"
                }`
              }
            >
              <LayoutDashboard size={18} /> Overview
            </NavLink>

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
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {renderDashboardView()}
        </main>
      </div>
    </div>
  );
}
