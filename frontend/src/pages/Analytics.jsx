import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useWalletStore } from "../store/walletStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

// ── Analytics Component ──────────────────────────────────────────────────────
export default function Analytics() {
  const { user } = useUser();
  const { transactions, fetchData, getAnalyticsData } = useWalletStore();

  useEffect(() => {
    if (user) fetchData(user.id);
  }, [user, fetchData]);

  const { areaData, pieData } = getAnalyticsData();
  const totalIncome = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
  const totalSpend = Math.abs(transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0));
  const netSavings = totalIncome - totalSpend;

  const stats = [
    { label: "Total Revenue", value: `Rs. ${totalIncome.toLocaleString()}`, growth: "+12.5%", positive: true },
    { label: "Total Expenses", value: `Rs. ${totalSpend.toLocaleString()}`, growth: "-3.2%", positive: false },
    { label: "Net Savings", value: `Rs. ${netSavings.toLocaleString()}`, growth: "+18.4%", positive: true },
  ];

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-1.5 min-h-screen">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-text-primary m-0 tracking-tight font-heading">Financial Analytics</h1>
        <p className="text-sm text-text-secondary mt-2">Track your spending and income trends over time.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-bg-card border border-border-main rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest font-heading">{stat.label}</span>
              <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${stat.positive ? "text-accent-green bg-accent-green/12" : "text-accent-red bg-accent-red/12"}`}>
                {stat.positive ? "↑" : "↓"} {stat.growth}
              </div>
            </div>
            <div className="text-2xl font-bold text-text-primary tracking-tight font-heading">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Activity Chart */}
      <div className="bg-bg-card border border-border-main rounded-xl p-6 lg:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-base font-bold text-text-primary m-0 font-heading">Activity Overview</h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
              <span className="text-[11px] text-text-secondary font-bold uppercase tracking-widest font-heading">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-[11px] text-text-secondary font-bold uppercase tracking-widest font-heading">Spending</span>
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 600 }} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "var(--text-secondary)", fontSize: 11, fontWeight: 600 }} 
              />
              <Tooltip 
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-main)", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} 
                itemStyle={{ fontSize: "12px", fontWeight: 700 }}
              />
              <Area type="monotone" dataKey="income" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
              <Area type="monotone" dataKey="spending" stroke="#6366f1" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending Breakdown */}
        <div className="bg-bg-card border border-border-main rounded-xl p-6 lg:p-8">
          <h3 className="text-[15px] font-bold text-text-primary mb-6 font-heading">Spending Allocation</h3>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="h-[220px] w-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full grid grid-cols-1 gap-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-text-primary/5 transition-all">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-[12px] text-text-secondary font-bold font-heading">{item.name}</span>
                  <span className="text-[12px] text-text-primary font-bold ml-auto font-heading">Rs. {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast / Net Trend */}
        <div className="bg-bg-card border border-border-main rounded-xl p-8 flex flex-col justify-center items-center text-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="w-16 h-16 bg-accent-blue/10 rounded-[1.5rem] flex items-center justify-center mb-2 z-10">
            <TrendingUp size={28} className="text-accent-blue" />
          </div>
          <h3 className="text-lg font-bold text-text-primary m-0 font-heading z-10">Savings Projection</h3>
          <p className="text-[13px] text-text-secondary leading-relaxed max-w-[280px] font-medium z-10">Based on your activity, we expect a <span className="text-accent-green font-bold">12% boost</span> in your capital reserves by next billing cycle.</p>
          <button className="mt-4 px-8 py-3 bg-text-primary/5 border border-border-main rounded-xl text-text-primary text-[11px] font-extrabold hover:bg-text-primary/10 transition-all uppercase tracking-widest font-heading z-10">
            Export Forecast
          </button>
        </div>
      </div>
    </div>
  );
}


