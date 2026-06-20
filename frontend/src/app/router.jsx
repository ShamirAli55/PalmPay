import { createBrowserRouter, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

import AppLayout from "../layouts/AppLayout";

import Dashboard from "../pages/Dashboard";
import Wallet from "../pages/Wallet";
import Transactions from "../pages/Transactions";
import Send from "../pages/Send";
import Receive from "../pages/Receive";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import Login from "../pages/Login";
import AddMoney from "../pages/AddMoney";

const Protected = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <Navigate to="/login" replace />
    </SignedOut>
  </>
);

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: (
      <Protected>
        <AppLayout />
      </Protected>
    ),
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "wallet", element: <Wallet /> },
      { path: "transactions", element: <Transactions /> },
      { path: "send", element: <Send /> },
      { path: "receive", element: <Receive /> },
      { path: "analytics", element: <Analytics /> },
      { path: "settings", element: <Settings /> },
      { path: "security", element: <Navigate to="/settings?tab=security" replace /> },
      { path: "add-money", element: <AddMoney /> },
    ],
  },
]);