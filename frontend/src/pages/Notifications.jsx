import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { 
  ArrowLeft, 
  Bell, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  CheckCircle2, 
  Trash2,
  X
} from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Notifications() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { notifications, fetchData, markAllAsRead, markNotificationAsRead, deleteNotification, loading } = useWalletStore();
  const [filter, setFilter] = useState("all");
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Load
  useEffect(() => {
    if (user?.id) {
        fetchData(user.id, user.fullName || user.username);
    }
  }, [user, fetchData]);

  const filteredNotifs = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "system") return n.type === "system" || n.type === "update";
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotifClick = (n) => {
    if(!n.isRead) markNotificationAsRead(n._id);
    setSelectedNotif(n);
  };

  const getIcon = (type) => {
    switch (type) {
      case "transaction": return <CreditCard size={20} />;
      case "security": return <ShieldCheck size={20} />;
      case "system":
      case "update": return <Zap size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "transaction": return "bg-accent-blue/10 text-accent-blue border-accent-blue/10";
      case "security": return "bg-accent-red/10 text-accent-red border-accent-red/10";
      case "system":
      case "update": return "bg-accent-green/10 text-accent-green border-accent-green/10";
      default: return "bg-text-secondary/10 text-text-secondary border-border-main/20";
    }
  };

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "transaction", label: "Transactions" },
    { id: "security", label: "Security" },
    { id: "system", label: "Updates" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-main max-w-6xl mx-auto px-4 sm:px-10 py-8 pb-32 relative">
      {/* Universal Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
         <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 flex items-center justify-center bg-bg-card border border-border-main rounded-2xl text-text-secondary hover:text-text-primary transition-all active:scale-95 shadow-sm"
            >
               <ArrowLeft size={22} />
            </button>
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-accent-blue uppercase tracking-[0.25em] font-heading">Recent Updates</span>
                  {unreadCount > 0 && <span className="text-[9px] font-bold text-accent-red bg-accent-red/10 px-2 py-0.5 rounded-full">{unreadCount} New</span>}
               </div>
               <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading tracking-tighter">Notifications</h1>
            </div>
         </div>

         {/* Filter Strip & Mark Read */}
         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
               {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap font-heading border ${filter === f.id ? "bg-accent-blue border-accent-blue text-white shadow-lg shadow-accent-blue/15" : "bg-bg-card border-border-main text-text-secondary hover:bg-text-primary/5 hover:text-text-primary"}`}
                  >
                     {f.label}
                  </button>
               ))}
            </div>
            <div className="h-8 w-px bg-border-main hidden sm:block mx-1" />
            <button 
               onClick={() => user?.id && markAllAsRead(user.id)}
               disabled={unreadCount === 0}
               className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 font-heading border border-border-main ${unreadCount > 0 ? "bg-bg-card text-text-primary hover:bg-text-primary/5" : "opacity-30 cursor-not-allowed text-text-secondary"}`}
            >
               <CheckCircle2 size={14} /> Mark All Read
            </button>
         </div>
      </div>

      {/* Fluid Notification List */}
      <div className="flex flex-col gap-4">
         {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
               <div className="w-12 h-12 border-2 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin" />
               <p className="text-[11px] font-black text-text-secondary uppercase tracking-widest">Loading...</p>
            </div>
         ) : filteredNotifs.length > 0 ? (
            <div className="space-y-4">
               {filteredNotifs.map((n) => (
                  <div 
                     key={n._id}
                     onClick={() => handleNotifClick(n)}
                     className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 hover:transform hover:scale-[1.005] duration-300 ${!n.isRead ? "bg-accent-blue/[0.03] border-accent-blue/10 shadow-sm" : "bg-bg-card/50 border-border-main hover:bg-bg-card hover:border-text-primary/10"}`}
                  >
                     <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all group-hover:scale-105 duration-500 ${getIconBg(n.type)} shadow-sm`}>
                        {getIcon(n.type)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                           <h3 className={`text-[15px] font-bold tracking-tight font-heading truncate pr-2 ${!n.isRead ? "text-text-primary" : "text-text-secondary/50"}`}>
                              {n.title}
                           </h3>
                           <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] text-text-secondary font-black opacity-30 uppercase font-heading whitespace-nowrap">
                                 {format(new Date(n.createdAt), 'HH:mm')}
                              </span>
                              {!n.isRead && (
                                 <div className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_var(--accent-blue)]" />
                              )}
                           </div>
                        </div>
                        <p className={`text-[12px] sm:text-[13px] leading-tight transition-all truncate ${!n.isRead ? "text-text-secondary font-medium" : "text-text-secondary/30 font-normal"}`}>
                           {n.message}
                        </p>
                     </div>
                     <div className="hidden sm:flex items-center opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 ml-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n._id);
                          }}
                          className="p-2.5 text-accent-red hover:bg-accent-red/5 rounded-lg transition-all"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
               ))}
               <div className="py-12 flex items-center justify-center">
                  <button className="text-[11px] font-black text-text-secondary/20 hover:text-accent-red uppercase tracking-[0.4em] transition-all font-heading hover:opacity-100 px-10 py-4 rounded-2xl hover:bg-accent-red/5">
                     Clear History
                  </button>
               </div>
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-40 px-10 text-center">
               <div className="w-24 h-24 bg-bg-card rounded-[2.5rem] flex items-center justify-center mb-8 border border-border-main opacity-20">
                  <Bell size={40} className="text-text-secondary rotate-12" />
               </div>
               <h3 className="text-2xl font-bold text-text-primary font-heading tracking-widest mb-3 uppercase opacity-40">No Notifications</h3>
               <p className="text-[13px] text-text-secondary font-medium max-w-[300px] leading-relaxed opacity-20">You're all caught up. New alerts will appear here.</p>
            </div>
         )}
      </div>

      {/* Detailed Modal */}
      <AnimatePresence>
        {selectedNotif && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotif(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-bg-card border border-border-main rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getIconBg(selectedNotif.type)} shadow-lg`}>
                    {getIcon(selectedNotif.type)}
                  </div>
                  <button 
                    onClick={() => setSelectedNotif(null)}
                    className="p-3 hover:bg-text-primary/5 rounded-xl text-text-secondary transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-accent-blue uppercase tracking-[0.2em] font-heading">{selectedNotif.type} log</span>
                    <span className="text-[10px] text-text-secondary font-bold opacity-30 uppercase">{format(new Date(selectedNotif.createdAt), 'dd MMM yyyy')}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-text-primary font-heading tracking-tight leading-tight">
                    {selectedNotif.title}
                  </h2>
                  <div className="h-px w-12 bg-accent-blue/30 my-4" />
                  <p className="text-[15px] sm:text-lg text-text-secondary leading-relaxed font-medium">
                    {selectedNotif.message}
                  </p>
                </div>

                <div className="mt-10">
                   <button 
                     onClick={() => {
                        deleteNotification(selectedNotif._id);
                        setSelectedNotif(null);
                     }}
                     className="w-full py-4 bg-accent-red text-white rounded-2xl text-[11px] font-black uppercase tracking-widest font-heading shadow-lg shadow-accent-red/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     <Trash2 size={16} /> Delete Forever
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
