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
  }, []);
  return (
    <div className="flex h-screen bg-bg-main text-text-primary overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
