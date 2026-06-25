import { useNavigate } from "react-router-dom";
import { Send, Plus, Download, BarChart2, History } from "lucide-react";

export default function VaultActions({ className = "", mode = "dashboard" }) {
  const navigate = useNavigate();

  const ACTIONS = [
    {
      label: "Transfer",
      icon: Send,
      path: "/send",
      cls: "bg-accent-green text-white shadow-lg shadow-accent-green/20"
    },
    {
      label: "Deposit",
      icon: Plus,
      path: "/add-money",
      cls: "bg-accent-blue text-white shadow-lg shadow-accent-blue/20"
    },
    {
      label: "Receive",
      icon: Download,
      path: "/receive",
      cls: "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"
    },
    mode === "wallet" ? {
      label: "History",
      icon: History,
      path: "/transactions",
      cls: "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"
    } : {
      label: "Analytics",
      icon: BarChart2,
      path: "/analytics",
      cls: "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"
    }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => action.path !== "#" && navigate(action.path)}
            className={`w-full flex items-center justify-center gap-2 sm:gap-3 py-3.5 sm:py-4 px-3 sm:px-4 rounded-2xl text-[11px] sm:text-[13px] font-bold transition-all active:scale-95 group relative overflow-hidden font-heading uppercase tracking-wider ${action.cls}`}
          >
            <Icon size={18} className="relative z-10 shrink-0" />
            <span className="relative z-10 truncate">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
