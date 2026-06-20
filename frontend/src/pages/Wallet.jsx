import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, ArrowLeftRight, Eye, EyeOff, Lock, Building2,
  ShoppingBag, Briefcase, UtensilsCrossed, CreditCard, Send, Download
} from "lucide-react";
import { MY_CARDS, CONNECTED_BANKS, RECENT_TRANSACTIONS } from "../constants/index";

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
      className={`rounded-2xl p-6 cursor-pointer relative overflow-hidden transition-all duration-200 min-h-[150px] flex-1 shadow-lg ${isActive ? "ring-2 ring-white/40 ring-offset-2 ring-offset-bg-card scale-[1.02]" : "opacity-80 hover:opacity-100 hover:scale-[1.01]"}`}
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

function VirtualCardSettings() {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="bg-bg-card border border-border-main rounded-2xl p-6 flex flex-col md:flex-row gap-6 flex-1 shadow-sm">
      <div
        onClick={() => setRevealed(!revealed)}
        className="w-full md:w-44 bg-text-primary/5 border border-border-main rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer p-6 shrink-0 transition-all active:scale-95 hover:bg-text-primary/10"
      >
        {revealed ? <Eye size={22} className="text-accent-blue" /> : <EyeOff size={22} className="text-text-secondary" />}
        <span className="text-[10px] text-text-secondary tracking-[0.2em] uppercase font-bold text-center font-heading">
          {revealed ? "SECURE CARD NO." : "TAP TO UNLOCK"}
        </span>
        <span className={`text-text-primary font-bold tracking-widest font-mono text-center ${revealed ? "text-[14px]" : "text-[12px]"}`}>
          {revealed ? "4532 •••• •••• 8829" : "•••• •••• •••• ••••"}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-base font-bold text-text-primary font-heading uppercase tracking-tight">Virtual Protocol</span>
          <span className="text-[10px] font-bold bg-accent-green/10 text-accent-green rounded-lg px-2.5 py-1 tracking-widest uppercase">Active</span>
        </div>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-4 font-medium">
          Generated dynamic card data refreshed every cycle. Specifically engineered for one-time digital acquisitions and recurring subscriptions.
        </p>
        <div className="flex flex-wrap gap-2">
          {["SINGLE USE ONLY", "BURST LIMIT: Rs. 50,000"].map((tag) => (
            <span key={tag} className="text-[10px] font-bold text-text-secondary bg-text-primary/5 border border-border-main rounded-lg px-3 py-1.5 font-heading tracking-widest">
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
        <div className="text-[15px] font-bold text-text-primary font-heading uppercase tracking-tight">Palm-ID™ Ready</div>
        <div className="text-[11px] text-text-secondary mt-1 font-bold font-heading opacity-60">VERIFIED 12M AGO</div>
      </div>
      <button className="bg-accent-green/20 border border-accent-green/30 text-accent-green rounded-xl px-5 py-2 text-[11px] font-bold hover:bg-accent-green/30 transition-all font-heading uppercase tracking-widest cursor-pointer">
        RE-VERIFY
      </button>
    </div>
  );
}

export default function Wallet() {
  const [activeCardId, setActiveCardId] = useState(MY_CARDS[0].id);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-2 min-h-screen">
      {/* Hero */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-8 lg:p-10 flex flex-col xl:flex-row justify-between items-center gap-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 text-center xl:text-left">
          <div className="text-[11px] text-text-secondary tracking-[0.3em] font-bold uppercase font-heading">CUMULATIVE VAULT VALUE</div>
          <div className="text-4xl lg:text-6xl font-bold text-text-primary tracking-tighter my-3 font-heading">Rs. 500,000.00</div>
          <div className="flex items-center justify-center xl:justify-start gap-4">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-accent-green bg-accent-green/12 rounded-lg px-2.5 py-1 shadow-sm whitespace-nowrap">↑ +2.4%</span>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-50">Trend Baseline</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center xl:justify-end gap-3 shrink-0 relative z-10">
          {[
            { label: "Transfer", icon: Send, action: () => navigate("/send"), cls: "bg-accent-green text-white shadow-lg shadow-accent-green/20" },
            { label: "Withdraw", icon: Download, action: () => navigate("/receive"), cls: "bg-accent-blue text-white shadow-lg shadow-accent-blue/20" },
            { label: "Deposit", icon: Plus, action: () => {}, cls: "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary" },
            { label: "Swap", icon: ArrowLeftRight, action: () => {}, cls: "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary" },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button key={btn.label} onClick={btn.action} className={`flex items-center gap-2.5 py-3.5 px-6 rounded-xl text-[13px] font-bold transition-all active:scale-95 cursor-pointer font-heading uppercase tracking-wide ${btn.cls}`}>
                <Icon size={16} /> {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards */}
        <div className="lg:col-span-2 bg-bg-card border border-border-main rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[17px] font-bold text-text-primary font-heading tracking-tight">Active Channels</span>
            <button className="text-[12px] font-bold text-accent-green hover:underline uppercase tracking-widest font-heading cursor-pointer">Manage</button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {MY_CARDS.map((card) => (
              <CardVisual key={card.id} card={card} isActive={activeCardId === card.id} onClick={() => setActiveCardId(card.id)} />
            ))}
          </div>
        </div>

        {/* Banks */}
        <div className="lg:col-span-1 bg-bg-card border border-border-main rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="text-[17px] font-bold text-text-primary mb-6 font-heading tracking-tight">Linked Network</div>
          <div className="divide-y divide-border-main">
            {CONNECTED_BANKS.map((bank) => (
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
                <span className="text-[15px] font-bold text-text-primary font-heading tracking-tighter">
                  Rs. {bank.balance.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-transparent border border-dashed border-border-main rounded-xl text-text-secondary hover:text-text-primary hover:border-text-primary/30 transition-all text-[11px] font-bold uppercase tracking-widest font-heading cursor-pointer">
            <Plus size={15} /> Add Link
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <VirtualCardSettings />
        <PalmIDPanel />
      </div>
    </div>
  );
}
