import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Loader2, Check } from "lucide-react";
import { useWalletStore } from "../../store/walletStore";

// ── Phone Normalizer ───────────────────────────────────────────────────────────
export function normalizePhone(raw) {
  if (!raw) return "";
  let stripped = raw.trim();
  const startsWithPlus = stripped.startsWith("+");
  let digits = stripped.replace(/\D/g, "");
  if (stripped.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return "+92" + digits.slice(1);
  if (digits.length === 10 && digits.startsWith("3")) return "+92" + digits;
  if (digits.length === 12 && digits.startsWith("92")) return "+" + digits;
  if (startsWithPlus || stripped.startsWith("00")) return "+" + digits;
  if (digits.length >= 10 && digits.length <= 15) return "+" + digits;
  return raw; 
}

export function isValidE164(normalized) {
  return /^\+\d{10,15}$/.test(normalized);
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export default function PhoneLinkModal({ isOpen, onClose, onSuccess, title = "Link Phone Number" }) {
  const { user: clerkUser }     = useUser();
  const { updateProfile, fetchData, user: dbUser } = useWalletStore();
  const [phone, setPhone]      = useState("");
  const [busy, setBusy]        = useState(false);
  const [error, setError]      = useState("");
  const [done, setDone]        = useState(false);

  const normalized = normalizePhone(phone);
  const isValid    = isValidE164(normalized);
  const isSame     = normalized === dbUser?.phone;

  useEffect(() => {
    if (isOpen) {
      setPhone(""); setError(""); setDone(false); setBusy(false);
    }
  }, [isOpen]);

  const handleLink = async () => {
    if (!isValid) { setError("Please enter a valid phone number."); return; }
    if (isSame) { setError("This is already your linked number."); return; }
    setBusy(true); setError("");

    try {
      // Direct Link to Backend MongoDB
      const success = await updateProfile(clerkUser.id, { phone: normalized });
      
      if (success) {
        // Refresh local data to show new phone across app
        await fetchData(clerkUser.id);
        setDone(true);
        setTimeout(() => { 
          onSuccess?.(normalized); 
          onClose(); 
        }, 1500);
      } else {
        setError("Could not link number. It may be in use by another account.");
      }
    } catch (e) {
      setError("Server error during linking. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />

          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed z-[70] inset-0 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-bg-card border border-border-main rounded-3xl shadow-2xl w-full max-w-sm p-7 pointer-events-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />

              <button onClick={onClose} className="absolute top-5 right-5 p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-text-primary/5">
                <X size={16} />
              </button>

              {done ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="w-16 h-16 bg-accent-green/10 border border-accent-green/20 rounded-2xl flex items-center justify-center shadow-xl shadow-accent-green/10">
                    <Check className="text-accent-green" size={28} />
                  </div>
                  <div>
                    <div className="text-[17px] font-black text-text-primary font-heading uppercase tracking-tight">Identity Linked</div>
                    <p className="text-[12px] text-text-secondary mt-1 opacity-60 font-mono italic">{normalized}</p>
                    <p className="text-[10px] text-accent-green mt-3 font-bold uppercase tracking-widest">Profile Synced</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl flex items-center justify-center shrink-0 text-accent-blue">
                      <Phone size={18} />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-black text-text-primary font-heading uppercase tracking-tight">{title}</h2>
                      <p className="text-[11px] text-text-secondary mt-0.5 opacity-60 leading-relaxed">Instantly link your mobile to your account.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">Phone Number</label>
                    <input
                      type="tel" autoFocus
                      placeholder="e.g. 0300 1234567"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && !busy && handleLink()}
                      className="w-full bg-text-primary/5 border border-border-main rounded-xl px-4 py-3.5 text-[14px] text-text-primary font-mono outline-none focus:border-accent-blue/50 transition-all font-heading"
                    />
                    {phone.length > 2 && (
                      <div className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors ${isValid ? "text-accent-green" : "text-text-secondary opacity-40"}`}>
                        {isValid && <Check size={10} />}
                        {isValid ? `Normalized: ${normalized}` : "Include operator code"}
                      </div>
                    )}
                    {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
                  </div>

                  <button
                    onClick={handleLink}
                    disabled={busy || !isValid || isSame}
                    className="w-full py-3.5 bg-accent-blue hover:brightness-110 text-white rounded-xl text-[12px] font-black uppercase tracking-[0.2em] font-heading transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2 shadow-xl shadow-accent-blue/10"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    Link Profile Now
                  </button>
                  
                  <p className="text-[9px] text-text-secondary/40 text-center uppercase tracking-widest font-medium italic">
                    By linking, you agree to receive search notifications
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
