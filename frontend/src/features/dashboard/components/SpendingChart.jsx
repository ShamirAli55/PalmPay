import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
  { name: "Food", value: 400 },
  { name: "Transport", value: 300 },
  { name: "Shopping", value: 300 },
];

const COLORS = ["#111", "#444", "#888"];

export default function SpendingChart() {
  return (
    <Card className="p-6">
      <h2 className="font-semibold mb-4">Spending Overview</h2>

      <PieChart width={300} height={200}>
        <Pie data={data} dataKey="value" outerRadius={80}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </Card>
  );
}