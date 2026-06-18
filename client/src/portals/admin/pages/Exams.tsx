import { useState, useEffect } from "react";
import { Plus, X, RefreshCw, Calendar, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const EXAM_TYPES = ["UNIT_TEST", "TERMINAL", "FINAL", "PRACTICAL", "BOARD"];
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SCHEDULED: { label: "Scheduled", color: "bg-blue-50 text-blue-700",       icon: Calendar },
  ONGOING:   { label: "Ongoing",   color: "bg-amber-50 text-amber-700",     icon: Clock },
  COMPLETED: { label: "Completed", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500",      icon: AlertTriangle },
};

function ExamModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", type: "TERMINAL", startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setForm({ name: "", type: "TERMINAL", startDate: "", endDate: "" }); setError(""); } }, [open]);
  if (!open) return null;

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) { setError("All fields are required"); return; }
    setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Schedule Exam</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Exam Name <span className="text-rose-400">*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. First Terminal Exam 2081"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Exam Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date <span className="text-rose-400">*</span></label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">End Date <span className="text-rose-400">*</span></label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Scheduling..." : "Schedule Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoutinePanel({ exam }: { exam: any; onRefresh: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<"DAY" | "MORNING">("DAY");
  const [form, setForm] = useState({ subjectName: "", examDate: "", startTime: "", endTime: "", fullMarks: "", passMarks: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.admin.getExam(exam.id).then(setDetail).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [exam.id]);

  const handleAdd = async () => {
    if (!form.subjectName || !form.examDate) { setError("Subject name and date are required"); return; }
    setAdding(true); setError("");
    try {
      await api.admin.upsertExamSubject(exam.id, {
        subjectName: form.subjectName,
        examDate: form.examDate,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        shift,
        fullMarks: form.fullMarks ? parseInt(form.fullMarks) : null,
        passMarks: form.passMarks ? parseInt(form.passMarks) : null,
      });
      setForm({ subjectName: "", examDate: "", startTime: "", endTime: "", fullMarks: "", passMarks: "" });
      load();
    }
    catch (e: any) { setError(e.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => { await api.admin.deleteExamSubject(id); load(); };

  const allSubjects: any[] = detail?.examSubjects ?? [];
  const subjects = allSubjects.filter((s) => (s.shift ?? "DAY") === shift);
  const examStart = exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 10) : undefined;
  const examEnd = exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 10) : undefined;

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exam Routine</h4>
        {/* Morning / Day class toggle — each shift keeps its own routine */}
        <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
          {(["DAY", "MORNING"] as const).map((sh) => (
            <button key={sh} onClick={() => setShift(sh)}
              className={cn("text-xs px-3 py-1 rounded-md font-medium transition-colors", shift === sh ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}>
              {sh === "DAY" ? "☀️ Day Class" : "🌅 Morning Class"}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="h-10 bg-gray-100 rounded-xl animate-pulse" /> : (
        <>
          {subjects.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-3">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50">{["Date", "Subject", "Time", "Full Marks", "Pass Marks", ""].map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody>
                  {subjects.map((s: any) => (
                    <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50 group">
                      <td className="px-4 py-2 font-medium text-gray-700">{s.examDate ? new Date(s.examDate).toLocaleDateString("en", { month: "short", day: "numeric", weekday: "short" }) : "—"}</td>
                      <td className="px-4 py-2 font-semibold text-gray-900">{s.subject?.name ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-500">{s.examTime ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-600">{s.fullMarks ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-600">{s.passMarks ?? "—"}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => handleDelete(s.id)} className="p-1 text-gray-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-3">No subjects in the {shift === "DAY" ? "day" : "morning"} routine yet.</p>
          )}

          {error && <div className="mb-2 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</div>}

          <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-3">
            <p className="text-xs font-medium text-gray-500">Add Subject to {shift === "DAY" ? "Day" : "Morning"} Routine
              <span className="text-gray-300 font-normal"> · within {examStart} → {examEnd}</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} placeholder="Subject name *"
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
              <input type="date" min={examStart} max={examEnd} value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
              <div className="flex gap-1">
                <input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} placeholder="Start (10:00)"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
                <input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} placeholder="End (13:00)"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <input type="number" value={form.fullMarks} onChange={(e) => setForm({ ...form, fullMarks: e.target.value })} placeholder="Full marks"
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
              <input type="number" value={form.passMarks} onChange={(e) => setForm({ ...form, passMarks: e.target.value })} placeholder="Pass marks"
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={handleAdd} disabled={adding}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {adding ? "Adding..." : "+ Add"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSugg, setShowSugg] = useState(false);

  const load = () => { setLoading(true); api.admin.exams().then((d) => setExams(Array.isArray(d) ? d : [])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggle = (id: string) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleStatusChange = async (id: string, status: string) => {
    try { await api.admin.updateExam(id, { status }); } finally { load(); }
  };

  const handleDelete = async (exam: any) => {
    if (!confirm(`Delete "${exam.name}"? This cannot be undone.`)) return;
    try { await api.admin.deleteExam(exam.id); } finally { load(); }
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    if (v.trim().length >= 2) {
      const q = v.toLowerCase();
      const sugg = Array.from(new Set(exams.flatMap((e) => [e.name, e.type.replace(/_/g, " ")]).filter((s) => s.toLowerCase().includes(q)))).slice(0, 5);
      setSuggestions(sugg);
      setShowSugg(sugg.length > 0);
    } else { setShowSugg(false); }
  };

  const filtered = search.trim() ? exams.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.type.toLowerCase().includes(search.toLowerCase())) : exams;

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Examinations</h1>
            <p className="text-sm text-gray-500 mt-0.5">Schedule and manage school exams with routines</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button onClick={() => setModal(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Schedule Exam
            </button>
          </div>
        </div>

        {/* Search bar with suggestions */}
        <div className="relative max-w-sm">
          <input value={search} onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => search.trim().length >= 2 && setShowSugg(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSugg(false), 150)}
            placeholder="Search exams…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
          <X className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300", search ? "hidden" : "")} />
          {search && <button onClick={() => { setSearch(""); setShowSugg(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
          {!search && <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-45" style={{ display: "none" }} />}
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/></svg>
          {showSugg && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {suggestions.map((s) => (
                <button key={s} onMouseDown={() => { setSearch(s); setShowSugg(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-32 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{search ? `No exams matching "${search}"` : "No exams scheduled."} {!search && <button onClick={() => setModal(true)} className="text-blue-600">Schedule one →</button>}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((exam) => {
              const cfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.SCHEDULED!;
              const Icon = cfg!.icon;
              const isExpanded = expanded.has(exam.id);
              return (
                <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggle(exam.id)} className="mt-0.5 text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-lg font-medium">{exam.type.replace(/_/g, " ")}</span>
                            <span>{new Date(exam.startDate).toLocaleDateString()} → {new Date(exam.endDate).toLocaleDateString()}</span>
                            <span className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => toggle(exam.id)}>
                              {exam.examSubjects?.length ?? 0} subjects in routine
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium", cfg!.color)}>
                          <Icon className="w-3 h-3" />{cfg!.label}
                        </span>
                        <select value={exam.status} onChange={(e) => handleStatusChange(exam.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                          {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]!.label}</option>)}
                        </select>
                        <button onClick={() => handleDelete(exam)} className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg transition-colors" title="Delete exam">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && <RoutinePanel exam={exam} onRefresh={load} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ExamModal open={modal} onClose={() => setModal(false)} onSave={async (d) => { await api.admin.createExam(d); load(); }} />
    </>
  );
}
