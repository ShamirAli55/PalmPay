import { create } from "zustand";
import axios from 'axios';
import { toast } from 'sonner';
import { SPENDING_CHART, MY_CARDS } from "../constants/index";

const API_URL = `http://${window.location.hostname}:5000/api`;

export const useWalletStore = create((set, get) => ({
  balance: 12450.0,
  transactions: [],
  loading: false,

  fetchData: async (clerkId) => {
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

  sendMoney: async (clerkId, data, palmImageBlob) => {
    set({ loading: true });
    const formData = new FormData();
    formData.append('clerkId', clerkId);
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