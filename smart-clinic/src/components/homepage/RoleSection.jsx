import {
  Building2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router";

export default function RoleSection() {
  return (
    <section className="bg-base-200 py-20">

      <div className="container mx-auto">

        <div className="text-center mb-10">

          <h2 className="text-4xl font-bold">
            Choose Your Journey
          </h2>

        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          <div className="card bg-base-100 shadow-xl">

            <div className="card-body">

              <Building2
                size={50}
                className="text-primary"
              />

              <h2 className="card-title">
                Clinic Owner
              </h2>

              <ul className="space-y-2">
                <li>✔ Register Clinic</li>
                <li>✔ Manage Doctors</li>
                <li>✔ View Patients</li>
                <li>✔ Appointment Dashboard</li>
              </ul>

              <Link to="/register" className="btn btn-primary mt-5">
                Open Clinic
              </Link>

            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">

            <div className="card-body">

              <UserRound
                size={50}
                className="text-secondary"
              />

              <h2 className="card-title">
                Patient
              </h2>

              <ul className="space-y-2">
                <li>✔ Find Clinics</li>
                <li>✔ Book Appointment</li>
                <li>✔ Appointment History</li>
                <li>✔ Digital Records</li>
              </ul>

              <Link to="/register" className="btn btn-secondary mt-5">
                Become Patient
              </Link>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}