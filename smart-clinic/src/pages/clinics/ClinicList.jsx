import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import apiClient from "../../api/axios";
import {
  MapPin, Phone, Mail, Building2, Search, ArrowRight,
  Stethoscope, ShieldCheck, CheckCircle2, Sparkles, Navigation
} from "lucide-react";
import { useAuth } from "../../Provider/AuthProvider";

const BD_DIVISIONS = [
  "All",
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
  "Sherpur"
];

export default function ClinicList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");
  const [error, setError] = useState("");

  const fetchClinics = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const urlQuery = query ? `?city=${encodeURIComponent(query)}` : "";
      const res = await apiClient.get(`/clinics/${urlQuery}`);
      const list = res.results || res || [];
      setClinics(list);
    } catch (err) {
      setError("Failed to load clinics. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSelectedDivision("All");
    fetchClinics(searchCity);
  };

  const handleDivisionClick = (division) => {
    setSelectedDivision(division);
    setSearchCity("");
    if (division === "All") {
      fetchClinics();
    } else {
      fetchClinics(division);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#283891] via-indigo-700 to-pink-600 text-white p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold tracking-wide">
            <Building2 size={14} /> 8 Divisions Healthcare Network
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Find Top Clinics Near You
          </h1>
          <p className="text-white/85 text-base md:text-lg max-w-2xl">
            Browse verified multi-specialty hospitals and medical centers across all 8 divisions of Bangladesh. Compare doctor rosters and book instant serials.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by city or clinic name (e.g. Dhaka, Sylhet, Chattogram)..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="input text-slate-800 w-full pl-11 bg-white focus:bg-white border-none shadow-lg text-sm rounded-xl"
              />
            </div>
            <button type="submit" className="btn btn-secondary shadow-lg gap-2 text-white font-bold rounded-xl px-6">
              <Search size={18} /> Search Clinics
            </button>
          </form>

          {/* 8 Divisions Quick Filter Pills */}
          <div className="pt-3 space-y-2">
            <div className="text-xs font-bold text-white/75 flex items-center gap-1.5">
              <Navigation size={12} /> Filter by Division / Region:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BD_DIVISIONS.map((div) => {
                const isActive = selectedDivision === div;
                return (
                  <button
                    key={div}
                    type="button"
                    onClick={() => handleDivisionClick(div)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-white text-[#283891] shadow-md scale-105"
                        : "bg-white/15 text-white hover:bg-white/30"
                    }`}
                  >
                    {div}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-base-200">
          <div className="text-sm font-bold text-base-content/70">
            Showing <span className="text-primary font-black">{clinics.length}</span> verified medical centers
            {selectedDivision !== "All" && (
              <span> in <span className="text-primary font-black">{selectedDivision}</span></span>
            )}
          </div>
          <Link
            to="/doctors"
            className="btn btn-ghost btn-sm gap-1.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Stethoscope size={14} /> View All Doctors
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-72 w-full rounded-2xl"></div>
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error shadow-md max-w-xl mx-auto">
            <span>{error}</span>
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-16 bg-base-100 rounded-3xl border border-base-200 space-y-3">
            <Building2 size={48} className="mx-auto text-base-content/30" />
            <h3 className="text-xl font-bold text-base-content">No Clinics Found</h3>
            <p className="text-base-content/60 text-sm">No partner centers found matching "{searchCity || selectedDivision}".</p>
            <button
              onClick={() => { setSearchCity(""); setSelectedDivision("All"); fetchClinics(); }}
              className="btn btn-primary btn-outline btn-sm font-bold"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinics.map((clinic, idx) => {
              const avatarColors = [
                "from-blue-500 to-indigo-600",
                "from-emerald-500 to-teal-600",
                "from-violet-500 to-purple-600",
                "from-rose-500 to-pink-600",
                "from-amber-500 to-orange-600",
              ];
              const gradientClass = avatarColors[idx % avatarColors.length];
              const initial = clinic.name?.charAt(0)?.toUpperCase() || "C";

              return (
                <div
                  key={clinic.id}
                  className="card bg-base-100 border border-base-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group flex flex-col justify-between"
                >
                  <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
                  <div className="card-body p-6 space-y-4">
                    {/* Header with image/avatar and title */}
                    <div className="flex items-start gap-4">
                      {clinic.logo_url ? (
                        <img
                          src={clinic.logo_url}
                          alt={clinic.name}
                          className="w-16 h-16 rounded-2xl object-cover shadow-sm shrink-0 border border-base-200"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0`}>
                          {initial}
                        </div>
                      )}
                      <div className="space-y-1 flex-1 min-w-0">
                        <h2 className="card-title text-lg font-extrabold text-base-content group-hover:text-primary transition-colors leading-tight">
                          {clinic.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="badge badge-success badge-soft text-[10px] font-bold gap-1">
                            <ShieldCheck size={10} /> Verified
                          </span>
                          <span className="badge badge-primary badge-outline text-[10px] font-bold">
                            {clinic.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clinic Address and Contact info */}
                    <div className="space-y-2 text-xs text-base-content/70">
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">{clinic.address}, {clinic.city}</span>
                      </div>
                      {clinic.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-primary shrink-0" />
                          <span className="font-semibold">{clinic.phone}</span>
                        </div>
                      )}
                      {clinic.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-primary shrink-0" />
                          <span className="line-clamp-1">{clinic.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Departments Badges */}
                    {clinic.departments && clinic.departments.length > 0 && (
                      <div className="pt-2 border-t border-base-200">
                        <div className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider mb-1.5">
                          Specialized Departments ({clinic.departments.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {clinic.departments.slice(0, 3).map((dept) => (
                            <span key={dept.id} className="badge badge-sm badge-ghost font-medium text-[10px]">
                              {dept.name}
                            </span>
                          ))}
                          {clinic.departments.length > 3 && (
                            <span className="badge badge-ghost badge-sm text-[10px] text-base-content/50">
                              +{clinic.departments.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Card CTA */}
                    <div className="card-actions justify-end pt-3 border-t border-base-200">
                      <Link
                        to={`/clinics/${clinic.id}`}
                        className="btn btn-primary btn-sm w-full gap-2 shadow-sm font-bold text-xs"
                      >
                        View Details & Doctors <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
