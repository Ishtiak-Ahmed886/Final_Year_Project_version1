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
    leaveReview: "Leave a Review",

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
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    bloodGroup: "Blood Group",
    medicalNotes: "Medical Notes / History",
    saveMember: "Save Member",
    editMember: "Edit Family Member",
    updateMember: "Update Member",
    deleteMember: "Delete",
    confirmDeleteMember: "Are you sure you want to remove this family member?",
    saving: "Saving...",

    // Prescription
    officialPrescription: "Official Digital E-Prescription",
    printPdf: "Print / PDF",
    qrVerified: "QR VERIFIED",
    scanToVerify: "Scan to Verify",
    recommendedTests: "Recommended Lab Tests:",
    doctorAdvice: "Doctor Advice:",
    prescribedMedicines: "Rx (Prescribed Medicines)",
    rxVerificationTitle: "Official E-Prescription Verification",
    rxVerificationSubtitle: "Government & DGDA Compliant Digital Medical Record Verification for Pharmacies & Labs",
    verifyPrescription: "Verify Prescription",
    enterQrToken: "Enter QR Token / Prescription UUID",
    dispenseHelper: "Pharmacy Dispensing Checklist",
    markDispensed: "Dispensed",
    copyVerifyLink: "Copy Link",
    linkCopied: "Link Copied!",

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

    // Homepage
    heroBadge: "Modernizing Clinic Operations & Care",
    heroPlatformBadge: "v2.4 Platform",
    heroTitle1: "Manage Clinics.",
    heroTitle2: "Book Appointments.",
    heroTitle3: "All in One Place.",
    heroSubtitle: "Smart Clinic connects clinic owners and patients through a simple, secure, and modern healthcare platform.",
    openYourClinic: "Open Your Clinic",
    findClinic: "Find a Clinic",
    onlineBookingBadge: "Online Booking",
    secureDataBadge: "Secure Data",
    uptimeBadge: "99.9% Uptime Guarantee",
    trustedByPractitioners: "Trusted by 1,000+ certified healthcare practitioners",
    quickBook: "Quick Book",
    everythingYouNeed: "Everything You Need",
    everythingYouNeedSubtitle: "Powerful tools for clinics and patients.",
    chooseYourJourney: "Choose Your Journey",
    chooseYourJourneySubtitle: "Tailored portals for healthcare providers and individuals seeking care.",
    clinicOwner: "Clinic Owner",
    clinicOwnerDesc: "Scale clinical workflows, doctor rosters, and digital billing from a unified console.",
    patient: "Patient",
    patientDesc: "Discover trusted doctors, schedule visits with zero waiting time, and access records.",
    openClinicBtn: "Open Clinic",
    becomePatientBtn: "Become Patient",
    forProviders: "For Providers",
    forPatients: "For Patients",
    readyToModernize: "Ready to Modernize Healthcare?",
    readyToModernizeSubtitle: "Join Smart Clinic today. Transform how your clinic operates and how patients book care.",
    getStarted: "Get Started",
    requestDemo: "Request a Demo",
    noCardRequired: "No credit card required",
    freeTrial: "Instant 14-day free trial",
    hipaaCompliant: "HIPAA/ISO Compliant",
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
    leaveReview: "রিভিউ দিন",

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
    dateOfBirth: "জন্ম তারিখ",
    gender: "লিঙ্গ",
    bloodGroup: "রক্তের গ্রুপ",
    medicalNotes: "চিকিৎসার নোট / ইতিহাস",
    saveMember: "সদস্য সংরক্ষণ করুন",
    editMember: "সদস্য সম্পাদনা করুন",
    updateMember: "আপডেট করুন",
    deleteMember: "মুছুন",
    confirmDeleteMember: "আপনি কি নিশ্চিতভাবে এই সদস্যকে মুছে ফেলতে চান?",
    saving: "সংরক্ষণ হচ্ছে...",

    // Prescription
    officialPrescription: "অফিসিয়াল ডিজিটাল ই-প্রেসক্রিপশন",
    printPdf: "প্রিন্ট / পিডিএফ",
    qrVerified: "QR যাচাইকৃত",
    scanToVerify: "যাচাই করতে স্ক্যান করুন",
    recommendedTests: "প্রস্তাবিত ল্যাব পরীক্ষা:",
    doctorAdvice: "ডাক্তারের পরামর্শ:",
    prescribedMedicines: "Rx (নির্ধারিত ওষুধ)",
    rxVerificationTitle: "অফিসিয়াল ই-প্রেসক্রিপশন যাচাইকরণ",
    rxVerificationSubtitle: "ফার্মেসি ও ডায়াগনস্টিক ল্যাবের জন্য ডিজিডিএ অনুমোদিত ডিজিটাল চিকিৎসা ব্যবস্থাপত্র যাচাইকরণ",
    verifyPrescription: "প্রেসক্রিপশন যাচাই করুন",
    enterQrToken: "কিউআর টোকেন বা কোড লিখুন",
    dispenseHelper: "ফার্মেসি ওষুধ বিতরণ চেকলিস্ট",
    markDispensed: "দেওয়া হয়েছে",
    copyVerifyLink: "লিংক কপি",
    linkCopied: "লিংক কপি হয়েছে!",

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

    // Homepage
    heroBadge: "আধুনিক ক্লিনিক ও চিকিৎসা সেবা কার্যক্রম",
    heroPlatformBadge: "v২.৪ প্ল্যাটফর্ম",
    heroTitle1: "ক্লিনিক পরিচালনা করুন।",
    heroTitle2: "অ্যাপয়েন্টমেন্ট বুক করুন।",
    heroTitle3: "সবকিছু এক প্ল্যাটফর্মে।",
    heroSubtitle: "স্মার্ট ক্লিনিক ক্লিনিক মালিক ও রোগীদের একটি সহজ, নিরাপদ ও আধুনিক স্বাস্থ্যসেবা প্ল্যাটফর্মের মাধ্যমে যুক্ত করে।",
    openYourClinic: "ক্লিনিক চালু করুন",
    findClinic: "ক্লিনিক খুঁজুন",
    onlineBookingBadge: "অনলাইন বুকিং",
    secureDataBadge: "নিরাপদ ডাটা",
    uptimeBadge: "৯৯.৯% আপটাইম নিশ্চয়তা",
    trustedByPractitioners: "১,০০০+ রেজিস্টার্ড চিকিৎসকদের বিশ্বস্ত",
    quickBook: "দ্রুত বুক করুন",
    everythingYouNeed: "আপনার প্রয়োজনীয় সবকিছু",
    everythingYouNeedSubtitle: "ক্লিনিক এবং রোগীদের জন্য আধুনিক সব টুলস।",
    chooseYourJourney: "আপনার মাধ্যম বেছে নিন",
    chooseYourJourneySubtitle: "স্বাস্থ্যসেবা প্রদানকারী এবং সেবা গ্রহীতাদের জন্য সুনির্দিষ্ট পোর্টাল।",
    clinicOwner: "ক্লিনিক মালিক",
    clinicOwnerDesc: "ক্লিনিক্যাল কার্যপ্রবাহ, ডাক্তারদের রোস্টার এবং ডিজিটাল বিলিং পরিচালনা করুন এক কনসোল থেকে।",
    patient: "রোগী",
    patientDesc: "বিশ্বস্ত ডাক্তার খুঁজুন, কোনো বিলম্ব ছাড়াই ভিজিট শিডিউল করুন এবং প্রেসক্রিপশন পান।",
    openClinicBtn: "ক্লিনিক খুলুন",
    becomePatientBtn: "রোগী হিসেবে যুক্ত হন",
    forProviders: "সেবা প্রদানকারীদের জন্য",
    forPatients: "রোগীদের জন্য",
    readyToModernize: "স্বাস্থ্যসেবায় আধুনিক হতে প্রস্তুত?",
    readyToModernizeSubtitle: "আজই স্মার্ট ক্লিনিকে যোগ দিন। আপনার ক্লিনিক কার্যক্রম রূপান্তর করুন।",
    getStarted: "শুরু করুন",
    requestDemo: "ডেমো দেখুন",
    noCardRequired: "কোনো ক্রেডিট কার্ড লাগবে না",
    freeTrial: "১৪ দিনের ফ্রি ট্রায়াল",
    hipaaCompliant: "HIPAA/ISO সার্টিফাইড",
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
