import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Bell, Sun, Moon, Menu, ShieldCheck, Zap } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { dark } from "@clerk/themes";
import { motion, AnimatePresence } from "framer-motion";

export default function Topbar() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { isDark, toggleTheme, toggleSidebar, securityEvents } = useWalletStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Use real security events as notifications
  const notifications = securityEvents?.slice(0, 5) || [];

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
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-red rounded-full border-2 border-bg-main" />
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
                    <span className="text-[9px] font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-md">NEW</span>
                  </div>

                  <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div key={i} className="flex gap-4 p-3 rounded-xl bg-text-primary/2 hover:bg-text-primary/5 border border-transparent hover:border-border-main/50 transition-all group">
                          <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${n.type === 'security' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-blue/10 text-accent-blue'}`}>
                            {n.type === 'security' ? <Zap size={14} /> : <ShieldCheck size={14} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold text-text-primary uppercase tracking-tight truncate leading-tight mb-0.5">{n.event}</div>
                            <div className="text-[9px] text-text-secondary font-medium opacity-60 uppercase tracking-widest">{n.time} • Local Device</div>
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