import { useState, useEffect, useRef } from "react";
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
  
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Sync notifications on mount
  useEffect(() => {
    if (user?.id) {
        fetchData(user.id, user.fullName || user.username);
    }
  }, [user, fetchData]);

  // Scroll logic
  useEffect(() => {
    const handleScroll = () => {
      // Find the scrollable container (parent in AppLayout)
      const container = document.querySelector('.flex-1.flex-col.overflow-y-auto');
      if (!container) return;

      const currentScrollY = container.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    const container = document.querySelector('.flex-1.flex-col.overflow-y-auto');
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.header 
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-[70px] sm:h-[80px] flex items-center justify-between px-4 sm:px-10 bg-bg-main/80 backdrop-blur-md border-b border-border-main sticky top-0 z-[60] shrink-0"
    >
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:text-text-primary transition-all active:scale-95 shadow-sm"
      >
        <Menu size={18} />
      </button>

      {/* Right Side */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <div className="relative">
          <button
            onClick={() => navigate("/notifications")}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border bg-bg-card border-border-main text-text-secondary hover:text-text-primary transition-all active:scale-95 flex items-center justify-center relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-accent-red text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-bg-main shadow-lg shadow-accent-red/20">
                 {unreadCount > 9 ? '9' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-text-secondary hover:text-text-primary transition-all active:scale-95"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border-main">
          <div className="hidden md:block text-right">
            <div className="text-[12px] font-bold text-text-primary leading-none uppercase tracking-tight">
              {user?.firstName}
            </div>
          </div>
          <div className="relative">
            <UserButton
              appearance={{
                baseTheme: isDark ? dark : undefined,
                elements: {
                  userButtonAvatarBox: "w-8 h-8 sm:w-9 sm:h-9 rounded-[10px]",
                  userButtonTrigger: "focus:shadow-none rounded-[12px]",
                },
              }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-green border-2 border-bg-main rounded-full shadow-[0_0_8px_var(--accent-green)]" />
          </div>
        </div>
      </div>
    </motion.header>
  );
}