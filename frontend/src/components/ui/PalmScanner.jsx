import { useEffect, useRef, useState, useCallback } from "react";
import { X, ShieldCheck, Loader2, Hand, CheckCircle2, Scan, RefreshCw, AlertTriangle } from "lucide-react";
import { usePalmStore } from "../../store/palmStore";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";

// ── MediaPipe Hands loader ────────────────────────────────────────────────────
let mpHandsPromise = null;
function loadMediaPipeHands() {
  if (mpHandsPromise) return mpHandsPromise;
  mpHandsPromise = new Promise((resolve) => {
    if (window.Hands) { resolve(window.Hands); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(window.Hands);
    script.onerror = () => resolve(null); // graceful fallback
    document.head.appendChild(script);
  });
  return mpHandsPromise;
}

export default function PalmScanner({ isOpen, onClose, onVerified, mode = "verify" }) {
  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const streamRef = useRef(null);       // ref so stopCamera always sees current stream
  const liveCheckRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Preparing Camera...");
  const [instruction, setInstruction] = useState("Open your palm and hold it steady");
  const [guideColor, setGuideColor] = useState("var(--accent-blue)");
  const [scanProgress, setScanProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  // "environment" = back camera (default for palm scanning), "user" = selfie
  const [facingMode, setFacingMode] = useState("environment");
  // palmReady = true when MediaPipe sees any hand at all
  const [palmReady, setPalmReady] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  // Multi-sample enrollment tracking
  const ENROLL_REQUIRED = 5;  // 5 explicit scans to build a robust template
  const VERIFY_FRAMES   = 4;  // frames silently captured during one 'long scan'
  const [enrollSamplesCount, setEnrollSamplesCount] = useState(0);

  const { enroll, verifyMulti, enrolling, verifying } = usePalmStore();
  const { user } = useUser();

  // ── Load MediaPipe Hands (once, app-wide) ──────────────────────────────────
  useEffect(() => {
    loadMediaPipeHands().then((HandsCls) => {
      if (!HandsCls) {
        // MediaPipe unavailable — degrade gracefully (no live indicator)
        setMpLoaded(false);
        return;
      }
      const hands = new HandsCls({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,            // lite model — fastest
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      hands.onResults((results) => {
        // ── Advanced Hand Validation ─────────────────────────────────────────
        const landmarks = results.multiHandLandmarks?.[0];
        const handedness = results.multiHandedness?.[0]; // Left/Right label

        if (!landmarks || !handedness) {
          setPalmReady(false);
          return;
        }

        // 1. Check if hand is open (fingers extended)
        // Compare finger tips (8, 12, 16, 20) with their bases (5, 9, 13, 17)
        const isHandOpen = 
          landmarks[8].y < landmarks[5].y && 
          landmarks[12].y < landmarks[9].y &&
          landmarks[16].y < landmarks[13].y &&
          landmarks[20].y < landmarks[17].y;

        // 2. Check if palm is facing the camera
        // In MediaPipe, for the PALM side, the thumb (4) and pinky (20) 
        // follow a specific order relative to the wrist (0)
        const isPalmFacing = handedness.label === "Right" 
          ? landmarks[4].x < landmarks[20].x  // Right hand palm facing
          : landmarks[4].x > landmarks[20].x; // Left hand palm facing

        // 3. Size check (not too far, not too close)
        const wrist = landmarks[0];
        const middleBase = landmarks[9];
        const handSize = Math.sqrt(Math.pow(wrist.x - middleBase.x, 2) + Math.pow(wrist.y - middleBase.y, 2));
        const isSizeValid = handSize > 0.1 && handSize < 0.4;

        setPalmReady(isHandOpen && isPalmFacing && isSizeValid);
      });
      handsRef.current = hands;
      setMpLoaded(true);
    });
  }, []);

  // ── Camera lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setPalmReady(false);
    setStatus("Starting camera...");

    const constraints = [
      { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: facingMode } },
      { video: true },
    ];

    let mediaStream = null;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Security Block");
      setInstruction("HTTPS is required for camera access. Please use 'https://' or setup a local cert.");
      return;
    }

    for (const c of constraints) {
      try {
        console.log("Trying camera constraint:", c);
        mediaStream = await navigator.mediaDevices.getUserMedia(c);
        if (mediaStream) break;
      } catch (err) {
        console.error("Constraint failed:", err.name, err.message);
      }
    }

    if (!mediaStream) {
      setStatus("Camera failed");
      setInstruction("Please ensure your camera is not in use by another app.");
      return;
    }

    streamRef.current = mediaStream;
    setStream(mediaStream);
    if (videoRef.current) videoRef.current.srcObject = mediaStream;
    setTimeout(() => setStatus("Ready"), 700);
  };

  const stopCamera = () => {
    if (liveCheckRef.current) clearInterval(liveCheckRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setScanning(false);
    setScanProgress(0);
    setGuideColor("var(--accent-blue)");
    setIsSuccess(false);
    setPalmReady(false);
    setEnrollSamplesCount(0);
  };

  // ── Live hand-presence check every 700 ms ─────────────────────────────────
  const startLiveCheck = useCallback(() => {
    if (liveCheckRef.current) clearInterval(liveCheckRef.current);
    liveCheckRef.current = setInterval(async () => {
      const vid = videoRef.current;
      if (!handsRef.current || !vid || vid.readyState < 2) return;
      try {
        await handsRef.current.send({ image: vid });
      } catch (_) { /* ignore mid-close errors */ }
    }, 700);
  }, []);

  useEffect(() => {
    if (stream && mpLoaded) startLiveCheck();
    return () => { if (liveCheckRef.current) clearInterval(liveCheckRef.current); };
  }, [stream, mpLoaded, startLiveCheck]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
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
    ctx.drawImage(v, x, y, size, size, 0, 0, 512, 512);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  };

  // Capture a frame after a delay (used for multi-frame verification)
  const captureFrameAt = (delayMs) =>
    new Promise((resolve) => setTimeout(() => resolve(captureFrame()), delayMs));

  // ── Scan handler ───────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!stream || scanning || !user) return;
    
    // Safety guard: only allow scan if MediaPipe confirms a valid palm
    if (mpLoaded && !palmReady) {
      setStatus("Invalid Position");
      setInstruction("Please show your open PALM clearly to the camera");
      setGuideColor("var(--accent-red)");
      setTimeout(() => {
        setStatus("Ready");
        setGuideColor("var(--accent-blue)");
      }, 2000);
      return;
    }

    setScanning(true);
    setGuideColor("var(--accent-green)");
    setInstruction("Scanning palm... hold still");

    const startTime = Date.now();
    const duration = 2500;
    const animate = () => {
      const p = Math.min(((Date.now() - startTime) / duration) * 100, 100);
      setScanProgress(p);
      if (p < 100) requestAnimationFrame(animate);
    };
    animate();

    const imageBlob = await captureFrame();
    let result = null;

    try {
      if (mode === "enroll") {
        // ── MULTI-SAMPLE ENROLLMENT ─────────────────────────────────────────
        result = await enroll(user.id, imageBlob);
        const newCount = result?.samples ?? (enrollSamplesCount + 1);
        setEnrollSamplesCount(newCount);

        if (newCount >= ENROLL_REQUIRED) {
          // All required samples collected — done!
          setIsSuccess(true);
          setStatus("Enrolled!");
          setInstruction("Palm template saved successfully");
          setTimeout(() => {
            onVerified(imageBlob);
            onClose();
          }, 1400);
        } else {
          // Need more samples — reset for next capture
          const remaining = ENROLL_REQUIRED - newCount;
          setScanning(false);
          setScanProgress(0);
          setGuideColor("var(--accent-blue)");
          setStatus(`Sample ${newCount}/${ENROLL_REQUIRED} captured`);
          setInstruction(
            remaining === 1
              ? "Almost there! One more scan"
              : `Good! ${remaining} more scans needed`
          );
        }
      } else {
        // ── VERIFICATION — one long scan, multiple hidden frames ───────────
        // Capture VERIFY_FRAMES frames spread across the scan duration
        // The progress bar covers the capture window — user just holds still
        const interval = Math.floor(2000 / (VERIFY_FRAMES - 1));  // e.g. 667ms apart
        const framePromises = Array.from({ length: VERIFY_FRAMES }, (_, i) =>
          captureFrameAt(i * interval)
        );
        const frames = await Promise.all(framePromises);
        const validFrames = frames.filter(Boolean);

        result = await verifyMulti(user.id, validFrames);
        const accepted = result?.accepted;

        if (accepted) {
          setIsSuccess(true);
          setStatus("Verified");
          setInstruction("Identity confirmed");
          setTimeout(() => {
            onVerified(imageBlob);
            onClose();
          }, 1200);
        } else {
          setScanning(false);
          setScanProgress(0);
          setGuideColor("var(--accent-red)");
          setStatus("Verification Failed");
          setInstruction(
            result?.similarity
              ? `Match: ${Math.round(result.similarity * 100)}% — Try again`
              : "Scan failed. Reposition and try again."
          );
          setTimeout(() => {
            setGuideColor("var(--accent-blue)");
            setStatus("Ready");
            setInstruction("Open your palm and hold it steady");
          }, 2500);
        }
      }
    } catch (_) {
      setScanning(false);
      setScanProgress(0);
      setGuideColor("var(--accent-red)");
      setStatus("Network Error");
      setInstruction("Connection failed. Check your network.");
    }
  };

  if (!isOpen) return null;

  // Video mirror only for front camera (selfie)
  const isFront = facingMode === "user";

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
                <div className="text-[14px] font-bold text-text-primary leading-tight font-heading uppercase tracking-tighter italic">
                  PALM RECOGNITION
                </div>
                <div className="text-[9px] font-bold text-text-secondary tracking-[0.2em] uppercase font-heading">
                  {mode === "enroll"
                    ? `Enrollment — Step ${Math.min(enrollSamplesCount + 1, ENROLL_REQUIRED)} of ${ENROLL_REQUIRED}`
                    : "Secure Access"}
                </div>
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
              className={`w-full h-full object-cover transition-all duration-1000
                ${isSuccess ? "scale-110 blur-sm brightness-50" : ""}
                ${isFront ? "-scale-x-100" : ""}
              `}
            />

            {/* Scan brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[70%] h-[70%] border-2 border-dashed border-white/20 rounded-[40px] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl transition-colors duration-500" style={{ borderColor: guideColor }} />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl transition-colors duration-500" style={{ borderColor: guideColor }} />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl transition-colors duration-500" style={{ borderColor: guideColor }} />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl transition-colors duration-500" style={{ borderColor: guideColor }} />
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Hand size={120} strokeWidth={1} />
                </div>
              </div>
            </div>

            {/* Scan line animation */}
            {scanning && (
              <motion.div
                initial={{ top: "15%" }} animate={{ top: "85%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-[15%] right-[15%] h-0.5 bg-accent-blue shadow-[0_0_20px_var(--accent-blue)] z-10"
              />
            )}

            {/* Status pill */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
              <div className="bg-bg-main/60 backdrop-blur-xl px-4 py-2 rounded-full border border-border-main text-[10px] font-bold text-text-primary italic uppercase tracking-widest text-center shadow-lg">
                {status}
              </div>
            </div>

            {/* Success overlay */}
            {isSuccess && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-accent-blue/10"
              >
                <div className="w-20 h-20 bg-accent-green rounded-full flex items-center justify-center shadow-[0_0_40px_var(--accent-green)]">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <div className="p-8 pt-2 text-center">
            <p className={`text-[14px] font-bold mb-1 transition-colors font-heading ${status === "Verification Failed" ? "text-accent-red" : "text-text-primary"
              }`}>
              {instruction}
            </p>

            {/* Hand presence indicator (soft — never blocks scanning) */}
            {mpLoaded && !scanning && !isSuccess && (
              <div className={`flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest mb-2 transition-colors ${palmReady ? "text-accent-green" : "text-text-secondary/50"
                }`}>
                {palmReady ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block" /> Hand Detected</>
                ) : (
                  <><AlertTriangle size={9} /> No hand detected</>
                )}
              </div>
            )}

            {/* Enrollment step dots */}
            {mode === "enroll" && !isSuccess && (
              <div className="flex items-center justify-center gap-2 mb-3">
                {Array.from({ length: ENROLL_REQUIRED }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-400 ${
                      i < enrollSamplesCount
                        ? "bg-accent-green border-accent-green shadow-[0_0_6px_var(--accent-green)]"
                        : i === enrollSamplesCount
                        ? "bg-accent-blue/40 border-accent-blue animate-pulse"
                        : "bg-transparent border-border-main"
                    }`}
                  />
                ))}
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest ml-1">
                  {enrollSamplesCount}/{ENROLL_REQUIRED} samples
                </span>
              </div>
            )}

            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mb-6 opacity-40 font-heading">
              {isFront ? "FRONT CAMERA" : "REAR CAMERA"}
            </p>

            {!scanning && !isSuccess ? (
              <button
                onClick={handleScan}
                disabled={!stream || enrolling || verifying}
                className="w-full h-16 bg-accent-blue hover:brightness-110 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 relative shadow-xl shadow-accent-blue/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {enrolling || verifying
                  ? <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                  : <ShieldCheck className="w-6 h-6 text-white" />
                }
                <span className="text-white font-bold italic tracking-tight uppercase font-heading">
                  {mode === "enroll"
                    ? (enrollSamplesCount === 0 ? "Scan Palm" : `Scan ${enrollSamplesCount + 1} of ${ENROLL_REQUIRED}`)
                    : "Authorize"}
                </span>
              </button>
            ) : (
              <div className="w-full space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] font-heading">
                  <span>Scanning...</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-text-primary/5 rounded-full overflow-hidden border border-border-main">
                  <motion.div
                    className="h-full bg-accent-blue shadow-[0_0_15px_var(--accent-blue)]"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
