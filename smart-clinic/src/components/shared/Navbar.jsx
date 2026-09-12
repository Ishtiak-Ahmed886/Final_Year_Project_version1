import { useState, useEffect, useRef } from "react";
import {
  Hospital,
  LogIn,
  LogOut,
  User,
  UserPlus,
  LayoutDashboard,
  Bell,
  Languages,
  Trash2,
  Menu,
  X,
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGuestMenu, setShowGuestMenu] = useState(false);

  const mobileMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const guestMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        setShowMobileMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
      if (guestMenuRef.current && !guestMenuRef.current.contains(e.target))
        setShowGuestMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get("/notifications/");
      setNotifications((res.results || res || []).slice(0, 8));
    } catch {
      // non-critical
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

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/notifications/${id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleClearAllNotifications = async (e) => {
    e.stopPropagation();
    try {
      await apiClient.delete("/notifications/clear-all/");
      setNotifications([]);
    } catch {
      setNotifications([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "bg-[#283891] text-white px-3.5 py-1.5 rounded-lg font-bold text-sm shadow-sm"
      : "text-slate-600 hover:text-slate-900 px-3 py-1.5 font-medium text-sm transition-colors";

  const navItems = (
    <>
      <li><NavLink to="/" className={navLinkClass}>{t("home")}</NavLink></li>
      <li><NavLink to="/clinics" className={navLinkClass}>{t("clinics")}</NavLink></li>
      <li><NavLink to="/doctors" className={navLinkClass}>{t("doctors")}</NavLink></li>
      <li>
        <NavLink to={user ? "/book" : "/login"} className={navLinkClass}>
          {t("bookAppointment")}
        </NavLink>
      </li>
      <li>
        <a href="/#pricing" className="text-slate-600 hover:text-slate-900 px-3 py-1.5 font-medium text-sm transition-colors">
          Pricing
        </a>
      </li>
      <li>
        <a href="/#about" className="text-slate-600 hover:text-slate-900 px-3 py-1.5 font-medium text-sm transition-colors">
          About
        </a>
      </li>
    </>
  );

  return (
    <div className="navbar bg-white shadow-sm px-4 lg:px-8 border-b border-slate-100 sticky top-0 z-50">
      <div className="navbar-start">
        {/* Mobile hamburger */}
        <div className="relative lg:hidden mr-1" ref={mobileMenuRef}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowMobileMenu((v) => !v)}
            aria-label="Open menu"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
          {showMobileMenu && (
            <div
              className="absolute left-0 w-56 bg-white rounded-2xl shadow-xl border border-slate-100"
              style={{ top: "calc(100% + 8px)", bottom: "auto", zIndex: 9999 }}
            >
              <ul className="flex flex-col gap-1 p-2">
                {[
                  { to: "/", label: t("home") },
                  { to: "/clinics", label: t("clinics") },
                  { to: "/doctors", label: t("doctors") },
                  { to: user ? "/book" : "/login", label: t("bookAppointment") },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={() => setShowMobileMenu(false)}
                      className={({ isActive }) =>
                        isActive
                          ? "block bg-[#283891] text-white px-4 py-2.5 rounded-xl font-bold text-sm"
                          : "block text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <a href="/#pricing" onClick={() => setShowMobileMenu(false)}
                    className="block text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/#about" onClick={() => setShowMobileMenu(false)}
                    className="block text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
                    About
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>

        <NavLink to="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-[#283891]">
          <div className="bg-indigo-50 p-1.5 rounded-xl text-[#283891] border border-indigo-100">
            <Hospital className="w-5 h-5" />
          </div>
          <span className="flex items-center gap-1.5">
            Smart<span className="text-pink-600">Clinic</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 tracking-tight">
              v2.4
            </span>
          </span>
        </NavLink>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="flex items-center gap-1">{navItems}</ul>
      </div>

      <div className="navbar-end gap-3 items-center">
        {/* Language Toggle */}
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
          <div className="relative" ref={notifRef}>
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
              <div
                className="absolute right-0 w-80 bg-base-100 border border-base-200 rounded-2xl shadow-2xl overflow-hidden"
                style={{ top: "calc(100% + 8px)", bottom: "auto", zIndex: 9999 }}
              >
                <div className="flex justify-between items-center px-4 py-3 border-b border-base-200 bg-base-200/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-base-content">{t("notifications")}</span>
                    {unreadCount > 0 && (
                      <span className="badge badge-error badge-xs text-white">{unreadCount} new</span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button type="button" onClick={handleClearAllNotifications}
                      className="text-[11px] text-error hover:underline font-medium">
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-base-200">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-xs text-base-content/50">{t("noNotifications")}</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => { handleMarkRead(n.id); setShowNotifDropdown(false); }}
                        className={`w-full text-left px-4 py-3 hover:bg-base-200/60 transition-colors cursor-pointer flex items-start justify-between gap-2 ${!n.is_read ? "bg-primary/5" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-base-content leading-tight">{n.title}</span>
                            {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                          </div>
                          <p className="text-[11px] text-base-content/60 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-base-content/40 mt-1 block">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotification(e, n.id)}
                          className="p-1.5 text-base-content/40 hover:text-error hover:bg-error/10 rounded-lg shrink-0 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard / Open Clinic Button */}
        <NavLink
          to={user ? "/dashboard" : "/register"}
          className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#283891] hover:bg-[#1f2c7a] shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          {user ? t("dashboard") : t("openClinicBtn")}
        </NavLink>

        {/* User / Guest menu */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              className="btn btn-ghost btn-circle avatar"
              onClick={() => setShowUserMenu((v) => !v)}
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-full ring-2 ring-[#283891] ring-offset-2 flex items-center justify-center bg-[#283891] text-white font-bold text-sm">
                {user.first_name ? user.first_name[0].toUpperCase() : <User size={18} />}
              </div>
            </button>
            {showUserMenu && (
              <div
                className="absolute right-0 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                style={{ top: "calc(100% + 8px)", bottom: "auto", zIndex: 9999 }}
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-bold text-slate-800 text-sm">{user.first_name} {user.last_name}</div>
                  <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  <div className="badge badge-primary badge-sm mt-1">{user.role}</div>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <NavLink
                    to="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <LayoutDashboard size={16} />
                    {t("dashboard")}
                  </NavLink>
                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-sm font-medium transition-colors w-full text-left"
                  >
                    <LogOut size={16} />
                    {t("signOut")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative" ref={guestMenuRef}>
            <button
              className="btn btn-ghost btn-circle border border-slate-200 text-slate-600 hover:text-[#283891]"
              onClick={() => setShowGuestMenu((v) => !v)}
              aria-label="Sign in"
            >
              <User size={18} />
            </button>
            {showGuestMenu && (
              <div
                className="absolute right-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                style={{ top: "calc(100% + 8px)", bottom: "auto", zIndex: 9999 }}
              >
                <div className="p-2 flex flex-col gap-1">
                  <NavLink
                    to="/login"
                    onClick={() => setShowGuestMenu(false)}
                    className="flex items-center gap-2 text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <LogIn size={16} /> {t("signIn")}
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={() => setShowGuestMenu(false)}
                    className="flex items-center gap-2 text-[#283891] hover:bg-indigo-50 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    <UserPlus size={16} /> {t("signUp")}
                  </NavLink>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
