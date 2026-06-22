import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useWalletStore } from "../store/walletStore";
import {
  Download,
  FileText,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Briefcase,
  CreditCard,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const CATEGORIES = ["All Categories", "Transfer", "Shopping", "Income", "Software", "Technology"];
const PAGE_SIZE = 5;

const STATUS_MAP = {
  Processed: { text: "text-accent-green", bg: "bg-accent-green/10", dot: "bg-accent-green" },
  Pending:   { text: "text-amber-500", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  Failed:    { text: "text-accent-red", bg: "bg-accent-red/10", dot: "bg-accent-red" },
};

const CAT_ICONS = {
  Transfer: CreditCard,
  Shopping: ShoppingBag,
  Income: Briefcase,
  Software: AlertTriangle,
  Technology: ShoppingBag,
};

function Avatar({ name, color }) {
  const initials = (name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div 
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 border border-border-main"
      style={{ backgroundColor: color || "var(--accent-blue)" }}
    >
      {initials}
    </div>
  );
}

const AVATAR_COLORS = ["var(--accent-blue)", "var(--accent-green)", "#f97316", "#8b5cf6", "#ec4899"];

export default function Transactions() {
  const { user } = useUser();
  const { transactions, fetchData } = useWalletStore();
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user) fetchData(user.id);
  }, [user, fetchData]);

  const filtered = category === "All Categories"
    ? transactions
    : transactions.filter((t) => (t.category || "Transfer") === category);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatTxnDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const formatTxnTime = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const handleExport = (type) => {
    if (type !== "PDF") return;
    
    const id = toast.loading("Generating your statement…");

    try {
        const doc = new jsPDF();
        const tableColumn = ["Recipient", "Category", "Date", "Status", "Amount"];
        const tableRows = [];

        filtered.forEach(txn => {
        const txnData = [
            txn.recipient || "Incoming",
            txn.category || "Transfer",
            formatTxnDate(txn.date),
            txn.status,
            `Rs. ${Math.abs(txn.amount).toLocaleString()}`
        ];
        tableRows.push(txnData);
        });

        // Styling
        doc.setFontSize(22);
        doc.setTextColor(29, 78, 216); // Brand Blue
        doc.text("PalmPay Financial Statement", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated for: ${user?.fullName || "Valued User"}`, 14, 30);
        doc.text(`Total Transactions: ${filtered.length}`, 14, 35);
        doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 14, 40);

        autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255] },
        margin: { top: 50 },
        });

        doc.save(`PalmPay_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("Statement downloaded successfully!", { id });
    } catch (error) {
        console.error("PDF Export Error:", error);
        toast.error("Failed to generate PDF. Please try again.", { id });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-1.5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary m-0 tracking-tight font-heading">Transaction History</h1>
          <p className="text-sm text-text-secondary mt-2">View and manage your recent transactions.</p>
        </div>
        <div className="flex w-full sm:w-auto shrink-0">
          <button
            onClick={() => handleExport("PDF")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-accent-blue rounded-xl text-white text-[11px] font-bold hover:brightness-110 transition-all uppercase tracking-widest font-heading shadow-lg shadow-accent-blue/10"
          >
            <FileText size={14} /> Generate Report
          </button>
        </div>
      </div>

      {/* Filters & Contacts */}
      <div className="bg-bg-card border border-border-main rounded-xl p-4 flex flex-col lg:flex-row items-center gap-6 shadow-sm">
        {/* Category filter */}
        <div className="relative w-full lg:w-48">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="w-full appearance-none bg-text-primary/5 border border-border-main rounded-xl py-3 pl-4 pr-10 text-[12px] text-text-primary font-bold outline-none focus:border-accent-blue/50 cursor-pointer font-heading"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-bg-card">{c}</option>)}
          </select>
          <ChevronDown
            className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-text-secondary"
          />
        </div>

        {/* Dynamic Scrollable Recent Contacts */}
        {transactions.length > 0 && (
          <div className="flex items-center gap-4 w-full lg:w-auto lg:ml-auto">
             <span className="text-[11px] text-text-secondary font-bold font-heading uppercase tracking-widest shrink-0">Recent Contacts:</span>
            <div className="flex -space-x-2 overflow-x-auto no-scrollbar py-2 px-1 flex-1 lg:max-w-[240px]">
              {[...new Set(transactions.map(t => t.recipient).filter(Boolean))].slice(0, 10).map((name, i) => {
                const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div 
                    key={name}
                    title={name}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-bg-card shadow-sm cursor-pointer transition-all hover:scale-110 hover:z-10 shrink-0" 
                    style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table container */}
      <div className="bg-bg-card border border-border-main rounded-xl overflow-hidden shadow-sm overflow-x-auto no-scrollbar">
        <div className="min-w-[800px]">
            <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr] px-6 py-4 border-b border-border-main bg-text-primary/2">
            {["RECIPIENT", "CATEGORY", "DATE & TIME", "STATUS", "AMOUNT"].map((col) => (
                <div key={col} className="text-[11px] font-bold text-text-secondary tracking-[0.2em] flex items-center gap-2 font-heading">
                {col}
                </div>
            ))}
            </div>

            <div className="divide-y divide-border-main">
            {paginated.map((txn, idx) => {
                const CatIcon = CAT_ICONS[txn.category] || CreditCard;
                const isPositive = txn.amount > 0;
                const sc = STATUS_MAP[txn.status] || STATUS_MAP.Processed;

                return (
                <div
                    key={txn.id}
                    className="grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr] px-6 py-5 items-center gap-4 hover:bg-text-primary/2 transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-4 min-w-0">
                    <Avatar name={txn.recipient || "User"} color={AVATAR_COLORS[idx % AVATAR_COLORS.length]} />
                    <div className="min-w-0">
                        <div className="text-[14px] font-bold text-text-primary truncate font-heading group-hover:text-accent-blue transition-colors uppercase tracking-tight">{txn.recipient || "Incoming"}</div>
                        <div className="text-[11px] text-text-secondary truncate mt-0.5 font-medium">{txn.description || "Transfer"}</div>
                    </div>
                    </div>

                    <div className="flex">
                    <div className="inline-flex items-center gap-2 bg-text-primary/5 border border-border-main rounded-lg px-3 py-1 text-[11px] text-text-secondary font-bold font-heading uppercase">
                        <CatIcon size={12} /> {txn.category || "Transfer"}
                    </div>
                    </div>

                    <div>
                    <div className="text-[13px] font-bold text-text-primary font-heading tracking-tight">{formatTxnDate(txn.date)}</div>
                    <div className="text-[11px] text-text-secondary font-medium tracking-widest">{formatTxnTime(txn.date)}</div>
                    </div>

                    <div>
                    <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-bold font-heading uppercase tracking-wide ${sc.text} ${sc.bg}`}>
                        <div className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse`} />
                        {txn.status}
                    </div>
                    </div>

                    <div className={`text-[15px] font-bold text-right font-heading tracking-tighter ${isPositive ? "text-accent-green" : "text-accent-red"}`}>
                    {isPositive ? "+" : ""}
                    Rs. {Math.abs(txn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 py-4 px-2">
        <span className="text-[12px] text-text-secondary font-bold font-heading">
          TRANSACTIONS: {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} – {Math.min(page * PAGE_SIZE, filtered.length)} OF {filtered.length} RESULTS
        </span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-10 h-10 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-text-secondary hover:bg-text-primary/5 disabled:opacity-20 transition-all shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex gap-2 mx-4">
            {/* First Page */}
            {totalPages >= 1 && (
              <button
                onClick={() => setPage(1)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all font-heading ${page === 1 ? "bg-accent-blue text-white shadow-lg" : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"}`}
              >
                1
              </button>
            )}

            {/* Start Ellipsis */}
            {page > 3 && totalPages > 5 && (
              <span className="flex items-end pb-3 text-text-secondary/30 font-bold px-1">...</span>
            )}

            {/* Middle Pages */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p !== 1 && p !== totalPages && Math.abs(p - page) <= 1)
              .map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all font-heading ${page === p ? "bg-accent-blue text-white shadow-lg" : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"}`}
                >
                  {p}
                </button>
              ))
            }

            {/* End Ellipsis */}
            {page < totalPages - 2 && totalPages > 5 && (
              <span className="flex items-end pb-3 text-text-secondary/30 font-bold px-1">...</span>
            )}

            {/* Last Page */}
            {totalPages > 1 && (
              <button
                onClick={() => setPage(totalPages)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all font-heading ${page === totalPages ? "bg-accent-blue text-white shadow-lg" : "bg-bg-card border border-border-main text-text-secondary hover:text-text-primary"}`}
              >
                {totalPages}
              </button>
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-10 h-10 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-text-secondary hover:bg-text-primary/5 disabled:opacity-20 transition-all shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}


