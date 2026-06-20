import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  return (
    <Card className="p-4 flex gap-2 justify-between">
      
      <Button className="flex-1">Pay</Button>
      <Button variant="secondary" className="flex-1">Send</Button>
      <Button variant="outline" className="flex-1">Add</Button>

    </Card>
  );
}