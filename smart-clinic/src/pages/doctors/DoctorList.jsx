import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import apiClient from "../../api/axios";
import { Stethoscope, Award, CalendarCheck, Search, User, Filter, Building2, ArrowLeft, LayoutDashboard, Star } from "lucide-react";
import { useAuth } from "../../Provider/AuthProvider";

export default function DoctorList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(user ? "/dashboard" : "/");
    }
  };

  const fetchData = async (specId = "") => {
    setLoading(true);
    setError("");
    try {
      const specRes = await apiClient.get("/doctors/specializations/");
      setSpecializations(specRes.results || specRes || []);

      const query = specId ? `?specialization_id=${specId}` : "";
      const docRes = await apiClient.get(`/doctors/${query}`);
      setDoctors(docRes.results || docRes || []);
    } catch (err) {
      setError("Failed to fetch doctors list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const specId = e.target.value;
    setSelectedSpec(specId);
    fetchData(specId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-secondary/90 via-primary to-accent text-white p-8 md:p-12 rounded-3xl shadow-2xl space-y-4">
        <div className="badge badge-lg bg-white/20 text-white border-none gap-2 font-medium">
          <Stethoscope size={16} /> Qualified Specialists
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Find & Consult Expert Doctors
        </h1>
        <p className="text-white/80 text-base md:text-lg max-w-2xl">
          Connect with top-rated medical specialists across multiple disciplines and book your consultation in seconds.
        </p>

        {/* Filter dropdown */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <div className="relative flex-1 max-w-md">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
            <select
              value={selectedSpec}
              onChange={handleFilterChange}
              className="select select-bordered text-base-content w-full pl-10 bg-white/90 focus:bg-white border-none shadow-inner"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-base-200">
          <div className="text-sm font-bold text-base-content/70">
            Showing <span className="text-primary font-black">{doctors.length}</span> registered medical specialists
          </div>
          <Link
            to="/clinics"
            className="btn btn-ghost btn-sm gap-1.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Building2 size={14} /> View All Partner Clinics
          </Link>
        </div>

        {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-64 w-full rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error shadow-md">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-3xl border border-base-200">
          <Stethoscope size={48} className="mx-auto text-base-content/30 mb-4" />
          <h3 className="text-xl font-bold text-base-content">No Doctors Found</h3>
          <p className="text-base-content/60 mt-1">Try selecting a different specialization filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="card bg-base-100 border border-base-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group"
            >
              <div className="card-body p-6 space-y-4">
                <div className="flex items-start gap-4">
                  {doctor.avatar_url ? (
                    <img
                      src={doctor.avatar_url}
                      alt={doctor.full_name}
                      className="w-16 h-16 rounded-2xl object-cover shadow-sm shrink-0 border border-base-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-black flex items-center justify-center text-2xl shrink-0 border border-primary/20 shadow-xs">
                      {doctor.full_name ? doctor.full_name[0].toUpperCase() : "D"}
                    </div>
                  )}
                  <div>
                    <h2 className="card-title text-xl font-bold text-base-content group-hover:text-primary transition-colors">
                      <Link to={`/doctors/${doctor.id}`}>Dr. {doctor.full_name}</Link>
                    </h2>
                    <p className="text-xs text-primary font-semibold">{doctor.qualification || "Medical Specialist"}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-base-content/60">
                      <div className="flex items-center gap-1">
                        <Award size={14} className="text-warning" />
                        <span>{doctor.experience_years} yrs exp</span>
                      </div>
                      {doctor.average_rating ? (
                        <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{doctor.average_rating} ({doctor.review_count})</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-base-content/40">No reviews yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {doctor.specializations && doctor.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {doctor.specializations.map((spec) => (
                      <span key={spec.id} className="badge badge-accent badge-soft text-xs">
                        {spec.name}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-base-content/70 line-clamp-2">
                  {doctor.bio || "Dedicated healthcare practitioner providing attentive patient care."}
                </p>

                {doctor.doctor_clinics && doctor.doctor_clinics.length > 0 && (
                  <div className="pt-2 border-t border-base-200 text-xs text-base-content/70">
                    <span className="font-semibold text-base-content flex items-center gap-1">
                      <Building2 size={14} className="text-primary" /> Practicing Clinics:
                    </span>
                    <ul className="mt-1 space-y-1 pl-4 list-disc">
                      {doctor.doctor_clinics.map((dc) => (
                        <li key={dc.id}>
                          <span className="font-medium">{dc.clinic?.name}</span> - Fee: ৳{dc.consultation_fee} BDT
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="card-actions justify-end pt-3 border-t border-base-200 flex gap-2">
                  <Link
                    to={`/doctors/${doctor.id}`}
                    className="btn btn-outline btn-sm flex-1 text-xs"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/book?doctor=${doctor.id}`}
                    className="btn btn-primary btn-sm flex-1 text-xs gap-1.5 shadow-sm"
                  >
                    <CalendarCheck size={15} /> Book
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
