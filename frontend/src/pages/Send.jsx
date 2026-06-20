import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Shield, ChevronRight, Plus, ScanLine, Wallet, Loader2 } from "lucide-react";
import { CONTACTS } from "../constants/index";
import { useWalletStore } from "../store/walletStore";
import PalmScanner from "../components/ui/PalmScanner";

export default function Send() {
  const { user } = useUser();
  const [selectedContact, setSelectedContact] = useState(CONTACTS[0].id);
  const [amount, setAmount] = useState("1250.00");
  const [description, setDescription] = useState("");
  const { balance, sendMoney, loading } = useWalletStore();
  const [success, setSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navigate = useNavigate();

  const handleSendRequest = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (numAmount > balance) return;
    setIsScannerOpen(true);
  };

  const onScanVerified = async (palmImageBlob) => {
    const numAmount = parseFloat(amount);
    const recipientName = CONTACTS.find(c => c.id === selectedContact)?.name;
    
    const result = await sendMoney(user.id, {
        recipient: recipientName,
        amount: numAmount,
        description: description,
        category: 'Transfer'
    }, palmImageBlob);

    if (result) setSuccess(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-0 lg:p-2 min-h-screen max-w-4xl mx-auto">
      <div className="flex-1">
        <div className="bg-bg-card border border-border-main rounded-xl p-8 sm:p-12 shadow-xl relative overflow-hidden transition-all duration-500">
          <div className="mb-12 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight font-heading">Secure Transfer</h1>
            <p className="text-[13px] text-text-secondary mt-3 font-medium uppercase tracking-[0.1em]">
              Authorized via Palm-ID™ Protocol 4.0
            </p>
          </div>

          {success ? (
            <div className="text-center py-12 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-accent-green/10 rounded-xl flex items-center justify-center mx-auto mb-8 border border-accent-green/20 shadow-lg shadow-accent-green/10">
                <Shield className="text-accent-green w-10 h-10" />
              </div>
              <h2 className="text-text-primary text-2xl font-bold mb-3 font-heading tracking-tight">Transmission Successful</h2>
              <p className="text-text-secondary text-[14px] mb-12 font-medium">
                Vault has released <span className="text-text-primary font-bold">Rs. {parseFloat(amount).toLocaleString()}</span> to <br className="hidden sm:block" />
                <span className="text-accent-blue font-bold uppercase tracking-tight">{CONTACTS.find(c => c.id === selectedContact)?.name}</span>
              </p>
              <button 
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto px-12 py-4 bg-accent-blue text-white rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-accent-blue/20 font-heading uppercase tracking-wide"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              <div>
                <div className="flex justify-between items-center mb-6">
                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">RECIPIENT DIRECTORY</div>
                    <button className="text-accent-blue text-[11px] font-bold uppercase tracking-widest hover:underline">Add New</button>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 -mx-1 px-1 no-scrollbar">
                  {CONTACTS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContact(c.id)}
                      className="flex flex-col items-center gap-3 shrink-0 group transition-all"
                    >
                      <div 
                        className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white transition-all transform ${selectedContact === c.id ? "bg-accent-blue shadow-lg scale-110 border-2 border-white/20" : "bg-text-primary/10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105"}`}
                      >
                        {c.initials}
                      </div>
                      <span className={`text-[12px] font-bold tracking-tight transition-colors ${selectedContact === c.id ? "text-text-primary" : "text-text-secondary"}`}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-text-primary/5 rounded-xl p-8 sm:p-10 border border-border-main overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full blur-3xl -mr-10 -mt-10" />
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 block font-heading">TRANSFER INTENT (RS)</label>
                <div className="relative flex items-baseline">
                  <span className="text-3xl font-bold text-text-secondary/50 mr-4 font-heading">Rs.</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-5xl sm:text-6xl font-bold text-text-primary tracking-tighter outline-none font-heading"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between mt-10 items-center pt-8 border-t border-white/5">
                  <span className="text-[12px] font-medium text-text-secondary">Network Balance: <span className="text-text-primary font-bold">Rs. {balance.toLocaleString()}</span></span>
                  <button onClick={() => setAmount(balance.toFixed(2))} className="text-[11px] font-bold text-accent-blue hover:brightness-125 uppercase tracking-widest font-heading border-b border-accent-blue/30 pb-0.5">MAX</button>
                </div>
              </div>

              <button
                onClick={handleSendRequest}
                disabled={!amount || parseFloat(amount) <= 0 || loading}
                className="w-full py-6 bg-accent-blue hover:brightness-110 rounded-xl text-white text-base font-bold tracking-widest shadow-2xl active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3 font-heading uppercase shadow-accent-blue/20"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <Shield size={22} />} 
                {loading ? "AUTHENTICATING..." : "AUTHORIZE WITH PALM-ID™"}
              </button>
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


