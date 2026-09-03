import { createContext, useContext, useState } from "react";

const translations = {
  en: {
    // Nav
    home: "Home",
    doctors: "Doctors",
    clinics: "Clinics",
    bookAppointment: "Book Appointment",
    dashboard: "Dashboard",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    notifications: "Notifications",
    noNotifications: "No new notifications",

    // Patient Dashboard
    patientDashboard: "Patient Dashboard",
    patientDashboardSubtitle: "Live serial tracker, appointments, & family care",
    myAppointments: "My Appointments",
    familyProfiles: "Family Profiles",
    addFamilyMember: "Add Family Member",
    noAppointments: "No Booked Appointments",
    noAppointmentsHint: "You haven't scheduled any doctor consultations yet.",
    bookNow: "Book an Appointment Now",

    // Serial Tracker
    liveSerialTracker: "LIVE SERIAL TRACKER",
    doctorStatus: "Doctor Status:",
    refreshesAuto: "Refreshes automatically ⏱️",
    currentlyCalled: "Currently Called",
    yourSerial: "Your Serial #",
    patientsAhead: "Patients Ahead",
    estWait: "Est. Wait",
    yourTurn: "Your Turn!",
    itsYourTurn: "🎉 IT'S YOUR TURN! Please proceed into",
    consultationRoom: "'s consultation room now.",
    getReady: "🔔 GET READY: You are only",
    patientsAway: "patient(s) away! Please report to clinic waiting lounge.",

    // Appointment card
    serialBadge: "Serial #",
    forPatient: "For:",
    pendingPayment: "Pending Payment",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    payAndConfirm: "Pay & Confirm",
    cancel: "Cancel",
    viewPrescription: "View E-Prescription",

    // Payment
    processPayment: "Process Payment",
    amountPayable: "Amount Payable",
    selectPaymentMethod: "Select Payment Method",
    enterTrxId: "Enter Transaction ID (TrxID) *",
    cashAtChamberNote: "Cash at Chamber Selected: You will pay directly at the clinic reception on your appointment day.",
    confirmPayment: "Confirm Payment",
    confirming: "Confirming...",

    // Family
    parentCareTitle: "Parent Care & Family Profiles",
    parentCareSubtitle: "Add parents, spouse, or children to manage their appointments & health history.",
    addMember: "Add Member",
    noFamilyMembers: "No Family Members Added",
    noFamilyHint: "Add your parents or dependents to book appointments for them easily.",
    fullName: "Full Name",
    relationship: "Relationship",
    phone: "Phone Number (BD)",
    age: "Age",
    gender: "Gender",
    bloodGroup: "Blood Group",
    medicalNotes: "Medical Notes / History",
    saveMember: "Save Member",
    saving: "Saving...",

    // Prescription
    officialPrescription: "Official Digital E-Prescription",
    printPdf: "Print / PDF",
    qrVerified: "QR VERIFIED",
    scanToVerify: "Scan to Verify",
    recommendedTests: "Recommended Lab Tests:",
    doctorAdvice: "Doctor Advice:",
    prescribedMedicines: "Rx (Prescribed Medicines)",

    // Medical Report Vault
    medicalReportVault: "Medical Report Vault",
    medicalReportVaultSubtitle: "Upload and organize all diagnostic lab reports, blood tests, and scans.",
    uploadLabReport: "Upload Lab Report",
    diagnosticCenter: "Diagnostic Center",
    testDate: "Test Date",
    testCategory: "Test Category",
    summaryFindings: "Summary / Key Findings",
    documentUrl: "Document / Scan URL (PDF or Image)",
    viewDocument: "View Report Document ↗",
    noReportsFound: "No Medical Reports Uploaded Yet",
    noReportsHint: "Upload your blood tests, USGs, and diagnostic reports to access them anywhere.",
  },

  bn: {
    // Nav
    home: "হোম",
    doctors: "ডাক্তার",
    clinics: "ক্লিনিক",
    bookAppointment: "অ্যাপয়েন্টমেন্ট করুন",
    dashboard: "ড্যাশবোর্ড",
    signIn: "লগইন করুন",
    signUp: "নিবন্ধন করুন",
    signOut: "লগআউট",
    notifications: "বিজ্ঞপ্তি",
    noNotifications: "কোনো নতুন বিজ্ঞপ্তি নেই",

    // Patient Dashboard
    patientDashboard: "রোগীর ড্যাশবোর্ড",
    patientDashboardSubtitle: "লাইভ সিরিয়াল ট্র্যাকার, অ্যাপয়েন্টমেন্ট ও পারিবারিক স্বাস্থ্যসেবা",
    myAppointments: "আমার অ্যাপয়েন্টমেন্ট",
    familyProfiles: "পরিবার প্রোফাইল",
    addFamilyMember: "পরিবারের সদস্য যোগ করুন",
    noAppointments: "কোনো অ্যাপয়েন্টমেন্ট নেই",
    noAppointmentsHint: "আপনি এখনো কোনো ডাক্তারের সাথে পরামর্শ নেননি।",
    bookNow: "এখনই অ্যাপয়েন্টমেন্ট করুন",

    // Serial Tracker
    liveSerialTracker: "লাইভ সিরিয়াল ট্র্যাকার",
    doctorStatus: "ডাক্তারের অবস্থা:",
    refreshesAuto: "স্বয়ংক্রিয়ভাবে রিফ্রেশ হচ্ছে ⏱️",
    currentlyCalled: "বর্তমানে ডাকা হচ্ছে",
    yourSerial: "আপনার সিরিয়াল #",
    patientsAhead: "সামনে রোগী",
    estWait: "অনুমানিত অপেক্ষা",
    yourTurn: "আপনার পালা!",
    itsYourTurn: "🎉 এখন আপনার পালা! ডা.",
    consultationRoom: "-এর চেম্বারে প্রবেশ করুন।",
    getReady: "🔔 প্রস্তুত থাকুন: আর মাত্র",
    patientsAway: "জন রোগী বাকি! অনুগ্রহ করে ওয়েটিং লাউঞ্জে রিপোর্ট করুন।",

    // Appointment card
    serialBadge: "সিরিয়াল #",
    forPatient: "রোগী:",
    pendingPayment: "পেমেন্ট বাকি",
    confirmed: "নিশ্চিত",
    completed: "সম্পন্ন",
    cancelled: "বাতিল",
    payAndConfirm: "পেমেন্ট করুন ও নিশ্চিত করুন",
    cancel: "বাতিল করুন",
    viewPrescription: "ই-প্রেসক্রিপশন দেখুন",

    // Payment
    processPayment: "পেমেন্ট প্রক্রিয়া করুন",
    amountPayable: "প্রদেয় পরিমাণ",
    selectPaymentMethod: "পেমেন্ট পদ্ধতি বেছে নিন",
    enterTrxId: "ট্রানজেকশন আইডি (TrxID) দিন *",
    cashAtChamberNote: "চেম্বারে নগদ নির্বাচিত: অ্যাপয়েন্টমেন্টের দিন ক্লিনিক রিসেপশনে সরাসরি পরিশোধ করুন।",
    confirmPayment: "পেমেন্ট নিশ্চিত করুন",
    confirming: "নিশ্চিত হচ্ছে...",

    // Family
    parentCareTitle: "অভিভাবক সেবা ও পারিবারিক প্রোফাইল",
    parentCareSubtitle: "বাবা-মা, স্বামী/স্ত্রী বা সন্তানদের যোগ করুন এবং তাদের অ্যাপয়েন্টমেন্ট ও স্বাস্থ্য ইতিহাস পরিচালনা করুন।",
    addMember: "সদস্য যোগ করুন",
    noFamilyMembers: "কোনো পারিবারিক সদস্য যোগ করা হয়নি",
    noFamilyHint: "আপনার পরিবারের সদস্যদের যোগ করুন এবং সহজেই তাদের পক্ষে অ্যাপয়েন্টমেন্ট নিন।",
    fullName: "পুরো নাম",
    relationship: "সম্পর্ক",
    phone: "ফোন নম্বর (বাংলাদেশ)",
    age: "বয়স",
    gender: "লিঙ্গ",
    bloodGroup: "রক্তের গ্রুপ",
    medicalNotes: "চিকিৎসার নোট / ইতিহাস",
    saveMember: "সদস্য সংরক্ষণ করুন",
    saving: "সংরক্ষণ হচ্ছে...",

    // Prescription
    officialPrescription: "অফিসিয়াল ডিজিটাল ই-প্রেসক্রিপশন",
    printPdf: "প্রিন্ট / পিডিএফ",
    qrVerified: "QR যাচাইকৃত",
    scanToVerify: "যাচাই করতে স্ক্যান করুন",
    recommendedTests: "প্রস্তাবিত ল্যাব পরীক্ষা:",
    doctorAdvice: "ডাক্তারের পরামর্শ:",
    prescribedMedicines: "Rx (নির্ধারিত ওষুধ)",

    // Medical Report Vault
    medicalReportVault: "মেডিকেল রিপোর্ট ভল্ট",
    medicalReportVaultSubtitle: "আপনার সব ডায়াগনস্টিক রিপোর্ট, রক্তের পরীক্ষা এবং স্ক্যান নিরাপদে সংরক্ষণ করুন।",
    uploadLabReport: "ল্যাব রিপোর্ট আপলোড করুন",
    diagnosticCenter: "ডায়াগনস্টিক সেন্টার",
    testDate: "পরীক্ষার তারিখ",
    testCategory: "পরীক্ষার ধরন",
    summaryFindings: "সারাংশ / প্রধান ফলাফল",
    documentUrl: "ডকুমেন্ট / স্ক্যান URL (পিডিএফ বা ছবি)",
    viewDocument: "রিপোর্ট ডকুমেন্ট দেখুন ↗",
    noReportsFound: "এখনো কোনো মেডিকেল রিপোর্ট আপলোড করা হয়নি",
    noReportsHint: "আপনার রক্তের পরীক্ষা, আল্ট্রাসনোগ্রাম এবং ডায়াগনস্টিক রিপোর্টগুলো আপলোড করে যেকোনো জায়গা থেকে অ্যাক্সেস করুন।",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("sc_lang") || "en"
  );

  const toggleLanguage = () => {
    const next = language === "en" ? "bn" : "en";
    setLanguage(next);
    localStorage.setItem("sc_lang", next);
  };

  const t = (key) => translations[language]?.[key] ?? translations["en"][key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
