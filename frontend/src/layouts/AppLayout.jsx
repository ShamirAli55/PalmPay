import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useWalletStore } from "../store/walletStore";

export default function AppLayout() {
  const { isDark } = useWalletStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  return (
    <div className="flex h-screen bg-bg-main text-text-primary overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar relative">
        <Topbar />

        <main className="p-4 md:p-6 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
