import { Card } from "@/components/ui/card";

export default function WalletStatusCard() {
  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-2">Security Status</h2>

      <p className="text-sm text-muted-foreground">Palm Authentication</p>
      <p className="text-green-600 font-medium">Registered</p>

      <p className="mt-3 text-sm text-muted-foreground">Backup PIN</p>
      <p className="text-green-600 font-medium">Enabled</p>
    </Card>
  );
}