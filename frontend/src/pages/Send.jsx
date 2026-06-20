import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Shield, ChevronRight, Plus, ScanLine, Wallet, Loader2 } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import PalmScanner from "../components/ui/PalmScanner";
import QRScannerModal from "../components/ui/QRScannerModal";

const QUICK_AMOUNTS = [200, 500, 1000, 5000];

export default function Send() {
  const { user } = useUser();
  const { balance, sendMoney, loading, users, fetchUsers } = useWalletStore();
  const [selectedContact, setSelectedContact] = useState(null);
  const [amount, setAmount] = useState("100.00");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleQRScan = (decodedId) => {
    const found = users.find(u => u.clerkId === decodedId);
    if (found) {
        setSelectedContact(decodedId);
    } else {
        setSelectedContact(decodedId);
    }
  };

  // Set first contact as default when users load
  useEffect(() => {
    if (users.length > 0 && !selectedContact) {
        const firstOtherUser = users.find(u => u.clerkId !== user?.id);
        if (firstOtherUser) setSelectedContact(firstOtherUser.clerkId);
    }
  }, [users, user, selectedContact]);

  const handleSendRequest = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100) return;
    if (numAmount > balance) return;
    setIsScannerOpen(true);
  };

  const handleAmountChange = (val) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleAmountBlur = () => {
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      setAmount(num.toFixed(2));
    } else {
      setAmount("100.00");
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const onScanVerified = async (palmImageBlob) => {
    const numAmount = parseFloat(amount);
    const recipient = users.find(u => u.clerkId === selectedContact);
    
    const result = await sendMoney(user.id, {
        recipientId: selectedContact,
        recipient: recipient?.name || 'Unknown',
        amount: numAmount,
        description: description,
        category: 'Transfer'
    }, palmImageBlob);

    if (result) setSuccess(true);
  };

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-2 min-h-screen max-w-4xl mx-auto">
      {/* Header telemetry */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-[0_0_8px_var(--accent-green)]" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Secure Connection Active</span>
         </div>
         <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading opacity-30">P-ID v4.0</span>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto">
        <div className="bg-bg-card border border-border-main rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden group transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-heading">Vault Transfer</h1>
            <p className="text-[11px] text-text-secondary mt-2 font-medium uppercase tracking-[0.2em] opacity-60">Authorize disbursement via palm-ID™</p>
          </div>

          {success ? (
            <div className="text-center py-8 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-accent-green/20 shadow-xl shadow-accent-green/10">
                <Shield className="text-accent-green w-10 h-10" />
              </div>
              <h2 className="text-text-primary text-2xl font-bold mb-3 font-heading tracking-tight">Access Granted</h2>
              <p className="text-text-secondary text-[14px] mb-10 font-medium leading-relaxed">
                Network validated biometric signature.<br />
                <span className="text-text-primary font-bold">Rs. {parseFloat(amount).toLocaleString()}</span> dispatched to<br />
                <span className="text-accent-blue font-bold uppercase tracking-tight">{users.find(u => u.clerkId === selectedContact)?.name}</span>
              </p>
              <button 
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-64 px-10 py-4 bg-accent-blue text-white rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-accent-blue/20 font-heading uppercase tracking-widest text-[11px]"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* Contacts Selection */}
              <div>
                <div className="flex justify-between items-end mb-6 px-1">
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Recipient Directory</div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsQRScannerOpen(true)}
                            className="text-accent-blue text-[10px] font-bold uppercase tracking-widest hover:brightness-125 flex items-center gap-1.5"
                        >
                            <ScanLine size={14} /> SCAN QR
                        </button>
                        <button className="text-accent-blue text-[10px] font-bold uppercase tracking-widest hover:brightness-125">SEARCH USER</button>
                    </div>
                </div>
                <div className="flex gap-10 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar">
                  {users.filter(u => u.clerkId !== user?.id).map((u) => (
                    <button
                      key={u.clerkId}
                      onClick={() => setSelectedContact(u.clerkId)}
                      className={`flex flex-col items-center gap-4 shrink-0 flex-none group transition-all relative ${selectedContact === u.clerkId ? "z-20" : "z-10"}`}
                    >
                      <div 
                        className={`w-14 h-14 aspect-square rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 transform ${selectedContact === u.clerkId ? "bg-accent-blue text-white shadow-xl scale-110 border-2 border-white/10" : "bg-text-primary/10 text-text-secondary opacity-60 hover:opacity-100 hover:bg-text-primary/20"}`}
                      >
                        {getInitials(u.name)}
                      </div>
                      <span className={`text-[10px] font-bold tracking-tight transition-all duration-300 uppercase whitespace-nowrap ${selectedContact === u.clerkId ? "text-text-primary" : "text-text-secondary opacity-0 group-hover:opacity-100"}`}>{u.name ? u.name.split(' ')[0] : 'User'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input Section */}
              <div className="bg-text-primary/5 rounded-2xl p-8 sm:p-10 border border-border-main relative overflow-hidden">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.25em] mb-6 block font-heading relative z-10">Transmission Intensity (RS)</label>
                <div className="relative flex items-center justify-center z-10">
                  <span className="text-2xl font-bold text-text-secondary/40 mr-4 font-heading">Rs.</span>
                  <input
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onBlur={handleAmountBlur}
                    className="w-full bg-transparent border-none p-0 text-4xl sm:text-5xl font-bold text-text-primary tracking-tighter outline-none font-heading"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex gap-3 mt-8 overflow-x-auto no-scrollbar relative z-10">
                   {QUICK_AMOUNTS.map(val => (
                      <button 
                        key={val}
                        onClick={() => setAmount(val.toFixed(2))}
                        className="px-6 py-2.5 rounded-xl bg-text-primary/5 border border-border-main text-[12px] font-bold text-text-primary hover:bg-accent-blue hover:text-white hover:border-accent-blue transition-all whitespace-nowrap"
                      >
                        Rs. {val}
                      </button>
                   ))}
                </div>

                <div className="flex justify-between mt-8 items-center pt-8 border-t border-text-primary/5 relative z-10">
                  <div className="flex flex-col">
                     <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest">Available</span>
                     <span className="text-[12px] font-bold text-text-primary">Rs. {balance.toLocaleString()}</span>
                  </div>
                  <button onClick={() => setAmount(balance.toFixed(2))} className="px-5 py-2 rounded-lg bg-text-primary/5 text-[10px] font-bold text-accent-blue hover:bg-accent-blue hover:text-white transition-all uppercase tracking-widest font-heading">MAX</button>
                </div>
              </div>

              {/* Memo */}
              <div className="px-1">
                <input 
                   value={description}
                   onChange={e => setDescription(e.target.value)}
                   placeholder="Purpose of transfer (optional)"
                   className="w-full bg-transparent border-b border-border-main py-3 text-[14px] text-text-primary font-medium outline-none focus:border-accent-blue transition-all placeholder:text-text-secondary/30"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSendRequest}
                  disabled={!amount || parseFloat(amount) < 100 || loading}
                  className="w-full py-5 bg-accent-blue hover:brightness-110 rounded-xl text-white text-sm font-bold tracking-[0.2em] shadow-lg active:scale-[0.99] transition-all disabled:opacity-20 flex flex-col items-center justify-center gap-1 font-heading uppercase"
                >
                  <div className="flex items-center gap-2.5">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />} 
                    <span>{loading ? "Processing..." : "Authorize Dispatch"}</span>
                  </div>
                  {!loading && parseFloat(amount) < 100 && <span className="text-[9px] opacity-60">Min Rs. 100</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PalmScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)}
        onVerified={onScanVerified}
      />

      <QRScannerModal 
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  );
}


