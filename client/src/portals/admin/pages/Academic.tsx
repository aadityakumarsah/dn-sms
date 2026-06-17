import { useState, useEffect } from "react";
import { Plus, X, RefreshCw, GraduationCap, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

function YearModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setForm({ name: "", startDate: "", endDate: "", isActive: true }); setError(""); }, [open]);
  if (!open) return null;

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) { setError("Name, start date and end date are required"); return; }
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
          <h2 className="font-bold text-gray-900">New Academic Year</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Year Name <span className="text-rose-400">*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2083 or 2083-84 (BS)"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["2082", "2083", "2084", "2085"].map((y) => (
                <button key={y} type="button" onClick={() => setForm({ ...form, name: y })}
                  className={cn("text-xs px-2.5 py-1 rounded-lg border", form.name === y ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>{y} BS</button>
              ))}
            </div>
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
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">Set as current academic year</span>
          </label>
          <p className="text-[11px] text-gray-400 -mt-1">The active year is used when creating grades, exams, and enrolling students.</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Creating..." : "Create Year"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromoteModal({ open, onClose, years, classes, onPromote }:
  { open: boolean; onClose: () => void; years: any[]; classes: any[]; onPromote: (d: any) => Promise<void> }) {
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [mappings, setMappings] = useState<{ fromSectionId: string; toSectionId: string }[]>([]);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const allSections = classes.flatMap((g: any) => (g.sections ?? []).map((s: any) => ({ id: s.id, label: `${g.name} — ${s.name}` })));

  useEffect(() => { setFromYear(""); setToYear(""); setMappings([]); setError(""); setResult(null); }, [open]);
  if (!open) return null;

  const addMapping = () => setMappings([...mappings, { fromSectionId: "", toSectionId: "" }]);
  const updateMapping = (i: number, key: string, val: string) => setMappings(mappings.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
  const removeMapping = (i: number) => setMappings(mappings.filter((_, idx) => idx !== i));

  const handlePromote = async () => {
    if (!fromYear || !toYear) { setError("Select both academic years"); return; }
    if (fromYear === toYear) { setError("From and To years must be different"); return; }
    const validMappings = mappings.filter((m) => m.fromSectionId && m.toSectionId);
    if (validMappings.length === 0) { setError("Add at least one section mapping"); return; }
    setPromoting(true); setError("");
    try {
      const res = await onPromote({ fromYearId: fromYear, toYearId: toYear, sectionMappings: validMappings });
      setResult(res);
    }
    catch (e: any) { setError(e.message); }
    finally { setPromoting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">Promote Students</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
              <p className="font-semibold mb-1">Promotion complete!</p>
              <p>Promoted: {result.promoted ?? 0} students</p>
              {result.skipped > 0 && <p className="text-xs mt-1 text-emerald-600">Skipped (already promoted): {result.skipped}</p>}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">From Year</label>
              <select value={fromYear} onChange={(e) => setFromYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">Select year</option>
                {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 mt-5 flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">To Year</label>
              <select value={toYear} onChange={(e) => setToYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">Select year</option>
                {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Section Mappings</label>
              <button onClick={addMapping} className="text-xs text-blue-600 hover:underline">+ Add mapping</button>
            </div>
            {mappings.length === 0 && (
              <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-xl">
                No mappings yet. Add section-to-section mappings to define promotions.
              </p>
            )}
            {mappings.map((m, i) => (
              <div key={i} className="flex items-center gap-2 mt-2">
                <select value={m.fromSectionId} onChange={(e) => updateMapping(i, "fromSectionId", e.target.value)}
                  className="flex-1 px-2.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">From section</option>
                  {allSections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <select value={m.toSectionId} onChange={(e) => updateMapping(i, "toSectionId", e.target.value)}
                  className="flex-1 px-2.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">To section</option>
                  {allSections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button onClick={() => removeMapping(i)} className="p-1 text-gray-300 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Close</button>
          {!result && (
            <button onClick={handlePromote} disabled={promoting}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
              {promoting ? "Promoting..." : "Promote Students"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Academic() {
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearModal, setYearModal] = useState(false);
  const [promoteModal, setPromoteModal] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.admin.academicYears(), api.admin.classes()])
      .then(([ys, cls]) => { setYears(Array.isArray(ys) ? ys : []); setClasses((cls as any).grades ?? []); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Academic Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Academic years and student promotion</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button onClick={() => setPromoteModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-emerald-700">
              <GraduationCap className="w-3.5 h-3.5" /> Promote Students
            </button>
            <button onClick={() => setYearModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> New Year
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Academic Years</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : years.length === 0 ? (
            <div className="py-14 text-center text-sm text-gray-400">No academic years yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {years.map((y: any) => (
                <div key={y.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", y.isActive ? "bg-emerald-500" : "bg-gray-200")} />
                    <div>
                      <p className="font-semibold text-gray-900">{y.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(y.startDate).toLocaleDateString()} — {new Date(y.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    {y.isActive && <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-lg font-medium">Current</span>}
                  </div>
                  <div className="text-xs text-gray-400">
                    {y._count?.grades ?? 0} grades · {y._count?.enrollments ?? 0} students
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Student Promotion</p>
              <p className="text-xs text-amber-700 mt-1">
                Use "Promote Students" to move students from one academic year to the next. You'll map each section from the old year to a section in the new year. Students already enrolled in the target year will be skipped automatically.
              </p>
              <button onClick={() => setPromoteModal(true)}
                className="mt-3 text-xs font-medium text-amber-800 underline">
                Start promotion →
              </button>
            </div>
          </div>
        </div>
      </div>

      <YearModal open={yearModal} onClose={() => setYearModal(false)}
        onSave={async (d) => { await api.admin.createAcademicYear(d); load(); }} />
      <PromoteModal open={promoteModal} onClose={() => setPromoteModal(false)} years={years} classes={classes}
        onPromote={async (d) => { const res = await api.admin.promoteStudents(d); load(); return res; }} />
    </>
  );
}
