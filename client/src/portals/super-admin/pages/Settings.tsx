import { useState } from "react";
import { Save, Eye, EyeOff, Globe, Bell, Shield, CreditCard, Palette, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "email", label: "Email / SMS", icon: Mail },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={cn("relative rounded-full transition-colors shrink-0", checked ? "bg-purple-600" : "bg-gray-200")}
      style={{ height: "22px", width: "40px" }}>
      <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    platformName: "DN-SMS",
    supportEmail: "support@dnsms.com",
    platformUrl: "https://dnsms.com",
    language: "English",
    calendar: "Bikram Sambat (BS)",
    currency: "NPR",
  });

  const [notifs, setNotifs] = useState({
    newSchool: true,
    payment: true,
    overdue: true,
    churn: true,
    systemAlert: true,
    weeklyDigest: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: false,
    ipWhitelist: false,
    auditLog: true,
  });

  const [billing, setBilling] = useState({
    esewa: true,
    khalti: false,
    bankTransfer: true,
    vatRate: "13",
    gracePeriod: "7",
  });

  const [email, setEmail] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smsGateway: "Sparrow SMS",
    smsApiKey: "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.superAdmin.updateSettings({
        general, notifications: notifs, security, billing, email,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure platform-wide settings and integrations</p>
      </div>

      <div className="flex gap-6">
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                activeTab === t.id ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100")}>
              <t.icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0 space-y-4">
          {activeTab === "general" && (
            <>
              <SectionCard title="Platform Identity">
                <SettingRow label="Platform Name" description="Shown in emails and invoices">
                  <input value={general.platformName} onChange={(e) => setGeneral({ ...general, platformName: e.target.value })}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-48" />
                </SettingRow>
                <SettingRow label="Support Email" description="Schools contact this address for help">
                  <input value={general.supportEmail} onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-48" />
                </SettingRow>
                <SettingRow label="Platform URL">
                  <input value={general.platformUrl} onChange={(e) => setGeneral({ ...general, platformUrl: e.target.value })}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-48" />
                </SettingRow>
              </SectionCard>
              <SectionCard title="Regional Settings">
                <SettingRow label="Default Language">
                  <select value={general.language} onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                    <option>English</option>
                    <option>नेपाली</option>
                  </select>
                </SettingRow>
                <SettingRow label="Default Calendar" description="Bikram Sambat or Gregorian">
                  <select value={general.calendar} onChange={(e) => setGeneral({ ...general, calendar: e.target.value })}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                    <option>Bikram Sambat (BS)</option>
                    <option>Gregorian (AD)</option>
                  </select>
                </SettingRow>
                <SettingRow label="Currency">
                  <select value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                    <option value="NPR">NPR — Nepali Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                </SettingRow>
              </SectionCard>
            </>
          )}

          {activeTab === "notifications" && (
            <SectionCard title="Admin Notification Preferences">
              {(Object.entries(notifs) as [keyof typeof notifs, boolean][]).map(([key, val]) => {
                const labels: Record<string, [string, string]> = {
                  newSchool: ["New school registered", "Email me when a new school signs up"],
                  payment: ["Payment received", "Notify on successful subscription payments"],
                  overdue: ["Payment overdue", "Alert when a school is 7+ days overdue"],
                  churn: ["School churned", "Notify when a school cancels their plan"],
                  systemAlert: ["System alerts", "Critical platform errors and downtime"],
                  weeklyDigest: ["Weekly digest", "Summary of platform activity every Monday"],
                };
                const [label, desc] = labels[key] ?? [key, ""];
                return (
                  <SettingRow key={key} label={label} description={desc}>
                    <Toggle checked={val} onChange={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))} />
                  </SettingRow>
                );
              })}
            </SectionCard>
          )}

          {activeTab === "security" && (
            <>
              <SectionCard title="Authentication">
                {(Object.entries(security) as [keyof typeof security, boolean][]).map(([key, val]) => {
                  const labels: Record<string, [string, string]> = {
                    twoFactor: ["Two-Factor Authentication", "Require 2FA for super admin login"],
                    sessionTimeout: ["Session Timeout", "Auto-logout after 30 minutes of inactivity"],
                    ipWhitelist: ["IP Whitelist", "Restrict super admin access to specific IPs"],
                    auditLog: ["Audit Logging", "Log all admin actions for compliance"],
                  };
                  const [label, desc] = labels[key] ?? [key, ""];
                  return (
                    <SettingRow key={key} label={label} description={desc}>
                      <Toggle checked={val} onChange={() => setSecurity((s) => ({ ...s, [key]: !s[key] }))} />
                    </SettingRow>
                  );
                })}
              </SectionCard>
              <SectionCard title="API Keys">
                <SettingRow label="Platform API Key" description="Use this to integrate external services">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1.5 rounded-lg font-mono text-gray-700">
                      {showKey ? "sk_live_dnsms_abc123xyz789" : "sk_live_•••••••••••••••"}
                    </code>
                    <button onClick={() => setShowKey((v) => !v)} className="text-gray-400 hover:text-gray-600">
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </SettingRow>
              </SectionCard>
            </>
          )}

          {activeTab === "billing" && (
            <SectionCard title="Payment Gateway">
              <SettingRow label="eSewa Integration" description="Enable eSewa payment for schools">
                <Toggle checked={billing.esewa} onChange={() => setBilling((b) => ({ ...b, esewa: !b.esewa }))} />
              </SettingRow>
              <SettingRow label="Khalti Integration" description="Enable Khalti payment for schools">
                <Toggle checked={billing.khalti} onChange={() => setBilling((b) => ({ ...b, khalti: !b.khalti }))} />
              </SettingRow>
              <SettingRow label="Bank Transfer" description="Allow manual bank transfer payments">
                <Toggle checked={billing.bankTransfer} onChange={() => setBilling((b) => ({ ...b, bankTransfer: !b.bankTransfer }))} />
              </SettingRow>
              <SettingRow label="Tax Rate (VAT)" description="Applied to all invoices">
                <div className="flex items-center gap-2">
                  <input value={billing.vatRate} onChange={(e) => setBilling((b) => ({ ...b, vatRate: e.target.value }))}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-20 text-right" />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </SettingRow>
              <SettingRow label="Grace Period" description="Days after due date before suspension">
                <div className="flex items-center gap-2">
                  <input value={billing.gracePeriod} onChange={(e) => setBilling((b) => ({ ...b, gracePeriod: e.target.value }))}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-20 text-right" />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </SettingRow>
            </SectionCard>
          )}

          {activeTab === "appearance" && (
            <SectionCard title="Branding">
              <SettingRow label="Primary Color" description="Used in buttons, badges and highlights">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 border-2 border-white ring-2 ring-purple-300 cursor-pointer" />
                  <span className="text-xs text-gray-500 font-mono">#7c3aed</span>
                </div>
              </SettingRow>
              <SettingRow label="Dark Sidebar" description="Super admin uses a dark sidebar by default">
                <Toggle checked={true} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="Compact Mode" description="Reduce padding for information-dense layouts">
                <Toggle checked={false} onChange={() => {}} />
              </SettingRow>
            </SectionCard>
          )}

          {activeTab === "email" && (
            <SectionCard title="Email & SMS Configuration">
              <SettingRow label="SMTP Host">
                <input value={email.smtpHost} onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-48" />
              </SettingRow>
              <SettingRow label="SMTP Port">
                <input value={email.smtpPort} onChange={(e) => setEmail({ ...email, smtpPort: e.target.value })}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-48" />
              </SettingRow>
              <SettingRow label="SMS Gateway" description="Sparrow SMS or Aakash SMS">
                <select value={email.smsGateway} onChange={(e) => setEmail({ ...email, smsGateway: e.target.value })}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white w-48">
                  <option>Sparrow SMS</option>
                  <option>Aakash SMS</option>
                  <option>Ncell API</option>
                </select>
              </SettingRow>
              <SettingRow label="SMS API Key">
                <input type="password" value={email.smsApiKey} onChange={(e) => setEmail({ ...email, smsApiKey: e.target.value })}
                  placeholder="Enter API key..."
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 w-48" />
              </SettingRow>
            </SectionCard>
          )}

          <div className="flex justify-end items-center gap-3">
            {saved && <p className="text-sm text-emerald-600 font-medium">✓ Settings saved</p>}
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
