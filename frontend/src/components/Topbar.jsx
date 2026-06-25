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
  // Sync notifications on mount
  useEffect(() => {
    if (user?.id) {
        fetchData(user.id, user.fullName || user.username);
    }
  }, [user, fetchData]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 rounded-xl border bg-bg-card border-border-main text-text-secondary hover:text-text-primary transition-all active:scale-95 flex items-center justify-center relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-bg-main shadow-lg shadow-accent-red/20">
                 {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
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