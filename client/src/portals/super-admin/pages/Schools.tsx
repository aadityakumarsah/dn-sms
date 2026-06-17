import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Download, MoreHorizontal, CheckCircle2, AlertCircle,
  Eye, Edit3, Trash2, RefreshCw, X, ChevronDown, Building2,
  Phone, Mail, MapPin, Calendar, Users, BookOpen, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ─── Nepal Data ───────────────────────────────────────────────────────────────

const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];

const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  Koshi: ["Taplejung", "Panchthar", "Ilam", "Jhapa", "Morang", "Sunsari", "Dhankuta", "Terhathum", "Sankhuwasabha", "Bhojpur", "Solukhumbu", "Okhaldhunga", "Khotang", "Udayapur"],
  Madhesh: ["Saptari", "Siraha", "Dhanusha", "Mahottari", "Sarlahi", "Rautahat", "Bara", "Parsa"],
  Bagmati: ["Sindhupalchok", "Rasuwa", "Nuwakot", "Dhading", "Kathmandu", "Bhaktapur", "Lalitpur", "Kavrepalanchok", "Sindhuli", "Ramechhap", "Dolakha", "Makwanpur", "Chitwan"],
  Gandaki: ["Gorkha", "Manang", "Mustang", "Myagdi", "Kaski", "Lamjung", "Tanahu", "Nawalpur", "Syangja", "Parbat", "Baglung"],
  Lumbini: ["Nawalparasi (W)", "Rupandehi", "Kapilbastu", "Arghakhanchi", "Gulmi", "Palpa", "Dang", "Pyuthan", "Rolpa", "Eastern Rukum", "Banke", "Bardiya"],
  Karnali: ["Dolpa", "Mugu", "Humla", "Jumla", "Kalikot", "Western Rukum", "Salyan", "Dailekh", "Jajarkot", "Surkhet"],
  Sudurpashchim: ["Bajura", "Bajhang", "Achham", "Doti", "Kailali", "Kanchanpur", "Dadeldhura", "Baitadi", "Darchula"],
};

const AFFILIATIONS = [
  "Department of Education (DoE)",
  "National Examination Board (NEB)",
  "Tribhuvan University (TU)",
  "Kathmandu University (KU)",
  "Pokhara University (PU)",
  "Purbanchal University",
  "Far-Western University",
  "Mid-Western University",
  "Agriculture and Forestry University",
  "Lumbini Buddhist University",
  "B.P. Koirala Institute of Health Sciences",
  "Not Affiliated",
];

const SCHOOL_TYPES = [
  { value: "PRIMARY", label: "Primary School (1-5)" },
  { value: "LOWER_SECONDARY", label: "Lower Secondary (1-8)" },
  { value: "SECONDARY", label: "Secondary School (1-10)" },
  { value: "HIGHER_SECONDARY", label: "Higher Secondary (+2)" },
  { value: "COLLEGE", label: "College / Campus" },
  { value: "UNIVERSITY", label: "University" },
];

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  ACTIVE:    { label: "Active",    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  TRIAL:     { label: "Trial",     badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",          dot: "bg-blue-500" },
  PAUSED:    { label: "Paused",    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-500" },
  SUSPENDED: { label: "Suspended", badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          dot: "bg-rose-500" },
  INACTIVE:  { label: "Inactive",  badge: "bg-gray-100 text-gray-500",                              dot: "bg-gray-400" },
};

const PLAN_BADGE: Record<string, string> = {
  enterprise: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  pro:        "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  basic:      "bg-gray-100 text-gray-600",
  free:       "bg-gray-50 text-gray-400",
};

// ─── School Form Modal ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", address: "", city: "", district: "", province: "",
  phone: "", altPhone: "", email: "", website: "",
  principalName: "", principalPhone: "", principalEmail: "",
  establishedYear: "", registrationNo: "", panNo: "",
  affiliatedTo: "", totalCapacity: "",
  schoolType: "SECONDARY", status: "TRIAL", planId: "", notes: "",
};

function SchoolModal({
  open, onClose, initial, plans, onSave
}: {
  open: boolean;
  onClose: () => void;
  initial: any | null;
  plans: any[];
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, string>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("basic");

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name ?? "", address: initial.address ?? "", city: initial.city ?? "",
        district: initial.district ?? "", province: initial.province ?? "",
        phone: initial.phone ?? "", altPhone: initial.altPhone ?? "",
        email: initial.email ?? "", website: initial.website ?? "",
        principalName: initial.principalName ?? "", principalPhone: initial.principalPhone ?? "",
        principalEmail: initial.principalEmail ?? "",
        establishedYear: initial.establishedYear ? String(initial.establishedYear) : "",
        registrationNo: initial.registrationNo ?? "", panNo: initial.panNo ?? "",
        affiliatedTo: initial.affiliatedTo ?? "", totalCapacity: initial.totalCapacity ? String(initial.totalCapacity) : "",
        schoolType: initial.schoolType ?? "SECONDARY", status: initial.status ?? "TRIAL",
        planId: initial.planId ?? initial.subscription?.planId ?? "",
        notes: initial.notes ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
    setTab("basic");
  }, [initial, open]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("School name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const districts = form.province ? (DISTRICTS_BY_PROVINCE[form.province] ?? []) : [];
  const TABS = ["basic", "location", "principal", "plan"];

  const InputField = ({ label, k, type = "text", placeholder = "", required = false }: any) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input type={type} value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all" />
    </div>
  );

  const SelectField = ({ label, k, options, required = false }: any) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select value={form[k]} onChange={(e) => set(k, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 bg-white">
        <option value="">— Select —</option>
        {options.map((o: any) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">{initial ? "Edit School" : "Register New School"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">All institutions across Nepal</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-100">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-2 text-xs font-medium rounded-t-lg capitalize transition-colors",
                tab === t ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500" : "text-gray-400 hover:text-gray-600")}>
              {t === "plan" ? "Plan & Status" : t === "basic" ? "School Info" : t === "location" ? "Location" : "Principal"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100">{error}</div>
          )}

          {tab === "basic" && (
            <div className="space-y-4">
              <InputField label="School / College / University Name" k="name" required placeholder="e.g. Bagmati Secondary School" />
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Institution Type" k="schoolType" required
                  options={SCHOOL_TYPES} />
                <InputField label="Established Year (BS)" k="establishedYear" type="number" placeholder="e.g. 2040" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Registration Number" k="registrationNo" placeholder="School reg. no." />
                <InputField label="PAN / VAT Number" k="panNo" placeholder="PAN number" />
              </div>
              <SelectField label="Affiliated To / Board" k="affiliatedTo" options={AFFILIATIONS} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Phone Number" k="phone" placeholder="01-4xxxxxx" />
                <InputField label="Alternate Phone" k="altPhone" placeholder="9841xxxxxx" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Email Address" k="email" type="email" placeholder="school@email.com" />
                <InputField label="Website" k="website" placeholder="https://school.edu.np" />
              </div>
              <InputField label="Total Student Capacity" k="totalCapacity" type="number" placeholder="e.g. 800" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes (Internal)</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  rows={2} placeholder="Internal notes about this school..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
              </div>
            </div>
          )}

          {tab === "location" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Province" k="province" required
                  options={PROVINCES.map((p) => ({ value: p, label: p }))} />
                <SelectField label="District" k="district" required
                  options={districts.map((d) => ({ value: d, label: d }))} />
              </div>
              <InputField label="City / Municipality" k="city" placeholder="e.g. Kathmandu Metropolitan" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Address</label>
                <textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={3}
                  placeholder="Street/Tole, Ward No., VDC/Municipality..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
              </div>
            </div>
          )}

          {tab === "principal" && (
            <div className="space-y-4">
              <InputField label="Principal / Head Name" k="principalName" required placeholder="Full name" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Principal Phone" k="principalPhone" placeholder="9841xxxxxx" />
                <InputField label="Principal Email" k="principalEmail" type="email" placeholder="principal@school.edu.np" />
              </div>
            </div>
          )}

          {tab === "plan" && (
            <div className="space-y-5">
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Account Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <button key={val} onClick={() => set("status", val)}
                      className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left",
                        form.status === val
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-100 hover:border-gray-200 text-gray-600")}>
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", cfg.dot)} />
                      <div>
                        <p className="font-semibold text-sm">{cfg.label}</p>
                        <p className="text-xs text-gray-400 font-normal">
                          {val === "ACTIVE" && "Full access, paid"}
                          {val === "TRIAL" && "14-day free trial"}
                          {val === "PAUSED" && "Service paused, no access"}
                          {val === "SUSPENDED" && "Suspended for non-payment"}
                          {val === "INACTIVE" && "Closed / decommissioned"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Subscription Plan</label>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <button key={plan.id} onClick={() => set("planId", plan.id)}
                      className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
                        form.planId === plan.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-100 hover:border-gray-200")}>
                      <div className="flex items-center gap-3">
                        <span className={cn("w-2.5 h-2.5 rounded-full",
                          plan.slug === "enterprise" ? "bg-purple-500" :
                          plan.slug === "pro" ? "bg-blue-500" :
                          plan.slug === "basic" ? "bg-sky-400" : "bg-gray-300")} />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                          <p className="text-xs text-gray-400">{plan.features?.slice(0, 2).join(" · ")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {Number(plan.price) === 0 ? "Free" : `NPR ${Number(plan.price).toLocaleString()}`}
                        </p>
                        <p className="text-xs text-gray-400">/month</p>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => set("planId", "")}
                    className={cn("w-full text-sm px-4 py-2 rounded-xl border-2 text-gray-400 hover:border-gray-200 transition-all",
                      !form.planId ? "border-gray-300 text-gray-600" : "border-gray-100")}>
                    No plan assigned yet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-2">
            {TABS.indexOf(tab) > 0 && (
              <button onClick={() => setTab(TABS[TABS.indexOf(tab) - 1])}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-white transition-colors">
                ← Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </button>
            {TABS.indexOf(tab) < TABS.length - 1 ? (
              <button onClick={() => setTab(TABS[TABS.indexOf(tab) + 1])}
                className="px-5 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium">
                Next →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium">
                {saving ? "Saving..." : initial ? "Update School" : "Register School"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── School Detail Panel ──────────────────────────────────────────────────────

function SchoolDetail({ id, onClose, onEdit, plans }: { id: string; onClose: () => void; onEdit: () => void; plans: any[] }) {
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.superAdmin.getSchool(id).then(setSchool).finally(() => setLoading(false));
  }, [id]);

  const planMap: Record<string, any> = {};
  for (const p of plans) planMap[p.id] = p;

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full sm:w-96 h-64 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!school) return null;
  const cfg = STATUS_CONFIG[school.status] ?? STATUS_CONFIG.INACTIVE;
  const planName = school.subscription?.plan?.name ?? "None";
  const planSlug = school.subscription?.plan?.slug ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full sm:w-[480px] overflow-y-auto shadow-2xl">
        {/* Top */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-base">
              {school.name[0]}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm leading-tight">{school.name}</h2>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.badge)}>{cfg.label}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium">Edit</button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Users", value: school._count?.users ?? 0, icon: Users },
              { label: "Students", value: school._count?.students ?? 0, icon: BookOpen },
              { label: "Staff", value: school._count?.staff ?? 0, icon: Users },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Plan */}
          <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-500 font-medium">Current Plan</p>
              <p className="text-base font-bold text-purple-900 mt-0.5">{planName}</p>
              {school.subscription && (
                <p className="text-xs text-purple-400 mt-0.5">
                  Sub status: {school.subscription.status}
                </p>
              )}
            </div>
            <CreditCard className="w-6 h-6 text-purple-300" />
          </div>

          {/* Details */}
          {[
            { icon: Building2, label: "Type", value: SCHOOL_TYPES.find((t) => t.value === school.schoolType)?.label ?? school.schoolType },
            { icon: MapPin, label: "Location", value: [school.address, school.city, school.district, school.province].filter(Boolean).join(", ") || "—" },
            { icon: Phone, label: "Phone", value: [school.phone, school.altPhone].filter(Boolean).join(" / ") || "—" },
            { icon: Mail, label: "Email", value: school.email || "—" },
            { icon: Calendar, label: "Est. Year (BS)", value: school.establishedYear ? String(school.establishedYear) : "—" },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{row.label}</p>
                  <p className="text-sm text-gray-800 font-medium mt-0.5">{row.value}</p>
                </div>
              </div>
            );
          })}

          {/* Principal */}
          {school.principalName && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Principal</p>
              <p className="text-sm font-semibold text-gray-900">{school.principalName}</p>
              {school.principalPhone && <p className="text-xs text-gray-400 mt-0.5">{school.principalPhone}</p>}
              {school.principalEmail && <p className="text-xs text-gray-400">{school.principalEmail}</p>}
            </div>
          )}

          {/* Registration */}
          {(school.registrationNo || school.panNo || school.affiliatedTo) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legal Info</p>
              {school.registrationNo && <p className="text-sm text-gray-700"><span className="text-gray-400">Reg No:</span> {school.registrationNo}</p>}
              {school.panNo && <p className="text-sm text-gray-700"><span className="text-gray-400">PAN:</span> {school.panNo}</p>}
              {school.affiliatedTo && <p className="text-sm text-gray-700"><span className="text-gray-400">Affiliated:</span> {school.affiliatedTo}</p>}
            </div>
          )}

          {/* Notes */}
          {school.notes && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Internal Notes</p>
              <p className="text-sm text-amber-800">{school.notes}</p>
            </div>
          )}

          {/* Recent transactions */}
          {school.billingTransactions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Payments</p>
              <div className="space-y-2">
                {school.billingTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-gray-700">{tx.description ?? "Payment"}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">NPR {Number(tx.amount).toLocaleString()}</p>
                      <span className={cn("text-xs font-medium", tx.status === "PAID" ? "text-emerald-600" : "text-amber-600")}>{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ id, current, onChange }: { id: string; current: string; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const cfg = STATUS_CONFIG[current] ?? STATUS_CONFIG.INACTIVE;

  const handleChange = async (status: string) => {
    setOpen(false);
    setLoading(true);
    await api.superAdmin.updateSchool(id, { status });
    setLoading(false);
    onChange();
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors", cfg.badge)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden">
            {Object.entries(STATUS_CONFIG).map(([val, c]) => (
              <button key={val} onClick={() => handleChange(val)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors",
                  val === current ? "bg-gray-50 font-semibold" : "")}>
                <span className={cn("w-2 h-2 rounded-full shrink-0", c.dot)} />
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUSES = ["", "ACTIVE", "TRIAL", "PAUSED", "SUSPENDED", "INACTIVE"];

export default function Schools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editSchool, setEditSchool] = useState<any | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.superAdmin.schools({ page, search, status: statusFilter || undefined })
      .then((res) => { setSchools(res.schools); setTotal(res.total); })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => {
    api.superAdmin.plans().then(setPlans);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);

  const handleCreate = async (data: any) => {
    await api.superAdmin.createSchool(data);
    load();
  };

  const handleEdit = async (data: any) => {
    await api.superAdmin.updateSchool(editSchool.id, data);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this school? This cannot be undone.")) return;
    await api.superAdmin.deleteSchool(id);
    load();
  };

  const openEdit = (school: any) => { setEditSchool(school); setModalOpen(true); };
  const totalPages = Math.ceil(total / 20);

  const summaryStats = [
    { label: "Total", value: total, color: "text-gray-900" },
    { label: "Active", value: schools.filter((s) => s.status === "ACTIVE").length + (statusFilter === "ACTIVE" ? 0 : 0), color: "text-emerald-600" },
    { label: "Trial", value: schools.filter((s) => s.status === "TRIAL").length, color: "text-blue-600" },
    { label: "Paused", value: schools.filter((s) => s.status === "PAUSED" || s.status === "SUSPENDED").length, color: "text-rose-500" },
  ];

  return (
    <>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Schools & Institutions</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} institutions registered on DN-SMS</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
            <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={() => { setEditSchool(null); setModalOpen(true); }}
              className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Register School
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryStats.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">{c.label}</p>
              <p className={cn("text-2xl font-bold mt-0.5", c.color)}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, district, principal..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-600">
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s || "All Statuses"}</option>
              ))}
            </select>
          </div>

          {selected.length > 0 && (
            <div className="px-5 py-2.5 bg-purple-50 border-b border-purple-100 flex items-center gap-4 text-sm">
              <span className="font-medium text-purple-700">{selected.length} selected</span>
              <button className="text-gray-600 hover:text-gray-800">Bulk Update</button>
              <button onClick={() => setSelected([])} className="ml-auto text-gray-400 text-xs">Clear</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" className="rounded"
                      checked={selected.length === schools.length && schools.length > 0}
                      onChange={() => setSelected(selected.length === schools.length ? [] : schools.map((s) => s.id))} />
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Institution</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Location</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Users</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {loading && schools.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : schools.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    No schools found. <button onClick={() => { setEditSchool(null); setModalOpen(true); }} className="text-purple-600 hover:underline">Register the first one →</button>
                  </td></tr>
                ) : schools.map((s) => (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {SCHOOL_TYPES.find((t) => t.value === s.schoolType)?.label?.split(" (")[0] ?? s.schoolType}
                            {s.principalName && ` · ${s.principalName}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-700">{s.district ?? "—"}</p>
                      <p className="text-xs text-gray-400">{s.province ? `${s.province} Province` : ""}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", PLAN_BADGE[s.planSlug ?? ""] ?? "bg-gray-50 text-gray-400")}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-700">{s.userCount}</p>
                      <p className="text-xs text-gray-400">{s.studentCount} students</p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusDropdown id={s.id} current={s.status} onChange={load} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDetailId(s.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Showing {schools.length} of {total} institutions</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={cn("text-xs px-2.5 py-1.5 rounded-lg font-medium",
                    n === page ? "bg-purple-600 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50")}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SchoolModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditSchool(null); }}
        initial={editSchool}
        plans={plans}
        onSave={editSchool ? handleEdit : handleCreate}
      />

      {detailId && (
        <SchoolDetail
          id={detailId}
          plans={plans}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            const s = schools.find((x) => x.id === detailId);
            if (s) { setDetailId(null); openEdit(s); }
          }}
        />
      )}
    </>
  );
}
