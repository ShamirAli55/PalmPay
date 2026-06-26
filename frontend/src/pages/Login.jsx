import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { motion } from "framer-motion";
import { Smartphone, ShieldCheck, Hand } from "lucide-react";

import { Link } from "react-router-dom";

/**
 * Clerk Appearance Configuration
 * Matches the system's "Premium Bubbly" industrial design
 */
const clerkAppearance = {
  baseTheme: dark,
  elements: {
    rootBox: "w-full flex justify-center",
    card: "!bg-transparent !shadow-none !border-none p-0 w-full",
    header: "hidden",
    main: "w-full space-y-6",
    socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 transition-all rounded-xl h-12",
    socialButtonsBlockButtonText: "text-white font-bold text-xs font-sans",
    dividerLine: "bg-white/10",
    dividerText: "text-white/20 text-[10px] uppercase font-black font-sans",
    formFieldLabel: "text-[10px] font-black text-white/50 uppercase tracking-[0.15em] mb-2 font-sans",
    formFieldInput: "bg-white/5 border border-white/10 rounded-xl text-white text-sm p-3.5 focus:border-accent-blue focus:ring-0 w-full font-sans",
    formButtonPrimary: "bg-accent-blue hover:bg-accent-blue/90 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-accent-blue/10 mt-4 w-full font-sans",
    footer: "hidden",
    formFieldInputShowPasswordButton: "text-white/40 hover:text-white",
    footerActionText: "text-white/40 text-xs font-sans",
    footerActionLink: "text-accent-blue hover:text-white font-bold transition-colors font-sans",
    identityPreviewText: "text-white font-bold font-sans",
    identityPreviewEditButtonIcon: "text-white/40",
  },
};

export default function Login() {
  return (
    <div className="min-h-screen bg-[#040a18] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 sm:p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20 mb-6">
              <Hand className="w-8 h-8 text-accent-blue" />
            </div>
            <h1 className="text-2xl font-black text-white font-heading tracking-tight mb-2 uppercase">
              Sign In
            </h1>
            <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest font-sans">
              Welcome back to PalmPay
            </p>
          </div>

          <div className="w-full flex justify-center mb-8">
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/signup"
              appearance={clerkAppearance}
              forceRedirectUrl="/dashboard"
            />
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest font-sans">
              Don't have an account?
            </p>
            <Link 
              to="/signup"
              className="w-full py-3.5 rounded-xl border border-accent-blue/20 bg-accent-blue/5 text-accent-blue text-xs font-bold uppercase tracking-widest text-center hover:bg-accent-blue/10 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

