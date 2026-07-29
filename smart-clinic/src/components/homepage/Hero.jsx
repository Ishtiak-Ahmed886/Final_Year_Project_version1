import {
  Hospital,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="hero min-h-[85vh] bg-base-200">

      <div className="hero-content flex-col-reverse lg:flex-row gap-12">

        <div className="max-w-xl">

          <div className="badge badge-primary badge-lg mb-4">
            Smart Healthcare Platform
          </div>

          <h1 className="text-5xl font-bold leading-tight">
            Manage Clinics.
            <br />
            Book Appointments.
            <br />
            All in One Place.
          </h1>

          <p className="py-6 text-lg">
            Smart Clinic connects clinic owners and
            patients through a simple, secure, and
            modern healthcare platform.
          </p>

          <div className="flex flex-wrap gap-4">

            <button className="btn btn-primary">
              Open Your Clinic
            </button>

            <button className="btn btn-outline">
              Find a Clinic
            </button>

          </div>

          <div className="flex flex-wrap gap-6 mt-8">

            <div className="flex items-center gap-2">
              <CalendarCheck className="text-success" />
              Online Booking
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="text-success" />
              Secure Data
            </div>

          </div>

        </div>

        <div className="flex justify-center">

          <div className="w-80 h-80 rounded-full bg-primary/10 flex items-center justify-center">

            <Hospital
              size={160}
              className="text-primary"
            />

          </div>

        </div>

      </div>

    </section>
  );
}