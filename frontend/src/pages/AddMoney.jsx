import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  ArrowLeft, 
  Plus, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Shield
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useWalletStore } from "../store/walletStore";
import PalmScanner from "../components/ui/PalmScanner";

// Initialize Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const QUICK_AMOUNTS = [
  { label: "Rs. 500", value: 500 },
  { label: "Rs. 1,000", value: 1000 },
  { label: "Rs. 5,000", value: 5000 },
];

const METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: CreditCard, color: "#3b82f6" },
  { id: "easypaisa", label: "Easypaisa", icon: Smartphone, color: "#22c55e" },
  { id: "jazzcash", label: "JazzCash", icon: Smartphone, color: "#f59e0b" },
];

function CheckoutForm({ amount, onBalanceAdd, onPalmRequired }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      onPalmRequired();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="bg-white/4 border border-white/10 rounded-xl p-4 mb-5">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#ffffff',
              '::placeholder': { color: 'rgba(255,255,255,0.3)' },
            },
            invalid: { color: '#ef4444' },
          },
        }} />
      </div>

      {error && (
        <div className="text-red-500 text-xs mb-4 flex items-center gap-1.5 font-semibold">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        disabled={!stripe || loading}
        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-white text-[15px] font-bold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? "Verifying Card..." : `Authorize Rs. ${amount}`}
      </button>
      <p className="text-[10px] text-white/30 text-center mt-3 font-medium uppercase tracking-wider">
        Final authentication via Palm-ID™ will follow
      </p>
    </form>
  );
}

export default function AddMoney() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const addFunds = useWalletStore((state) => state.addFunds);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);

  const handleAuthorize = () => {
    if (!amount || parseInt(amount) <= 0) return;
    setIsScannerOpen(true);
  };

  const onScanVerified = () => {
    setLocalLoading(true);
    setTimeout(() => {
       addFunds(amount);
       setLocalLoading(false);
       setLocalSuccess(true);
    }, 800);
  };

  if (localSuccess) {
    return (
      <div className="max-w-[640px] mx-auto py-10 px-4">
        <div className="bg-[#0d1424] border border-white/8 rounded-2xl p-8 text-center shadow-xl">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-white text-2xl font-bold mb-2">Top-up Successful!</h2>
          <p className="text-white/40 text-sm mt-2 mb-6">
            Rs. {amount} has been added to your Digital Palm wallet balance.
          </p>
          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto py-2.5 px-4">
      <button 
        onClick={() => navigate(-1)}
        className="bg-white/5 border-none rounded-lg px-3 py-2 text-white/60 cursor-pointer flex items-center gap-1.5 mb-5 text-[13px] hover:text-white"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-[#0d1424] border border-white/8 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl">
        <h1 className="text-[26px] font-extrabold text-white leading-tight mb-2 m-0 tracking-tight">
          Top Up Wallet
        </h1>
        <p className="text-sm text-white/40 mb-8 font-medium">
          Securely add funds via Palm-ID™ Biometric Verification
        </p>

        {/* Amount Input */}
        <div className="mb-8">
          <label className="text-[11px] font-bold text-white/30 tracking-widest mb-3 block uppercase">
            ENTER AMOUNT (PKR)
          </label>
          <div className="relative mt-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-white/20">
              Rs.
            </span>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/3 border border-white/6 rounded-xl p-[16px_16px_16px_56px] text-2xl font-bold text-white outline-none focus:border-white/20 transition-all font-mono"
            />
          </div>

          <div className="flex gap-2.5 mt-4">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q.value}
                onClick={() => setAmount(q.value.toString())}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${amount === q.value.toString() ? "bg-blue-500/15 border-blue-500 text-blue-500" : "bg-white/4 border-white/10 text-white/60 hover:bg-white/6"}`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Method Selection */}
        <div className="mb-8">
          <label className="text-[11px] font-bold text-white/30 tracking-widest mb-3 block uppercase">
            SELECT PAYMENT METHOD
          </label>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const isSelected = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl transition-all border ${isSelected ? "bg-white/5 border-white/20" : "bg-white/3 border-white/8 hover:border-white/15"}`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ background: isSelected ? m.color : "rgba(255,255,255,0.05)" }}
                  >
                    <Icon size={18} />
                  </div>
                  <span className={`text-[11px] font-semibold transition-colors ${isSelected ? "text-white" : "text-white/40"}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment logic Integration */}
        {method === "card" && amount && parseInt(amount) > 0 ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              amount={amount} 
              onBalanceAdd={addFunds} 
              onPalmRequired={() => setIsScannerOpen(true)}
            />
          </Elements>
        ) : (
          <button
            disabled={!amount || parseInt(amount) <= 0 || localLoading}
            onClick={handleAuthorize}
            className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 text-white text-[15px] font-bold transition-all shadow-lg ${(!amount || parseInt(amount) <= 0) ? "bg-white/5 opacity-50 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-110 active:scale-95"}`}
          >
            <Shield size={18} />
            <span className="font-bold">
              {method === "card" ? "Enter details above" : `Top up via Palm-ID™`}
            </span>
          </button>
        )}
      </div>

      <PalmScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)}
        onVerified={onScanVerified}
      />
    </div>
  );
}

