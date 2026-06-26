import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wallet, List, BarChart2, Settings, HelpCircle, LogOut, X, Phone } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useWalletStore } from "../store/walletStore";
import { motion, AnimatePresence } from "framer-motion";
import PhoneLinkModal from "./ui/PhoneLinkModal";

const ICON_MAP = {
  "layout-dashboard": LayoutDashboard,
  wallet: Wallet,
  list: List,
  "bar-chart-2": BarChart2,
  settings: Settings,
};

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/dashboard",    icon: "layout-dashboard" },
  { label: "Wallet",       path: "/wallet",        icon: "wallet" },
  { label: "Transactions", path: "/transactions",  icon: "list" },
  { label: "Analytics",    path: "/analytics",     icon: "bar-chart-2" },
  { label: "Settings",     path: "/settings",      icon: "settings" },
];

function NavItem({ item, onClick }) {
  const Icon = ICON_MAP[item.icon];
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-[9px] px-[11px] py-2 rounded-lg mb-0.5 text-[13px] transition-all duration-150 border-l-[3px] font-heading ${isActive
          ? "font-bold text-text-primary bg-accent-green/15 border-accent-green"
          : "font-medium text-text-secondary bg-transparent border-transparent hover:bg-text-primary/5 hover:text-text-primary"
        }`
      }
    >
      {Icon && <Icon size={15} />}
      {item.label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user }   = useUser();
  const { signOut } = useClerk();
  const navigate   = useNavigate();
  const { isSidebarOpen, closeSidebar, user: dbUser } = useWalletStore();
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const handleLogout = () => signOut(() => navigate("/login"));
  const displayPhone = dbUser?.phone;

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[240px] min-w-[240px] bg-bg-main border-r border-border-main flex flex-col h-full transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen lg:flex
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* ── Identity Header ──────────────────────────────── */}
        <div className="px-6 py-8 pb-6 border-b border-white/5 bg-text-primary/[0.02]">
          {user && (
            <div className="space-y-5">
              {/* Header: Avatar | Name+ID */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={user.imageUrl}
                    alt={user.fullName}
                    className="w-[58px] h-[58px] rounded-2xl object-cover shadow-2xl shadow-black/40 border-2 border-white/5"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-green border-[3px] border-bg-main rounded-full" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-black text-text-primary leading-tight font-heading tracking-tight uppercase truncate">
                    {dbUser?.name || user.fullName}
                  </div>
                  <div className="text-[11px] font-bold text-accent-blue tracking-[0.1em] uppercase mt-0.5 truncate">
                    @{dbUser?.username || user.username || user.firstName?.toLowerCase() || 'palm.user'}
                  </div>
                </div>

                <button onClick={closeSidebar} className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Identity Token: Phone Number */}
              <div className="pt-1">
                {displayPhone ? (
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-text-primary/5 rounded-xl border border-white/5 shadow-inner">
                    <Phone size={11} className="text-accent-blue/60 shrink-0" />
                    <span className="text-[12px] font-black text-text-primary/80 tracking-widest font-mono">
                      {displayPhone}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setPhoneModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-blue/5 border border-accent-blue/20 rounded-xl text-[10px] font-black text-accent-blue hover:bg-accent-blue/10 transition-all uppercase tracking-widest"
                  >
                    <Phone size={10} />
                    Link Mobile Number
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Nav ──────────────────────────────────────────── */}
        <nav className="flex-1 px-6 mt-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} onClick={closeSidebar} />
          ))}

          <div className="h-px bg-border-main my-5 mx-3" />

          <button className="flex items-center gap-[9px] px-[11px] py-2.5 rounded-lg mb-1 text-[13px] text-text-secondary bg-transparent border-none cursor-pointer w-full text-left font-medium hover:bg-text-primary/5 hover:text-text-primary transition-colors font-heading">
            <HelpCircle size={15} />
            Customer Support
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-[9px] px-[11px] py-2.5 rounded-lg text-[13px] text-accent-red bg-transparent border-none cursor-pointer w-full text-left font-bold transition-colors hover:bg-accent-red/10 font-heading"
          >
            <LogOut size={15} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Phone Link Modal */}
      {phoneModalOpen && (
        <PhoneLinkModal
          isOpen={phoneModalOpen}
          onClose={() => setPhoneModalOpen(false)}
          onSuccess={() => setPhoneModalOpen(false)}
        />
      )}
    </>
  );
}