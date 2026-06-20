import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  List,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  Smartphone,
  X,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useWalletStore } from "../store/walletStore";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP = {
  "layout-dashboard": LayoutDashboard,
  wallet: Wallet,
  list: List,
  "bar-chart-2": BarChart2,
  settings: Settings,
};

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: "layout-dashboard" },
  { label: "Wallet", path: "/wallet", icon: "wallet" },
  { label: "Transactions", path: "/transactions", icon: "list" },
  { label: "Analytics", path: "/analytics", icon: "bar-chart-2" },
  { label: "Settings", path: "/settings", icon: "settings" },
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
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { isSidebarOpen, closeSidebar } = useWalletStore();

  const handleLogout = () => signOut(() => navigate("/login"));

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
        {/* Logo Section */}
        <div className="p-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-xl border border-accent-blue/30 bg-accent-blue/10 flex items-center justify-center shrink-0 text-accent-blue">
              <Smartphone size={20} />
            </div>
            <div className="font-extrabold text-[20px] text-text-primary leading-none font-heading tracking-tight whitespace-nowrap">
              Digital Palm
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-text-secondary hover:text-text-primary">
            <X size={22} />
          </button>
        </div>

        {/* Nav list starts directly */}
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
            Exit Platform
          </button>
        </nav>

        {/* User Footer Profile */}
        {user && (
          <div className="p-6 border-t border-border-main flex items-center gap-3.5 bg-text-primary/2">
            <div className="relative">
              <img
                src={user.imageUrl}
                alt={user.fullName}
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border-main"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent-green border-2 border-bg-main rounded-full" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[14px] font-black text-text-primary truncate font-heading tracking-tight leading-none">
                {user.firstName || user.username}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}