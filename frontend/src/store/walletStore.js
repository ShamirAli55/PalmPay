import { create } from "zustand";
import api from '../api';
import { toast } from 'sonner';
import { SPENDING_CHART, MY_CARDS } from "../constants/index";

export const useWalletStore = create((set, get) => ({
  balance: 0,
  transactions: [],
  users: [],
  linkedBanks: [],
  cards: [],
  activeCardId: null,
  trustedDevices: [],
  securityEvents: [],
  loading: false,

  fetchUsers: async () => {
    try {
        const res = await api.get(`/users`);
        set({ users: res.data });
    } catch (err) {
        console.error('Fetch users error:', err);
    }
  },

  fetchData: async (clerkId) => {
    if (!clerkId || get().loading) return;
    set({ loading: true });
    try {
        const [userRes, transRes] = await Promise.all([
            api.get(`/users/${clerkId}`),
            api.get(`/transactions/${clerkId}`)
        ]);
        set({ 
            balance: userRes.data.balance || 0, 
            transactions: transRes.data || [],
            linkedBanks: userRes.data.linkedBanks || [],
            cards: (userRes.data.cards || []).map(c => ({
              ...c,
              network: c.brand || 'VISA' // Map brand to network for UI
            })),
            activeCardId: userRes.data.cards?.[0]?.id || null,
            trustedDevices: userRes.data.trustedDevices || [],
            securityEvents: userRes.data.securityEvents || [],
            loading: false 
        });
    } catch (err) {
        set({ loading: false });
    }
  },

  // Dynamic Data Getters
  getComputedStats: () => {
    const { balance, transactions } = get();
    const income = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
    const spend = Math.abs(transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0));
    const recentTxnsCount = transactions.filter(t => new Date(t.date) > new Date(Date.now() - 86400000)).length;

    return [
      {
        id: "total-balance",
        label: "TOTAL BALANCE",
        value: `Rs. ${balance.toLocaleString()}`,
        change: "+5.2%", // Mock trend for now
        changePositive: true,
        sub: "Updated just now",
        icon: "trending-up",
        showChart: true
      },
      {
        id: "monthly-spend",
        label: "MONTHLY SPEND",
        value: `Rs. ${spend.toLocaleString()}`,
        sub: `${Math.min(99, Math.round(spend/1000 * 100))}% of budget`,
        icon: "credit-card",
        showProgress: true,
        progress: Math.min(100, Math.round(spend/1000 * 100))
      },
      {
        id: "received",
        label: "RECEIVED",
        value: `Rs. ${income.toLocaleString()}`,
        sub: `${recentTxnsCount} new deposits`,
        icon: "arrow-down",
        changePositive: true
      },
      {
        id: "active-auth",
        label: "SECURITY",
        value: "READY",
        sub: "Palm Recognition Active",
        icon: "target",
        showProgress: true,
        progress: 100
      }
    ];
  },

  getFinancialSummary: () => {
    const { transactions } = get();
    const income = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
    const spend = Math.abs(transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0));
    return { income, spend };
  },

  getChartData: () => {
    const { transactions } = get();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = new Date().getDay();
    
    // 7-day Weekly Trend (Locked to actual data)
    const week = days.map((day, i) => {
        const date = new Date();
        date.setDate(date.getDate() - ((currentDay - i + 7) % 7));
        const dayStart = new Date(date.setHours(0,0,0,0));
        const dayEnd = new Date(date.setHours(23,59,59,999));
        
        const daySpend = Math.abs(transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= dayStart && tDate <= dayEnd && t.type === 'debit';
        }).reduce((acc, t) => acc + t.amount, 0));

        return { day, amount: daySpend }; 
    });

    // Dynamic Monthly Trend (Aggregated by Weeks)
    const monthLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const month = monthLabels.map((name, i) => {
        const weekIncome = transactions.filter(t => {
            const tDate = new Date(t.date);
            const weekNum = Math.floor(tDate.getDate() / 7);
            return weekNum === i && t.type === 'credit';
        }).reduce((acc, t) => acc + t.amount, 0);

        const weekSpend = Math.abs(transactions.filter(t => {
            const tDate = new Date(t.date);
            const weekNum = Math.floor(tDate.getDate() / 7);
            return weekNum === i && t.type === 'debit';
        }).reduce((acc, t) => acc + t.amount, 0));

        return { name, income: weekIncome, spending: weekSpend };
    });

    return { week, month, year: [] }; // Year can be added similarly by month aggregation 
  },

  getAnalyticsData: () => {
    const { transactions } = get();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = new Date().getDay();
    
    // Last 7 days overview
    const areaData = days.map((name, i) => {
        const date = new Date();
        date.setDate(date.getDate() - ((currentDay - i + 7) % 7));
        const dayStart = new Date(date.setHours(0,0,0,0));
        const dayEnd = new Date(date.setHours(23,59,59,999));
        
        const income = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= dayStart && tDate <= dayEnd && t.type === 'credit';
        }).reduce((acc, t) => acc + t.amount, 0);

        const spending = Math.abs(transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= dayStart && tDate <= dayEnd && t.type === 'debit';
        }).reduce((acc, t) => acc + t.amount, 0));

        return { name, income, spending };
    });

    // Category breakdown
    const categories = [...new Set(transactions.map(t => t.category || "Other"))];
    const categoryColors = {
        Shopping: "var(--accent-blue)",
        Rent: "#6366f1",
        Dining: "#8b5cf6",
        Utils: "#ec4899",
        Deposit: "#22c55e",
        Transfer: "#f97316",
        Other: "#94a3b8"
    };

    const pieData = categories.map(cat => {
        const value = Math.abs(transactions.filter(t => (t.category || "Other") === cat).reduce((acc, t) => acc + t.amount, 0));
        return { name: cat, value, color: categoryColors[cat] || categoryColors.Other };
    }).filter(c => c.value > 0);

    return { areaData, pieData };
  },

  sendMoney: async (clerkId, data, palmImageBlob) => {
    set({ loading: true });
    const formData = new FormData();
    formData.append('clerkId', clerkId);
    formData.append('recipientId', data.recipientId);
    formData.append('recipient', data.recipient);
    formData.append('amount', data.amount);
    formData.append('category', data.category || 'Transfer');
    formData.append('description', data.description || '');
    formData.append('palm_image', palmImageBlob, 'auth.jpg');

    try {
        const res = await api.post(`/transactions/create`, formData);
        set((state) => ({
            balance: res.data.balance,
            transactions: [res.data.transaction, ...state.transactions],
            loading: false
        }));
        toast.success('Transfer Successful!', { id: 'txn-success' });
        return true;
    } catch (err) {
        set({ loading: false });
        const msg = err.response?.data?.message || 'Transaction failed';
        toast.error(msg, { id: 'txn-error' });
        return false;
    }
  },
  addFunds: async (clerkId, data, palmImageBlob) => {
    set({ loading: true });
    const formData = new FormData();
    formData.append('clerkId', clerkId);
    formData.append('bankId', data.bankId);
    formData.append('amount', data.amount);
    formData.append('source', data.source || 'Bank Link');
    formData.append('palm_image', palmImageBlob, 'auth.jpg');

    try {
        const res = await api.post(`/transactions/add-funds`, formData);
        set((state) => ({
            balance: res.data.balance,
            transactions: [res.data.transaction, ...state.transactions],
            linkedBanks: res.data.linkedBanks || state.linkedBanks,
            loading: false
        }));
        toast.success('Funds added successfully!', { id: 'add-success' });
        return true;
    } catch (err) {
        set({ loading: false });
        const msg = err.response?.data?.message || 'Deposit Error';
        toast.error(msg, { id: 'add-error' });
        return false;
    }
  },

  setActiveCard: (id) => set({ activeCardId: id }),
  getActiveCard: () => {
    const state = get();
    return state.cards.find((c) => c.id === state.activeCardId);
  },
  toggleCardFreeze: (id) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === id ? { ...c, frozen: !c.frozen } : c
      ),
    })),

  chartPeriod: "week",
  chartData: SPENDING_CHART,
  setChartPeriod: (period) => set({ chartPeriod: period }),
  isDark: true,
  toggleTheme: () => set((state) => {
    const newIsDark = !state.isDark;
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDark: newIsDark };
  }),
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
}));