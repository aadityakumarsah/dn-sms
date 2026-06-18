import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, RefreshCw, Users, BookOpen, ChevronDown, ChevronRight, Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const PERF_CFG: Record<string, { label: string; color: string; dot: string }> = {
  EXCELLENT:    { label: "Excellent",    color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  GOOD:         { label: "Good",         color: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
  AVERAGE:      { label: "Average",      color: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
  BELOW_AVERAGE:{ label: "Below Avg",    color: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
};

// Education levels (Nepal structure) with their grade presets and stream options.
type Cat = { key: string; label: string; presets: { name: string; level: number }[]; streams?: string[]; defaultDuration?: number };
const CATEGORIES: Cat[] = [
  { key: "PRE_PRIMARY", label: "Pre-Primary", presets: [{ name: "Nursery", level: 0 }, { name: "LKG", level: 0 }, { name: "UKG", level: 0 }] },
  { key: "PRIMARY", label: "Primary (1–8)", presets: Array.from({ length: 8 }, (_, i) => ({ name: `Class ${i + 1}`, level: i + 1 })) },
  { key: "SECONDARY", label: "Secondary (9–10)", presets: [{ name: "Class 9", level: 9 }, { name: "Class 10", level: 10 }] },
  { key: "HIGH_SCHOOL", label: "High School / +2 (11–12)", presets: [{ name: "Class 11", level: 11 }, { name: "Class 12", level: 12 }], streams: ["Science", "Management", "Humanities", "Education"], defaultDuration: 2 },
  // { key: "BACHELOR", label: "Bachelor", presets: [{ name: "BSc CSIT", level: 13 }, { name: "BCA", level: 13 }, { name: "BBA", level: 13 }, { name: "BBS", level: 13 }, { name: "BE Computer", level: 13 }, { name: "B.Tech", level: 13 }, { name: "BA", level: 13 }, { name: "BSc", level: 13 }], streams: ["Science", "Management", "Humanities", "Computer Science", "Engineering"], defaultDuration: 4 },
  // { key: "MASTER", label: "Master", presets: [{ name: "MSc", level: 17 }, { name: "MBA", level: 17 }, { name: "MA", level: 17 }, { name: "M.Tech", level: 17 }], streams: ["Science", "Management", "Humanities", "Computer Science"], defaultDuration: 2 },
];

function GradeModal({ open, onClose, departments, onSave }: { open: boolean; onClose: () => void; departments: any[]; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", level: "", departmentId: "", category: "PRE_PRIMARY", stream: "", durationYears: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setForm({ name: "", level: "", departmentId: "", category: "PRE_PRIMARY", stream: "", durationYears: "" }); setError(""); } }, [open]);
  if (!open) return null;

  const cat = CATEGORIES.find((c) => c.key === form.category) ?? CATEGORIES[0]!;
  const showStream = !!cat.streams;

  const pickCategory = (key: string) => {
    const c = CATEGORIES.find((x) => x.key === key)!;
    setForm({ ...form, category: key, name: "", level: "", stream: "", durationYears: c.defaultDuration ? String(c.defaultDuration) : "" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Grade name is required"); return; }
    setSaving(true); setError("");
    try {
      await onSave({
        name: form.name.trim(),
        gradeNumber: form.level === "" ? 0 : parseInt(form.level, 10) || 0,
        category: form.category,
        stream: form.stream || null,
        durationYears: form.durationYears ? parseInt(form.durationYears, 10) : null,
        departmentId: form.departmentId || null,
      });
      onClose();
    }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const field = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">Add Grade / Class</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Education level</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" onClick={() => pickCategory(c.key)}
                  className={cn("text-xs px-2.5 py-1.5 rounded-lg border transition-colors",
                    form.category === c.key ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{cat.label} — quick pick</label>
            <div className="flex flex-wrap gap-1.5">
              {cat.presets.map((g) => (
                <button key={g.name} type="button"
                  onClick={() => setForm({ ...form, name: g.name, level: String(g.level) })}
                  className={cn("text-xs px-2.5 py-1 rounded-lg border transition-colors",
                    form.name === g.name ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Grade / Class / Program Name <span className="text-rose-400">*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nursery, Class 11, BSc CSIT…" className={field} />
            <p className="text-[11px] text-gray-400 mt-1">Accepts both text (Nursery, BSc) and numbers (11, 12).</p>
          </div>
          {showStream && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Stream</label>
                <div className="flex flex-wrap gap-1.5">
                  {cat.streams!.map((s) => (
                    <button key={s} type="button" onClick={() => setForm({ ...form, stream: form.stream === s ? "" : s })}
                      className={cn("text-xs px-2.5 py-1 rounded-lg border", form.stream === s ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Course duration (years)</label>
                <input type="number" value={form.durationYears} onChange={(e) => setForm({ ...form, durationYears: e.target.value })} placeholder="e.g. 3 or 4" className={field} />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Level <span className="text-gray-300">(for ordering)</span></label>
            <input type="number" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="auto-filled by quick pick" className={field} />
          </div>
          {departments.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Department <span className="text-gray-300">(synced with Departments)</span></label>
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className={cn(field, "bg-white")}>
                <option value="">No department</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Adding..." : "Add Grade"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionModal({ open, onClose, gradeId, initial, onSave }: { open: boolean; onClose: () => void; gradeId: string; initial?: any; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", totalSeats: "40", performance: "AVERAGE" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ name: initial.name ?? "", totalSeats: String(initial.totalSeats ?? 40), performance: initial.performance ?? "AVERAGE" });
      } else {
        setForm({ name: "", totalSeats: "40", performance: "AVERAGE" });
      }
      setError("");
    }
  }, [open, initial]);
  if (!open) return null;

  const isEdit = !!initial;
  const handleSave = async () => {
    if (!form.name) { setError("Section name is required"); return; }
    setSaving(true); setError("");
    try { await onSave({ name: form.name, totalSeats: parseInt(form.totalSeats) || 40, performance: form.performance }); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{isEdit ? "Edit Section" : "Add Section"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Section Name <span className="text-rose-400">*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Section A"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Total Seats</label>
            <input type="number" value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: e.target.value })} placeholder="40"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Performance Level</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PERF_CFG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setForm({ ...form, performance: key })}
                  className={cn("text-xs px-3 py-2 rounded-xl border font-medium transition-colors", form.performance === key ? cfg.color : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Section")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Classes() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ grades: [] });
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeModal, setGradeModal] = useState(false);
  const [sectionModal, setSectionModal] = useState<string | null>(null);
  const [editSection, setEditSection] = useState<any>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = () => { setLoading(true); api.admin.classes().then(setData).finally(() => setLoading(false)); };
  useEffect(() => {
    load();
    api.admin.departments().then((d) => setDepartments(Array.isArray(d) ? d : d.departments ?? []));
  }, []);

  const toggle = (id: string) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Classes & Sections</h1>
            <p className="text-sm text-gray-500 mt-0.5">{data.grades?.length ?? 0} grades configured</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button onClick={() => setGradeModal(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Add Grade
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-20 animate-pulse" />)}</div>
        ) : (data.grades ?? []).length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
            <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No grades yet. <button onClick={() => setGradeModal(true)} className="text-blue-600">Add the first one →</button></p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.grades.map((grade: any) => (
              <div key={grade.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50" onClick={() => toggle(grade.id)}>
                  <div className="flex items-center gap-3">
                    {expanded.has(grade.id) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{grade.name}</p>
                        {grade.category && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">{grade.category.replace(/_/g, " ").toLowerCase()}</span>}
                        {grade.stream && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg">{grade.stream}</span>}
                        {grade.durationYears && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{grade.durationYears} yr</span>}
                        {grade.department && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg">{grade.department.name}</span>}
                      </div>
                      <p className="text-xs text-gray-400">{grade.sections?.length ?? 0} sections · {grade._count?.enrollments ?? 0} students</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={(e) => { e.stopPropagation(); setSectionModal(grade.id); }}
                      className="text-xs flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100">
                      <Plus className="w-3 h-3" /> Section
                    </button>
                    <button onClick={async (e) => { e.stopPropagation(); if (confirm("Delete this grade? All sections will also be removed.")) { try { await api.admin.deleteGrade(grade.id); } finally { load(); } } }}
                      className="p-1.5 text-gray-300 hover:text-rose-400 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {expanded.has(grade.id) && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    {(grade.sections ?? []).length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 text-center">No sections yet. <button onClick={() => setSectionModal(grade.id)} className="text-blue-500">Add one →</button></p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {grade.sections.map((sec: any) => {
                          const perf = (PERF_CFG[sec.performance] ?? PERF_CFG.AVERAGE)!;
                          const occupied = sec.occupiedSeats ?? sec._count?.enrollments ?? 0;
                          const total = sec.totalSeats ?? 40;
                          const pct = Math.round((occupied / total) * 100);
                          return (
                            <div key={sec.id} onClick={() => navigate(`/admin/sections/${sec.id}`)}
                              className={cn("group rounded-xl p-3 border cursor-pointer hover:shadow-md transition-shadow", perf.color.includes("emerald") ? "bg-emerald-50/50 border-emerald-100" : perf.color.includes("blue") ? "bg-blue-50/50 border-blue-100" : perf.color.includes("amber") ? "bg-amber-50/50 border-amber-100" : "bg-rose-50/50 border-rose-100")}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className={cn("w-2 h-2 rounded-full shrink-0", perf.dot)} />
                                  <p className="text-sm font-semibold text-gray-800 truncate">{sec.name}</p>
                                </div>
                                <div className="flex gap-1 shrink-0 ml-1">
                                  <button onClick={(e) => { e.stopPropagation(); setEditSection({ ...sec, gradeId: grade.id }); setSectionModal(null); }}
                                    className="p-1 text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-colors"><Edit3 className="w-3 h-3" /></button>
                                  <button onClick={async (e) => { e.stopPropagation(); if (confirm("Delete this section?")) { try { await api.admin.deleteSection(sec.id); } finally { load(); } } }}
                                    className="p-1 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                              <p className="text-[11px] text-blue-500 mb-1">View students →</p>
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                                <span><Users className="w-3 h-3 inline mr-0.5" />{occupied} students</span>
                                <span className={cn("font-medium text-xs px-1.5 py-0.5 rounded-md border", perf.color)}>{perf.label}</span>
                              </div>
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>Seats</span><span>{occupied}/{total}</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={cn("h-full rounded-full", pct >= 90 ? "bg-rose-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400")}
                                    style={{ width: `${Math.min(100, pct)}%` }} />
                                </div>
                                {pct >= 90 && <p className="text-xs text-rose-500 mt-0.5">Almost full</p>}
                                {total - occupied <= 0 && <p className="text-xs text-rose-500 mt-0.5 font-medium">Section full</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <GradeModal open={gradeModal} onClose={() => setGradeModal(false)} departments={departments}
        onSave={async (d) => { try { await api.admin.createGrade(d); } finally { load(); } }} />
      <SectionModal open={!!sectionModal || !!editSection} onClose={() => { setSectionModal(null); setEditSection(null); }}
        gradeId={editSection?.gradeId || sectionModal || ""} initial={editSection}
        onSave={async (d) => {
          try {
            if (editSection) {
              await api.admin.updateSection(editSection.id, d);
              setEditSection(null);
            } else {
              await api.admin.createSection(sectionModal!, d);
              setSectionModal(null);
            }
          } finally { load(); }
        }} />
    </>
  );
}
