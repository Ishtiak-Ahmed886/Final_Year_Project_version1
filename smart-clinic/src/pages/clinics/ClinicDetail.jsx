import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import apiClient from "../../api/axios";
import { MapPin, Phone, Mail, Building2, Stethoscope, CalendarCheck, UserCheck, ArrowLeft, Award, ExternalLink } from "lucide-react";

export default function ClinicDetail() {
  const { id } = useParams();
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClinicData = async () => {
      setLoading(true);
      setError("");
      try {
        const clinicData = await apiClient.get(`/clinics/${id}/`);
        setClinic(clinicData);

        const doctorsData = await apiClient.get(`/doctors/?clinic_id=${id}`);
        setDoctors(doctorsData.results || doctorsData || []);
      } catch (err) {
        setError("Failed to load clinic details.");
      } finally {
        setLoading(false);
      }
    };

    fetchClinicData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="skeleton h-48 w-full rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-64 w-full rounded-2xl"></div>
          <div className="skeleton h-64 w-full rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="alert alert-error">{error || "Clinic not found."}</div>
        <Link to="/clinics" className="btn btn-outline btn-sm gap-2">
          <ArrowLeft size={16} /> Back to Clinics
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link to="/clinics" className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-primary font-semibold">
        <ArrowLeft size={16} /> Back to Clinics
      </Link>

      {/* Clinic Header Banner */}
      <div className="bg-base-100 border border-base-200 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary font-bold">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-base-content">{clinic.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge badge-accent badge-soft font-semibold">{clinic.subscription_plan || "Verified"}</span>
                <span className="text-sm text-base-content/60 flex items-center gap-1">
                  <MapPin size={14} className="text-primary" /> {clinic.city}
                </span>
              </div>
            </div>
          </div>
          <p className="text-base-content/70 max-w-2xl">{clinic.address}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm bg-base-200/50 p-4 rounded-2xl border border-base-200">
          {clinic.phone && (
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-primary" />
              <span className="font-semibold">{clinic.phone}</span>
            </div>
          )}
          {clinic.email && (
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              <span className="font-semibold">{clinic.email}</span>
            </div>
          )}
          {clinic.latitude && clinic.longitude && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${clinic.latitude}&mlon=${clinic.longitude}#map=15/${clinic.latitude}/${clinic.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline font-semibold"
            >
              <MapPin size={16} /> View on Map <ExternalLink size={13} />
            </a>
          )}
          {clinic.certificate_url && (
            <a
              href={clinic.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-success hover:underline font-semibold"
            >
              <Award size={16} /> View Certificate <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {/* Departments Section */}
      {clinic.departments && clinic.departments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
            <Stethoscope className="text-primary" /> Medical Departments
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {clinic.departments.map((dept) => (
              <div key={dept.id} className="p-4 bg-base-100 border border-base-200 rounded-2xl text-center space-y-1 shadow-sm hover:border-primary transition-colors">
                <div className="font-bold text-base-content">{dept.name}</div>
                {dept.description && <div className="text-xs text-base-content/60">{dept.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practicing Doctors Section */}
      <div className="space-y-6 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <UserCheck className="text-primary" /> Practicing Doctors ({doctors.length})
          </h2>
        </div>

        {doctors.length === 0 ? (
          <div className="p-8 text-center bg-base-100 rounded-2xl border border-base-200 text-base-content/60">
            No active doctors currently mapped to this clinic.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="card bg-base-100 border border-base-200 shadow-md hover:shadow-lg transition-all rounded-2xl">
                <div className="card-body p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="card-title text-lg font-bold text-base-content">
                        Dr. {doctor.full_name}
                      </h3>
                      <p className="text-xs text-primary font-semibold">{doctor.qualification || "Medical Specialist"}</p>
                    </div>
                    <span className="badge badge-secondary badge-outline text-xs">
                      {doctor.experience_years} yrs exp
                    </span>
                  </div>

                  {doctor.specializations && doctor.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doctor.specializations.map((spec) => (
                        <span key={spec.id} className="badge badge-sm badge-ghost">
                          {spec.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-base-content/70 line-clamp-2">{doctor.bio || "Dedicated healthcare professional providing compassionate care."}</p>

                  <div className="card-actions justify-end pt-3 border-t border-base-200">
                    <Link
                      to={`/book?clinic=${clinic.id}&doctor=${doctor.id}`}
                      className="btn btn-primary btn-sm w-full gap-2"
                    >
                      <CalendarCheck size={16} /> Book Appointment
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
