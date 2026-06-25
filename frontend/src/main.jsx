import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { Toaster } from "react-hot-toast";
import AuthNotifier from "./components/AuthNotifier";
import SocketManager from "./realtime/SocketManager";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark
      }}
    >
      <AuthNotifier />
      <SocketManager />
      <RouterProvider router={router} />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(23, 23, 23, 0.85)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 20px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            maxWidth: '400px',
            width: '90vw'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            style: {
              background: 'rgba(23, 23, 23, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
            }
          }
        }}
      />
    </ClerkProvider>
  </React.StrictMode>
);