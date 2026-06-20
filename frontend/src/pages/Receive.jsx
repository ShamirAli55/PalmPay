import { useState } from "react";
import { Copy, Share2, Download, ChevronRight, User, Building2, ShoppingBag, Shield } from "lucide-react";
import { RECENT_REQUESTS } from "../constants/index";
import { useWalletStore } from "../store/walletStore";
import PalmScanner from "../components/ui/PalmScanner";

const WALLET_ID = "PALM-X92F-K1L8-44MN";
const CATEGORY_TAGS = ["Shopping", "Payroll", "Investment", "Gifts"];

function RequestIcon({ icon }) {
  const map = { person: User, building: Building2, shopping: ShoppingBag };
  const Icon = map[icon] || User;
  return (
    <div className="w-10 h-10 rounded-lg bg-text-primary/5 flex items-center justify-center shrink-0 border border-border-main">
      <Icon size={16} className="text-text-secondary" />
    </div>
  );
}

export default function Receive() {
  const [copied, setCopied] = useState(false);
  const { addFunds } = useWalletStore();
  const [receiving, setReceiving] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLET_ID).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateArrival = () => {
    setIsScannerOpen(true);
  };

  const onScanVerified = () => {
    setReceiving(true);
    setTimeout(() => {
      addFunds(2500);
      setReceiving(false);
      alert("Payment verified! Rs. 2,500.00 synthesized into your vault.");
    }, 1000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-0 lg:p-1.5 min-h-screen">
      {/* ── Left: QR + Wallet ID ───────────────────────────────────────── */}
      <div className="flex-1">
        <div className="bg-bg-card border border-border-main rounded-xl p-8 sm:p-12 flex flex-col items-center gap-8 shadow-xl transition-all duration-300">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary m-0 font-heading tracking-tight">Receive Capital</h1>
            <p className="text-[13px] text-text-secondary mt-3 font-medium uppercase tracking-widest max-w-sm mx-auto">
              Broadcast your unique bio-linked signature to authorize inbound transmissions.
            </p>
          </div>

          {/* QR Code Frame */}
          <div className="bg-text-primary/5 border border-border-main rounded-xl p-8 flex items-center justify-center shadow-inner group transition-all hover:scale-[1.02]">
            <svg width={200} height={200} viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
              <rect width="180" height="180" fill="var(--bg-main)" rx="16" />
              <rect x="12" y="12" width="44" height="44" rx="6" fill="none" stroke="var(--accent-blue)" strokeWidth="3" />
              <rect x="18" y="18" width="32" height="32" rx="3" fill="var(--accent-blue)" />
              <rect x="124" y="12" width="44" height="44" rx="6" fill="none" stroke="var(--accent-blue)" strokeWidth="3" />
              <rect x="130" y="18" width="32" height="32" rx="3" fill="var(--accent-blue)" />
              <rect x="12" y="124" width="44" height="44" rx="6" fill="none" stroke="var(--accent-blue)" strokeWidth="3" />
              <rect x="18" y="130" width="32" height="32" rx="3" fill="var(--accent-blue)" />
              {[
                [68, 12], [76, 12], [84, 12], [68, 20], [84, 20], [68, 28], [76, 28], [84, 28], [68, 36], [76, 36], [68, 44],
                [68, 60], [76, 60], [84, 60], [92, 60], [100, 60], [68, 68], [84, 68], [100, 68], [68, 76], [76, 76], [92, 76],
                [12, 68], [20, 68], [28, 68], [36, 68], [12, 76], [28, 76], [36, 76], [12, 84], [20, 84], [36, 84], [12, 92], [20, 92], [28, 92],
                [124, 68], [132, 68], [140, 68], [148, 68], [156, 68], [124, 76], [140, 76], [156, 76], [124, 84], [132, 84], [148, 84], [124, 92], [132, 92], [140, 92], [156, 92],
                [68, 92], [84, 92], [100, 92], [68, 100], [76, 100], [92, 100], [100, 100], [68, 108], [84, 108],
                [124, 124], [132, 124], [140, 124], [148, 124], [156, 124], [124, 132], [140, 132], [124, 140], [132, 140], [148, 140], [156, 140], [124, 148], [148, 148], [124, 156], [132, 156], [140, 156], [148, 156], [156, 156],
              ].map(([x, y], i) => (
                <rect key={i} x={x} y={y} width="6" height="6" fill="var(--accent-blue)" opacity={0.6 + (i%4 * 0.1)} />
              ))}
              <circle cx="90" cy="90" r="16" fill="var(--bg-main)" stroke="var(--accent-blue)" strokeWidth="2" />
              <text x="90" y="95" textAnchor="middle" fontSize="16">🤚</text>
            </svg>
          </div>

          <div className="flex items-center justify-between bg-text-primary/5 border border-border-main rounded-xl p-4 px-6 w-full group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-blue/5 rounded-full blur-xl transition-all group-hover:scale-150" />
            <div className="relative z-10">
              <div className="text-[10px] text-text-secondary tracking-[0.2em] mb-1.5 font-bold uppercase font-heading">
                YOUR VAULT SIGNATURE
              </div>
              <div className="text-[14px] font-bold text-text-primary tracking-widest font-mono">{WALLET_ID}</div>
            </div>
            <button
              onClick={handleCopy}
              className={`p-3 rounded-lg border transition-all z-10 ${copied ? "bg-accent-green/10 border-accent-green/30 text-accent-green" : "bg-bg-card border-border-main text-text-secondary hover:text-text-primary shadow-sm hover:scale-110 active:scale-95"}`}
            >
              <Copy size={16} />
            </button>
          </div>

          <button
            onClick={simulateArrival}
            disabled={receiving}
            className="w-full flex items-center justify-center gap-3 py-5 bg-accent-blue hover:brightness-110 rounded-xl text-white text-sm font-bold shadow-2xl shadow-accent-blue/20 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest font-heading"
          >
            {receiving ? "COLLECTING TELEMETRY..." : <><Shield size={18} /> Simulate Inbound Pulse</>}
          </button>
        </div>
      </div>

      <div className="w-full lg:w-[280px] flex flex-col gap-6 shrink-0">
        <div className="bg-bg-card border border-border-main rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[15px] font-bold text-text-primary font-heading uppercase tracking-tight">Active Inbound</span>
            <button className="text-[11px] font-bold text-accent-blue hover:underline uppercase tracking-widest font-heading">View Logs</button>
          </div>
          <div className="divide-y divide-border-main">
            {RECENT_REQUESTS.map((req) => (
              <div key={req.id} className="flex items-center gap-3.5 py-4 cursor-pointer group hover:bg-text-primary/2 -mx-2 px-2 rounded-lg transition-all">
                <RequestIcon icon={req.icon} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-text-primary truncate font-heading group-hover:text-accent-blue transition-colors uppercase tracking-tight">{req.name}</div>
                  <div className="text-[10px] text-text-secondary font-bold truncate mt-1 opacity-60">{req.detail} • {req.time}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[13px] font-extrabold text-accent-green font-heading tracking-tighter">
                    +{req.amount.toLocaleString()}
                  </span>
                  <ChevronRight size={14} className="text-text-secondary/30" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-accent-blue/20 rounded-xl p-6 flex items-start gap-4 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0 border border-accent-blue/10">
            <Shield size={18} className="text-accent-blue" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-accent-blue tracking-[0.1em] mb-2 uppercase font-heading">
              SECURE DEPOSIT READY
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed font-medium uppercase italic opacity-70">
              Incoming packets are screened via Palm-ID™ Protocol 4.0.
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-main rounded-xl p-6">
          <div className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] mb-4 font-heading">Label Categories</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TAGS.map((tag) => (
              <span key={tag} className="text-[10px] font-bold border border-border-main text-text-secondary rounded-lg px-3.5 py-1.5 hover:bg-text-primary/5 hover:text-text-primary cursor-pointer transition-all font-heading uppercase">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <PalmScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onVerified={onScanVerified}
      />
    </div>
  );
}


