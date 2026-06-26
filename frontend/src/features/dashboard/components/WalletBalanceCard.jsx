import { Card } from "@/components/ui/card";

export default function WalletBalanceCard() {
  return (
    <Card className="p-6 rounded-2xl">
      <p className="text-sm text-muted-foreground">Available Balance</p>
      
      <h1 className="text-4xl font-bold mt-2">
        PKR 10,000
      </h1>

      <p className="text-xs text-muted-foreground mt-2">
        Easypaisa Wallet
      </p>
    </Card>
  );
}