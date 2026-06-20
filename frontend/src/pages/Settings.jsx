import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  User, Bell, Shield, Palette, Globe, CreditCard,
  ChevronRight, Camera, Check, Moon, Sun,
  Fingerprint, Smartphone, Key, AlertTriangle, CheckCircle, Lock, Eye, EyeOff,
  Scan, Loader2, LogOut
} from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { usePalmStore } from "../store/palmStore";
import PalmScanner from "../components/ui/PalmScanner";

const TABS = ["General", "Security"];

const DEVICES = [
  { id: "d1", name: "iPhone 15 Pro", type: "Mobile", lastActive: "2 min ago", trusted: true },
  { id: "d2", name: "MacBook Pro M3", type: "Desktop", lastActive: "1 hour ago", trusted: true },
  { id: "d3", name: "Chrome · Windows", type: "Browser", lastActive: "3 days ago", trusted: false },
];

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-bg-card border border-border-main rounded-xl p-6 md:p-8 mb-6">
      <div className="mb-8">
        <div className="text-base font-bold text-text-primary font-heading tracking-tight">{title}</div>
        {subtitle && <div className="text-[12px] text-text-secondary mt-1.5 font-medium">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingRow({ icon: Icon, iconColor = "var(--accent-blue)", label, sub, right }) {
  return (
    <div className="flex items-center gap-4 py-5 border-b border-white/5 last:border-0">
      <div 
        style={{ backgroundColor: `${iconColor === 'var(--accent-blue)' ? 'rgba(59, 130, 246, 0.1)' : iconColor + '15'}` }}
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
      >
        <Icon size={20} className={iconColor === 'var(--accent-blue)' ? 'text-accent-blue' : ''} style={iconColor !== 'var(--accent-blue)' ? { color: iconColor } : {}} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold text-text-primary font-heading truncate">{label}</div>
        {sub && <div className="text-[12px] text-text-secondary mt-1 font-medium truncate">{sub}</div>}
      </div>
      <div className="shrink-0 ml-2">{right}</div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${on ? "bg-accent-green shadow-md shadow-accent-green/20" : "bg-text-primary/10"}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${on ? "left-[24px]" : "left-1"}`} />
    </button>
  );
}

function SecurityTab() {
  const { user } = useUser();
  const { enrollSamples, palmEnrolled, fetchPalmStatus } = usePalmStore();
  const [showKey, setShowKey] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (user?.id) fetchPalmStatus(user.id);
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 mb-8 shadow-sm">
        <div className="relative">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shrink-0 transition-colors duration-500 ${palmEnrolled ? 'bg-accent-green/20' : 'bg-accent-blue/20'}`}>
                {palmEnrolled ? '🛡️' : '🌐'}
            </div>
            {palmEnrolled && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent-green rounded-full border-4 border-bg-card flex items-center justify-center text-[10px]">✓</div>}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="text-[11px] text-accent-blue font-bold tracking-[0.2em] uppercase font-heading">Security Compliance</div>
          <div className="text-2xl font-bold text-text-primary mt-2 font-heading tracking-tight">
            {palmEnrolled ? 'Protocol Level 4 Active' : 'Registry Entry Pending'}
          </div>
          <div className="h-2 rounded-full bg-text-primary/5 mt-5 max-w-md mx-auto md:mx-0 overflow-hidden border border-white/5">
            <div 
              style={{ width: palmEnrolled ? '100%' : `${(enrollSamples / 3) * 100}%` }} 
              className={`h-full rounded-full transition-all duration-1000 ${palmEnrolled ? 'bg-accent-green' : 'bg-accent-blue'}`} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
        <div className="space-y-6">
          <SectionCard title="Biometric Palm-ID™" subtitle="Manage your palmprint signature">
             <SettingRow 
                icon={Fingerprint} 
                label="Signature Status" 
                sub={palmEnrolled ? "Successfully Verified" : `Samples Logged: ${enrollSamples}/3`}
                right={
                  <button 
                    onClick={() => setScannerOpen(true)}
                    className="px-5 py-2.5 bg-accent-blue hover:brightness-110 text-white text-[12px] font-bold rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95 font-heading uppercase tracking-wide"
                  >
                    <Scan size={14} /> {palmEnrolled ? 'Re-enroll' : 'Initialize'}
                  </button>
                } 
            />
            <SettingRow 
                icon={Lock} 
                iconColor="var(--accent-green)" 
                label="Biometric Authorization" 
                sub="Secure all outgoing transmissions"
                right={<Toggle on={true} onChange={() => {}} />} 
            />
          </SectionCard>

          <SectionCard title="Internal Vault Access">
             <SettingRow icon={Key} iconColor="#f59e0b" label="Master Access Token"
              sub={showKey ? "PALM-REG-0X2B-K9L1-77VY" : "••••-••••-••••-••••"}
              right={
                <button onClick={() => setShowKey(!showKey)} className="bg-text-primary/5 border border-border-main rounded-xl px-4 py-2 text-text-secondary text-[11px] font-bold hover:text-text-primary transition-all flex items-center gap-2">
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />} {showKey ? "Hide" : "Reveal"}
                </button>
              } />
          </SectionCard>Section 1
<option value=""></option>
        </div>

        <div>
          <SectionCard title="Authorized Hardware" subtitle="Active sessions signed into your profile">
            <div className="space-y-1">
              {DEVICES.map((d) => (
                <div key={d.id} className="flex items-center gap-4 py-5 border-b border-white/5 last:border-0 group">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl border border-border-main transition-all ${d.trusted ? "bg-accent-green/10" : "bg-text-primary/5"}`}>
                    {d.type === "Mobile" ? "📱" : d.type === "Desktop" ? "💻" : "🌐"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-text-primary font-heading">{d.name}</div>
                    <div className="text-[11px] text-text-secondary font-medium">{d.type} • Active {d.lastActive}</div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {d.trusted ? <CheckCircle size={18} className="text-accent-green" /> : (
                      <button className="text-[11px] text-accent-red bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 rounded-lg px-4 py-1.5 font-bold transition-all uppercase tracking-tight">Revoke</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <PalmScanner 
        isOpen={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        mode="enroll" 
        onVerified={() => {
            fetchPalmStatus(user.id);
        }}
      />
    </div>
  );
}

export default function Settings() {
  const { user } = useUser();
  const { isDark, toggleTheme } = useWalletStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);

  const activeTab = searchParams.get("tab") === "security" ? "Security" : "General";
  const setTab = (tab) => setSearchParams(tab === "Security" ? { tab: "security" } : {});

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight font-heading">Vault Configuration</h1>
        <p className="text-[14px] text-text-secondary mt-3 font-medium">Manage your biometric security, interface themes, and profile details.</p>
      </div>

      <div className="flex gap-8 mb-8 border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`pb-4 text-[13px] font-bold transition-all relative whitespace-nowrap font-heading uppercase tracking-widest ${activeTab === tab ? "text-accent-blue" : "text-text-secondary hover:text-text-primary"}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-blue rounded-t-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" />}
          </button>
        ))}
      </div>

      {activeTab === "General" ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="xl:col-span-3 space-y-6">
            <SectionCard title="Public Identity" subtitle="Linked personal data on your network profile">
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-accent-blue/30 p-1 bg-bg-main shadow-lg">
                    <img src={user?.imageUrl} className="w-full h-full rounded-[1.8rem] object-cover" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-accent-blue border-4 border-bg-card flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
                    <Camera size={16} />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold text-text-primary font-heading tracking-tight">{user?.fullName || user?.username}</div>
                  <div className="text-[13px] text-text-secondary mt-1.5 font-medium">{user?.primaryEmailAddress?.emailAddress}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { label: "Vault Alias", value: user?.fullName || user?.username || "" },
                  { label: "Primary Email", value: user?.primaryEmailAddress?.emailAddress || "" },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="text-[11px] text-text-secondary font-bold uppercase tracking-[0.2em] mb-3 font-heading">{f.label}</div>
                    <input
                      defaultValue={f.value}
                      className="w-full bg-text-primary/5 border border-border-main rounded-xl px-5 py-4 text-text-primary text-[14px] font-medium outline-none focus:border-accent-blue/50 transition-all shadow-inner"
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-2 space-y-6">
             <SectionCard title="System Environment" subtitle="Tailor the interface to your preference">
              <SettingRow
                icon={isDark ? Moon : Sun}
                iconColor="var(--accent-blue)"
                label="Dark Protocol"
                sub={isDark ? "Maximum contrast enabled" : "Standard clarity mode"}
                right={<Toggle on={isDark} onChange={toggleTheme} />}
              />
            </SectionCard>

            <button onClick={handleSave} className={`w-full py-5 rounded-xl font-bold text-sm tracking-widest text-white transition-all shadow-2xl font-heading uppercase ${saved ? 'bg-accent-green' : 'bg-accent-blue shadow-accent-blue/20 hover:brightness-110 active:scale-[0.98]'}`}>
              {saved ? 'Synchronized ✓' : 'Save Protocol Changes'}
            </button>

            <button className="w-full py-4 border border-accent-red/20 text-accent-red rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-accent-red/5 transition-all flex items-center justify-center gap-2">
                <LogOut size={14} /> Exit Vault
            </button>
          </div>
        </div>
      ) : (
        <SecurityTab />
      )}
    </div>
  );
}


