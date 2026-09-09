import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import apiClient from "../../api/axios";
import {
  ShieldCheck, Lock, CreditCard, Smartphone, Building2,
  CheckCircle2, AlertCircle, ArrowLeft, Loader2
} from "lucide-react";

export default function CheckoutGateway() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("mfs"); // 'mfs' | 'cards' | 'netbanking'
  const [selectedMethod, setSelectedMethod] = useState("BKASH");
  const [phone, setPhone] = useState("01712345678");
  const [pin, setPin] = useState("12345");
  const [step, setStep] = useState(1); // 1 = account, 2 = otp/pin

  const MFS_METHODS = [
    { id: "BKASH", name: "bKash", color: "bg-[#E2136E] text-white border-[#E2136E]", desc: "Direct bKash Wallet" },
    { id: "NAGAD", name: "Nagad", color: "bg-[#F7941D] text-white border-[#F7941D]", desc: "Postal MFS Service" },
    { id: "ROCKET", name: "Rocket", color: "bg-[#8C3494] text-white border-[#8C3494]", desc: "Dutch-Bangla Bank MFS" },
    { id: "UPAY", name: "Upay", color: "bg-[#0055A5] text-white border-[#0055A5]", desc: "UCB Digital Wallet" },
  ];

  const CARD_METHODS = [
    { id: "VISA", name: "Visa Card", color: "bg-[#1A1F71] text-white border-[#1A1F71]" },
    { id: "MASTERCARD", name: "Mastercard", color: "bg-[#EB001B] text-white border-[#EB001B]" },
    { id: "NEXUS", name: "DBBL Nexus", color: "bg-[#00884A] text-white border-[#00884A]" },
  ];

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await apiClient.get("/payments/");
        const list = res.results || res || [];
        const found = list.find((p) => p.id === paymentId);
        if (found) {
          setPayment(found);
        } else {
          // Fallback dummy for instant view
          setPayment({
            id: paymentId,
            amount: "1000.00",
            currency: "BDT",
            appointment: { doctor: { full_name: "Consultant Specialist" }, clinic: { name: "Smart Clinic Chamber" } }
          });
        }
      } catch {
        setPayment({
          id: paymentId,
          amount: "1000.00",
          currency: "BDT",
          appointment: { doctor: { full_name: "Consultant Specialist" }, clinic: { name: "Smart Clinic Chamber" } }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [paymentId]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (step === 1 && (selectedMethod === "BKASH" || selectedMethod === "NAGAD")) {
      setStep(2);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const generatedTrx = `SSL_${selectedMethod}_${Date.now()}`;
      const generatedVal = `VAL_${Date.now()}`;
      
      await apiClient.post(`/payments/${paymentId}/process/`, {
        transaction_id: generatedTrx,
        val_id: generatedVal,
        card_type: `${selectedMethod}-MobileBanking`,
      });

      const aptId = payment?.appointment?.id || "";
      navigate(`/dashboard?payment=success&apt_id=${aptId}`, { replace: true });
    } catch {
      setError("Payment transaction failed. Please try again.");
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard?payment=cancel", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Gateway Brand Header */}
        <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
              SSL
            </div>
            <div>
              <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                SSLCOMMERZ Hosted Gateway <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs text-slate-400">Official Bangladesh Secure Payment Service</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Payable Amount</div>
            <div className="text-xl font-black text-primary">৳{payment?.amount || "1000.00"} BDT</div>
          </div>
        </div>

        {/* Order Details Mini Banner */}
        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <div>
            <strong>Merchant:</strong> Smart Clinic Bangladesh
          </div>
          <div>
            <strong>Invoice:</strong> #{paymentId?.slice(0, 8)}
          </div>
        </div>

        {/* Payment Channels Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
          {/* Method Tabs */}
          <div className="flex border-b border-slate-200 pb-2 gap-4">
            <button
              type="button"
              onClick={() => { setActiveTab("mfs"); setStep(1); }}
              className={`pb-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "mfs" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Smartphone size={16} /> Mobile Banking (MFS)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("cards"); setStep(1); }}
              className={`pb-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "cards" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <CreditCard size={16} /> Cards & Net Banking
            </button>
          </div>

          {error && (
            <div className="alert alert-error text-white text-xs font-bold rounded-2xl">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* MFS CHANNEL SELECT */}
          {activeTab === "mfs" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MFS_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setSelectedMethod(m.id); setStep(1); }}
                    className={`p-4 rounded-2xl font-bold text-center border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedMethod === m.id
                        ? `${m.color} shadow-lg scale-102`
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-base tracking-wide font-black">{m.name}</div>
                    <div className="text-[10px] opacity-80">{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* MFS Input Form Simulation */}
              <form onSubmit={handlePay} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className={`px-3 py-1 rounded-xl text-xs font-black ${
                    selectedMethod === "BKASH" ? "bg-[#E2136E] text-white" :
                    selectedMethod === "NAGAD" ? "bg-[#F7941D] text-white" :
                    selectedMethod === "ROCKET" ? "bg-[#8C3494] text-white" : "bg-primary text-white"
                  }`}>
                    {selectedMethod}
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {step === 1 ? "Enter Account Number" : "Enter Verification PIN"}
                  </span>
                </div>

                {step === 1 ? (
                  <div>
                    <label className="label text-xs font-bold text-slate-600">Your {selectedMethod} Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="input input-bordered w-full bg-white font-mono text-sm"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Demo mode: click Next to proceed to PIN confirmation.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="label text-xs font-bold text-slate-600">{selectedMethod} 5-Digit PIN</label>
                      <input
                        type="password"
                        required
                        maxLength={5}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="•••••"
                        className="input input-bordered w-full bg-white font-mono text-center tracking-widest text-lg"
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      🔒 Sandbox Gateway Simulation: Pre-filled with demo PIN. Click Confirm to verify.
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-ghost flex-1 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`btn flex-1 text-white shadow-md ${
                      selectedMethod === "BKASH" ? "bg-[#E2136E] hover:bg-[#c4105f] border-none" :
                      selectedMethod === "NAGAD" ? "bg-[#F7941D] hover:bg-[#de8012] border-none" :
                      selectedMethod === "ROCKET" ? "bg-[#8C3494] hover:bg-[#73297a] border-none" : "btn-primary"
                    }`}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : step === 1 ? (
                      "Next Step ➔"
                    ) : (
                      `Pay ৳${payment?.amount || "1000.00"} BDT`
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CARDS CHANNEL SELECT */}
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
                        ? `${m.color} shadow-lg scale-102`
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>

              <form onSubmit={handlePay} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="label text-xs font-bold text-slate-600">Card Number</label>
                  <input
                    type="text"
                    defaultValue="4111 2222 3333 4444"
                    className="input input-bordered w-full bg-white font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs font-bold text-slate-600">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="input input-bordered w-full bg-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-slate-600">CVV / CVC</label>
                    <input
                      type="password"
                      defaultValue="123"
                      maxLength={4}
                      className="input input-bordered w-full bg-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-ghost flex-1 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 shadow-md"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      `Pay ৳${payment?.amount || "1000.00"} BDT`
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer Security Note */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Lock size={12} className="text-emerald-600" /> 256-Bit SSL Encrypted Connection
            </div>
            <div>Powered by SSLCommerz V4</div>
          </div>
        </div>
      </div>
    </div>
  );
}
