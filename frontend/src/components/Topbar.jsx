import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Bell, Sun, Moon, Menu, ShieldCheck, Zap, CreditCard, Info } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { dark } from "@clerk/themes";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Topbar() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { isDark, toggleTheme, toggleSidebar, notifications, fetchData } = useWalletStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Sync notifications on mount
  useEffect(() => {
    if (user?.id) {
        fetchData(user.id, user.fullName || user.username);
    }
  }, [user, fetchData]);

  const recentNotifs = notifications.slice(0, 3);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type) => {
    switch (type) {
      case "transaction": return <CreditCard size={14} />;
      case "security": return <ShieldCheck size={14} />;
      case "system":
      case "update": return <Zap size={14} />;
      default: return <Bell size={14} />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "transaction": return "bg-accent-blue/10 text-accent-blue";
      case "security": return "bg-accent-red/10 text-accent-red";
      case "system":
      case "update": return "bg-accent-green/10 text-accent-green";
      default: return "bg-text-secondary/10 text-text-secondary";
    }
  };

  return (
    <header className="h-[80px] flex items-center justify-between px-6 sm:px-10 bg-bg-main border-b border-border-main relative z-50">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2.5 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:text-text-primary transition-all active:scale-95"
      >
        <Menu size={20} />
      </button>

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${isNotifOpen ? "bg-accent-blue/10 border-accent-blue text-accent-blue" : "bg-bg-card border-border-main text-text-secondary hover:text-text-primary"}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-bg-main shadow-lg shadow-accent-red/20">
                 {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-bg-card border border-border-main rounded-2xl shadow-2xl p-5 z-50 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-[11px] font-bold text-text-primary uppercase tracking-[0.2em] font-heading">Notifications</span>
                    {unreadCount > 0 && <span className="text-[9px] font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-md">NEW</span>}
                  </div>

                  <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto no-scrollbar">
                    {recentNotifs.length > 0 ? (
                      recentNotifs.map((n) => (
                        <div key={n._id} className={`flex gap-4 p-3 rounded-xl transition-all group border ${!n.isRead ? 'bg-accent-blue/[0.03] border-accent-blue/10 hover:border-accent-blue/20' : 'bg-text-primary/2 border-transparent hover:border-border-main/50'}`}>
                          <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${getIconBg(n.type)} shadow-sm`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="min-w-0 pr-1">
                            <div className={`text-[12px] font-bold uppercase tracking-tight truncate leading-tight mb-0.5 ${!n.isRead ? 'text-text-primary' : 'text-text-secondary/70'}`}>
                                {n.title}
                            </div>
                            <div className="text-[10px] text-text-secondary font-medium opacity-60 leading-tight line-clamp-2 mb-1">{n.message}</div>
                            <div className="text-[8px] text-text-secondary font-bold uppercase tracking-widest opacity-40">
                                {format(new Date(n.createdAt), 'HH:mm')} • {format(new Date(n.createdAt), 'dd MMM')}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-[11px] text-text-secondary font-bold uppercase tracking-widest opacity-40 italic">System Idle. No new alerts.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate("/notifications");
                    }}
                    className="w-full mt-4 py-3 bg-text-primary/5 hover:bg-text-primary/10 rounded-xl text-[10px] font-bold text-text-secondary tracking-widest uppercase transition-all"
                  >
                    View All Notifications
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-text-secondary hover:text-text-primary transition-all active:scale-95"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-border-main">
          <div className="hidden sm:block text-right">
            <div className="text-[13px] font-bold text-text-primary leading-none uppercase tracking-tight">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[10px] text-text-secondary font-bold mt-1 uppercase tracking-widest opacity-60">
              Verified Account
            </div>
          </div>
          <div className="relative">
            <UserButton
              appearance={{
                baseTheme: isDark ? dark : undefined,
                elements: {
                  userButtonAvatarBox: "w-9 h-9 rounded-[10px]",
                  userButtonTrigger: "focus:shadow-none rounded-[12px]",
                },
              }}
            />
            {/* Real-time Status Dot migrated from Sidebar */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-green border-2 border-bg-main rounded-full shadow-[0_0_8px_var(--accent-green)]" />
          </div>
        </div>
      </div>
    </header>
  );
}