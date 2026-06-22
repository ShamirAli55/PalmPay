import { useState, useEffect } from "react";
import { Copy, Shield, ChevronRight, CheckCircle2, History, Loader2 } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import PalmScanner from "../components/ui/PalmScanner";
import { useUser } from "@clerk/clerk-react";
import { QRCodeSVG } from "qrcode.react";

export default function Receive() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const { transactions, fetchData, loading } = useWalletStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Filter for real incoming transactions from this user's account
  const inboundHistory = transactions.filter(t => t.type === 'credit').slice(0, 5);
  const WALLET_ID = user?.id || "PALM-SYNC-PENDING";

  useEffect(() => {
    if (user?.id) fetchData(user.id);
  }, [user, fetchData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLET_ID).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-2 min-h-screen max-w-4xl mx-auto">
      {/* Header telemetry */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-[0_0_8px_var(--accent-green)]" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Secure Receiving</span>
         </div>
         <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading opacity-30">P-ID v4.0</span>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto">
        <div className="bg-bg-card border border-border-main rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden group transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-heading m-0">Receive Money</h1>
            <p className="text-[11px] text-text-secondary mt-2 font-medium uppercase tracking-[0.2em] opacity-60">Use your unique QR code to receive payments</p>
          </div>

          <div className="flex flex-col gap-10">
            {/* QR Code / Signature Section */}
            <div className="flex flex-col items-center gap-8">
                <div className="p-8 bg-white rounded-3xl border border-border-main relative group shadow-2xl shadow-accent-blue/10">
                    <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                    <div className="relative z-10 transition-transform group-hover:scale-105 duration-500">
                        <QRCodeSVG 
                            value={WALLET_ID} 
                            size={180}
                            level="H"
                            includeMargin={false}
                            imageSettings={{
                                src: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/hand.svg",
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>
                </div>

                <div className="w-full flex items-center justify-between bg-text-primary/5 border border-border-main rounded-xl p-4 px-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />
                    <div>
                        <div className="text-[10px] text-text-secondary tracking-[0.25em] mb-1.5 font-bold uppercase font-heading">Wallet ID</div>
                        <div className="text-[14px] font-bold text-text-primary tracking-widest font-mono truncate max-w-[200px] sm:max-w-none">{WALLET_ID}</div>
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`p-3 rounded-lg border transition-all z-10 ${copied ? "bg-accent-green/10 border-accent-green/30 text-accent-green shadow-xl shadow-accent-green/10" : "bg-bg-card border-border-main text-text-secondary hover:text-text-primary shadow-sm active:scale-95"}`}
                    >
                        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>

            {/* Real History Section */}
            <div className="pt-4 border-t border-text-primary/5">
                <div className="flex justify-between items-end mb-6 px-1">
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Recent Deposits</div>
                    <History className="text-text-secondary/30" size={14} />
                </div>
                
                <div className="space-y-3">
                    {loading ? (
                       <div className="flex items-center justify-center py-10 text-text-secondary opacity-40 italic text-[11px] uppercase tracking-widest gap-2">
                           <Loader2 className="animate-spin" size={14} /> Loading transaction history...
                       </div>
                    ) : inboundHistory.length > 0 ? (
                        inboundHistory.map((req) => (
                            <div key={req._id} className="bg-text-primary/5 rounded-xl p-4 flex items-center justify-between border border-transparent hover:border-border-main transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green font-bold text-xs">
                                        {req.sender ? req.sender[0].toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-bold text-text-primary uppercase tracking-tight font-heading group-hover:text-accent-blue transition-colors">
                                           {req.sender || 'Unknown Sender'}
                                        </div>
                                        <div className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-0.5 opacity-60">
                                            {new Date(req.date).toLocaleDateString()} • {req.category}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[14px] font-extrabold text-accent-green font-heading tracking-tighter">
                                        +Rs. {Math.abs(req.amount).toLocaleString()}
                                    </div>
                                    <div className="text-[9px] text-text-secondary font-bold uppercase bg-accent-green/10 text-accent-green px-1.5 py-0.5 rounded-md inline-block mt-1">RECEIVED</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-text-primary/2 rounded-2xl border border-dashed border-border-main">
                            <p className="text-[11px] text-text-secondary font-bold uppercase tracking-[0.2em] opacity-40 italic">No incoming payments yet</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-2">
                <button
                   className="w-full py-5 bg-text-primary/5 hover:bg-text-primary/10 rounded-xl text-text-secondary text-[11px] font-bold tracking-[0.2em] shadow-sm active:scale-[0.99] transition-all font-heading uppercase"
                >
                   Share Payment Link
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


