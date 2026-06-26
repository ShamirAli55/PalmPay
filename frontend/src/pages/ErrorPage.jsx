import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";

export default function ErrorPage() {
   const error = useRouteError();
   const navigate = useNavigate();

   console.error(error);

   return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 text-center">
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-red/5 rounded-full blur-[120px]" />
         </div>

         <div className="relative z-10 max-w-md w-full">
            <div className="w-24 h-24 bg-accent-red/10 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-accent-red/20 shadow-2xl shadow-accent-red/10 animate-pulse">
               <AlertTriangle className="text-accent-red w-12 h-12" />
            </div>

            <div className="flex items-center justify-center gap-3 mb-4">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
               <span className="text-[10px] font-bold text-accent-red uppercase tracking-[0.3em] font-heading">Something went wrong</span>
            </div>

            <h1 className="text-3xl font-bold text-text-primary mb-4 font-heading tracking-tight uppercase">Page Not Found</h1>

            <p className="text-[13px] text-text-secondary mb-12 font-medium leading-relaxed opacity-60">
               The page you are looking for does not exist or has been moved. Return to your dashboard to continue.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
               <button
                  onClick={() => navigate(-1)}
                  className="flex-1 px-8 py-4 bg-bg-card border border-border-main rounded-2xl text-[11px] font-bold text-text-primary uppercase tracking-widest hover:bg-text-primary/5 transition-all active:scale-95 flex items-center justify-center gap-2.5 font-heading"
               >
                  <ArrowLeft size={16} />
                  Go Back
               </button>
               <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 px-8 py-4 bg-accent-blue text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-accent-blue/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2.5 font-heading"
               >
                  <Home size={16} />
                  Dashboard
               </button>
            </div>

            <div className="mt-16 flex items-center justify-center gap-6 opacity-20">
               <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-text-secondary uppercase">Error</span>
                  <span className="text-[10px] font-bold text-text-primary mt-1">404</span>
               </div>
               <div className="h-6 w-px bg-border-main" />
               <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-text-secondary uppercase">Service</span>
                  <span className="text-[10px] font-bold text-text-primary mt-1">PalmPay v2.5</span>
               </div>
            </div>
         </div>
      </div>
   );
}
