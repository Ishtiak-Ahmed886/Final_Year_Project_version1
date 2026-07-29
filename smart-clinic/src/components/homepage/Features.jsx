import {
  Calendar,
  Hospital,
  Users,
  ShieldCheck,
  Bell,
  FolderHeart,
} from "lucide-react";

const features = [
  {
    icon: Hospital,
    title: "Clinic Management",
    desc: "Manage your clinic efficiently."
  },
  {
    icon: Calendar,
    title: "Appointments",
    desc: "Easy online appointment booking."
  },
  {
    icon: Users,
    title: "Doctors",
    desc: "Manage doctors and schedules."
  },
  {
    icon: FolderHeart,
    title: "Patient Records",
    desc: "Secure medical history."
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Automatic reminders."
  },
  {
    icon: ShieldCheck,
    title: "Secure",
    desc: "Protected with JWT authentication."
  }
];

export default function Features() {
  return (
    <section className="container mx-auto py-20">

      <div className="text-center mb-12">

        <h2 className="text-4xl font-bold">
          Everything You Need
        </h2>

        <p className="mt-3 text-base-content/70">
          Powerful tools for clinics and patients.
        </p>

      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {features.map((item) => (
          <div
            key={item.title}
            className="card bg-base-100 shadow-md hover:shadow-xl transition"
          >
            <div className="card-body">

              <item.icon
                className="text-primary mb-4"
                size={38}
              />

              <h3 className="card-title">
                {item.title}
              </h3>

              <p>{item.desc}</p>

            </div>
          </div>
        ))}

      </div>
    </section>
  );
}