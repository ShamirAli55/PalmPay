import { create } from "zustand";
import api from '../api';
import { toast } from 'react-hot-toast';

export const useWalletStore = create((set, get) => ({
  balance: 0,
  transactions: [],
  linkedBanks: [],
  cards: [],
  activeCardId: null,
  notifications: [],
  securityEvents: [],
  trustedDevices: [],
  loading: false,
  isSecure: true,
  palmEnrolled: false,
  users: [],
  user: null,

  setSecure: (status) => set({ isSecure: status }),

  // Users
  fetchUsers: async () => {
    try {
      const res = await api.get('/users');
      set({ users: res.data || [] });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  },

  // Sync
  fetchData: async (clerkId, name) => {
    if (!clerkId || get().loading) return;
    set({ loading: true });
    try {
      const [userRes, transRes, notifsRes] = await Promise.all([
        api.get(`/users/${clerkId}?name=${encodeURIComponent(name || '')}`),
        api.get(`/transactions/${clerkId}`),
        api.get(`/notifications/${clerkId}`)
      ]);

      set({
        user: userRes.data,
        balance: userRes.data.balance || 0,
        linkedBanks: userRes.data.linkedBanks || [],
        cards: (userRes.data.cards || []).map(c => ({ ...c, network: c.brand || 'VISA' })),
        activeCardId: userRes.data.cards?.[0]?.id || null,
        palmEnrolled: userRes.data.palmEnrolled || false,
        transactions: transRes.data || [],
        notifications: notifsRes.data || [],
        loading: false
      });
    } catch (err) {
      set({ loading: false });
    }
  },

  // Txns
  sendMoney: async (clerkId, data, palmImageBlob) => {
    set({ loading: true });
    const formData = new FormData();
    formData.append('clerkId', clerkId);
    if (data.recipientId) formData.append('recipientId', data.recipientId);
    if (data.bankId) formData.append('bankId', data.bankId);
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
      toast.success('Transfer Successful', { id: 'txn-success' });
      return true;
    } catch (err) {
      set({ loading: false });
      toast.error(err.response?.data?.message || 'Transaction failed', { id: 'txn-error' });
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
        loading: false
      }));
      toast.success('Funds added', { id: 'deposit-success' });
      return true;
    } catch (err) {
      set({ loading: false });
      toast.error(err.response?.data?.message || 'Deposit failed', { id: 'deposit-error' });
      return false;
    }
  },

  // Notifications
  markAllAsRead: async (clerkId) => {
    try {
      await api.patch(`/notifications/mark-all-read/${clerkId}`);
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true }))
      }));
    } catch (err) {
      console.error('Notification Error:', err);
    }
  },

  markNotificationAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n)
      }));
    } catch (err) {
      console.error('Single Notification Error:', err);
    }
  },

  setActiveCard: (id) => set({ activeCardId: id }),

  // Analytics
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
    const week = days.map((day, i) => {
      const date = new Date();
      date.setDate(date.getDate() - ((currentDay - i + 7) % 7));
      const daySpend = Math.abs(transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getDay() === i && t.type === 'debit';
      }).reduce((acc, t) => acc + t.amount, 0));
      return { day, amount: daySpend };
    });
    return { week, month: [], year: [] };
  },

  getAnalyticsData: () => {
    const { transactions } = get();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = new Date().getDay();

    // Last 7 days
    const areaData = days.map((name, i) => {
      const date = new Date();
      date.setDate(date.getDate() - ((currentDay - i + 7) % 7));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

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

    // Categories
    const categories = [...new Set(transactions.map(t => t.category || "Other"))];
    const categoryColors = { Shopping: "#3b82f6", Rent: "#6366f1", Dining: "#8b5cf6", Utils: "#ec4899", Deposit: "#22c55e", Transfer: "#f97316", Other: "#94a3b8" };

    const pieData = categories.map(cat => {
      const value = Math.abs(transactions.filter(t => (t.category || "Other") === cat).reduce((acc, t) => acc + t.amount, 0));
      return { name: cat, value, color: categoryColors[cat] || categoryColors.Other };
    }).filter(c => c.value > 0);

    return { areaData, pieData };
  },

  toggleCardFreeze: async (cardId) => {
    try {
      const res = await api.patch(`/wallet/cards/${cardId}/freeze`);
      set((state) => ({
        cards: state.cards.map(c => c.id === cardId ? { ...c, status: res.data.card.status, frozen: res.data.card.status === 'frozen' } : c)
      }));
      toast.success(`Card ${res.data.card.status}`, { id: `card-status-${cardId}` });
      return true;
    } catch (err) {
      toast.error('Failed to update card', { id: `card-error-${cardId}` });
      return false;
    }
  },

  issueCard: async (clerkId, cardData) => {
    try {
      const res = await api.post(`/wallet/cards/issue`, { clerkId, ...cardData });
      set((state) => ({
        cards: [...state.cards, { ...res.data, network: res.data.brand }]
      }));
      toast.success(`Card ${res.data.label} Issued!`, { id: 'card-issue-success' });
      return true;
    } catch (err) {
      toast.error('Failed to issue card', { id: 'card-issue-error' });
      return false;
    }
  },

  // Profile
  updateProfile: async (clerkId, data) => {
    try {
      const res = await api.post('/users/update', { clerkId, ...data });
      set({ user: res.data.user });
      toast.success('Profile updated', { id: 'profile-update-success' });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed', { id: 'profile-update-error' });
      return false;
    }
  },

  // Stats
  getComputedStats: () => {
    const { balance, transactions, isSecure } = get();
    const income = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
    const spend = Math.abs(transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0));

    return [
      { id: "total-balance", label: "TOTAL BALANCE", value: `Rs. ${balance.toLocaleString()}`, change: "+5.2%", changePositive: true, sub: "Live", icon: "trending-up", showChart: true },
      { id: "monthly-spend", label: "MONTHLY SPEND", value: `Rs. ${spend.toLocaleString()}`, sub: "of budget", icon: "credit-card", showProgress: true, progress: Math.min(100, Math.round(spend / 1000 * 100)) },
      { id: "received", label: "RECEIVED", value: `Rs. ${income.toLocaleString()}`, change: "+12%", changePositive: true, sub: "Incoming", icon: "arrow-down" },
      {
        id: "active-auth",
        label: "SECURITY",
        value: !isSecure ? "RE-AUTH" : (get().palmEnrolled ? "READY" : "ACTION"),
        sub: !isSecure ? "Session Error" : (get().palmEnrolled ? "Palm Verified" : "Setup Required"),
        icon: "target",
        showProgress: true,
        progress: (isSecure && get().palmEnrolled) ? 100 : 0
      }
    ];
  },

  // Realtime Apply Actions
  applyBalanceUpdatedEvent: (event) => {
    set((state) => ({
      balance: event.balance,
      // If balance is linked to specific card models, update them too
      cards: state.cards.map(card => ({ ...card, balance: event.balance })) 
    }));
  },

  applyTransactionCreatedEvent: (event) => {
    set((state) => {
      // Avoid duplicates
      if (state.transactions.find(t => t._id === event.transaction._id)) return state;
      return {
        transactions: [event.transaction, ...state.transactions]
      };
    });
  },

  applyNotificationNewEvent: (event) => {
    set((state) => {
      if (state.notifications.find(n => n._id === event.notification._id)) return state;
      return {
        notifications: [event.notification, ...state.notifications]
      };
    });
  },

  applyNotificationReadUpdatedEvent: (event) => {
    set((state) => ({
      notifications: state.notifications.map(n => 
        n._id === event.notificationId ? { ...n, isRead: event.isRead } : n
      )
    }));
  },

  applyNotificationAllReadEvent: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true }))
    }));
  },

  applyUnreadCountUpdatedEvent: (event) => {
    // Current store doesn't have an explicit unreadCount field, it derives it.
    // If we wanted to add one, we would do it here. 
    // For now, the array updates above are sufficient for derived state.
  },

  // Utility
  isDark: true,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
}));

// Auth
if (typeof window !== 'undefined') {
  window.addEventListener('palm-auth-status', (e) => {
    useWalletStore.getState().setSecure(e.detail.secure);
  });
}