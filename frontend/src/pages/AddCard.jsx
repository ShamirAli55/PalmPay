import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { ArrowLeft, CreditCard, Shield, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import PalmScanner from "../components/ui/PalmScanner";

const CARD_TEMPLATES = [
  {
    id: "platinum",
    brand: "VISA",
    label: "PLATINUM PRIME",
    color: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    desc: "Premium benefits & global access"
  },
  {
    id: "stealth",
    brand: "MASTERCARD",
    label: "STEALTH BLACK",
    color: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    desc: "Ultimate privacy for digital spend"
  },
  {
    id: "indigo",
    brand: "VISA",
    label: "INDIGO PRIORITY",
    color: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    desc: "Daily rewards & instant cashback"
  }
];

export default function AddCard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { issueCard, loading } = useWalletStore();
  
  const [selectedTemplate, setSelectedTemplate] = useState(CARD_TEMPLATES[0]);
  const [cardLabel, setCardLabel] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [success, setSuccess] = useState(false);
<<<<<<< HEAD
  const [submitting, setSubmitting] = useState(false);
  const [labelError, setLabelError] = useState("");

  const handleIssueRequest = () => {
    const cleanLabel = cardLabel.trim();
    if (cleanLabel.length > 50) {
      setLabelError('Card label must be 50 characters or less');
      return;
    }
    setLabelError('');
=======

  const handleIssueRequest = () => {
>>>>>>> origin/main
    setIsScannerOpen(true);
  };

  const onScanVerified = async () => {
<<<<<<< HEAD
    if (submitting) return;
    setSubmitting(true);
    try {
      const cleanLabel = cardLabel.trim().slice(0, 50);
      const result = await issueCard(user.id, {
        label: cleanLabel || selectedTemplate.label,
        brand: selectedTemplate.brand,
        color: selectedTemplate.color
      });
      if (result) setSuccess(true);
    } finally {
      setSubmitting(false);
    }
=======
    const success = await issueCard(user.id, {
        label: cardLabel || selectedTemplate.label,
        brand: selectedTemplate.brand,
        color: selectedTemplate.color
    });
    if (success) setSuccess(true);
>>>>>>> origin/main
  };

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-2 min-h-screen max-w-4xl mx-auto">
      <div className="flex items-center gap-4 px-3 pt-2">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:text-text-primary transition-all shadow-sm">
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading opacity-60">Issuance Portal</span>
            <span className="text-lg font-bold text-text-primary">Instant Virtual Card</span>
        </div>
      </div>

      <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex-1 mb-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

        {success ? (
          <div className="text-center py-16 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-accent-green/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-accent-green/20 shadow-xl shadow-accent-green/10 relative">
                <CheckCircle2 className="text-accent-green w-12 h-12" />
                <div className="absolute -inset-2 bg-accent-green/20 rounded-full blur-xl -z-10 animate-pulse" />
            </div>
            <h2 className="text-text-primary text-3xl font-bold mb-4 font-heading tracking-tight uppercase">Card Minted Successfully</h2>
            <p className="text-text-secondary text-[13px] mb-12 font-bold uppercase tracking-widest leading-relaxed opacity-60">
                Your new digital asset is now <span className="text-accent-green">Active</span>.<br />
                Ready for instant transactions.
            </p>
            <button onClick={() => navigate("/wallet")} className="w-full sm:w-72 py-5 bg-accent-blue text-white rounded-2xl font-bold hover:brightness-110 transition-all shadow-xl font-heading uppercase tracking-[0.25em] text-[11px]">
              View In Wallet
            </button>
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-10">
            {/* Left: Configuration */}
            <div className="flex-1 space-y-10">
              <section>
                <div className="text-[11px] font-bold text-text-secondary tracking-[0.2em] uppercase mb-4 opacity-50">Select Template</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CARD_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${selectedTemplate.id === tpl.id ? "bg-accent-blue/5 border-accent-blue shadow-lg" : "bg-text-primary/5 border-border-main hover:border-text-primary/10"}`}
                    >
                      <div className="w-12 h-8 rounded shadow-sm shrink-0" style={{ background: tpl.color }} />
                      <div>
                        <div className="text-[12px] font-bold text-text-primary uppercase tracking-tight">{tpl.label}</div>
                        <div className="text-[10px] text-text-secondary font-medium mt-1 uppercase tracking-widest opacity-60">{tpl.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="text-[11px] font-bold text-text-secondary tracking-[0.2em] uppercase mb-4 opacity-50">Custom Label</div>
<<<<<<< HEAD
                 <input 
                   placeholder="e.g. SHOPPING CARD"
                   value={cardLabel}
                   onChange={e => { setCardLabel(e.target.value.toUpperCase().slice(0, 50)); setLabelError(''); }}
                   maxLength={50}
                   className={`w-full bg-text-primary/5 border rounded-2xl px-6 py-4 text-[14px] font-bold text-text-primary outline-none focus:border-accent-blue transition-all uppercase tracking-widest ${labelError ? 'border-accent-red/50' : 'border-border-main'}`}
                 />
                 {labelError && <p className="text-[10px] text-accent-red mt-1.5 font-bold">{labelError}</p>}
=======
                <input 
                   placeholder="e.g. SHOPPING CARD"
                   value={cardLabel}
                   onChange={e => setCardLabel(e.target.value.toUpperCase())}
                   className="w-full bg-text-primary/5 border border-border-main rounded-2xl px-6 py-4 text-[14px] font-bold text-text-primary outline-none focus:border-accent-blue transition-all uppercase tracking-widest"
                />
>>>>>>> origin/main
              </section>

              <button
                onClick={handleIssueRequest}
<<<<<<< HEAD
                disabled={loading || submitting}
                className="w-full py-5 bg-accent-blue hover:brightness-110 rounded-2xl text-white text-[12px] font-bold tracking-[0.25em] shadow-xl shadow-accent-blue/20 transition-all flex items-center justify-center gap-3 font-heading uppercase"
              >
                {(loading || submitting) ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />} 
                <span>{(loading || submitting) ? "Issuing Card..." : "Authorize Issuance"}</span>
=======
                disabled={loading}
                className="w-full py-5 bg-accent-blue hover:brightness-110 rounded-2xl text-white text-[12px] font-bold tracking-[0.25em] shadow-xl shadow-accent-blue/20 transition-all flex items-center justify-center gap-3 font-heading uppercase"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />} 
                <span>{loading ? "Issuing Card..." : "Authorize Issuance"}</span>
>>>>>>> origin/main
              </button>
            </div>

            {/* Right: Live Preview */}
            <div className="w-full xl:w-80 space-y-6">
                <div className="text-[11px] font-bold text-text-secondary tracking-[0.2em] uppercase opacity-50 text-center">Live Preview</div>
                <div 
                    className="aspect-[1.6/1] w-full rounded-2xl p-6 relative overflow-hidden shadow-2xl transition-all duration-500"
                    style={{ background: selectedTemplate.color }}
                >
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="text-[9px] text-white/60 tracking-widest font-bold uppercase">{cardLabel || selectedTemplate.label}</div>
                            <div className="text-[11px] text-white/80 mt-1 font-bold">PALM USER</div>
                        </div>
                        <div className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-extrabold text-white tracking-widest italic">{selectedTemplate.brand}</div>
                    </div>
                    <div className="text-[14px] tracking-[0.15em] text-white/60 mb-1 font-mono">•••• •••• •••• 0000</div>
                    <div className="flex justify-between items-end mt-4">
                        <div className="text-[20px] font-extrabold text-white tracking-tight">VIRTUAL ASSET</div>
                    </div>
                </div>
                <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-2xl p-5">
                    <div className="text-[10px] font-extrabold text-accent-blue uppercase tracking-widest mb-1.5">ISSUANCE FEE: FREE</div>
                    <p className="text-[11px] text-text-secondary leading-relaxed opacity-70">New virtual cards are issued instantly. Each card has its own spend limits and anti-fraud protocols.</p>
                </div>
            </div>
          </div>
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
