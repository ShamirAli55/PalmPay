import { useState, useEffect } from "react";
import { 
  Copy, 
  Shield, 
  CheckCircle2, 
  History, 
  Loader2, 
  ArrowLeft, 
  Maximize2, 
  Minimize2,
  X,
  Share2
} from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { useUser } from "@clerk/clerk-react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Receive() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const { transactions, fetchData, loading } = useWalletStore();

  const WALLET_ID = user?.id || "PALM-SYNC-PENDING";
  const QR_VALUE = WALLET_ID;

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

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    
    const shareData = {
      title: 'PalmPay Payment Request',
      text: `Send money to my PalmPay wallet ID: ${WALLET_ID}`,
      url: window.location.origin + `/send?recipient=${WALLET_ID}`,
    };

    try {
      setIsSharing(true);
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Share failed:", err);
      }
    } finally {
      setIsSharing(false);
    }
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
            <p className="text-[11px] text-text-secondary mt-2 font-medium uppercase tracking-[0.2em] opacity-60">Scan barcode to receive funds</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-14 items-start mb-12">
            {/* QR Code Section - Larger for high scanability */}
            <div className="md:col-span-2 flex flex-col items-center gap-6">
                <div className="relative w-full max-w-[320px] mx-auto">
                    <div 
                      onClick={() => setIsZoomed(true)}
                      className="aspect-square p-8 bg-white rounded-[2.5rem] border-8 border-accent-blue/5 relative group cursor-zoom-in shadow-2xl shadow-accent-blue/10 transition-transform hover:scale-[1.02] duration-500"
                    >
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
                    
                    {/* Floating Zoom Button */}
                    <button 
                      onClick={() => setIsZoomed(true)}
                      className="absolute -top-3 -right-3 w-10 h-10 bg-bg-card border border-border-main rounded-xl shadow-lg flex items-center justify-center text-accent-blue hover:text-text-primary hover:bg-accent-blue transition-all active:scale-90 z-20 group"
                    >
                        <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-accent-blue px-4 py-2 bg-accent-blue/5 rounded-full">
                    <Shield size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Secure Signature</span>
                </div>
            </div>

            {/* ID Section - 3/5 columns on desktop */}
            <div className="md:col-span-3 w-full flex flex-col gap-6 justify-center">
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
                      <div className="text-[15px] font-black text-accent-green font-heading tracking-tighter leading-none">
                        +Rs. {Math.abs(req.amount).toLocaleString()}
                      </div>
                      <div className="inline-flex items-center justify-center text-[8px] font-black text-accent-green bg-accent-green/20 px-2 py-0.5 rounded-lg mt-1.5 italic uppercase tracking-wider">
                        CREDITED
                      </div>
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
                onClick={handleShare}
                className="w-full py-5 bg-accent-blue hover:brightness-110 text-white rounded-2xl text-[11px] font-black tracking-[0.25em] active:scale-[0.98] transition-all font-heading uppercase shadow-lg shadow-accent-blue/20 flex items-center justify-center gap-3"
              >
                <Share2 size={16} />
                Share Payment Link
              </button>
          </div>
        </div>
      </div>

      {/* Zoomed QR Modal */}
      <AnimatePresence>
        {isZoomed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsZoomed(false)}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                className="relative w-full max-w-[500px] aspect-square bg-white rounded-[3rem] p-10 sm:p-16 shadow-[0_0_100px_rgba(59,130,246,0.3)] group"
            >
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <QRCodeSVG 
                        value={QR_VALUE} 
                        size={400}
                        style={{ width: '100%', height: '100%' }}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                            src: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/hand.svg",
                            x: undefined,
                            y: undefined,
                            height: 60,
                            width: 60,
                            excavate: true,
                        }}
                    />
                </div>
                
                {/* Close/Zoom Out Button */}
                <button
                    onClick={() => setIsZoomed(false)}
                    className="absolute top-6 right-6 sm:top-8 sm:right-8 w-12 h-12 bg-black/5 hover:bg-black/10 text-black border border-black/5 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                >
                    <Minimize2 size={24} />
                </button>

                <div className="absolute -bottom-20 left-0 right-0 text-center">
                    <div className="text-[11px] font-bold text-white uppercase tracking-[0.3em] font-heading opacity-60">Ready to Scan</div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
