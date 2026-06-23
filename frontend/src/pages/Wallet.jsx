import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useWalletStore } from "../store/walletStore";
import {
  Plus, ArrowLeftRight, Eye, EyeOff, Lock, Building2,
  ShoppingBag, Briefcase, UtensilsCrossed, CreditCard
} from "lucide-react";
import VaultActions from "../components/ui/VaultActions";
import PalmScanner from "../components/ui/PalmScanner";
import { MY_CARDS, CONNECTED_BANKS } from "../constants/index";

const MERCHANT_ICONS = {
  TECHNOLOGY: ShoppingBag,
  INCOME: Briefcase,
  DINING: UtensilsCrossed,
  TRANSPORT: CreditCard,
  ENTERTAINMENT: CreditCard,
};

function CardVisual({ card, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: card.color }}
      className={`rounded-2xl p-6 cursor-pointer relative overflow-hidden transition-all duration-200 min-h-[160px] w-full md:w-[320px] md:flex-none shadow-lg ${isActive ? "ring-2 ring-white/40 ring-offset-2 ring-offset-bg-card scale-[1.02]" : "opacity-80 hover:opacity-100 hover:scale-[1.01]"}`}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="text-[10px] text-white/60 tracking-widest font-bold uppercase">{card.label}</div>
          <div className="text-[12px] text-white/80 mt-1 font-bold">{card.holder}</div>
        </div>
        <div className="bg-white/15 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white tracking-widest">
          {card.network}
        </div>
      </div>
      <div className="text-[13px] tracking-[0.2em] text-white/60 mb-1 font-mono">•••• •••• •••• {card.last4}</div>
      <div className="flex justify-between items-end mt-3">
        <div className="text-[22px] font-extrabold text-white tracking-tight">Rs. {card.balance?.toLocaleString()}</div>
        {card.frozen && <Lock size={16} className="text-white/60" />}
      </div>
    </div>
  );
}

function VirtualCardSettings({ card, onToggleFreeze }) {
  const [revealed, setRevealed] = useState(false);
  if (!card) return null;

  const isFrozen = card.status === 'frozen';

  return (
    <div className="bg-bg-card border border-border-main rounded-2xl p-6 flex flex-col md:flex-row gap-6 flex-1 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl pointer-events-none" style={{ background: card.color }} />
      <div
        onClick={() => setRevealed(!revealed)}
        style={{ borderColor: revealed ? card.color + '44' : 'var(--border-main)' }}
        className="w-full md:w-44 bg-text-primary/5 border border-border-main rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer p-6 shrink-0 transition-all active:scale-95 hover:bg-text-primary/10"
      >
        {revealed ? <Eye size={22} style={{ color: card.color }} /> : <EyeOff size={22} className="text-text-secondary" />}
        <span className="text-[10px] text-text-secondary tracking-[0.2em] uppercase font-bold text-center font-heading">
          {revealed ? "HIDE CARD DETAILS" : "VIEW CARD DETAILS"}
        </span>
        <span className={`text-text-primary font-bold font-mono text-center whitespace-nowrap px-2 ${revealed ? "text-[13px] tracking-normal" : "text-[13px] tracking-normal"}`}>
          {revealed ? `${card.brand === 'MASTERCARD' ? '5412' : '4532'} ${card.last4} 0041 ${card.last4}` : `•••• •••• •••• ${card.last4}`}
        </span>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-text-primary font-heading uppercase tracking-tight">{card.label}</span>
            <span 
              className="text-[10px] font-bold rounded-lg px-2.5 py-1 tracking-widest uppercase"
              style={{ background: card.color + '15', color: card.color }}
            >
              {!isFrozen ? 'ACTIVE' : 'FROZEN'}
            </span>
          </div>
          <button 
            onClick={() => onToggleFreeze(card)}
            style={{ 
                background: isFrozen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isFrozen ? '#22c55e' : '#ef4444'
            }}
            className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:opacity-80 active:scale-95"
          >
            {isFrozen ? 'UNFREEZE CARD' : 'FREEZE CARD'}
          </button>
        </div>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-4 font-medium">
          Manage your {card.brand || card.network} secure identity. Your {(card.cardType || 'Virtual').toLowerCase()} card details are protected by Palm recognition and anti-fraud protocols.
        </p>
        <div className="flex flex-wrap gap-2">
          {[`EXPIRY: ${card.expiry}`, `LIMIT: Rs. 50,000`, isFrozen ? "FROZEN" : "ACTIVE"].map((tag) => (
            <span 
                key={tag} 
                className="text-[10px] font-bold text-text-secondary bg-text-primary/5 border border-border-main rounded-lg px-3 py-1.5 font-heading tracking-widest"
                style={tag === "ACTIVE" ? { color: '#22c55e', background: 'rgba(34, 197, 94, 0.05)' } : {}}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

function PalmIDPanel() {
  return (
    <div className="bg-gradient-to-br from-accent-green/10 to-accent-blue/10 border border-accent-green/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 min-w-[200px] shadow-sm text-center">
      <div className="w-16 h-16 rounded-full bg-accent-green/10 border-2 border-accent-green/30 flex items-center justify-center text-3xl">🤚</div>
      <div>
        <div className="text-[15px] font-bold text-text-primary font-heading uppercase tracking-tight">Palm Recognition Active</div>
        <div className="text-[11px] text-text-secondary mt-1 font-bold font-heading opacity-60">LAST VERIFIED 12M AGO</div>
      </div>
      <button className="bg-accent-green/20 border border-accent-green/30 text-accent-green rounded-xl px-5 py-2 text-[11px] font-bold hover:bg-accent-green/30 transition-all font-heading uppercase tracking-widest cursor-pointer">
        UPDATE SCAN
      </button>
    </div>
  );
}

export default function Wallet() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { balance, fetchData, linkedBanks, cards, activeCardId, setActiveCard, toggleCardFreeze } = useWalletStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [showAllCards, setShowAllCards] = useState(false);

  useEffect(() => {
    if (user) fetchData(user.id);
  }, [user, fetchData]);

  const handleToggleFreeze = (card) => {
    if (card.status === 'frozen') {
      setPendingCard(card);
      setIsScannerOpen(true);
    } else {
      toggleCardFreeze(card.id);
    }
  };

  const displayedCards = showAllCards ? cards : cards.slice(0, 2);

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-2 min-h-screen">
      {/* ... Hero Section remains same ... */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-8 lg:p-10 flex flex-col xl:flex-row justify-between items-center gap-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 text-center xl:text-left">
          <div className="text-[11px] text-text-secondary tracking-[0.3em] font-bold uppercase font-heading">TOTAL WALLET BALANCE</div>
          <div className="text-4xl lg:text-6xl font-bold text-text-primary tracking-tighter my-3 font-heading">Rs. {balance.toLocaleString()}</div>
          <div className="flex items-center justify-center xl:justify-start gap-4">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-accent-green bg-accent-green/12 rounded-lg px-2.5 py-1 shadow-sm whitespace-nowrap">↑ +2.4%</span>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-50">Trend Baseline</span>
          </div>
        </div>
        <VaultActions mode="wallet" className="justify-center xl:justify-end shrink-0 relative z-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-bg-card border border-border-main rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[17px] font-bold text-text-primary font-heading tracking-tight">My Cards</span>
            <div className="flex gap-4">
              {cards.length > 2 && (
                  <button 
                      onClick={() => setShowAllCards(!showAllCards)}
                      className="text-[12px] font-bold text-accent-green hover:underline uppercase tracking-widest font-heading cursor-pointer"
                  >
                      {showAllCards ? "Show Less" : `View All (${cards.length})`}
                  </button>
              )}
              <button 
                onClick={() => navigate("/add-card")}
                className="flex items-center gap-1.5 text-[12px] font-bold text-accent-blue hover:underline uppercase tracking-widest font-heading cursor-pointer"
              >
                <Plus size={14} /> Request Card
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {displayedCards.map((card) => (
              <CardVisual key={card.id} card={card} isActive={activeCardId === card.id} onClick={() => setActiveCard(card.id)} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-bg-card border border-border-main rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="text-[17px] font-bold text-text-primary mb-6 font-heading tracking-tight">Linked Bank Accounts</div>
          <div className="divide-y divide-border-main">
            {linkedBanks.map((bank) => (
              <div key={bank.id} className="flex items-center justify-between py-4 group cursor-pointer">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/10 flex items-center justify-center transition-all group-hover:scale-110">
                    <Building2 size={18} className="text-accent-blue" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text-primary font-heading tracking-tight uppercase">{bank.name}</div>
                    <div className="text-[10px] text-text-secondary font-bold tracking-widest opacity-50 uppercase">••• {bank.last4}</div>
                  </div>
                </div>
                <span className="text-[15px] font-bold text-text-primary font-heading tracking-tighter">Rs. {bank.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <VirtualCardSettings 
          card={cards.find(c => c.id === activeCardId) || cards[0]} 
          onToggleFreeze={handleToggleFreeze}
        />
        <PalmIDPanel />
      </div>

      <PalmScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        mode="verify"
        onVerified={() => {
          if (pendingCard) toggleCardFreeze(pendingCard.id);
          setPendingCard(null);
        }}
      />
    </div>
  );
}
