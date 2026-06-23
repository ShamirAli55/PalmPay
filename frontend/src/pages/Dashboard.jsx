import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  CreditCard,
  ArrowDownCircle,
  Target,
  Send,
  Download,
  Plus,
  BarChart2,
  TrendingDown,
  Hand,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { STAT_CARDS, SPENDING_CHART, MY_CARDS } from "../constants/index";
import VaultActions from "../components/ui/VaultActions";
import PalmScanner from "../components/ui/PalmScanner";
import { useWalletStore } from "../store/walletStore";
import { usePalmStore } from "../store/palmStore";

// Stats
function StatCard({ card }) {
  const icons = {
    "trending-up": TrendingUp,
    "credit-card": CreditCard,
    "arrow-down": ArrowDownCircle,
    target: Target,
  };
  const Icon = icons[card.icon] || TrendingUp;

  return (
    <div className="bg-bg-card border border-border-main rounded-2xl p-6 shadow-sm relative overflow-hidden group transition-all hover:shadow-md cursor-default">
      <div className="flex justify-between items-center mb-5">
        <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase font-heading">
          {card.label}
        </span>
        <div className="bg-accent-blue/10 rounded-xl p-2 flex items-center group-hover:bg-accent-blue/20 transition-all">
          <Icon className="w-4 h-4 text-accent-blue" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-2xl font-bold text-text-primary tracking-tight font-heading">
          {card.value}
        </span>
        {card.change && (
          <div className="flex items-center justify-between w-full">
            <span className={`text-[11px] font-bold rounded-lg px-2 py-0.5 whitespace-nowrap ${card.changePositive ? "text-accent-green bg-accent-green/12" : "text-accent-red bg-accent-red/12"}`}>
              {card.changePositive ? "↑" : "↓"} {card.change}
            </span>
          </div>
        )}
        {card.showProgress && (
          <div className="mt-1">
            <div className="w-full h-1.5 bg-text-primary/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent-blue rounded-full" style={{ width: `${card.progress}%` }} />
            </div>
            <span className="text-[11px] text-text-secondary mt-1.5 block font-medium">{card.sub}</span>
          </div>
        )}
        {!card.showProgress && !card.change && (
          <span className="text-[11px] text-text-secondary font-medium">{card.sub}</span>
        )}
      </div>

      {card.showChart && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-15 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={card.chartData || []}>
              <Bar dataKey="amount" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Action
function ActionButton({ icon: Icon, label, variant = "secondary", onClick }) {
  const base = "flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[13px] font-bold transition-all active:scale-95 cursor-pointer font-heading uppercase tracking-wider";
  const styles = {
    primary: "bg-accent-blue text-white shadow-lg shadow-accent-blue/20 hover:brightness-110",
    secondary: "bg-bg-card border border-border-main text-text-primary hover:bg-text-primary/5",
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`}>
      <Icon size={16} /> {label}
    </button>
  );
}

// Dashboard
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { balance, cards, activeCardId, fetchData, getComputedStats, getChartData, getFinancialSummary } = useWalletStore();
  const { palmEnrolled, fetchPalmStatus } = usePalmStore();
  const [chartRange, setChartRange] = useState("week");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const activeCard = cards.find(c => c.id === activeCardId) || cards[0] || MY_CARDS[0];

  useEffect(() => {
    if (user) {
      fetchData(user.id);
      fetchPalmStatus(user.id);
    }
  }, [user, fetchData, fetchPalmStatus]);

  const stats = getComputedStats();
  const chartData = getChartData();
  const summary = getFinancialSummary();

  if (stats.length > 0) {
    stats[0].chartData = chartData.week;
  }

  // Security stat card: always clickable — enroll or re-enroll
  const handleCardClick = (id) => {
    if (id === "active-auth") setIsScannerOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-2 min-h-screen">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((card) => (
          <div key={card.id} onClick={() => handleCardClick(card.id)}>
            <StatCard card={card} />
          </div>
        ))}
      </div>

      <PalmScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        mode="enroll"
        onVerified={() => {
          if (user?.id) {
            fetchData(user.id);
            fetchPalmStatus(user.id);
          }
        }}
      />

      <VaultActions className="grid grid-cols-2 lg:grid-cols-4" />

      {/* Charts & Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Spending Analytics */}
        <div className="lg:col-span-2 bg-bg-card border border-border-main rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-8 transition-all hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary font-heading tracking-tight">Spending Overview</h2>
              <p className="text-[12px] text-text-secondary mt-1 font-medium italic opacity-70">A summary of your recent spending habits</p>
            </div>
            <div className="flex bg-text-primary/5 rounded-xl p-1 self-start sm:self-auto border border-border-main/50">
              {["week", "month", "year"].map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-5 py-2 rounded-lg text-[12px] font-bold capitalize transition-all duration-200 cursor-pointer ${chartRange === r
                    ? "bg-accent-blue text-white shadow-md shadow-accent-blue/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData[chartRange]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barCategoryGap="10%"
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="inactiveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--text-primary)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="var(--text-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--text-primary)" opacity={0.05} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                />
                <Tooltip
                  cursor={{ fill: "var(--text-primary)", opacity: 0.03, radius: 4 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-bg-card/90 backdrop-blur-xl border border-border-main p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2">{label}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent-blue" />
                            <p className="text-lg font-bold text-text-primary font-heading tracking-tight">
                              Rs. {payload[0].value.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="amount"
                  radius={[2, 2, 0, 0]}
                  animationDuration={1500}
                >
                  {chartData[chartRange].map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === chartData[chartRange].length - 1 ? "url(#barGradient)" : "url(#inactiveGradient)"}
                      className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-base font-bold text-text-primary font-heading uppercase tracking-tight">Active Assets</h2>
            <div className="flex gap-1.5">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${cards.indexOf(activeCard) === idx ? "bg-accent-blue w-4" : "bg-text-primary/10"}`}
                />
              ))}
            </div>
          </div>

          <div className="relative overflow-visible h-[160px] cursor-grab active:cursor-grabbing">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCardId}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ background: activeCard.color }}
                title="Swipe to switch cards"
                onClick={() => {
                  const nextIdx = (cards.indexOf(activeCard) + 1) % cards.length;
                  useWalletStore.getState().setActiveCard(cards[nextIdx].id);
                }}
                className="w-full h-full rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col transition-all hover:brightness-110 active:scale-[0.98] group"
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
                <div className="flex justify-between items-start mb-5 z-10">
                  <div>
                    <div className="text-[10px] text-white/60 tracking-widest font-bold uppercase">{activeCard.label}</div>
                    <div className="text-[12px] text-white/80 mt-1 font-bold">PALM USER</div>
                  </div>
                  <div className="bg-white/15 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white tracking-widest">
                    {activeCard.network}
                  </div>
                </div>
                <div className="text-[13px] tracking-[0.2em] text-white/60 mb-1 font-mono z-10 font-bold">
                  •••• •••• •••• {activeCard.last4}
                </div>
                <div className="flex justify-between items-end mt-auto z-10">
                  <div>
                    <div className="text-[22px] font-extrabold text-white tracking-tight">
                      Rs. {activeCard.balance?.toLocaleString() || "0"}
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 font-bold">V-AUTH ACTIVE</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 space-y-3">
            <div className="bg-text-primary/5 border border-border-main rounded-xl p-4 flex items-center justify-between cursor-default hover:border-accent-green/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-green/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-accent-green" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-text-primary">Total Income</div>
                  <div className="text-[11px] text-text-secondary font-medium">This month</div>
                </div>
              </div>
              <span className="text-[13px] font-black text-accent-green">+Rs. {summary.income.toLocaleString()}</span>
            </div>
            <div className="bg-text-primary/5 border border-border-main rounded-xl p-4 flex items-center justify-between cursor-default hover:border-accent-red/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-red/10 flex items-center justify-center">
                  <TrendingDown size={16} className="text-accent-red" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-text-primary">Total Spend</div>
                  <div className="text-[11px] text-text-secondary font-medium">This month</div>
                </div>
              </div>
              <span className="text-[13px] font-black text-text-primary">-Rs. {summary.spend.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Status - The 'Normal' Placeholder */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mb-12 group transition-all hover:shadow-md">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20 group-hover:scale-105 transition-transform duration-500 shadow-sm shadow-accent-blue/10">
            <Hand className="w-8 h-8 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary font-heading tracking-tight">Palm Recognition Security</h2>
            <p className="text-[12px] text-text-secondary font-medium max-w-[320px] leading-relaxed">
              {palmEnrolled 
                ? "Your palm scan is active. Your account is fully protected." 
                : "Biometric security is not yet active. Please complete enrollment."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className={`text-[10px] font-black uppercase tracking-widest ${palmEnrolled ? "text-accent-green" : "text-accent-red"}`}>
              {palmEnrolled ? "Protected" : "Action Required"}
            </span>
            <span className="text-[11px] text-text-secondary font-medium">
              {palmEnrolled ? "Identity Verified" : "Setup Incomplete"}
            </span>
          </div>
          <button
            onClick={() => navigate("/security")}
            className="flex-1 md:flex-none px-10 py-4 bg-bg-main border border-border-main rounded-xl text-[12px] font-bold text-text-primary uppercase tracking-widest hover:bg-text-primary/5 transition-all active:scale-95 font-heading"
          >
            Security Settings
          </button>
        </div>
      </div>
    </div>
  );
}
