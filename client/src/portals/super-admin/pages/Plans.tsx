import { useState, useEffect } from "react";
import {
  Plus, Edit3, Trash2, Check, X, RefreshCw, CreditCard,
  TrendingUp, Users, Zap, Star, Building2, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ─── Plan Modal ───────────────────────────────────────────────────────────────

const FEATURE_PRESETS: Record<string, string[]> = {
  free:       ["Basic attendance tracking", "Fee collection", "Notices board", "Up to 50 students"],
  basic:      ["Everything in Free", "Exam management", "Reports export", "SMS notifications", "Up to 200 students"],
  pro:        ["Everything in Basic", "Payroll management", "Inventory tracking", "Analytics dashboard", "Custom branding", "Up to 1000 students"],
  enterprise: ["Everything in Pro", "Unlimited students & teachers", "Dedicated support", "API access", "Custom domain", "Priority onboarding"],
};

function PlanModal({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void; initial: any | null;
  onSave: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [annualPrice, setAnnualPrice] = useState("");
  const [maxStudents, setMaxStudents] = useState("-1");
  const [maxTeachers, setMaxTeachers] = useState("-1");
  const [maxStorageMB, setMaxStorageMB] = useState("-1");
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? ""); setSlug(initial.slug ?? "");
      setPrice(String(initial.price ?? "")); setAnnualPrice(initial.annualPrice ? String(initial.annualPrice) : "");
      setMaxStudents(String(initial.maxStudents ?? -1));
      setMaxTeachers(String(initial.maxTeachers ?? -1));
      setMaxStorageMB(String(initial.maxStorageMB ?? -1));
      setFeatures(initial.features ?? []); setIsActive(initial.isActive ?? true);
    } else {
      setName(""); setSlug(""); setPrice(""); setAnnualPrice("");
      setMaxStudents("-1"); setMaxTeachers("-1"); setMaxStorageMB("-1");
      setFeatures([]); setIsActive(true);
    }
    setError(null);
  }, [initial, open]);

  const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async () => {
    if (!name || !slug || price === "") { setError("Name, slug, and price are required"); return; }
    setSaving(true); setError(null);
    try {
      await onSave({
        name, slug, price: parseFloat(price),
        annualPrice: annualPrice ? parseFloat(annualPrice) : null,
        maxStudents: parseInt(maxStudents), maxTeachers: parseInt(maxTeachers),
        maxStorageMB: parseInt(maxStorageMB), features, isActive,
      });
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">{initial ? "Edit Plan" : "Create New Plan"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Plan Name <span className="text-rose-500">*</span></label>
              <input value={name} onChange={(e) => { setName(e.target.value); if (!initial) setSlug(autoSlug(e.target.value)); }}
                placeholder="e.g. Pro" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Slug <span className="text-rose-500">*</span></label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. pro"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Monthly Price (NPR) <span className="text-rose-500">*</span></label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Annual Price (NPR)</label>
              <input type="number" value={annualPrice} onChange={(e) => setAnnualPrice(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Max Students", val: maxStudents, set: setMaxStudents },
              { label: "Max Teachers", val: maxTeachers, set: setMaxTeachers },
              { label: "Storage (MB)", val: maxStorageMB, set: setMaxStorageMB },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                <input type="number" value={val} onChange={(e) => set(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400" />
                <p className="text-xs text-gray-400 mt-1">-1 = unlimited</p>
              </div>
            ))}
          </div>
          {!initial && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Quick-fill features:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(FEATURE_PRESETS).map((k) => (
                  <button key={k} onClick={() => setFeatures(FEATURE_PRESETS[k])}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-purple-50 hover:text-purple-700 capitalize transition-colors">{k}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Features</label>
            <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{f}</span>
                  <button onClick={() => setFeatures(features.filter((_, j) => j !== i))} className="text-gray-300 hover:text-rose-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newFeature} onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newFeature.trim()) { setFeatures([...features, newFeature.trim()]); setNewFeature(""); } }}
                placeholder="Add feature and press Enter..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400" />
              <button onClick={() => { if (newFeature.trim()) { setFeatures([...features, newFeature.trim()]); setNewFeature(""); } }}
                className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          {initial && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <button onClick={() => setIsActive(!isActive)}
                className={cn("w-10 h-5 rounded-full transition-colors relative", isActive ? "bg-purple-500" : "bg-gray-200")}>
                <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", isActive ? "translate-x-5" : "translate-x-0.5")} />
              </button>
              <span className="text-sm text-gray-700">Plan is {isActive ? "active" : "inactive"}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium">
            {saving ? "Saving..." : initial ? "Update Plan" : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function PaymentModal({ open, onClose, schools, onSave }: {
  open: boolean; onClose: () => void; schools: any[]; onSave: (data: any) => Promise<void>;
}) {
  const [schoolId, setSchoolId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("eSewa");
  const [description, setDescription] = useState("Monthly subscription");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!schoolId || !amount) { setError("School and amount are required"); return; }
    setSaving(true); setError(null);
    try {
      await onSave({ schoolId, amount: parseFloat(amount), paymentMethod: method, description, status: "PAID" });
      setSchoolId(""); setAmount(""); setMethod("eSewa"); setDescription("Monthly subscription");
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">School <span className="text-rose-500">*</span></label>
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 bg-white">
              <option value="">— Select school —</option>
              {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (NPR) <span className="text-rose-500">*</span></label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 bg-white">
                {["eSewa", "Khalti", "IME Pay", "Bank Transfer", "Cash", "Cheque", "Manual"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-medium">
            {saving ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const PLAN_COLORS = ["bg-gray-300", "bg-sky-400", "bg-blue-500", "bg-purple-500", "bg-indigo-500"];
const PLAN_ICONS = [Zap, Star, TrendingUp, Building2, CheckCircle2];

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-600",
  OVERDUE: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-gray-100 text-gray-500",
};

export default function Plans() {
  const [tab, setTab] = useState<"plans" | "payments">("plans");
  const [plans, setPlans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any>({ transactions: [], total: 0, totalRevenue: 0, mrr: 0 });
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [planModal, setPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [payModal, setPayModal] = useState(false);

  const loadPlans = () => {
    setLoading(true);
    api.superAdmin.plans().then(setPlans).finally(() => setLoading(false));
  };
  const loadPayments = () => {
    setLoading(true);
    api.superAdmin.payments({ page }).then(setPayments).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlans();
    api.superAdmin.schools({ limit: 200 }).then((r) => setSchools(r.schools));
    api.superAdmin.payments().then(setPayments);
  }, []);

  useEffect(() => { if (tab === "payments") loadPayments(); }, [tab, page]);

  const totalMRR = plans.reduce((s, p) => s + (Number(p.price) * (p._count?.subscriptions ?? 0)), 0);

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Plans & Billing</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage subscription plans and track revenue</p>
          </div>
          <div className="flex gap-2">
            <button onClick={tab === "plans" ? loadPlans : loadPayments}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
            {tab === "plans" ? (
              <button onClick={() => { setEditPlan(null); setPlanModal(true); }}
                className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-purple-700">
                <Plus className="w-3.5 h-3.5" /> New Plan
              </button>
            ) : (
              <button onClick={() => setPayModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-emerald-700">
                <Plus className="w-3.5 h-3.5" /> Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Est. Monthly Revenue", value: `NPR ${totalMRR.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
            { label: "All-time Revenue", value: `NPR ${Number(payments.totalRevenue ?? 0).toLocaleString()}`, icon: CreditCard, color: "text-blue-600 bg-blue-50" },
            { label: "This Month", value: `NPR ${Number(payments.mrr ?? 0).toLocaleString()}`, icon: CheckCircle2, color: "text-purple-600 bg-purple-50" },
            { label: "Active Plans", value: plans.filter((p) => p.isActive).length, icon: Zap, color: "text-amber-600 bg-amber-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-sm font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100">
          {(["plans", "payments"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2",
                tab === t ? "border-purple-500 text-purple-700" : "border-transparent text-gray-400 hover:text-gray-600")}>
              {t}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        {tab === "plans" && (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-72 animate-pulse">
                <div className="w-8 h-8 bg-gray-100 rounded-xl mb-4" /><div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-7 bg-gray-100 rounded w-1/2" />
              </div>
            )) : plans.map((plan, i) => {
              const Icon = PLAN_ICONS[i % PLAN_ICONS.length];
              const subCount = plan._count?.subscriptions ?? 0;
              return (
                <div key={plan.id} className={cn("bg-white rounded-2xl border-2 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow",
                  plan.slug === "pro" ? "border-blue-200" : plan.slug === "enterprise" ? "border-purple-200" : "border-gray-100")}>
                  <div className="flex items-start justify-between">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white", PLAN_COLORS[i % PLAN_COLORS.length])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditPlan(plan); setPlanModal(true); }}
                        className="p-1.5 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => {
                        if (!confirm(`Delete ${plan.name}?`)) return;
                        await api.superAdmin.deletePlan(plan.id).catch((e: any) => alert(e.message));
                        loadPlans();
                      }} className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{plan.name}</h3>
                      {!plan.isActive && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {Number(plan.price) === 0 ? "Free" : `NPR ${Number(plan.price).toLocaleString()}`}
                      {Number(plan.price) > 0 && <span className="text-sm font-normal text-gray-400">/mo</span>}
                    </p>
                    {plan.annualPrice && <p className="text-xs text-emerald-600 mt-0.5">NPR {Number(plan.annualPrice).toLocaleString()}/yr</p>}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {(plan.features ?? []).slice(0, 5).map((f: string, fi: number) => (
                      <div key={fi} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="text-xs text-gray-600">{f}</span>
                      </div>
                    ))}
                    {(plan.features ?? []).length > 5 && <p className="text-xs text-gray-400">+{plan.features.length - 5} more</p>}
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700">{subCount} school{subCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">MRR</p>
                      <p className="text-xs font-bold text-emerald-600">NPR {(Number(plan.price) * subCount).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                    {[
                      { label: "Students", val: plan.maxStudents },
                      { label: "Teachers", val: plan.maxTeachers },
                      { label: "Storage", val: plan.maxStorageMB, suffix: " MB" },
                    ].map(({ label, val, suffix = "" }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-gray-700">{val === -1 ? "Unlimited" : `${val}${suffix}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payments Table */}
        {tab === "payments" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {["Invoice", "School", "Amount (NPR)", "Method", "Description", "Date", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td></tr>
                  ) : payments.transactions?.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                      No payments recorded yet.{" "}
                      <button onClick={() => setPayModal(true)} className="text-purple-600 hover:underline">Record the first one →</button>
                    </td></tr>
                  ) : payments.transactions?.map((tx: any) => (
                    <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{tx.invoiceNo}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{tx.school?.name ?? "—"}</td>
                      <td className="px-5 py-3 font-bold text-gray-900">{Number(tx.amount).toLocaleString()}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{tx.paymentMethod ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{tx.description ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", PAYMENT_STATUS_BADGE[tx.status] ?? "bg-gray-100 text-gray-500")}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {payments.total > 20 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">{payments.transactions?.length} of {payments.total}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={(payments.transactions?.length ?? 0) < 20}
                    className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PlanModal open={planModal} onClose={() => { setPlanModal(false); setEditPlan(null); }}
        initial={editPlan} onSave={editPlan ? async (d) => { await api.superAdmin.updatePlan(editPlan.id, d); loadPlans(); } : async (d) => { await api.superAdmin.createPlan(d); loadPlans(); }} />
      <PaymentModal open={payModal} onClose={() => setPayModal(false)} schools={schools}
        onSave={async (d) => { await api.superAdmin.recordPayment(d); loadPayments(); }} />
    </>
  );
}
