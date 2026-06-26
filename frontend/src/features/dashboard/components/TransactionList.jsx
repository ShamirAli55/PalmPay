import WalletBalanceCard from "../features/dashboard/components/WalletBalanceCard";
import QuickActions from "../features/dashboard/components/QuickActions";
import TransactionList from "../features/dashboard/components/TransactionList";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      
      <div className="w-full max-w-md p-4 space-y-5">

        {/* 💰 BALANCE (HERO) */}
        <WalletBalanceCard />

        {/* ⚡ ACTIONS (PRIMARY UX) */}
        <QuickActions />

        {/* 📜 TRANSACTIONS */}
        <TransactionList />

      </div>

    </div>
  );
}