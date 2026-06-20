import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      // Removed global dark theme to allow component-level or adaptive switching
    >
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" theme="dark" closeButton />
    </ClerkProvider>
  </React.StrictMode>
);