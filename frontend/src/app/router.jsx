import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

import AppLayout from "../layouts/AppLayout";

import Dashboard from "../pages/Dashboard";
import Wallet from "../pages/Wallet";
import Transactions from "../pages/Transactions";
import Send from "../pages/Send";
import Receive from "../pages/Receive";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import Login from "../pages/Login";
import SignUp from "../pages/SignUp";
import AddMoney from "../pages/AddMoney";
import AddCard from "../pages/AddCard";
import Notifications from "../pages/Notifications";
import ErrorPage from "../pages/ErrorPage";

const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return children;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
    children: [
      { path: "sso-callback", element: <Login /> } // Captures Clerk SSO callbacks
    ]
  },
  {
    path: "/signup",
    element: <SignUp />,
    errorElement: <ErrorPage />,
    children: [
      { path: "sso-callback", element: <SignUp /> }
    ]
  },
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "wallet", element: <Wallet /> },
      { path: "transactions", element: <Transactions /> },
      { path: "send", element: <Send /> },
      { path: "receive", element: <Receive /> },
      { path: "analytics", element: <Analytics /> },
      { path: "settings", element: <Settings /> },
      { path: "security", element: <Navigate to="/settings?tab=security" replace /> },
      { path: "add-money", element: <AddMoney /> },
      { path: "add-card", element: <AddCard /> },
      { path: "notifications", element: <Notifications /> },
    ],
  },
]);