import { useEffect, useRef, useState } from "react";
import { Camera, X, ShieldCheck, Loader2, Sparkles, Hand, CheckCircle2, Scan, RefreshCw } from "lucide-react";
import { usePalmStore } from "../../store/palmStore";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PalmScanner({ isOpen, onClose, onVerified, mode = "verify" }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Setup Scanning Environment");
  const [instruction, setInstruction] = useState("Center your palm with fingers spread");
  const [guideColor, setGuideColor] = useState("var(--accent-blue)"); 
  const [scanProgress, setScanProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); 
  
  const { enroll, verify, enrolling, verifying } = usePalmStore();
  const { user } = useUser();

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: { ideal: facingMode },
            width: { ideal: 1080 },
            height: { ideal: 1080 } 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStatus("Sensor Calibration...");
      setTimeout(() => setStatus("Ready to Scan"), 800);
    } catch (err) {
      setStatus("Camera Access Failed");
      setInstruction(`Error: ${err.name}. Protocol requires Camera.`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
    setScanProgress(0);
    setGuideColor("var(--accent-blue)");
    setIsSuccess(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const captureFrame = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const v = videoRef.current;
    
    const size = Math.min(v.videoWidth, v.videoHeight);
    const x = (v.videoWidth - size) / 2;
    const y = (v.videoHeight - size) / 2;
    
    // NO MIRRORING for capture - keep original sensor data for AI
    ctx.drawImage(v, x, y, size, size, 0, 0, 512, 512);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  };

  const handleScan = async () => {
    if (!stream || scanning || !user) return;
    setScanning(true);
    setGuideColor("var(--accent-green)");
    setInstruction("Analyzing dermal ridges... Don't move");
    
    const startTime = Date.now();
    const duration = 2500;
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const p = Math.min((elapsed / duration) * 100, 100);
        setScanProgress(p);
        if (p < 100) requestAnimationFrame(animate);
    };
    animate();

    const imageBlob = await captureFrame();
    let success = false;
    let result = null;

    try {
        if (mode === "enroll") {
            success = await enroll(user.id, imageBlob);
        } else {
            result = await verify(user.id, imageBlob);
            success = result?.accepted;
        }

        if (success) {
            setIsSuccess(true);
            setStatus("Authorization Success");
            setInstruction("Bio-signature verified");
            setTimeout(() => {
                onVerified(imageBlob);
                onClose();
            }, 1200);
        } else {
            setScanning(false);
            setScanProgress(0);
            setGuideColor("var(--accent-red)");
            setStatus("Verification Failed");
            setInstruction(result?.similarity ? `Similarity: ${Math.round(result.similarity * 100)}%` : "Scan failure. Try again.");
            setTimeout(() => setGuideColor("var(--accent-blue)"), 2500);
        }
    } catch (err) {
        setScanning(false);
        setGuideColor("var(--accent-red)");
        setStatus("Network Error");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-main/95 backdrop-blur-3xl"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
          className="w-full max-w-sm bg-bg-card border border-border-main rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 pb-2 flex justify-between items-center bg-gradient-to-b from-text-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                <Scan className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-text-primary leading-tight font-heading uppercase tracking-tighter italic">PALM-SCANNER™</div>
                <div className="text-[9px] font-bold text-text-secondary tracking-[0.2em] uppercase font-heading">{mode === 'enroll' ? 'MASTER REGISTRY' : 'SECURE VAULT ACCESS'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={toggleCamera} 
                    className="w-10 h-10 rounded-lg bg-text-primary/5 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-text-primary/10 transition-all active:rotate-180 duration-500 shadow-sm"
                    title="Switch Camera"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-2 text-text-secondary hover:text-accent-red transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
          </div>

          {/* Viewport */}
          <div className="relative aspect-square m-4 rounded-lg overflow-hidden border border-border-main bg-black">
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transition-all duration-1000 ${isSuccess ? 'scale-110 blur-sm brightness-50' : ''} ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
            
            {/* Professional Scan Brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[70%] h-[70%] border-2 border-dashed border-white/20 rounded-[40px] relative">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl transition-colors duration-500" style={{ borderColor: guideColor }} />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl transition-colors duration-500" style={{ borderColor: guideColor }} />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl transition-colors duration-500" style={{ borderColor: guideColor }} />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl transition-colors duration-500" style={{ borderColor: guideColor }} />
                
                {/* Subtle Hand Icon placeholder */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Hand size={120} strokeWidth={1} />
                </div>
              </div>
            </div>

            {scanning && (
                <motion.div 
                    initial={{ top: "15%" }} animate={{ top: "85%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-[15%] right-[15%] h-0.5 bg-accent-blue shadow-[0_0_20px_var(--accent-blue)] z-10"
                />
            )}

            <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
                <div className="bg-bg-main/60 backdrop-blur-xl px-4 py-2 rounded-full border border-border-main text-[10px] font-bold text-text-primary italic uppercase tracking-widest text-center shadow-lg">
                    {status}
                </div>
            </div>

            {isSuccess && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-accent-blue/10">
                    <div className="w-20 h-20 bg-accent-green rounded-full flex items-center justify-center shadow-[0_0_40px_var(--accent-green)]">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                </motion.div>
            )}
          </div>

          <div className="p-8 pt-2 text-center">
            <p className={`text-[14px] font-bold mb-1 transition-colors font-heading ${status === 'Verification Failed' ? 'text-accent-red' : 'text-text-primary'}`}>{instruction}</p>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mb-8 opacity-50 font-heading">
                {facingMode === 'user' ? "FRONT SENSOR ACTIVE" : "BACK SENSOR ACTIVE"}
            </p>

            {!scanning && !isSuccess ? (
                <button
                    onClick={handleScan}
                    disabled={!stream || enrolling || verifying}
                    className="w-full h-16 bg-accent-blue hover:brightness-110 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 group relative shadow-xl shadow-accent-blue/20"
                >
                    {enrolling || verifying ? <Loader2 className="w-6 h-6 animate-spin text-white/50" /> : <ShieldCheck className="w-6 h-6 text-white" />}
                    <span className="text-white font-bold italic tracking-tight uppercase font-heading">{mode === 'enroll' ? 'Begin Registration' : 'Authorize Payload'}</span>
                </button>
            ) : (
                <div className="w-full space-y-4">
                    <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] font-heading">
                        <span>Scanning Ridges...</span>
                        <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-text-primary/5 rounded-full overflow-hidden border border-border-main">
                        <motion.div className="h-full bg-accent-blue shadow-[0_0_15px_var(--accent-blue)]" style={{ width: `${scanProgress}%` }} />
                    </div>
                </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
