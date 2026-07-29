export default function Stats() {
  return (
    <section className="container mx-auto py-20">

      <div className="stats stats-vertical lg:stats-horizontal shadow w-full">

        <div className="stat">
          <div className="stat-value text-primary">250+</div>
          <div className="stat-title">Clinics</div>
        </div>

        <div className="stat">
          <div className="stat-value text-secondary">1,000+</div>
          <div className="stat-title">Doctors</div>
        </div>

        <div className="stat">
          <div className="stat-value">15K+</div>
          <div className="stat-title">Patients</div>
        </div>

        <div className="stat">
          <div className="stat-value">50K+</div>
          <div className="stat-title">Appointments</div>
        </div>

      </div>

    </section>
  );
}