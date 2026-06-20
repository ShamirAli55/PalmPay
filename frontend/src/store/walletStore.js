import { create } from "zustand";
import axios from 'axios';
import { toast } from 'sonner';
import { SPENDING_CHART, MY_CARDS } from "../constants/index";

const API_URL = `http://${window.location.hostname}:5000/api`;

export const useWalletStore = create((set, get) => ({
  balance: 12450.0,
  transactions: [],
  users: [],
  loading: false,

  fetchUsers: async () => {
    try {
        const res = await axios.get(`${API_URL}/users`);
        set({ users: res.data });
    } catch (err) {
        console.error('Fetch users error:', err);
    }
  },

  fetchData: async (clerkId) => {
    if (!clerkId) return;
    set({ loading: true });
    try {
        const [userRes, transRes] = await Promise.all([
            axios.get(`${API_URL}/user/${clerkId}`),
            axios.get(`${API_URL}/transactions/${clerkId}`)
        ]);
        set({ 
            balance: userRes.data.balance, 
            transactions: transRes.data,
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
        sub: "Real-time sync active",
        icon: "trending-up",
        showChart: true
      },
      {
        id: "monthly-spend",
        label: "MONTHLY SPEND",
        value: `Rs. ${spend.toLocaleString()}`,
        sub: `${Math.min(99, Math.round(spend/1000 * 100))}% of threshold`,
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
        label: "BIO-SECURITY",
        value: "READY",
        sub: "Palm-ID™ Identity Active",
        icon: "target",
        showProgress: true,
        progress: 100
      }
    ];
  },

  getChartData: () => {
    const { transactions } = get();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = new Date().getDay();
    
    // Sort transactions by day for the last 7 days
    const dailyData = days.map((day, i) => {
        const date = new Date();
        date.setDate(date.getDate() - ((currentDay - i + 7) % 7));
        const dayStart = new Date(date.setHours(0,0,0,0));
        const dayEnd = new Date(date.setHours(23,59,59,999));
        
        const daySpend = Math.abs(transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= dayStart && tDate <= dayEnd && t.type === 'debit';
        }).reduce((acc, t) => acc + t.amount, 0));

        return { day, amount: daySpend || Math.floor(Math.random() * 100) }; // Fallback to random if zero just for better visuals during testing
    });

    return {
        week: dailyData,
        month: SPENDING_CHART.month, // Keep static for now or refine later
        year: SPENDING_CHART.year
    };
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
        const res = await axios.post(`${API_URL}/transactions/create`, formData);
        set((state) => ({
            balance: res.data.balance,
            transactions: [res.data.transaction, ...state.transactions],
            loading: false
        }));
        toast.success('Transaction Successful!', { id: 'txn-success' });
        return true;
    } catch (err) {
        set({ loading: false });
        const msg = err.response?.data?.message || 'Transaction Security Failure';
        toast.error(msg, { id: 'txn-error' });
        return false;
    }
  },
  addFunds: async (clerkId, data, palmImageBlob) => {
    set({ loading: true });
    const formData = new FormData();
    formData.append('clerkId', clerkId);
    formData.append('amount', data.amount);
    formData.append('source', data.source || 'Bank Link');
    formData.append('palm_image', palmImageBlob, 'auth.jpg');

    try {
        const res = await axios.post(`${API_URL}/wallet/add-funds`, formData);
        set((state) => ({
            balance: res.data.balance,
            transactions: [res.data.transaction, ...state.transactions],
            loading: false
        }));
        toast.success('Funds Synthesized!', { id: 'add-success' });
        return true;
    } catch (err) {
        set({ loading: false });
        const msg = err.response?.data?.message || 'Synthesis Error';
        toast.error(msg, { id: 'add-error' });
        return false;
    }
  },

  cards: MY_CARDS,
  activeCardId: MY_CARDS[0].id,
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