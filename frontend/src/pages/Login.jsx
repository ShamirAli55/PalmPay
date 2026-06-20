import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";

const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
  },
  elements: {
    card: { background: "transparent", boxShadow: "none", border: "none" },
    headerTitle: { display: "none" },
    headerSubtitle: { display: "none" },
    formButtonPrimary: {
      background: "linear-gradient(135deg,#22c55e,#16a34a)",
      fontSize: "14px",
      fontWeight: 600,
      borderRadius: "12px",
      padding: "10px",
    },
    formFieldInput: {
      background: "#111827",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px",
      color: "#fff",
      fontSize: "14px",
    },
    footerActionLink: { color: "#22c55e" },
  },
};

export default function Login() {
  return (
    <div className="min-h-screen bg-[#040a18] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white/2 border border-white/10 backdrop-blur-2xl rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-500 bg-blue-500/10 text-blue-500 mb-4">
            <Smartphone size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Digital Palm</h1>
          <p className="text-xs text-white/40 mt-1">Secure biometric wealth management</p>
        </div>

        <SignIn
          routing="hash"
          appearance={clerkAppearance}
          signUpUrl="#sign-up"
          forceRedirectUrl="/dashboard"
        />
      </motion.div>
    </div>
  );
}

