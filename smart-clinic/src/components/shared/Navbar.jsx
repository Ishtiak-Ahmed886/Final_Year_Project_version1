import {
  BookAlert,
  CalendarCheck,
  Hospital,
  House,
  LogIn,
  LogOut,
  MailPlus,
  MapPinSearch,
  Stethoscope,
  User,
  UserPlus,
  LayoutDashboard
} from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../../Provider/AuthProvider";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = (
    <>
      <li>
        <NavLink to="/" className={({ isActive }) => isActive ? "font-semibold text-primary" : ""}>
          <House size={16} />
          Home
        </NavLink>
      </li>
      <li>
        <NavLink to="/clinics" className={({ isActive }) => isActive ? "font-semibold text-primary" : ""}>
          <MapPinSearch size={16} />
          Clinics
        </NavLink>
      </li>
      <li>
        <NavLink to="/doctors" className={({ isActive }) => isActive ? "font-semibold text-primary" : ""}>
          <Stethoscope size={16} />
          Doctors
        </NavLink>
      </li>
      {user && (
        <li>
          <NavLink to="/book" className={({ isActive }) => isActive ? "font-semibold text-primary" : ""}>
            <CalendarCheck size={16} />
            Book Slot
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow-lg border border-base-200"
          >
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

      <div className="navbar-end gap-2">
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-2 flex items-center justify-center bg-primary text-primary-content font-bold">
                {user.first_name ? user.first_name[0].toUpperCase() : <User size={20} />}
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-56 p-2 shadow-xl border border-base-200"
            >
              <li className="menu-title px-4 py-2 border-b border-base-200">
                <div className="font-bold text-base-content">{user.first_name} {user.last_name}</div>
                <div className="text-xs text-base-content/60">{user.email}</div>
                <div className="badge badge-primary badge-sm mt-1">{user.role}</div>
              </li>
              <li className="mt-2">
                <NavLink to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard size={16} />
                  Dashboard
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="text-error flex items-center gap-2">
                  <LogOut size={16} />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <>
            <NavLink to="/login" className="btn btn-ghost btn-sm lg:btn-md gap-1">
              <LogIn size={16} /> Login
            </NavLink>
            <NavLink to="/register" className="btn btn-primary btn-sm lg:btn-md shadow-md gap-1">
              <UserPlus size={16} /> Register
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}
