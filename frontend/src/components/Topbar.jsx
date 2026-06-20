import { useUser, UserButton } from "@clerk/clerk-react";
import { Bell, Sun, Moon, Menu } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { dark } from "@clerk/themes";

export default function Topbar() {
  const { user } = useUser();
  const { isDark, toggleTheme, toggleSidebar } = useWalletStore();

  return (
    <header className="h-[80px] flex items-center justify-between px-6 sm:px-10 bg-bg-main border-b border-border-main relative">
      {/* Mobile Menu Button */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden p-2.5 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:text-text-primary transition-all active:scale-95"
      >
        <Menu size={20} />
      </button>

      {/* Center heading removed */}

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        <button className="w-10 h-10 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
          <Bell size={18} />
        </button>
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-text-secondary hover:text-text-primary transition-all"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-border-main">
          <div className="hidden sm:block text-right">
            <div className="text-[13px] font-bold text-text-primary leading-none">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[10px] text-text-secondary font-bold mt-0.5 uppercase tracking-widest opacity-60">
              Verified Account
            </div>
          </div>
          <UserButton
            appearance={{
              baseTheme: isDark ? dark : undefined,
              elements: {
                userButtonAvatarBox: "w-9 h-9 rounded-[8px]",
                userButtonTrigger: "focus:shadow-none rounded-[10px]",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}