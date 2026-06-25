import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Shield, ChevronRight, Plus, ScanLine, Wallet, Loader2, ArrowLeft } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import PalmScanner from "../components/ui/PalmScanner";
import QRScannerModal from "../components/ui/QRScannerModal";

const QUICK_AMOUNTS = [200, 500, 1000, 5000];

export default function Send() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { balance, sendMoney, loading, users, fetchUsers, linkedBanks } = useWalletStore();
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [amount, setAmount] = useState("100.00");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleQRScan = (decodedText) => {
    if (decodedText.startsWith("PALM_PAY|")) {
      const [, clerkId, requestedAmount] = decodedText.split("|");
      const found = (users || []).find(u => u.clerkId === clerkId);
      if (found) {
        setSelectedContact(clerkId);
        if (requestedAmount) setAmount(parseFloat(requestedAmount).toFixed(2));
      }
    } else {
      const found = (users || []).find(u => u.clerkId === decodedText);
      if (found) setSelectedContact(decodedText);
    }
  };

  const normalizePhone = (p) => p ? p.replace(/\D/g, '') : '';

  useEffect(() => {
    if ((users || []).length > 0 && !selectedContact && !success) {
      const firstOther = (users || []).find(u => u.clerkId !== user?.id);
      if (firstOther) setSelectedContact(firstOther.clerkId);
    }
  }, [users, user, selectedContact, success]);

  const handleSendRequest = () => {
    const n = parseFloat(amount);
    if (!n || n < 100 || n > balance) return;
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
    setAmount(!isNaN(num) ? num.toFixed(2) : "100.00");
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const onScanVerified = async (palmImageBlob) => {
    const numAmount = parseFloat(amount);
    const recipient = (users || []).find(u => u.clerkId === selectedContact);
    const bank = linkedBanks.find(b => b.id === selectedBank);
    const result = await sendMoney(user.id, {
      recipientId: selectedContact,
      bankId: selectedBank,
      recipient: selectedBank ? (bank?.name || "Bank") : (recipient?.name || "Unknown"),
      amount: numAmount,
      description,
      category: selectedBank ? "Withdrawal" : "Transfer",
    }, palmImageBlob);
    if (result) setSuccess(true);
  };

  return (
    <div className="flex flex-col gap-4 p-0 lg:p-2 min-h-screen max-w-2xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:text-text-primary hover:border-accent-blue/30 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_var(--accent-green)]" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">
              Secure Connection
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading opacity-30 hidden sm:block">
          P-ID v4.0
        </span>
      </div>

      {/* Main Card */}
      <div className="flex-1 w-full px-3 sm:px-0">
        <div className="bg-bg-card border border-border-main rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-blue/5 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />

          {/* Title */}
          <div className="mb-7 text-center">
            <h1 className="text-xl sm:text-3xl font-bold text-text-primary tracking-tight font-heading">Send Money</h1>
            <p className="text-[10px] text-text-secondary mt-1.5 font-medium uppercase tracking-[0.2em] opacity-60">
              Authorize payment using palm recognition
            </p>
          </div>

          {/* ── Success State ────────────────────────────────────── */}
          {success ? (
            <div className="text-center py-6 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent-green/20 shadow-xl shadow-accent-green/10">
                <Shield className="text-accent-green w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-text-primary text-xl sm:text-2xl font-bold mb-3 font-heading tracking-tight">
                Transfer Successful
              </h2>
              <p className="text-text-secondary text-[13px] sm:text-[14px] mb-8 font-medium leading-relaxed">
                Your identity has been verified.<br />
                <span className="text-text-primary font-bold">Rs. {parseFloat(amount).toLocaleString()}</span> sent to<br />
                <span className="text-accent-blue font-bold uppercase tracking-tight">
                  {users.find(u => u.clerkId === selectedContact)?.name}
                </span>
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto px-10 py-4 bg-accent-blue text-white rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-accent-blue/20 font-heading uppercase tracking-widest text-[11px]"
              >
                Return to Dashboard
              </button>
            </div>

          ) : (
            <div className="flex flex-col gap-7">

              {/* ── Section 1: Recipient ─────────────────────────── */}
              <div className="space-y-4">
                {/* Label row */}
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">
                    Recipient
                  </span>
                  <button
                    onClick={() => setIsQRScannerOpen(true)}
                    className="text-accent-blue text-[10px] font-bold uppercase tracking-widest hover:brightness-125 flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <ScanLine size={13} /> Scan QR
                  </button>
                </div>

                {/* Search input */}
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-blue transition-colors">
                    <Plus size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Phone, @PalmTag or Name"
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace('@', '');
                      const normalizedInput = normalizePhone(val);
                      const found = (users || []).find(
                        u => (u.phone && normalizePhone(u.phone) === normalizedInput) || 
                             u.clerkId === val || 
                             u.name?.toLowerCase().includes(val) || 
                             (u.username && u.username.toLowerCase().includes(val))
                      );
                      if (found) setSelectedContact(found.clerkId);
                    }}
                    className="w-full bg-text-primary/5 border border-border-main rounded-xl py-4 pl-10 pr-4 text-[13px] text-text-primary font-bold outline-none focus:border-accent-blue/50 transition-all font-heading placeholder:font-normal"
                  />
                </div>

                {/* Contact / bank picker */}
                <div>
                  {/* Selection Display */}
                  {selectedContact && !selectedBank ? (
                    (() => {
                      const u = users.find(user => user.clerkId === selectedContact);
                      const tag = u?.username ? `@${u.username}` : `@${u?.name?.split(' ')[0].toLowerCase() || 'user'}`;
                      return (
                        <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="w-11 h-11 rounded-full bg-accent-blue/20 flex items-center justify-center text-[14px] font-bold text-accent-blue shrink-0">
                            {getInitials(u?.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-bold text-text-primary truncate">
                              {u?.name || "Palm User"}
                            </div>
                            <div className="text-[10px] text-accent-blue font-bold uppercase tracking-widest opacity-80 truncate">
                              {tag}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedContact(null)}
                            className="text-[10px] font-bold text-text-secondary hover:text-accent-red uppercase tracking-tight transition-colors shrink-0 px-2 py-1"
                          >
                            Change
                          </button>
                        </div>
                      );
                    })()
                  ) : selectedBank ? (
                    <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden animate-in slide-in-from-top-2 duration-300">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/5 rounded-full blur-2xl -mr-12 -mt-12" />
                      <div className="w-11 h-11 rounded-xl bg-accent-green flex items-center justify-center text-white text-base font-black shadow-md shadow-accent-green/20 relative z-10 shrink-0">
                        {linkedBanks.find(b => b.id === selectedBank)?.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 z-10 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[14px] font-bold text-text-primary m-0 tracking-tight truncate">
                            {linkedBanks.find(b => b.id === selectedBank)?.name}
                          </h3>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-0.5 font-bold uppercase tracking-widest opacity-60">
                          ••• {linkedBanks.find(b => b.id === selectedBank)?.last4}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedBank(null)}
                        className="text-[10px] font-bold text-text-secondary hover:text-accent-red uppercase tracking-tight transition-colors shrink-0 px-2 py-1 z-10"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar animate-in fade-in duration-300">
                      {(users || []).filter(u => u.clerkId !== user?.id).slice(0, 8).map((u) => {
                        const tag = u?.username ? `@${u.username}` : `@${u?.name?.split(' ')[0].toLowerCase() || 'user'}`;
                        return (
                          <button
                            key={u.clerkId}
                            onClick={() => setSelectedContact(u.clerkId)}
                            className="flex flex-col items-center gap-2 bg-text-primary/5 border border-border-main/50 p-3 rounded-xl hover:bg-text-primary/10 hover:border-accent-blue/20 transition-all shrink-0 active:scale-95 min-w-[85px]"
                          >
                            <div className="w-9 h-9 rounded-full bg-accent-blue/20 flex items-center justify-center text-[11px] font-bold text-accent-blue shrink-0">
                              {getInitials(u.name)}
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] font-bold text-text-primary uppercase tracking-tight truncate max-w-[70px]">
                                {u.name?.split(" ")[0] || "User"}
                              </div>
                              <div className="text-[8px] font-bold text-accent-blue/60 uppercase truncate max-w-[70px]">
                                {tag}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Always show Banks below if no bank is selected (Linked Account Section) */}
                  {!selectedBank && linkedBanks.length > 0 && (
                    <div className="space-y-2.5 mt-6 pt-6 border-t border-white/5">
                      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">
                        Withdraw to Linked Bank
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {linkedBanks.map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => {
                              setSelectedBank(bank.id);
                              setSelectedContact(null);
                            }}
                            className="bg-text-primary/5 border border-border-main rounded-xl p-3.5 flex items-center justify-between hover:border-accent-blue/40 hover:bg-text-primary/10 transition-all active:scale-[0.98] group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-text-secondary group-hover:text-accent-blue group-hover:border-accent-blue/20 transition-all shrink-0">
                                <Wallet size={16} />
                              </div>
                              <div className="text-left">
                                <div className="text-[12px] font-bold text-text-primary uppercase tracking-tight">{bank.name}</div>
                                <div className="text-[10px] text-text-secondary font-medium uppercase tracking-widest opacity-50">••• {bank.last4}</div>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-text-secondary group-hover:text-accent-blue transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 2: Amount ────────────────────────────── */}
              <div className="bg-text-primary/5 rounded-2xl p-5 sm:p-7 border border-border-main relative overflow-hidden">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.25em] mb-4 block font-heading relative z-10">
                  Amount (Rs.)
                </label>

                {/* Amount input */}
                <div className="relative flex items-baseline gap-2 z-10 overflow-hidden">
                  <span className="text-lg sm:text-xl font-bold text-text-secondary/40 font-heading shrink-0">Rs.</span>
                  <input
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onBlur={handleAmountBlur}
                    inputMode="decimal"
                    className="flex-1 min-w-0 bg-transparent border-none p-0 text-3xl sm:text-5xl font-bold text-text-primary tracking-tighter outline-none font-heading"
                    placeholder="0.00"
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar relative z-10 pb-0.5">
                  {QUICK_AMOUNTS.map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val.toFixed(2))}
                      className="px-4 py-2 rounded-lg bg-text-primary/5 border border-border-main text-[11px] font-bold text-text-primary hover:bg-accent-blue hover:text-white hover:border-accent-blue transition-all whitespace-nowrap active:scale-95"
                    >
                      Rs.{val}
                    </button>
                  ))}
                </div>

                {/* Available balance row */}
                <div className="flex justify-between mt-5 items-center pt-5 border-t border-text-primary/5 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest">Available</span>
                    <span className="text-[13px] font-bold text-text-primary">Rs. {balance.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => setAmount(balance.toFixed(2))}
                    className="px-4 py-2 rounded-lg bg-text-primary/5 text-[10px] font-bold text-accent-blue hover:bg-accent-blue hover:text-white transition-all uppercase tracking-widest font-heading active:scale-95"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* ── Section 3: Memo ──────────────────────────────── */}
              <div>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Purpose of transfer (optional)"
                  className="w-full bg-transparent border-b border-border-main py-3 text-[13px] sm:text-[14px] text-text-primary font-medium outline-none focus:border-accent-blue transition-all placeholder:text-text-secondary/30"
                />
              </div>

              {/* ── Send Button ──────────────────────────────────── */}
              <button
                onClick={handleSendRequest}
                disabled={!amount || parseFloat(amount) < 100 || loading}
                className="w-full py-5 bg-accent-blue hover:brightness-110 rounded-2xl text-white text-[12px] font-bold tracking-[0.25em] shadow-xl shadow-accent-blue/20 active:scale-95 transition-all disabled:opacity-20 flex flex-col items-center justify-center gap-1 font-heading uppercase"
              >
                <div className="flex items-center gap-3">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
                  <span>{loading ? "Processing..." : "Send Payment"}</span>
                </div>
                {!loading && parseFloat(amount) < 100 && (
                  <span className="text-[9px] opacity-60 normal-case tracking-normal">
                    Minimum Transfer: Rs. 100
                  </span>
                )}
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

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  );
}
