import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { 
  ArrowLeft, 
  Bell, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Info, 
  CheckCircle2, 
  MoreVertical,
  Trash2,
  Filter
} from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { format } from "date-fns";

export default function Notifications() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { notifications, fetchData, markAllAsRead, loading } = useWalletStore();
  const [filter, setFilter] = useState("all");

  // Load
  useEffect(() => {
    if (user?.id) fetchData(user.id);
  }, [user, fetchData]);

  // Logic
  const filteredNotifs = notifications.filter(n => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const getIcon = (type) => {
    switch (type) {
      case "transaction": return <CreditCard size={18} />;
      case "security": return <Zap size={18} />;
      case "update": return <Info size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "transaction": return "bg-accent-blue/10 text-accent-blue border-accent-blue/20";
      case "security": return "bg-accent-red/10 text-accent-red border-accent-red/20";
      case "update": return "bg-accent-green/10 text-accent-green border-accent-green/20";
      default: return "bg-text-primary/10 text-text-secondary border-border-main";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-2 min-h-screen max-w-4xl mx-auto">
      {/* Header telemetry */}
      <div className="flex items-center justify-between px-3 pt-2">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2.5 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:text-text-primary hover:border-accent-blue/30 transition-all active:scale-95 shadow-sm"
            >
               <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2.5">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_var(--accent-blue)]" />
               <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Notifications</span>
            </div>
         </div>
      </div>

      <div className="bg-bg-card border border-border-main rounded-3xl shadow-xl flex flex-col overflow-hidden min-h-[600px]">
         {/* Filter Strip */}
         <div className="px-6 sm:px-8 py-5 border-b border-border-main bg-text-primary/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
               {["all", "transactions", "security", "system"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap font-heading ${filter === f ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/20" : "bg-text-primary/5 text-text-secondary hover:bg-text-primary/10 hover:text-text-primary"}`}
                  >
                     {f}
                  </button>
               ))}
            </div>
            <button 
              onClick={() => user?.id && markAllAsRead(user.id)}
              className="px-4 py-2 bg-text-primary/5 hover:bg-accent-blue/10 border border-border-main/50 rounded-xl text-[10px] font-bold text-text-secondary hover:text-accent-blue uppercase tracking-widest transition-all active:scale-95 font-heading"
            >
               Mark All As Read
            </button>
         </div>

         {/* Notification List */}
         <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredNotifs.length > 0 ? (
               <div className="divide-y divide-border-main/50">
                  {filteredNotifs.map((n) => (
                     <div 
                        key={n._id}
                        onClick={() => !n.isRead && markNotificationAsRead(n._id)}
                        className={`group px-6 sm:px-10 py-6 flex gap-6 hover:bg-text-primary/[0.02] transition-all cursor-pointer relative ${!n.isRead ? "bg-accent-blue/[0.02]" : ""}`}
                     >
                        {!n.isRead && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-blue shadow-[4px_0_12px_var(--accent-blue)]" />
                        )}
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-300 ${getIconBg(n.type)}`}>
                           {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-1">
                              <h3 className={`text-[15px] font-bold tracking-tight font-heading leading-tight ${!n.isRead ? "text-text-primary" : "text-text-secondary opacity-70"}`}>
                                 {n.title}
                              </h3>
                              <span className="text-[10px] text-text-secondary font-bold opacity-40 whitespace-nowrap ml-4 uppercase font-heading">
                                 {format(new Date(n.createdAt), 'HH:mm • dd MMM')}
                              </span>
                           </div>
                           <p className={`text-[13px] leading-relaxed transition-opacity ${!n.isRead ? "text-text-secondary font-medium" : "text-text-secondary/50 font-normal"}`}>
                              {n.message}
                           </p>
                        </div>
                        <div className="hidden sm:flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-2 text-text-secondary hover:text-accent-red">
                              <Trash2 size={18} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
                  <div className="w-20 h-20 bg-text-primary/5 rounded-3xl flex items-center justify-center mb-8 border border-border-main opacity-20">
                     <Bell size={32} className="text-text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary font-heading tracking-tight mb-2 uppercase">No Notifications</h3>
                  <p className="text-[13px] text-text-secondary font-medium max-w-[280px] leading-relaxed opacity-40">Your notification feed is currently empty. Critical updates will appear here.</p>
               </div>
            )}
         </div>

         {/* Bottom Action */}
         <div className="p-6 border-t border-border-main bg-text-primary/[0.01] flex items-center justify-center">
            <button className="text-[10px] font-bold text-text-secondary hover:text-accent-blue uppercase tracking-[0.25em] transition-all font-heading opacity-50 hover:opacity-100">
               Clear All Notifications
            </button>
         </div>
      </div>
    </div>
  );
}
