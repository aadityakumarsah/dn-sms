import { useState, useEffect } from "react";
import { Save, RefreshCw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const TABS = ["General", "Academic", "Fees", "Notifications"] as const;
type Tab = typeof TABS[number];

export default function Settings() {
  const [tab, setTab] = useState<Tab>("General");
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.admin.settings().then((d) => { setForm(d ?? {}); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    try { await api.admin.updateSettings(form); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    finally { setSaving(false); }
  };

  const F = ({ label, k, type = "text", placeholder = "", half = false }: { label: string; k: string; type?: string; placeholder?: string; half?: boolean }) => (
    <div className={half ? "col-span-1" : ""}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {type === "textarea" ? (
        <textarea value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={placeholder} rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
      ) : (
        <input type={type} value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
      )}
    </div>
  );

  const Toggle = ({ label, k, desc }: { label: string; k: string; desc?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button type="button" onClick={() => setForm({ ...form, [k]: !form[k] })}
        className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none",
          form[k] ? "bg-blue-500" : "bg-gray-200")}>
        <span className={cn("pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          form[k] ? "translate-x-5" : "translate-x-0")} />
      </button>
    </div>
  );

  if (loading) return (
    <div className="p-6 space-y-5">
      <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your school configuration</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50">
          {saved ? <CheckCircle className="w-4 h-4" /> : saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-sm">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors",
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {tab === "General" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">School Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <F label="School Name" k="schoolName" placeholder="Bagmati Secondary School" half />
              <F label="School Code" k="schoolCode" placeholder="079/080" half />
            </div>
            <F label="Address" k="address" placeholder="Kathmandu, Bagmati Province" />
            <div className="grid grid-cols-2 gap-4">
              <F label="Phone" k="phone" placeholder="+977 01-XXXXXXX" half />
              <F label="Email" k="email" type="email" placeholder="info@school.edu.np" half />
            </div>
            <F label="Website" k="website" placeholder="https://school.edu.np" />
            <F label="About / Description" k="description" type="textarea" placeholder="Brief description of your school..." />
          </div>
        )}

        {tab === "Academic" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Academic Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <F label="Academic Year" k="currentAcademicYear" placeholder="2081/82 BS" half />
              <F label="School Type" k="schoolType" placeholder="Secondary" half />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="School Start Time" k="startTime" type="time" half />
              <F label="School End Time" k="endTime" type="time" half />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Working Days</label>
              <div className="flex gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => {
                  const days: string[] = form.workingDays ?? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
                  const active = days.includes(d);
                  return (
                    <button key={d} type="button" onClick={() => {
                      const next = active ? days.filter((x) => x !== d) : [...days, d];
                      setForm({ ...form, workingDays: next });
                    }}
                      className={cn("text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all",
                        active ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "Fees" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Fee Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <F label="Currency" k="currency" placeholder="NPR" half />
              <F label="Fee Due Day of Month" k="feeDueDay" type="number" placeholder="10" half />
            </div>
            <Toggle label="Auto late fee" k="autoLateFee" desc="Automatically mark fees as overdue after due date" />
            <Toggle label="Send fee reminders" k="feeReminders" desc="Send reminders to parents for pending fees" />
            <Toggle label="Allow partial payments" k="allowPartialPayments" desc="Accept payments less than full amount" />
          </div>
        )}

        {tab === "Notifications" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Notification Preferences</h3>
            <Toggle label="Email notifications" k="emailNotifications" desc="Send email updates for important events" />
            <Toggle label="Attendance alerts" k="attendanceAlerts" desc="Notify parents when student is absent" />
            <Toggle label="Fee payment reminders" k="feeRemindersEnabled" desc="Automated payment reminders" />
            <Toggle label="Exam notifications" k="examNotifications" desc="Notify about upcoming exams and results" />
            <Toggle label="Notice board alerts" k="noticeAlerts" desc="Push important notices to all users" />
          </div>
        )}
      </div>
    </div>
  );
}
