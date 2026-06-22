import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Shield, ChevronRight, CheckCircle2, History, Loader2, Building2, Smartphone } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import PalmScanner from "../components/ui/PalmScanner";

const QUICK_AMOUNTS = [500, 1000, 5000, 10000];

export default function AddMoney() {
  const { user } = useUser();
  const { balance, addFunds, loading, linkedBanks, fetchData } = useWalletStore();
  const [selectedSource, setSelectedSource] = useState("");
  const [amount, setAmount] = useState("500.00");
  const [success, setSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) fetchData(user.id);
  }, [user, fetchData]);

  useEffect(() => {
    if (linkedBanks.length > 0 && !selectedSource) {
        setSelectedSource(linkedBanks[0].bankId);
    }
  }, [linkedBanks, selectedSource]);

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
      setAmount("500.00");
    }
  };

  const handleDepositRequest = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100) return;
    setIsScannerOpen(true);
  };

  const onScanVerified = async (palmImageBlob) => {
    const numAmount = parseFloat(amount);
    const bank = linkedBanks.find(b => b.bankId === selectedSource);
    
    const result = await addFunds(user.id, {
        amount: numAmount,
        bankId: selectedSource,
        source: bank?.name || 'External Bank'
    }, palmImageBlob);

    if (result) setSuccess(true);
  };

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-2 min-h-screen max-w-4xl mx-auto">
      {/* Header telemetry */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse shadow-[0_0_8px_var(--accent-blue)]" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Secure Deposit</span>
         </div>
         <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading opacity-30">V-AUTH v2.1</span>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto">
        <div className="bg-bg-card border border-border-main rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden group transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-green/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight font-heading m-0">Add Funds</h1>
            <p className="text-[11px] text-text-secondary mt-2 font-medium uppercase tracking-[0.2em] opacity-60">Authorize deposit using palm recognition</p>
          </div>

          {success ? (
            <div className="text-center py-8 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-accent-green/20 shadow-xl shadow-accent-green/10">
                <CheckCircle2 className="text-accent-green w-10 h-10" />
              </div>
              <h2 className="text-text-primary text-2xl font-bold mb-3 font-heading tracking-tight">Deposit Successful</h2>
              <p className="text-text-secondary text-[14px] mb-10 font-medium leading-relaxed">
                Your funds have been added successfully.<br />
                <span className="text-text-primary font-bold">Rs. {parseFloat(amount).toLocaleString()}</span> added from<br />
                <span className="text-accent-blue font-bold uppercase tracking-tight">{linkedBanks.find(b => b.bankId === selectedSource)?.name}</span>
              </p>
              <button 
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-64 px-10 py-4 bg-accent-blue text-white rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-accent-blue/20 font-heading uppercase tracking-widest text-[11px]"
              >
                View Wallet Balance
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* Linked Sources Selection */}
              <div>
                <div className="flex justify-between items-end mb-6 px-1">
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Select Source</div>
                    <button className="text-accent-blue text-[10px] font-bold uppercase tracking-widest hover:brightness-125">ADD BANK ACCOUNT</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {linkedBanks.map((bank) => (
                    <button
                      key={bank.bankId}
                      onClick={() => setSelectedSource(bank.bankId)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all border relative overflow-hidden group ${selectedSource === bank.bankId ? "bg-accent-blue/5 border-accent-blue shadow-lg" : "bg-text-primary/5 border-border-main hover:border-text-primary/20"}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${selectedSource === bank.bankId ? "bg-accent-blue text-white" : "bg-text-primary/10 text-text-secondary"}`}>
                         <Building2 size={18} />
                      </div>
                      <div className="text-center overflow-hidden w-full">
                         <div className={`text-[11px] font-bold truncate uppercase tracking-tight ${selectedSource === bank.bankId ? "text-text-primary" : "text-text-secondary"}`}>{bank.name}</div>
                         <div className="text-[9px] text-text-secondary/50 font-bold tracking-widest mt-0.5">•• {bank.last4}</div>
                         <div className="text-[10px] font-bold text-accent-green mt-1">Rs. {bank.balance.toLocaleString()}</div>
                      </div>
                      {selectedSource === bank.bankId && (
                        <div className="absolute top-1.5 right-1.5">
                           <CheckCircle2 size={12} className="text-accent-blue" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input Section */}
              <div className="bg-text-primary/5 rounded-2xl p-8 sm:p-10 border border-border-main relative overflow-hidden">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.25em] mb-6 block font-heading relative z-10">Amount (RS)</label>
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
                        className={`px-6 py-2.5 rounded-xl border transition-all whitespace-nowrap text-[12px] font-bold ${parseFloat(amount) === val ? "bg-accent-blue border-accent-blue text-white shadow-lg shadow-accent-blue/20" : "bg-text-primary/5 border-border-main text-text-primary hover:bg-text-primary/10"}`}
                      >
                        Rs. {val.toLocaleString()}
                      </button>
                   ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDepositRequest}
                  disabled={!amount || parseFloat(amount) < 100 || loading}
                  className="w-full py-5 bg-accent-blue hover:brightness-110 rounded-xl text-white text-sm font-bold tracking-[0.2em] shadow-lg active:scale-[0.99] transition-all disabled:opacity-20 flex flex-col items-center justify-center gap-1 font-heading uppercase"
                >
                  <div className="flex items-center gap-2.5">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />} 
                    <span>{loading ? "Adding funds..." : "Confirm Deposit"}</span>
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
    </div>
  );
}
