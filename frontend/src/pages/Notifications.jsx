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
  const { notifications, fetchData, markAllAsRead, markNotificationAsRead, loading } = useWalletStore();
  const [filter, setFilter] = useState("all");

  // Load
  useEffect(() => {
    if (user?.id) {
        fetchData(user.id, user.fullName || user.username);
    }
  }, [user, fetchData]);

  // Logic
  const filteredNotifs = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "system") return n.type === "system" || n.type === "update";
    return n.type === filter;
  });

  const getIcon = (type) => {
    switch (type) {
      case "transaction": return <CreditCard size={18} />;
      case "security": return <ShieldCheck size={18} />;
      case "system":
      case "update": return <Zap size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "transaction": return "bg-accent-blue/10 text-accent-blue border-accent-blue/20";
      case "security": return "bg-accent-red/10 text-accent-red border-accent-red/20";
      case "system":
      case "update": return "bg-accent-green/10 text-accent-green border-accent-green/20";
      default: return "bg-text-secondary/10 text-text-secondary border-border-main";
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen max-w-5xl mx-auto pb-24 lg:pb-6">
      {/* Header telemetry */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-bg-card border border-border-main rounded-2xl text-text-secondary hover:text-text-primary hover:border-accent-blue/30 transition-all active:scale-95 shadow-lg shadow-black/5"
            >
               <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse shadow-[0_0_8px_var(--accent-blue)]" />
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] font-heading">Notification Center</span>
               </div>
               <h1 className="text-2xl font-bold text-text-primary font-heading tracking-tight mt-0.5">Inbox</h1>
            </div>
         </div>

         <button 
            onClick={() => user?.id && markAllAsRead(user.id)}
            className="hidden sm:flex px-6 py-3 bg-text-primary/5 hover:bg-accent-blue/10 border border-border-main rounded-2xl text-[11px] font-bold text-text-secondary hover:text-accent-blue uppercase tracking-widest transition-all active:scale-95 font-heading"
         >
            Mark All As Read
         </button>
      </div>

      <div className="bg-bg-card border border-border-main rounded-[2rem] shadow-2xl flex flex-col overflow-hidden min-h-[70vh] backdrop-blur-xl relative">
         {/* Filter Strip */}
         <div className="px-4 sm:px-8 py-6 border-b border-border-main bg-white/[0.02] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 sm:pb-0">
               {["all", "transaction", "security", "system"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap font-heading border ${filter === f ? "bg-accent-blue border-accent-blue text-white shadow-lg shadow-accent-blue/20" : "bg-text-primary/5 border-transparent text-text-secondary hover:bg-text-primary/10 hover:text-text-primary"}`}
                  >
                     {f === "transaction" ? "Transactions" : f === "system" ? "Updates" : f}
                  </button>
               ))}
            </div>
            
            <button 
               onClick={() => user?.id && markAllAsRead(user.id)}
               className="sm:hidden w-full py-3 bg-text-primary/5 rounded-xl text-[11px] font-bold text-text-secondary uppercase tracking-widest font-heading border border-border-main"
            >
               Mark All Read
            </button>
         </div>

         {/* Notification List */}
         <div className="flex-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-350px)] sm:max-h-[700px]">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <div className="w-10 h-10 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter">Syncing feed...</p>
               </div>
            ) : filteredNotifs.length > 0 ? (
               <div className="grid grid-cols-1 divide-y divide-border-main/30">
                  {filteredNotifs.map((n) => (
                     <div 
                        key={n._id}
                        onClick={() => !n.isRead && markNotificationAsRead(n._id)}
                        className={`group px-4 sm:px-10 py-7 flex gap-4 sm:gap-8 hover:bg-text-primary/[0.03] transition-all cursor-pointer relative ${!n.isRead ? "bg-accent-blue/[0.03]" : "opacity-80"}`}
                     >
                        {!n.isRead && (
                           <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-accent-blue shadow-[4px_0_15px_rgba(59,130,246,0.5)]" />
                        )}
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center shrink-0 transition-all group-hover:scale-110 group-hover:rotate-3 duration-500 ${getIconBg(n.type)} shadow-lg shadow-black/5`}>
                           {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                           <div className="flex justify-between items-start">
                              <h3 className={`text-base sm:text-[17px] font-bold tracking-tight font-heading leading-tight transition-colors ${!n.isRead ? "text-text-primary" : "text-text-secondary/70"}`}>
                                 {n.title}
                              </h3>
                              <span className="text-[10px] text-text-secondary font-bold opacity-40 whitespace-nowrap ml-4 uppercase font-heading bg-text-primary/5 px-2 py-0.5 rounded-md mt-1 shrink-0">
                                 {format(new Date(n.createdAt), 'HH:mm')}
                              </span>
                           </div>
                           <p className={`text-[13px] sm:text-sm leading-relaxed transition-all max-w-2xl ${!n.isRead ? "text-text-secondary font-medium" : "text-text-secondary/40 font-normal"}`}>
                              {n.message}
                           </p>
                           <div className="flex items-center gap-3 mt-1 text-[10px] text-text-secondary/30 font-bold uppercase tracking-widest">
                              <span>{format(new Date(n.createdAt), 'dd MMM yyyy')}</span>
                              {!n.isRead && (
                                 <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                              )}
                           </div>
                        </div>
                        <div className="hidden sm:flex items-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                           <button className="p-3 bg-red-500/5 text-accent-red rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                              <Trash2 size={18} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-32 px-10 text-center animate-in fade-in zoom-in duration-700">
                  <div className="w-24 h-24 bg-text-secondary/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-border-main relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <Bell size={40} className="text-text-secondary opacity-30 transform -rotate-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary font-heading tracking-tight mb-3 uppercase">Clear Skies</h3>
                  <p className="text-[14px] text-text-secondary font-medium max-w-[320px] leading-relaxed opacity-40">Your notification feed is empty. We'll alert you to important activity here.</p>
               </div>
            )}
         </div>

         {/* Bottom Action */}
         <div className="p-6 border-t border-border-main bg-white/[0.01] flex items-center justify-center">
            <button className="text-[11px] font-bold text-text-secondary hover:text-accent-red uppercase tracking-[0.3em] transition-all font-heading opacity-50 hover:opacity-100 px-6 py-2 rounded-xl hover:bg-red-500/5">
               Clear Feed History
            </button>
         </div>
      </div>
    </div>
  );
}
