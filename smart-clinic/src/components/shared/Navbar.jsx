import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Hospital,
  House,
  LogIn,
  LogOut,
  MapPinSearch,
  Stethoscope,
  User,
  UserPlus,
  LayoutDashboard,
  Bell,
  Languages,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";
import { useLanguage } from "../../context/LanguageContext";
import apiClient from "../../api/axios";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get("/notifications/");
      setNotifications((res.results || res || []).slice(0, 8));
    } catch {
      // Silently fail — notifications are non-critical
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post(`/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = (
    <>
      <li>
        <NavLink to="/" className={({ isActive }) => isActive ? "font-semibold text-primary" : ""}>
          <House size={16} />
          {t("home")}
        </NavLink>
      </li>
      <li>
        <NavLink to="/clinics" className={({ isActive }) => isActive ? "font-semibold text-primary" : ""}>
          <MapPinSearch size={16} />
          {t("clinics")}
        </NavLink>
      </li>
      <li>
        <NavLink to="/doctors" className={({ isActive }) => isActive ? "font-semibold text-primary" : ""}>
          <Stethoscope size={16} />
          {t("doctors")}
        </NavLink>
      </li>
      {user && (
        <li>
          <NavLink to="/book" className={({ isActive }) => isActive ? "font-semibold text-primary" : ""}>
            <CalendarCheck size={16} />
            {t("bookAppointment")}
          </NavLink>
        </li>
      )}
    </>
  );

  return (
    <div className="navbar bg-base-100 shadow-md px-4 lg:px-8 border-b border-base-200">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow-lg border border-base-200">
            {navItems}
          </ul>
        </div>
        <NavLink to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Hospital className="w-6 h-6" />
          </div>
          <span>Smart<span className="text-secondary">Clinic</span></span>
        </NavLink>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1 text-base font-medium">
          {navItems}
        </ul>
      </div>

      <div className="navbar-end gap-2 items-center">
        {/* Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          className="btn btn-ghost btn-sm gap-1.5 font-bold border border-base-300 rounded-xl hover:border-primary transition-all"
          title={language === "en" ? "বাংলায় দেখুন" : "View in English"}
        >
          <Languages size={15} />
          {language === "en" ? "বাংলা" : "EN"}
        </button>

        {/* Notification Bell */}
        {user && (
          <div className="relative">
            <button
              className="btn btn-ghost btn-circle relative"
              onClick={() => setShowNotifDropdown((v) => !v)}
              aria-label={t("notifications")}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error rounded-full text-[9px] font-black text-white flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 top-12 z-50 w-80 bg-base-100 border border-base-200 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-base-200 bg-base-200/50">
                  <span className="font-bold text-sm text-base-content">{t("notifications")}</span>
                  {unreadCount > 0 && (
                    <span className="badge badge-error badge-sm text-white">{unreadCount} new</span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-base-200">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-xs text-base-content/50">{t("noNotifications")}</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { handleMarkRead(n.id); setShowNotifDropdown(false); }}
                        className={`w-full text-left px-4 py-3 hover:bg-base-200/60 transition-colors block ${!n.is_read ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-semibold text-xs text-base-content leading-tight">{n.title}</div>
                          {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
                        </div>
                        <p className="text-[11px] text-base-content/60 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-base-content/40 mt-1 block">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Avatar / Login Buttons */}
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-2 flex items-center justify-center bg-primary text-primary-content font-bold">
                {user.first_name ? user.first_name[0].toUpperCase() : <User size={20} />}
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-56 p-2 shadow-xl border border-base-200">
              <li className="menu-title px-4 py-2 border-b border-base-200">
                <div className="font-bold text-base-content">{user.first_name} {user.last_name}</div>
                <div className="text-xs text-base-content/60">{user.email}</div>
                <div className="badge badge-primary badge-sm mt-1">{user.role}</div>
              </li>
              <li className="mt-2">
                <NavLink to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard size={16} />
                  {t("dashboard")}
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="text-error flex items-center gap-2">
                  <LogOut size={16} />
                  {t("signOut")}
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <>
            <NavLink to="/login" className="btn btn-ghost btn-sm lg:btn-md gap-1">
              <LogIn size={16} /> {t("signIn")}
            </NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm lg:btn-md shadow-md gap-1">
              <UserPlus size={16} /> {t("signUp")}
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}
