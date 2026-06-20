// ─── Dashboard Stat Cards ────────────────────────────────────────────────────
export const STAT_CARDS = [
  {
    id: "total-balance",
    label: "TOTAL BALANCE",
    value: "Rs. 500.50",
    change: "+12.5%",
    changePositive: true,
    sub: "Updated 2m ago",
    icon: "trending-up",
    showChart: true,
  },
  {
    id: "monthly-spend",
    label: "MONTHLY SPEND",
    value: "Rs. 290.00",
    sub: "69% of monthly budget",
    icon: "credit-card",
    showProgress: true,
    progress: 69,
  },
  {
    id: "received",
    label: "RECEIVED",
    value: "Rs. 18.00",
    sub: "3 new deposits",
    icon: "arrow-down",
    changePositive: true,
  },
  {
    id: "savings-goal",
    label: "SAVINGS GOAL",
    value: "Rs. 328.00",
    sub: '82% to "Tesla Plaid"',
    icon: "target",
    showProgress: true,
    progress: 82,
  },
];

// ─── Spending Chart ──────────────────────────────────────────────────────────
export const SPENDING_CHART = {
  week: [
    { day: "MON", amount: 120 },
    { day: "TUE", amount: 200 },
    { day: "WED", amount: 95 },
    { day: "THU", amount: 250 },
    { day: "FRI", amount: 310 },
    { day: "SAT", amount: 430 },
    { day: "SUN", amount: 180 },
  ],
  month: [
    { day: "W1", amount: 850 },
    { day: "W2", amount: 1200 },
    { day: "W3", amount: 670 },
    { day: "W4", amount: 990 },
  ],
  year: [
    { day: "JAN", amount: 3200 },
    { day: "FEB", amount: 2800 },
    { day: "MAR", amount: 4100 },
    { day: "APR", amount: 3700 },
    { day: "MAY", amount: 5200 },
    { day: "JUN", amount: 4800 },
    { day: "JUL", amount: 6100 },
    { day: "AUG", amount: 5500 },
    { day: "SEP", amount: 4200 },
    { day: "OCT", amount: 3900 },
    { day: "NOV", amount: 4700 },
    { day: "DEC", amount: 6800 },
  ],
};

// ─── Recent Transactions (Dashboard + Wallet) ────────────────────────────────
export const RECENT_TRANSACTIONS = [
  {
    id: "txn-001",
    merchant: "Node Protocol Payout",
    category: "INCOME",
    time: "12:45 PM",
    amount: +1299.0,
    status: "Completed",
  },
  {
    id: "txn-002",
    merchant: "Tech Corp Salary",
    category: "INCOME",
    time: "YESTERDAY",
    amount: +8500.0,
    status: "Income",
  },
  {
    id: "txn-003",
    merchant: "Nobu Downtown",
    category: "DINING",
    time: "YESTERDAY",
    amount: -450.25,
    status: "Pending",
  },
  {
    id: "txn-004",
    merchant: "Uber",
    category: "TRANSPORT",
    time: "MON",
    amount: -24.5,
    status: "Completed",
  },
  {
    id: "txn-005",
    merchant: "Netflix",
    category: "ENTERTAINMENT",
    time: "MON",
    amount: -15.99,
    status: "Completed",
  },
];

// ─── Full Transaction History ─────────────────────────────────────────────────
export const ALL_TRANSACTIONS = [
  {
    id: "t-001",
    recipient: "Dummy User",
    email: "jw.palm@wealth.com",
    avatar: null,
    category: "Transfer",
    date: "Oct 24, 2023",
    time: "14:32 PM",
    status: "Processed",
    amount: -1240.0,
  },
  {
    id: "t-002",
    recipient: "Dummy User",
    email: "Merchant Purchase",
    avatar: null,
    category: "Shopping",
    date: "Oct 22, 2023",
    time: "09:15 AM",
    status: "Pending",
    amount: -2199.0,
  },
  {
    id: "t-003",
    recipient: "Dummy User",
    email: "e.rodriguez@domain.io",
    avatar: null,
    category: "Income",
    date: "Oct 20, 2023",
    time: "18:45 PM",
    status: "Processed",
    amount: +5000.0,
  },
  {
    id: "t-004",
    recipient: "Cloud Services Inc.",
    email: "Recurring Billing",
    avatar: null,
    category: "Software",
    date: "Oct 19, 2023",
    time: "02:00 AM",
    status: "Failed",
    amount: -85.0,
  },
  {
    id: "t-005",
    recipient: "Apple Store",
    email: "apple.com",
    avatar: null,
    category: "Technology",
    date: "Oct 18, 2023",
    time: "11:30 AM",
    status: "Processed",
    amount: -1299.0,
  },
  {
    id: "t-006",
    recipient: "Payroll Credit",
    email: "hr@company.com",
    avatar: null,
    category: "Income",
    date: "Oct 15, 2023",
    time: "08:00 AM",
    status: "Processed",
    amount: +8500.0,
  },
];

// ─── My Cards ─────────────────────────────────────────────────────────────────
export const MY_CARDS = [
  {
    id: "card-001",
    label: "PLATINUM PRIME",
    holder: "Test_User_Web_Project",
    balance: 12450.0,
    last4: "8829",
    expiry: "12/26",
    color: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%)",
    frozen: false,
    network: "VISA",
  },
  {
    id: "card-002",
    label: "BUSINESS BLACK",
    holder: "Test_User_Web_Project",
    balance: 3200.0,
    last4: "0042",
    expiry: "08/25",
    color: "linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)",
    frozen: false,
    network: "MC",
  },
];

// ─── Connected Banks ──────────────────────────────────────────────────────────
export const CONNECTED_BANKS = [
  { id: "bank-001", name: "Chase Savings", last4: "9901", balance: 12400 },
  { id: "bank-002", name: "Goldman Asset", last4: "4423", balance: 84000 },
];

// ─── Send - Contacts ──────────────────────────────────────────────────────────
export const CONTACTS = [
  { id: "c-001", name: "Dummy User", initials: "DU", color: "#6366f1" },
  { id: "c-002", name: "Dummy User", initials: "DU", color: "#8b5cf6" },
  { id: "c-003", name: "Dummy User", initials: "DU", color: "#06b6d4" },
  { id: "c-004", name: "Dummy User", initials: "DU", color: "#22c55e" },
];

// ─── Receive - Recent Requests ────────────────────────────────────────────────
export const RECENT_REQUESTS = [
  {
    id: "req-001",
    name: "Elena Rodriguez",
    detail: "Project: Design Sprint",
    time: "2h ago",
    amount: 450.0,
    icon: "person",
  },
  {
    id: "req-002",
    name: "CloudScale Inc.",
    detail: "Invoice #882-DP",
    time: "5h ago",
    amount: 2800.0,
    icon: "building",
  },
  {
    id: "req-003",
    name: "Market Split",
    detail: "Dinner at Lumière",
    time: "Yesterday",
    amount: 45.5,
    icon: "shopping",
  },
];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const SPENDING_VS_INCOME = {
  week: [
    { label: "W1", income: 3200, spending: 1800 },
    { label: "W2", income: 4100, spending: 2900 },
    { label: "W3", income: 3700, spending: 1500 },
    { label: "W4", income: 5200, spending: 3100 },
  ],
  month: [
    { label: "Jan", income: 8500, spending: 5200 },
    { label: "Feb", income: 7200, spending: 4800 },
    { label: "Mar", income: 9100, spending: 6100 },
    { label: "Apr", income: 8800, spending: 5700 },
    { label: "May", income: 10200, spending: 7300 },
    { label: "Jun", income: 9500, spending: 6500 },
  ],
  year: [
    { label: "2021", income: 92000, spending: 68000 },
    { label: "2022", income: 108000, spending: 79000 },
    { label: "2023", income: 124800, spending: 86500 },
  ],
};

export const WEALTH_TRAJECTORY = [
  { month: "Jan", value: 85000 },
  { month: "Feb", value: 92000 },
  { month: "Mar", value: 78000 },
  { month: "Apr", value: 110000 },
  { month: "May", value: 130000 },
  { month: "Jun", value: 118000 },
  { month: "Jul", value: 142400 },
  { month: "Aug", value: 138000 },
  { month: "Sep", value: 155000 },
  { month: "Oct", value: 162000 },
];

export const SPENDING_CATEGORIES = [
  { name: "Business", value: 40, color: "#3b82f6" },
  { name: "Leisure", value: 25, color: "#22c55e" },
  { name: "Invest", value: 15, color: "#f97316" },
  { name: "Other", value: 20, color: "#6366f1" },
];

// ─── NAV Items ────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: "layout-dashboard" },
  { label: "Wallet", path: "/wallet", icon: "wallet" },
  { label: "Transactions", path: "/transactions", icon: "list" },
  { label: "Analytics", path: "/analytics", icon: "bar-chart-2" },
  { label: "Settings", path: "/settings", icon: "settings" },
];
