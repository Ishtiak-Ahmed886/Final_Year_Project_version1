export default function Stats() {
  const stats = [
    {
      value: "250+",
      label: "Clinics Managed",
      color: "text-[#2534a5]",
    },
    {
      value: "1,000+",
      label: "Active Doctors",
      color: "text-[#d91a6e]",
    },
    {
      value: "15K+",
      label: "Registered Patients",
      color: "text-slate-900",
    },
    {
      value: "50K+",
      label: "Completed Appointments",
      color: "text-[#3b49df]",
    },
  ];

  return (
    <section className="py-16 bg-white border-y border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((item) => (
            <div key={item.label} className="text-center lg:text-left">
              <div className={`text-4xl sm:text-5xl font-black tracking-tight ${item.color}`}>
                {item.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-2">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}