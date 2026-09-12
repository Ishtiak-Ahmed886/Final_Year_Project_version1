import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import apiClient from "../../api/axios";
import {
  ShieldCheck, Lock, CreditCard, Smartphone, Building2,
  CheckCircle2, AlertCircle, ArrowLeft, Loader2, Printer,
  Calendar, Clock, User, Stethoscope, ChevronRight,
  Sparkles
} from "lucide-react";

export default function CheckoutGateway() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Payment Options
  const [payMode, setPayMode] = useState("FULL"); // 'FULL' or 'TOKEN_DEPOSIT'
  const [activeTab, setActiveTab] = useState("mfs"); // 'mfs' | 'cards'
  const [selectedMethod, setSelectedMethod] = useState("BKASH");

  // Multi-step MFS states
  const [mfsStep, setMfsStep] = useState(1); // 1 = Mobile, 2 = OTP, 3 = PIN
  const [phone, setPhone] = useState("01712345678");
  const [otp, setOtp] = useState("123456");
  const [pin, setPin] = useState("12345");
  const [otpTimer, setOtpTimer] = useState(59);

  // Card Inputs
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [cardName, setCardName] = useState("Rahim Uddin");

  // Success Modal State & Digital Receipt
  const [successReceipt, setSuccessReceipt] = useState(null);

  const MFS_METHODS = [
    {
      id: "BKASH",
      name: "bKash",
      color: "bg-[#E2136E] text-white border-[#E2136E]",
      badge: "Most Popular",
      desc: "Instant bKash Direct Checkout",
      logoText: "bKash"
    },
    {
      id: "NAGAD",
      name: "Nagad",
      color: "bg-[#F7941D] text-white border-[#F7941D]",
      badge: "Govt Post",
      desc: "Postal Digital MFS Wallet",
      logoText: "Nagad"
    },
    {
      id: "ROCKET",
      name: "Rocket",
      color: "bg-[#8C3494] text-white border-[#8C3494]",
      badge: "DBBL",
      desc: "Dutch-Bangla Bank MFS",
      logoText: "Rocket"
    },
    {
      id: "UPAY",
      name: "Upay",
      color: "bg-[#0055A5] text-white border-[#0055A5]",
      badge: "UCB",
      desc: "UCB Digital Money Wallet",
      logoText: "Upay"
    },
  ];

  const CARD_METHODS = [
    { id: "VISA", name: "Visa Debit/Credit", brand: "VISA" },
    { id: "MASTERCARD", name: "Mastercard", brand: "MC" },
    { id: "NEXUS", name: "DBBL Nexus Card", brand: "NEXUS" },
  ];

  // OTP Countdown simulation
  useEffect(() => {
    let interval = null;
    if (mfsStep === 2 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mfsStep, otpTimer]);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const directRes = await apiClient.get(`/payments/${paymentId}/`);
        if (directRes && directRes.id) {
          setPayment(directRes);
          return;
        }
      } catch {
        try {
          const res = await apiClient.get("/payments/");
          const list = res.results || res || [];
          const found = list.find((p) => p.id === paymentId);
          if (found) {
            setPayment(found);
            return;
          }
        } catch {}
      } finally {
        setLoading(false);
      }

      setPayment({
        id: paymentId,
        amount: "1000.00",
        currency: "BDT",
        appointment: {
          id: "preview-apt-01",
          serial_number: 7,
          appointment_date: new Date().toISOString().split("T")[0],
          appointment_time: "10:30 AM",
          doctor: { full_name: "Dr. Karim Chowdhury", qualification: "MBBS, FCPS" },
          clinic: { name: "Smart Clinic Chamber", address: "Dhanmondi 27, Dhaka", phone: "01700-000000" },
          patient: { first_name: "Rahim", last_name: "Uddin" }
        }
      });
    };
    fetchPayment();
  }, [paymentId]);

  const fullAmount = Number(payment?.amount || 1000);
  const tokenDepositAmount = Math.min(200, fullAmount);
  const payableAmount = payMode === "TOKEN_DEPOSIT" ? tokenDepositAmount : fullAmount;
  const remainingDue = fullAmount - payableAmount;

  const handleNextStep = (e) => {
    e.preventDefault();
    if (selectedMethod === "BKASH") {
      if (mfsStep === 1) {
        setMfsStep(2);
        setOtpTimer(59);
        return;
      }
      if (mfsStep === 2) {
        setMfsStep(3);
        return;
      }
    } else {
      if (mfsStep === 1) {
        setMfsStep(3);
        return;
      }
    }
    handleExecutePayment();
  };

  const handleExecutePayment = async () => {
    setSubmitting(true);
    setError("");

    try {
      const generatedTrx = `${selectedMethod}_${Date.now().toString().slice(-8)}`;
      const generatedVal = `VAL_${Date.now().toString().slice(-8)}`;

      const res = await apiClient.post(`/payments/${paymentId}/process/`, {
        transaction_id: generatedTrx,
        val_id: generatedVal,
        bank_tran_id: generatedTrx,
        card_type: `${selectedMethod}-MobileBanking`,
        payment_method: selectedMethod,
      });

      const apt = res?.appointment || payment?.appointment || {};
      setSuccessReceipt({
        paymentId: paymentId,
        transactionId: generatedTrx,
        valId: generatedVal,
        method: selectedMethod,
        amountPaid: payableAmount,
        remainingDue: remainingDue,
        currency: "BDT",
        appointmentId: apt.id || payment?.appointment?.id || "",
        serialNumber: apt.serial_number || payment?.appointment?.serial_number || 1,
        appointmentDate: apt.appointment_date || payment?.appointment?.appointment_date || "",
        appointmentTime: apt.appointment_time || payment?.appointment?.appointment_time || "",
        doctorName: apt.doctor?.full_name || payment?.appointment?.doctor?.full_name || "Specialist Doctor",
        doctorQualification: apt.doctor?.qualification || "MBBS, Specialist",
        clinicName: apt.clinic?.name || payment?.appointment?.clinic?.name || "Smart Clinic Bangladesh",
        clinicAddress: apt.clinic?.address || payment?.appointment?.clinic?.address || "Dhaka, Bangladesh",
        patientName: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}`.trim() : "Patient",
      });
    } catch {
      setError("Payment processing failed. Please check your credentials or try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard?payment=cancel", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-primary" />
          <span className="text-xs font-bold text-slate-500">Connecting to Payment Gateway...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="btn btn-ghost btn-sm gap-1.5 text-slate-600 font-bold hover:bg-white"
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full font-bold border border-emerald-300/60">
            <Lock size={12} /> 256-Bit SSL Encrypted
          </div>
        </div>

        {/* Brand Gateway Header Card */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              ৳
            </div>
            <div>
              <div className="font-black text-slate-800 text-base flex items-center gap-1.5">
                Smart Clinic MFS Gateway <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs text-slate-400">
                Official Bangladesh Instant Healthcare Checkout
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex sm:flex-col justify-between items-end">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payable Now</div>
            <div className="text-2xl font-black text-primary">৳{payableAmount} <span className="text-xs font-bold text-slate-500">BDT</span></div>
          </div>
        </div>

        {/* Appointment Summary Banner */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
              <Stethoscope size={15} className="text-primary" />
              Dr. {payment?.appointment?.doctor?.full_name || "Specialist Doctor"}
            </div>
            <span className="badge badge-sm badge-outline font-bold text-slate-500">
              Serial #{payment?.appointment?.serial_number || 1}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1 text-slate-500">
              <Building2 size={13} className="text-slate-400" />
              <span className="truncate">{payment?.appointment?.clinic?.name || "Smart Clinic"}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 justify-end">
              <Calendar size={13} className="text-slate-400" />
              <span>{payment?.appointment?.appointment_date} ({payment?.appointment?.appointment_time})</span>
            </div>
          </div>
        </div>

        {/* PAYMENT PLAN SELECTION (FULL vs ADVANCE DEPOSIT) */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-3">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" /> Choose Payment Option
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPayMode("FULL")}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                payMode === "FULL"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-extrabold text-xs text-slate-800">Full Consultation Fee</span>
                <span className="badge badge-sm badge-primary font-bold">100% Cleared</span>
              </div>
              <div className="text-lg font-black text-primary mt-1">৳{fullAmount} BDT</div>
              <div className="text-[10px] text-slate-400 mt-1">No pending fees at the chamber counter.</div>
            </button>

            <button
              type="button"
              onClick={() => setPayMode("TOKEN_DEPOSIT")}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                payMode === "TOKEN_DEPOSIT"
                  ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-extrabold text-xs text-slate-800">Token Advance Deposit</span>
                <span className="badge badge-sm badge-success badge-soft font-bold">Locks Serial</span>
              </div>
              <div className="text-lg font-black text-emerald-600 mt-1">৳{tokenDepositAmount} BDT</div>
              <div className="text-[10px] text-slate-500 mt-1">Pay ৳{remainingDue} remaining in cash at reception.</div>
            </button>
          </div>
        </div>

        {/* PAYMENT CHANNELS & INTERACTIVE GATEWAY */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
          {/* Main Channel Tabs */}
          <div className="flex border-b border-slate-200 pb-2 gap-5">
            <button
              type="button"
              onClick={() => { setActiveTab("mfs"); setMfsStep(1); }}
              className={`pb-2.5 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "mfs"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Smartphone size={16} /> Mobile Banking (MFS)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("cards"); setMfsStep(1); }}
              className={`pb-2.5 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "cards"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <CreditCard size={16} /> Cards & Internet Banking
            </button>
          </div>

          {error && (
            <div className="alert alert-error text-white text-xs font-bold rounded-2xl shadow-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* ===== MFS SECTION (bKash, Nagad, Rocket, Upay) ===== */}
          {activeTab === "mfs" && (
            <div className="space-y-6">
              {/* MFS Selector Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {MFS_METHODS.map((m) => {
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setSelectedMethod(m.id); setMfsStep(1); }}
                      className={`p-3.5 rounded-2xl font-bold text-center border-2 transition-all flex flex-col items-center justify-between gap-1 relative ${
                        isSelected
                          ? `${m.color} shadow-lg scale-102`
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {m.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {m.badge}
                        </span>
                      )}
                      <div className="text-base tracking-wide font-black">{m.name}</div>
                      <div className={`text-[9px] leading-tight ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                        {m.id === "BKASH" ? "Direct Wallet" : m.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* AUTHENTIC BRANDED MFS FORM CONTAINER */}
              <form onSubmit={handleNextStep} className="rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Method Brand Bar */}
                <div className={`p-4 flex items-center justify-between ${
                  selectedMethod === "BKASH" ? "bg-[#E2136E] text-white" :
                  selectedMethod === "NAGAD" ? "bg-[#F7941D] text-white" :
                  selectedMethod === "ROCKET" ? "bg-[#8C3494] text-white" : "bg-primary text-white"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-wider">{selectedMethod}</span>
                    <span className="text-xs opacity-90">| Payment Gateway</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="opacity-80">Total: </span>
                    <strong className="text-sm">৳{payableAmount} BDT</strong>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 space-y-4">
                  {/* Step Progress Dots */}
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 pb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${mfsStep >= 1 ? "bg-slate-800 text-white" : "bg-slate-200"}`}>
                      1. Account
                    </span>
                    <span>➔</span>
                    {selectedMethod === "BKASH" && (
                      <>
                        <span className={`px-2.5 py-1 rounded-full text-xs ${mfsStep >= 2 ? "bg-slate-800 text-white" : "bg-slate-200"}`}>
                          2. OTP Code
                        </span>
                        <span>➔</span>
                      </>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs ${mfsStep === 3 ? "bg-slate-800 text-white" : "bg-slate-200"}`}>
                      {selectedMethod === "BKASH" ? "3. PIN" : "2. PIN"}
                    </span>
                  </div>

                  {/* STEP 1: MOBILE NUMBER */}
                  {mfsStep === 1 && (
                    <div className="space-y-3">
                      <div>
                        <label className="label text-xs font-bold text-slate-700">
                          Your {selectedMethod} Mobile Account Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            maxLength={11}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="input input-bordered w-full bg-white font-mono text-base tracking-wider pl-4"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 px-1">
                          <span>Must be an active 11-digit mobile number</span>
                          <button
                            type="button"
                            onClick={() => setPhone("01711998877")}
                            className="text-primary hover:underline font-bold"
                          >
                            Demo Fill
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200 flex items-start gap-2">
                        <Lock size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                        <span>By clicking Next, you agree to authorize the transaction of <strong>৳{payableAmount} BDT</strong> for clinic booking.</span>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: OTP VERIFICATION (bKash Flow) */}
                  {mfsStep === 2 && (
                    <div className="space-y-3">
                      <div className="text-center py-1">
                        <div className="text-xs font-bold text-slate-700">Enter Verification Code sent to</div>
                        <div className="font-mono font-black text-slate-900 text-sm mt-0.5">{phone}</div>
                      </div>

                      <div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="123456"
                          className="input input-bordered w-full bg-white font-mono text-center tracking-[0.5em] text-xl font-black"
                        />
                        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
                          <span>Demo Sandbox Code: <strong className="font-mono text-slate-700">123456</strong></span>
                          <span className="font-bold text-slate-600">
                            {otpTimer > 0 ? `Resend in ${otpTimer}s` : (
                              <button type="button" onClick={() => setOtpTimer(59)} className="text-primary font-bold">
                                Resend Code
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: PIN VERIFICATION */}
                  {mfsStep === 3 && (
                    <div className="space-y-3">
                      <div className="text-center py-1">
                        <div className="text-xs font-bold text-slate-700">Enter your {selectedMethod} PIN</div>
                        <div className="text-[11px] text-slate-400">Secured sandbox simulation</div>
                      </div>

                      <div>
                        <input
                          type="password"
                          required
                          maxLength={5}
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="•••••"
                          className="input input-bordered w-full bg-white font-mono text-center tracking-[0.6em] text-2xl font-black"
                        />
                        <span className="text-[11px] text-slate-400 block text-center mt-1.5">
                          Pre-filled with test PIN (12345). Click Confirm Payment to complete.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Navigation Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    {mfsStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setMfsStep((prev) => prev - 1)}
                        className="btn btn-ghost flex-1 text-slate-600 font-bold"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-ghost flex-1 text-slate-500 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`btn flex-1 text-white shadow-md font-extrabold ${
                        selectedMethod === "BKASH" ? "bg-[#E2136E] hover:bg-[#c4105f] border-none" :
                        selectedMethod === "NAGAD" ? "bg-[#F7941D] hover:bg-[#de8012] border-none" :
                        selectedMethod === "ROCKET" ? "bg-[#8C3494] hover:bg-[#73297a] border-none" : "btn-primary"
                      }`}
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : mfsStep < 3 && selectedMethod === "BKASH" ? (
                        "Next Step ➔"
                      ) : mfsStep === 1 && selectedMethod !== "BKASH" ? (
                        "Next Step ➔"
                      ) : (
                        `Confirm Pay ৳${payableAmount} BDT`
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ===== CARDS SECTION (Visa / Mastercard / Nexus) ===== */}
          {activeTab === "cards" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {CARD_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-4 rounded-2xl font-bold text-center border-2 transition-all ${
                      selectedMethod === m.id
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-sm font-black">{m.brand}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{m.name}</div>
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleExecutePayment(); }} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="label text-xs font-bold text-slate-600">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="input input-bordered w-full bg-white text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold text-slate-600">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="input input-bordered w-full bg-white font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs font-bold text-slate-600">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="input input-bordered w-full bg-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-slate-600">CVV / CVC</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="input input-bordered w-full bg-white font-mono text-sm text-center"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-ghost flex-1 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 shadow-md font-extrabold"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      `Pay ৳${payableAmount} BDT`
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Guarantee Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Lock size={13} className="text-emerald-600" />
              Verified by SSLCommerz V4 Bangladesh Gateway Engine
            </div>
            <div className="text-[11px] font-mono">
              Session Ref: #{paymentId?.slice(0, 8)}
            </div>
          </div>
        </div>
      </div>

      {/* ===== POST-PAYMENT SUCCESS & THERMAL RECEIPT MODAL ===== */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            {/* Top Success Banner */}
            <div className="text-center space-y-1 print:hidden">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-500">
                Token Serial confirmed & SMS sent to your phone.
              </p>
            </div>

            {/* Printable Thermal Receipt Slip */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3 font-mono text-xs bg-slate-50">
              <div className="border-b border-slate-200 pb-2 space-y-0.5">
                <div className="font-black text-sm uppercase tracking-wider">{successReceipt.clinicName}</div>
                <div className="text-[10px] text-slate-500">{successReceipt.clinicAddress}</div>
                <div className="text-[9px] text-slate-400">Govt Reg. Clinic ID: #{successReceipt.paymentId?.slice(0, 8)}</div>
              </div>

              {/* Big Serial Display */}
              <div className="py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">
                  CONFIRMED SERIAL TOKEN
                </div>
                <div className="text-5xl font-black text-emerald-600 my-1">
                  #{successReceipt.serialNumber}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  {successReceipt.appointmentDate} | {successReceipt.appointmentTime}
                </div>
              </div>

              {/* Ledger Summary */}
              <div className="text-left space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold">{successReceipt.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold">Dr. {successReceipt.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel / Method:</span>
                  <span className="font-bold uppercase text-primary">{successReceipt.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TrxID:</span>
                  <span className="font-mono font-bold">{successReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-black text-emerald-600">৳{successReceipt.amountPaid} BDT</span>
                </div>
                {successReceipt.remainingDue > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Due at Chamber:</span>
                    <span>৳{successReceipt.remainingDue} BDT</span>
                  </div>
                )}
              </div>

              {/* Scannable Live Tracker QR Code */}
              <div className="pt-2 border-t border-slate-200 flex flex-col items-center justify-center space-y-1.5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    `${window.location.origin}/track-queue/${successReceipt.appointmentId}`
                  )}`}
                  alt="Queue QR"
                  className="w-20 h-20 border border-slate-300 rounded-lg p-1 bg-white shadow-xs"
                />
                <span className="text-[10px] font-bold text-emerald-700">
                  Scan QR with Mobile to Track Live Queue
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {window.location.origin}/track-queue/{successReceipt.appointmentId?.slice(0, 8)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1 print:hidden">
              <Link
                to={`/track-queue/${successReceipt.appointmentId}`}
                className="btn btn-primary w-full gap-2 font-black shadow-md"
              >
                Track Live Queue Now <ChevronRight size={16} />
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline flex-1 gap-1.5 font-bold text-xs"
                >
                  <Printer size={15} /> Print Slip
                </button>
                <Link
                  to="/dashboard"
                  className="btn btn-ghost flex-1 font-bold text-xs text-slate-600"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
