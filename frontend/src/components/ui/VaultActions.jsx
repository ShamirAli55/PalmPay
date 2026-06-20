import { useNavigate } from "react-router-dom";
import { Send, Plus, Download, BarChart2, ArrowLeftRight } from "lucide-react";

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
      label: "Swap", 
      icon: ArrowLeftRight, 
      path: "#", 
      cls: "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary opacity-50 cursor-not-allowed" 
    } : { 
      label: "Analytics", 
      icon: BarChart2, 
      path: "/analytics", 
      cls: "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary" 
    }
  ];

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => action.path !== "#" && navigate(action.path)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-[12px] font-bold transition-all active:scale-95 group relative overflow-hidden font-heading uppercase tracking-wide min-w-[120px] ${action.cls}`}
          >
            <Icon size={16} className="relative z-10" />
            <span className="relative z-10">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
