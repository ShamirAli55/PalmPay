import { useState, useEffect } from "react";
import { Copy, Shield, CheckCircle2, History, Loader2, ArrowLeft } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { useUser } from "@clerk/clerk-react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";

export default function Receive() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { transactions, fetchData, loading } = useWalletStore();
  const [receiveAmount, setReceiveAmount] = useState("");

  const WALLET_ID = user?.id || "PALM-SYNC-PENDING";
  // Protocol: PALM_PAY|clerkId|amount
  const QR_VALUE = receiveAmount ? `PALM_PAY|${WALLET_ID}|${receiveAmount}` : WALLET_ID;

  // Real-time inbound transactions (filter for credits)
  const inboundHistory = transactions.filter(t => t.type === 'credit').slice(0, 5);

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
      {/* Dynamic Header with Back Navigation */}
      <div className="flex items-center justify-between px-3 pt-2">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2.5 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:text-text-primary hover:border-accent-blue/30 transition-all active:scale-95 shadow-sm"
            >
               <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2.5">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_var(--accent-green)]" />
               <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Secure Receiving</span>
            </div>
         </div>
         <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading opacity-30 hidden sm:block">P-ID v4.0</span>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto px-2 sm:px-0">
        <div className="bg-bg-card border border-border-main rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden group transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-heading m-0">Receive Money</h1>
            <p className="text-[11px] text-text-secondary mt-2 font-medium uppercase tracking-[0.2em] opacity-60">Generate a custom payment request</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-14 items-start mb-12">
            {/* QR Code Section - Larger for high scanability */}
            <div className="md:col-span-2 flex flex-col items-center gap-6">
                <div className="w-full max-w-[320px] aspect-square p-8 bg-white rounded-[2.5rem] border-8 border-accent-blue/5 relative group shadow-2xl shadow-accent-blue/10 transition-transform hover:scale-[1.02] duration-500">
                    <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <QRCodeSVG 
                            value={QR_VALUE} 
                            size={220}
                            style={{ width: '100%', height: '100%' }}
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
                <div className="flex items-center gap-2 text-accent-blue px-4 py-2 bg-accent-blue/5 rounded-full">
                    <Shield size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Secure Signature</span>
                </div>
            </div>

            {/* Input & ID Section - 3/5 columns on desktop */}
            <div className="md:col-span-3 w-full flex flex-col gap-6">
                <div className="bg-text-primary/5 rounded-2xl p-6 sm:p-8 border border-border-main relative overflow-hidden group hover:border-accent-blue/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.25em] mb-5 block font-heading">Request Amount (Optional)</label>
                    <div className="relative flex items-center">
                        <span className="text-2xl font-bold text-text-secondary/40 mr-4 font-heading">Rs.</span>
                        <input 
                            type="number"
                            placeholder="0.00"
                            value={receiveAmount}
                            onChange={(e) => setReceiveAmount(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-3xl sm:text-4xl font-bold text-text-primary tracking-tighter outline-none font-heading"
                        />
                    </div>
                    <div className="mt-4 flex items-center gap-2 opacity-40">
                         <div className="w-1 h-1 rounded-full bg-text-secondary" />
                         <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest italic">Beneficiary will see this amount auto-filled</p>
                    </div>
                </div>

                <div className="bg-text-primary/5 border border-border-main rounded-2xl p-6 relative group overflow-hidden hover:border-accent-blue/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-text-secondary tracking-[0.25em] mb-2 font-bold uppercase font-heading">Public Wallet ID</div>
                            <div className="text-[14px] font-bold text-text-primary tracking-widest font-mono truncate lg:whitespace-normal break-all">
                                {WALLET_ID}
                            </div>
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`shrink-0 flex items-center justify-center p-4 rounded-xl border transition-all z-10 ${copied ? "bg-accent-green/10 border-accent-green/30 text-accent-green shadow-xl shadow-accent-green/10" : "bg-bg-card border-border-main text-text-secondary hover:text-text-primary shadow-sm active:scale-95"}`}
                        >
                            {copied ? <CheckCircle2 size={20} /> : <div className="flex items-center gap-2"><Copy size={18} /><span className="text-[11px] font-bold sm:hidden">COPY</span></div>}
                        </button>
                    </div>
                </div>
            </div>
          </div>

          <div className="pt-10 border-t border-text-primary/5">
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
                      <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green font-bold text-xs uppercase">
                        {req.sender ? req.sender[0] : 'U'}
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-text-primary uppercase tracking-tight font-heading group-hover:text-accent-blue transition-colors">
                          {req.sender || 'Unknown Sender'}
                        </div>
                        <div className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-0.5 opacity-60">
                          {new Date(req.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-extrabold text-accent-green font-heading tracking-tighter">
                        +Rs. {Math.abs(req.amount).toLocaleString()}
                      </div>
                      <div className="text-[8px] font-black text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded-md mt-1 italic">CREDITED</div>
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

          <div className="mt-10">
              <button
                className="w-full py-5 bg-text-primary/5 hover:bg-text-primary/10 border border-border-main/50 rounded-2xl text-text-secondary hover:text-text-primary text-[11px] font-bold tracking-[0.25em] active:scale-95 transition-all font-heading uppercase"
              >
                Share Payment Link
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
