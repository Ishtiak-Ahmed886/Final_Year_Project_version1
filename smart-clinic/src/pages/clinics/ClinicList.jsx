import { useState, useEffect } from "react";
import { Link } from "react-router";
import apiClient from "../../api/axios";
import { MapPin, Phone, Mail, Building2, Search, ArrowRight, Stethoscope } from "lucide-react";

export default function ClinicList() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [error, setError] = useState("");

  const fetchClinics = async (city = "") => {
    setLoading(true);
    setError("");
    try {
      const query = city ? `?city=${encodeURIComponent(city)}` : "";
      const res = await apiClient.get(`/clinics/${query}`);
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
    fetchClinics(searchCity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/90 via-primary to-secondary text-primary-content p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="badge badge-lg bg-white/20 text-white border-none gap-2 font-medium">
            <Building2 size={16} /> Partner Healthcare Centers
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Find Top Clinics Near You
          </h1>
          <p className="text-white/80 text-base md:text-lg">
            Browse verified multi-specialty medical centers, compare services, and book appointments instantly.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 pt-4">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
              <input
                type="text"
                placeholder="Search by city (e.g. Dhaka, Chittagong, Sylhet)..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="input input-bordered text-base-content w-full pl-10 bg-white/90 focus:bg-white border-none shadow-inner"
              />
            </div>
            <button type="submit" className="btn btn-secondary shadow-lg gap-2">
              <Search size={18} /> Search Clinics
            </button>
          </form>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-64 w-full rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error shadow-md max-w-xl mx-auto">
          <span>{error}</span>
        </div>
      ) : clinics.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-3xl border border-base-200">
          <Building2 size={48} className="mx-auto text-base-content/30 mb-4" />
          <h3 className="text-xl font-bold text-base-content">No Clinics Found</h3>
          <p className="text-base-content/60 mt-1">Try clearing your search filter or check back later.</p>
          {searchCity && (
            <button
              onClick={() => { setSearchCity(""); fetchClinics(); }}
              className="btn btn-primary btn-outline btn-sm mt-4"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="card bg-base-100 border border-base-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group"
            >
              <div className="h-2 bg-gradient-to-r from-primary to-secondary"></div>
              <div className="card-body p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title text-xl font-bold text-base-content group-hover:text-primary transition-colors">
                      {clinic.name}
                    </h2>
                    <span className="badge badge-accent badge-soft text-xs mt-1">
                      {clinic.subscription_plan || "Verified Center"}
                    </span>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
                    <Building2 size={24} />
                  </div>
                </div>

                <div className="space-y-2 text-sm text-base-content/70">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary shrink-0" />
                    <span className="line-clamp-1">{clinic.address}, {clinic.city}</span>
                  </div>
                  {clinic.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-primary shrink-0" />
                      <span>{clinic.phone}</span>
                    </div>
                  )}
                  {clinic.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-primary shrink-0" />
                      <span className="line-clamp-1">{clinic.email}</span>
                    </div>
                  )}
                </div>

                {clinic.departments && clinic.departments.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                      Departments ({clinic.departments.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {clinic.departments.slice(0, 3).map((dept) => (
                        <span key={dept.id} className="badge badge-outline badge-sm">
                          {dept.name}
                        </span>
                      ))}
                      {clinic.departments.length > 3 && (
                        <span className="badge badge-ghost badge-sm">
                          +{clinic.departments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="card-actions justify-end pt-4 border-t border-base-200">
                  <Link
                    to={`/clinics/${clinic.id}`}
                    className="btn btn-primary btn-sm w-full gap-2 shadow-sm"
                  >
                    View Details & Doctors <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
