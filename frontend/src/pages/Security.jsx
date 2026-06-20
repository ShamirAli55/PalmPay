import { useState } from "react";
import {
  Shield, Fingerprint, Smartphone, Key, Bell,
  Eye, EyeOff, Lock, CheckCircle, AlertTriangle, ChevronRight, ToggleLeft, ToggleRight,
} from "lucide-react";

const DEVICES = [
  { id: "d1", name: "iPhone 15 Pro", type: "Mobile", lastActive: "2 min ago", trusted: true },
  { id: "d2", name: "MacBook Pro M3", type: "Desktop", lastActive: "1 hour ago", trusted: true },
  { id: "d3", name: "Chrome · Windows", type: "Browser", lastActive: "3 days ago", trusted: false },
];

const ACTIVITY = [
  { id: "a1", event: "Palm ID Verified", detail: "Transaction of $1,250.00 authorized", time: "Today, 12:45 PM", status: "success" },
  { id: "a2", event: "Login · iPhone 15 Pro", detail: "New York, NY · iOS 18", time: "Today, 09:12 AM", status: "success" },
  { id: "a3", event: "Failed Auth Attempt", detail: "Unknown device · Blocked", time: "Yesterday, 11:38 PM", status: "warning" },
  { id: "a4", event: "2FA Code Sent", detail: "SMS to +1 •••• 4821", time: "Yesterday, 08:00 AM", status: "info" },
];

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

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-bg-card border border-border-main rounded-xl p-6 lg:p-8 mb-6">
      <div className="mb-6">
        <div className="text-base font-bold text-text-primary font-heading tracking-tight">{title}</div>
        {subtitle && <div className="text-[12px] text-text-secondary mt-1 font-medium">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingRow({ icon: Icon, iconColor = "var(--accent-blue)", label, sub, right }) {
  return (
    <div className="flex items-center gap-4 py-5 border-b border-white/5 last:border-0 hover:bg-text-primary/2 transition-all px-2 -mx-2 rounded-xl">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border-main"
        style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold text-text-primary font-heading uppercase tracking-tight">{label}</div>
        {sub && <div className="text-[11px] text-text-secondary mt-1 font-medium italic opacity-60">{sub}</div>}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

export default function Security() {
  const [palmId, setPalmId] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [txnAlerts, setTxnAlerts] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);
  const [showKey, setShowKey] = useState(false);

  const statusDot = { 
    success: "bg-accent-green", 
    warning: "bg-amber-500", 
    info: "bg-accent-blue" 
  };

  return (
    <div className="flex flex-col gap-6 p-0 lg:p-1.5 min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-text-primary m-0 tracking-tight font-heading">Security Protocol</h1>
        <p className="text-sm text-text-secondary mt-2">Manage your biometric authentication, devices, and vault preferences.</p>
      </div>

      {/* Security Score Banner */}
      <div className="bg-gradient-to-br from-accent-green/10 to-accent-blue/5 border border-accent-green/20 rounded-xl p-8 lg:p-10 flex flex-col md:flex-row items-center gap-8 mb-4 shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="w-20 h-20 rounded-full bg-accent-green/10 border-2 border-accent-green/40 flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-accent-green/10">🛡️</div>
        <div className="flex-1 text-center md:text-left">
          <div className="text-[11px] text-accent-green font-bold tracking-[0.3em] uppercase font-heading">VAULT COMPLIANCE</div>
          <div className="text-2xl lg:text-3xl font-bold text-text-primary mt-3 font-heading tracking-tight">Status: Excellent — 94/100</div>
          <div className="h-2 rounded-full bg-text-primary/10 mt-6 max-w-md border border-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-blue transition-all duration-1000 w-[94%]" />
          </div>
        </div>
        <div className="text-[12px] text-text-secondary font-medium max-w-[180px] leading-relaxed italic opacity-70">
          Activate biometric verification on all network nodes to reach 100.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Authentication */}
          <SectionCard title="Biometric Integration">
            <SettingRow
              icon={Fingerprint} iconColor="var(--accent-green)"
              label="Palm-ID™ Recognition"
              sub="Core bio-signature protocol active"
              right={<Toggle on={palmId} onChange={setPalmId} />}
            />
            <SettingRow
              icon={Smartphone} iconColor="var(--accent-blue)"
              label="Secondary Auth"
              sub="Encrypted signals to +1 •••• 4821"
              right={<Toggle on={twoFactor} onChange={setTwoFactor} />}
            />
            <SettingRow
              icon={Eye} iconColor="#8b5cf6"
              label="Identity Login"
              sub="Use handprint for OS authorization"
              right={<Toggle on={biometricLogin} onChange={setBiometricLogin} />}
            />
            <SettingRow
              icon={Key} iconColor="#f59e0b"
              label="Recovery Matrix"
              sub={showKey ? "PALM-9X2F-K8L1-44MN-7Q3P" : "••••-••••-••••-•••• "}
              right={
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="bg-bg-card border border-border-main rounded-xl px-4 py-2 text-text-secondary text-[11px] font-bold hover:text-text-primary shadow-sm transition-all flex items-center gap-2 uppercase tracking-widest font-heading"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showKey ? "Lock" : "Unlock"}
                </button>
              }
            />
          </SectionCard>

          {/* Alerts */}
          <SectionCard title="Telemetry Alerts">
            <SettingRow
              icon={Bell} iconColor="var(--accent-green)"
              label="Transaction Feedback"
              sub="Real-time settlement pings"
              right={<Toggle on={txnAlerts} onChange={setTxnAlerts} />}
            />
            <SettingRow
              icon={AlertTriangle} iconColor="var(--accent-red)"
              label="Anomaly Detection"
              sub="Continuous fraud pattern analysis"
              right={<Toggle on={fraudAlerts} onChange={setFraudAlerts} />}
            />
            <SettingRow
              icon={Lock} iconColor="var(--accent-blue)"
              label="Auto-Freeze Protocol"
              sub="Instant lockdown on threat detection"
              right={<Toggle on={true} onChange={() => {}} />}
            />
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Trusted Devices */}
          <SectionCard title="Node Directory" subtitle="Authorized hardware linked to your vault">
            <div className="divide-y divide-border-main">
                {DEVICES.map((d) => (
                <div key={d.id} className="flex items-center gap-4 py-5 group">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border-main transition-all group-hover:scale-110 ${d.trusted ? "bg-accent-green/10 text-accent-green" : "bg-text-primary/5 text-text-secondary"}`}>
                    {d.type === "Mobile" ? "📱" : d.type === "Desktop" ? "💻" : "🌐"}
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-text-primary uppercase tracking-tight font-heading">{d.name}</div>
                    <div className="text-[11px] text-text-secondary font-bold uppercase tracking-widest mt-1 opacity-50">
                        {d.type} • ACTIVE {d.lastActive}
                    </div>
                    </div>
                    <div className="shrink-0 ml-4">
                        {d.trusted
                        ? <CheckCircle size={20} className="text-accent-green" />
                        : (
                            <button className="text-[10px] font-bold text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-1.5 transition-all shadow-sm hover:bg-accent-red hover:text-white uppercase tracking-tighter">De-authorize</button>
                        )
                        }
                    </div>
                </div>
                ))}
            </div>
            <button className="w-full mt-6 flex items-center justify-center gap-3 py-4 bg-transparent border border-dashed border-border-main rounded-xl text-text-secondary hover:text-text-primary hover:border-text-primary/30 transition-all text-[11px] font-bold font-heading uppercase tracking-[0.2em] shadow-sm">
              Manage Network Nodes <ChevronRight size={14} />
            </button>
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard title="Security Telemetry">
            <div className="divide-y divide-border-main">
                {ACTIVITY.map((a) => (
                <div key={a.id} className="flex items-start gap-4 py-4 group">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusDot[a.status]} mt-1.5 flex-shrink-0 animate-pulse`} />
                    <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-text-primary font-heading group-hover:text-accent-blue transition-colors uppercase tracking-tight">{a.event}</div>
                    <div className="text-[11px] text-text-secondary mt-1 font-medium italic opacity-70">{a.detail}</div>
                    </div>
                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-tighter opacity-30 whitespace-nowrap pt-1 font-heading">{a.time}</div>
                </div>
                ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}


