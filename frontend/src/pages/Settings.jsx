import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  User, Bell, Shield, CreditCard,
  ChevronRight, Camera, Moon, Sun,
  Fingerprint, Lock,
  Scan, Loader2, LogOut, ShieldCheck, ShieldOff, Phone, Check
} from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { usePalmStore } from "../store/palmStore";
import PalmScanner from "../components/ui/PalmScanner";
import PhoneLinkModal, { normalizePhone } from "../components/ui/PhoneLinkModal";

const TABS = ["General", "Security"];

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
  const { palmEnrolled, fetchPalmStatus } = usePalmStore();
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (user?.id) fetchPalmStatus(user.id);
  }, [user]);

  return (
    <div className="space-y-6">

      {/* ── Security Status Header ── */}
      <div className="bg-bg-card border border-border-main rounded-xl overflow-hidden mb-2">
        {/* Top accent bar */}
        <div className={`h-0.5 w-full ${palmEnrolled ? 'bg-accent-green' : 'bg-accent-red/60'}`} />

        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${palmEnrolled
            ? 'bg-accent-green/10 border-accent-green/20'
            : 'bg-accent-red/10 border-accent-red/20'
            }`}>
            {palmEnrolled
              ? <ShieldCheck className="w-7 h-7 text-accent-green" />
              : <ShieldOff className="w-7 h-7 text-accent-red/80" />}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-[17px] font-bold text-text-primary font-heading tracking-tight">
                {palmEnrolled ? 'Biometric Security Active' : 'Biometric Security Inactive'}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${palmEnrolled
                ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                : 'bg-accent-red/10 text-accent-red/80 border-accent-red/20'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${palmEnrolled ? 'bg-accent-green' : 'bg-accent-red/70'
                  }`} />
                {palmEnrolled ? 'Verified' : 'Action Required'}
              </span>
            </div>
            <p className="text-[12px] text-text-secondary mt-1.5 font-medium leading-relaxed">
              {palmEnrolled
                ? 'Your palm ID is enrolled. All transactions require biometric confirmation.'
                : 'Palm ID not enrolled. Enroll now to enable biometric transaction security.'}
            </p>
          </div>

          {/* Action */}
          <button
            onClick={() => setScannerOpen(true)}
            className="shrink-0 px-5 py-2.5 bg-accent-blue hover:brightness-110 text-white text-[12px] font-bold rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95 font-heading uppercase tracking-wide"
          >
            <Scan size={14} />
            {palmEnrolled ? 'Re-enroll' : 'Enroll Now'}
          </button>
        </div>

        {/* Stats strip */}
        <div className="border-t border-border-main grid grid-cols-3 divide-x divide-border-main">
          {[
            { label: 'Auth Method', value: 'Palm Biometric' },
            { label: 'Status', value: palmEnrolled ? 'Active' : 'Inactive' },
            { label: 'Protection', value: palmEnrolled ? 'Full' : 'None' },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-4">
              <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mb-1">{label}</div>
              <div className={`text-[13px] font-bold font-heading ${value === 'Active' || value === 'Full' ? 'text-accent-green' :
                value === 'Inactive' || value === 'None' ? 'text-accent-red/70' :
                  'text-text-primary'
                }`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
        <div className="space-y-6">
          <SectionCard title="Biometric Palm-ID" subtitle="Manage your palmprint authentication">
            <SettingRow
              icon={Fingerprint}
              label="Signature Status"
              sub={palmEnrolled ? "Active — Palm ID verified" : "Not enrolled"}
              right={
                <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${palmEnrolled
                  ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                  : 'bg-accent-red/10 text-accent-red/70 border-accent-red/20'
                  }`}>
                  {palmEnrolled ? 'Enrolled' : 'Not Set'}
                </span>
              }
            />
            <SettingRow
              icon={Lock}
              iconColor="var(--accent-green)"
              label="Biometric Authorization"
              sub="Secure all outgoing transmissions"
              right={<Toggle on={true} onChange={() => { }} />}
            />
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
  const { user: clerkUser } = useUser();
  const { isDark, toggleTheme, user: dbUser, fetchData, updateProfile } = useWalletStore();
  const { fetchPalmStatus } = usePalmStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [saved, setSaved]       = useState(false);
  const [phone, setPhone]       = useState("");
  const [username, setUsername] = useState("");
  const [name, setName]         = useState("");
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  useEffect(() => {
    if (clerkUser?.id) {
      fetchData(clerkUser.id);
      fetchPalmStatus(clerkUser.id);
    }
  }, [clerkUser?.id]);

  useEffect(() => {
    if (dbUser?.phone) {
      setPhone(dbUser.phone);
    } else if (clerkUser?.primaryPhoneNumber?.phoneNumber) {
      // Sync from Clerk if DB doesn't have it yet
      setPhone(clerkUser.primaryPhoneNumber.phoneNumber);
    }
    
    if (dbUser?.username) setUsername(dbUser.username);
    if (dbUser?.name) setName(dbUser.name);
    else if (clerkUser?.fullName) setName(clerkUser.fullName);
  }, [dbUser, clerkUser]);

  const activeTab = searchParams.get("tab") === "security" ? "Security" : "General";
  const setTab = (tab) => setSearchParams(tab === "Security" ? { tab: "security" } : {});

  const handleSave = async () => {
    if (clerkUser?.id) {
      const normalizedPhone    = normalizePhone(phone);
      const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');

      const success = await updateProfile(clerkUser.id, {
        phone: normalizedPhone,
        username: normalizedUsername,
        name: name.trim()
      });
      if (success) window.location.reload();
    }
  };

  const hasChanges = 
    name.trim() !== (dbUser?.name || clerkUser?.fullName || "") ||
    normalizePhone(phone) !== normalizePhone(dbUser?.phone || "") ||
    username.toLowerCase().replace(/[^a-z0-9]/g, '') !== (dbUser?.username || "");

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight font-heading">Settings</h1>
        <p className="text-[14px] text-text-secondary mt-3 font-medium">Manage your personal information, security preferences, and interface theme.</p>
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
            <SectionCard title="Profile Information" subtitle="Update your personal details and contact information">
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-accent-blue/30 p-1 bg-bg-main shadow-lg">
                    <img src={clerkUser?.imageUrl} className="w-full h-full rounded-[1.8rem] object-cover" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold text-text-primary font-heading tracking-tight">{name || "Palm User"}</div>
                  <div className="text-[13px] text-text-secondary mt-1.5 font-medium">{clerkUser?.primaryEmailAddress?.emailAddress}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <div className="text-[11px] text-text-secondary font-bold uppercase tracking-[0.2em] mb-3 font-heading">Full Name</div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-text-primary/5 border border-border-main rounded-xl px-5 py-4 text-text-primary text-[14px] font-medium outline-none focus:border-accent-blue/50 transition-all shadow-inner"
                  />
                  <p className="text-[9px] text-text-secondary mt-2 opacity-50 italic">How your name appears to others in transfers.</p>
                </div>

                <div>
                  <div className="text-[11px] text-text-secondary font-bold uppercase tracking-[0.2em] mb-3 font-heading">Email Address</div>
                  <input
                    value={clerkUser?.primaryEmailAddress?.emailAddress || ""}
                    readOnly
                    className="w-full bg-text-primary/5 border border-border-main rounded-xl px-5 py-4 text-text-primary text-[14px] font-medium outline-none opacity-40 cursor-not-allowed shadow-inner"
                  />
                  <p className="text-[9px] text-text-secondary mt-2 opacity-50 italic">Managed via Auth Provider.</p>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-[11px] text-text-secondary font-bold uppercase tracking-[0.15em] mb-3 font-heading flex items-center gap-2">
                    Palm ID
                    <span className="text-[9px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-md font-black">Unique Handle</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary font-bold font-heading">@</span>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="yourname"
                      className="w-full bg-text-primary/5 border border-border-main rounded-xl pl-10 pr-5 py-4 text-text-primary text-[14px] font-medium outline-none focus:border-accent-blue/50 transition-all shadow-inner"
                    />
                  </div>
                  <p className="text-[10px] text-text-secondary mt-2.5 font-medium opacity-60 italic">Your unique handle for instant transfers. No spaces or special characters.</p>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-[11px] text-text-secondary font-bold uppercase tracking-[0.15em] mb-3 font-heading flex items-center gap-2">
                    Mobile Number
                    <span className="text-[9px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-md font-black">Verified via SMS</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-3 bg-text-primary/5 border border-border-main rounded-xl px-5 py-3.5">
                      {dbUser?.phone ? (
                        <>
                          <Check size={14} className="text-accent-green shrink-0" />
                          <span className="text-[14px] font-mono text-text-primary font-medium">
                            {dbUser.phone}
                          </span>
                        </>
                      ) : (
                        <>
                          <Phone size={14} className="text-text-secondary/40 shrink-0" />
                          <span className="text-[13px] text-text-secondary opacity-40 font-medium">No phone linked</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setPhoneModalOpen(true)}
                      className="shrink-0 px-4 py-3.5 bg-text-primary/5 border border-border-main rounded-xl text-[11px] font-bold text-accent-blue hover:border-accent-blue/30 hover:bg-accent-blue/5 transition-all uppercase tracking-widest"
                    >
                      {dbUser?.phone ? "Change" : "Link Now"}
                    </button>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-2.5 font-medium opacity-50">
                    Verified Identity — used for instant transfers and recipient search within PalmPay.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <SectionCard title="Preferences" subtitle="Customize the interface and display settings">
              <SettingRow
                icon={isDark ? Moon : Sun}
                iconColor="var(--accent-blue)"
                label="Dark Mode"
                sub={isDark ? "Enable high-contrast dark theme" : "Use light theme interface"}
                right={<Toggle on={isDark} onChange={toggleTheme} />}
              />
            </SectionCard>

            <button 
              onClick={handleSave} 
              disabled={!hasChanges && !saved}
              className={`w-full py-5 rounded-xl font-bold text-sm tracking-widest text-white transition-all shadow-2xl font-heading uppercase ${!hasChanges && !saved ? 'opacity-40 cursor-not-allowed grayscale bg-text-primary/10' : saved ? 'bg-accent-green' : 'bg-accent-blue shadow-accent-blue/20 hover:brightness-110 active:scale-[0.98]'}`}
            >
              {saved ? 'Saved ✓' : 'Save Changes'}
            </button>

            <button className="w-full py-4 border border-accent-red/20 text-accent-red rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-accent-red/5 transition-all flex items-center justify-center gap-2">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      ) : (
        <SecurityTab />
      )}

      {/* Phone Link / Change Modal */}
      {phoneModalOpen && (
        <PhoneLinkModal
          isOpen={phoneModalOpen}
          onClose={() => setPhoneModalOpen(false)}
          title={dbUser?.phone ? "Update Phone Number" : "Link Phone Number"}
          onSuccess={(newPhone) => {
            setPhone(newPhone);
            setPhoneModalOpen(false);
          }}
        />
      )}
    </div>
  );
}


