import {
  Calendar,
  Hospital,
  Users,
  ShieldCheck,
  Bell,
  FolderHeart,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const features = [
  {
    icon: Hospital,
    title: "Clinic Management",
    desc: "Manage your clinic efficiently.",
    tag: "Multi-branch ready",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: Calendar,
    title: "Appointments",
    desc: "Easy online appointment booking.",
    tag: "Real-time calendar sync",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    icon: Users,
    title: "Doctors",
    desc: "Manage doctors and schedules.",
    tag: "Rosters & leaves",
    color: "bg-sky-50 text-sky-600 border-sky-100",
  },
  {
    icon: FolderHeart,
    title: "Patient Records",
    desc: "Secure medical history.",
    tag: "EMR / Prescriptions",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Automatic reminders.",
    tag: "SMS & Email alerts",
    color: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
  },
  {
    icon: ShieldCheck,
    title: "Secure",
    desc: "Protected with JWT authentication.",
    tag: "256-bit encryption",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
];

export default function Features() {
  const { t } = useLanguage();

  return (
    <section className="py-20 lg:py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
            FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {t("everythingYouNeed")}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-500 font-normal">
            {t("everythingYouNeedSubtitle")}
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-3xl p-7 border border-slate-200/70 shadow-sm hover:shadow-xl hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Icon Box */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Footer Tag & Arrow */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                    {item.tag}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}