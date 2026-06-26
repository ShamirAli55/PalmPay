import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Shield, Camera } from "lucide-react";

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Force back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Silence noise
          }
        );
      } catch (err) {
        console.error("Unable to start scanner", err);
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        onClose();
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg-main/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-bg-card border border-border-main rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 leading-none">
        <div className="p-6 border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                <Shield size={18} />
             </div>
             <div>
                <div className="text-[14px] font-bold text-text-primary tracking-tight font-heading uppercase">Link Scanner</div>
                <div className="text-[10px] text-text-secondary font-bold tracking-widest uppercase opacity-40">Protocol P-ID 4.0</div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-text-primary/5 rounded-full transition-all text-text-secondary">
             <X size={20} />
          </button>
        </div>

        <div className="p-8">
            <div id="qr-reader" className="overflow-hidden rounded-2xl border border-border-main bg-black/20" style={{ width: "100%" }}></div>
            <p className="text-[11px] text-text-secondary mt-6 text-center font-bold uppercase tracking-[0.2em] opacity-40 italic">
                Position the user's Vault QR within the frame
            </p>
        </div>
      </div>
    </div>
  );
}
