import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert, Plus, Trash2, Search, Loader2, X,
  CheckCircle2, AlertTriangle, AlertCircle, ChevronDown,
  RefreshCw, User, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: "NAILS",       label: "Nails",          emoji: "💅" },
  { value: "HAIR",        label: "Hair",            emoji: "✂️" },
  { value: "UNIFORM",     label: "Uniform",         emoji: "👔" },
  { value: "ID_CARD",     label: "ID Card",         emoji: "🪪" },
  { value: "MOBILE_PHONE",label: "Mobile Phone",    emoji: "📱" },
  { value: "PUNCTUALITY", label: "Punctuality",     emoji: "⏰" },
  { value: "BEHAVIOR",    label: "Behavior",        emoji: "🗣️" },
  { value: "CLEANLINESS", label: "Cleanliness",     emoji: "🧹" },
  { value: "OTHER",       label: "Other",           emoji: "📋" },
];

const SEVERITIES = [
  { value: "MINOR",    label: "Minor",    color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { value: "MODERATE", label: "Moderate", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "SERIOUS",  label: "Serious",  color: "text-rose-600 bg-rose-50 border-rose-200"   },
];

function severityStyle(s: string) {
  return SEVERITIES.find((x) => x.value === s)?.color ?? "text-gray-500 bg-gray-50 border-gray-200";
}
function categoryLabel(c: string) {
  return CATEGORIES.find((x) => x.value === c) ?? { label: c, emoji: "📋" };
}

// ─── Add Record Modal ─────────────────────────────────────────────────────────
function AddRecordModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const fld = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-400 bg-white";
  const [search,      setSearch]      = useState("");
  const [students,    setStudents]    = useState<any[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [selected,    setSelected]    = useState<any | null>(null);
  const [category,    setCategory]    = useState("UNIFORM");
  const [severity,    setSeverity]    = useState("MINOR");
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!search.trim()) { setStudents([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setStudents(await api.di.students(search)); }
      catch { /**/ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const save = async () => {
    if (!selected) { setError("Select a student"); return; }
    if (!description.trim()) { setError("Description is required"); return; }
    setSaving(true); setError("");
    try {
      await api.di.create({ studentId: selected.id, category, severity, description, actionTaken: actionTaken || null });
      onAdded();
    } catch (e: any) { setError(e.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h2 className="text-base font-semibold text-gray-900">New Discipline Record</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>}

          {/* Student search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Student <span className="text-rose-500">*</span></label>
            {selected ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-900 truncate">{selected.name}</p>
                  <p className="text-xs text-blue-600">{selected.className ?? "—"} · {selected.admissionNo}</p>
                </div>
                <button onClick={() => { setSelected(null); setSearch(""); }} className="text-blue-400 hover:text-blue-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or admission no…"
                  className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-400" />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                {students.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {students.map((s) => (
                      <button key={s.id} onClick={() => { setSelected(s); setSearch(""); setStudents([]); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.className ?? "—"} · {s.admissionNo}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                  className={cn("flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all",
                    category === c.value
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "border-gray-200 text-gray-600 hover:border-rose-300 hover:bg-rose-50")}>
                  <span>{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Severity</label>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button key={s.value} type="button" onClick={() => setSeverity(s.value)}
                  className={cn("flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                    severity === s.value ? s.color + " shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300")}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description <span className="text-rose-500">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Describe the violation in detail…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
          </div>

          {/* Action */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Action Taken (optional)</label>
            <input value={actionTaken} onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Verbal warning, sent to principal…"
              className={fld.replace("bg-white", "")} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 font-medium flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save Record"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record Card ──────────────────────────────────────────────────────────────
function RecordCard({ record, onDelete, onUpdate }: {
  record: any;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [action,     setAction]     = useState(record.actionTaken ?? "");
  const [notified,   setNotified]   = useState(record.parentNotified);
  const [saving,     setSaving]     = useState(false);
  const cat = categoryLabel(record.category);

  const save = async () => {
    setSaving(true);
    try { await onUpdate(record.id, { actionTaken: action, parentNotified: notified }); }
    finally { setSaving(false); }
  };

  return (
    <div className={cn("bg-white rounded-2xl border overflow-hidden transition-all",
      record.severity === "SERIOUS" ? "border-rose-200" : record.severity === "MODERATE" ? "border-orange-200" : "border-gray-100")}>
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/40"
        onClick={() => setExpanded((v) => !v)}>
        <div className="text-xl mt-0.5 shrink-0">{cat.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{record.studentName}</p>
            {record.className && <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">{record.className}</span>}
            <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded-md border", severityStyle(record.severity))}>
              {record.severity}
            </span>
            {record.parentNotified && (
              <span className="text-[11px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Send className="w-3 h-3" /> Parent notified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.label} · {record.description}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {new Date(record.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} · Reported by {record.reportedBy}
          </p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 mt-0.5 transition-transform", expanded && "rotate-180")} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50/30 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Full Description</p>
            <p className="text-sm text-gray-700">{record.description}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Action Taken</label>
            <input value={action} onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. Verbal warning given, letter sent home…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300 bg-white" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={notified} onChange={(e) => setNotified(e.target.checked)}
                className="w-4 h-4 accent-rose-500" />
              <span className="text-sm text-gray-700">Parent / Guardian notified</span>
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => onDelete(record.id)}
                className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={save} disabled={saving}
                className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-50 flex items-center gap-1 font-medium">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function DisciplineManager() {
  const [records,   setRecords]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [showAdd,   setShowAdd]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [sevFilter, setSevFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRecords(await api.di.records()); }
    catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discipline record?")) return;
    try { await api.di.delete(id); setRecords((r) => r.filter((x) => x.id !== id)); }
    catch (e: any) { alert(e.message); }
  };

  const handleUpdate = async (id: string, data: any) => {
    const updated = await api.di.update(id, data);
    setRecords((r) => r.map((x) => x.id === id ? { ...x, ...data } : x));
    return updated;
  };

  const filtered = records.filter((r) => {
    if (search && !r.studentName.toLowerCase().includes(search.toLowerCase()) &&
        !r.studentAdmissionNo?.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && r.category !== catFilter) return false;
    if (sevFilter && r.severity !== sevFilter) return false;
    return true;
  });

  // Summary stats
  const today = new Date().toDateString();
  const stats = {
    total: records.length,
    today: records.filter((r) => new Date(r.createdAt).toDateString() === today).length,
    serious: records.filter((r) => r.severity === "SERIOUS").length,
    unnotified: records.filter((r) => !r.parentNotified).length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {showAdd && (
        <AddRecordModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Discipline Records
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage student discipline — reports are shared with parents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> New Record
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Records",     value: stats.total,      icon: ShieldAlert,    color: "text-rose-600 bg-rose-50" },
            { label: "Today",             value: stats.today,      icon: AlertCircle,    color: "text-blue-600 bg-blue-50" },
            { label: "Serious Cases",     value: stats.serious,    icon: AlertTriangle,  color: "text-orange-600 bg-orange-50" },
            { label: "Parents Unnotified",value: stats.unnotified, icon: User,           color: "text-amber-600 bg-amber-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student…"
            className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300 bg-white">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
        </select>
        <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300 bg-white">
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(search || catFilter || sevFilter) && (
          <button onClick={() => { setSearch(""); setCatFilter(""); setSevFilter(""); }}
            className="text-sm text-gray-400 hover:text-gray-600 px-2">Clear</button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error.includes("DI") ? 'Your account needs the designation "DI" to access this page.' : error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Records */}
      {!loading && !error && (
        filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <ShieldAlert className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              {records.length === 0 ? "No discipline records yet" : "No records match the filters"}
            </p>
            {records.length === 0 && (
              <button onClick={() => setShowAdd(true)}
                className="mt-3 text-sm text-rose-500 hover:underline">Add first record →</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 px-1">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
            {filtered.map((r) => (
              <RecordCard key={r.id} record={r} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
