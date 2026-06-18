import { useState, useEffect, useRef } from "react";
import {
  Plus, X, RefreshCw, GraduationCap, ChevronRight, ArrowRight,
  Edit3, Trash2, CheckCircle, Calendar, Users, BookOpen,
  AlertTriangle, ChevronDown, ChevronUp, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { fmtBS } from "@/lib/nepali-date";
import { NepaliDateInput } from "@/components/common/NepaliDateInput";
import { PortalMenu } from "@/components/common/PortalMenu";

// ─── Year Modal (create + edit) ───────────────────────────────────────────────

function YearModal({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void;
  onSave: (d: any) => Promise<void>;
  initial?: any;
}) {
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isActive: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial;

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name ?? "",
          startDate: initial.startDate ? initial.startDate.slice(0, 10) : "",
          endDate: initial.endDate ? initial.endDate.slice(0, 10) : "",
          isActive: initial.isActive ?? false,
        });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setForm({ name: "", startDate: today, endDate: today, isActive: true });
      }
      setError("");
    }
  }, [open, initial]);

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
          <h2 className="font-bold text-gray-900">{isEdit ? "Edit Academic Year" : "New Academic Year"}</h2>
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
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date (BS) <span className="text-rose-400">*</span></label>
              <NepaliDateInput value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">End Date (BS) <span className="text-rose-400">*</span></label>
              <NepaliDateInput value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
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
            {saving ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Year")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirmation ───────────────────────────────────────────────────────

function DeleteYearModal({ open, year, onClose, onConfirm }: {
  open: boolean; year: any; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [open]);
  if (!open || !year) return null;

  const handle = async () => {
    setDeleting(true); setError("");
    try { await onConfirm(); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Delete Academic Year?</p>
            <p className="text-sm text-gray-500">"{year.name}" will be permanently removed.</p>
          </div>
        </div>
        {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
        <p className="text-xs text-gray-400">Years with student enrollments cannot be deleted.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handle} disabled={deleting}
            className="px-4 py-2 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 font-medium">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Promote Modal (enhanced with preview) ────────────────────────────────────

function PromoteModal({ open, onClose, years, onPromote }: {
  open: boolean; onClose: () => void; years: any[];
  onPromote: (d: any) => Promise<any>;
}) {
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [mappings, setMappings] = useState<{ fromSectionId: string; toSectionId: string }[]>([]);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [previewSections, setPreviewSections] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [toSections, setToSections] = useState<any[]>([]);

  useEffect(() => { setFromYear(""); setToYear(""); setMappings([]); setError(""); setResult(null); setPreviewSections([]); setToSections([]); }, [open]);
  if (!open) return null;

  const handleFromYearChange = async (yearId: string) => {
    setFromYear(yearId);
    setMappings([]);
    setPreviewSections([]);
    if (!yearId) return;
    setLoadingPreview(true);
    try {
      const sections = await (api.admin as any).promotionPreview(yearId);
      setPreviewSections(Array.isArray(sections) ? sections : []);
    } catch { setPreviewSections([]); }
    finally { setLoadingPreview(false); }
  };

  const handleToYearChange = async (yearId: string) => {
    setToYear(yearId);
    if (!yearId) { setToSections([]); return; }
    setLoadingPreview(true);
    try {
      const sections = await (api.admin as any).promotionPreview(yearId);
      setToSections(Array.isArray(sections) ? sections : []);
    } catch { setToSections([]); }
    finally { setLoadingPreview(false); }
  };

  const addMapping = () => setMappings([...mappings, { fromSectionId: "", toSectionId: "" }]);
  const updateMapping = (i: number, key: string, val: string) => setMappings(mappings.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
  const removeMapping = (i: number) => setMappings(mappings.filter((_, idx) => idx !== i));

  const totalStudents = mappings.reduce((sum, m) => {
    const sec = previewSections.find((s) => s.id === m.fromSectionId);
    return sum + (sec?.studentCount ?? 0);
  }, 0);

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!promoting ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Promote Students</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}

          {result ? (
            <div className="space-y-4">
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <p className="font-semibold">Promotion Complete!</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{result.promoted ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Students promoted</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-400">{result.skipped ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Already enrolled (skipped)</p>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-full px-4 py-2.5 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium">Done</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">From Year</label>
                  <select value={fromYear} onChange={(e) => handleFromYearChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    <option value="">Select year</option>
                    {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 mt-5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">To Year</label>
                  <select value={toYear} onChange={(e) => handleToYearChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    <option value="">Select year</option>
                    {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
              </div>

              {fromYear && (
                <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                  {loadingPreview ? (
                    <span>Loading sections...</span>
                  ) : (
                    <span>{previewSections.length} sections available · {previewSections.reduce((s, x) => s + x.studentCount, 0)} total students</span>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Section Mappings</label>
                  <button onClick={addMapping} disabled={!fromYear || !toYear}
                    className="text-xs text-blue-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
                    + Add mapping
                  </button>
                </div>
                {mappings.length === 0 && (
                  <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-xl">
                    {fromYear && toYear ? "No mappings yet. Click '+ Add mapping' to start." : "Select both years first."}
                  </p>
                )}
                <div className="space-y-2">
                  {mappings.map((m, i) => {
                    const fromSec = previewSections.find((s) => s.id === m.fromSectionId);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <select value={m.fromSectionId} onChange={(e) => updateMapping(i, "fromSectionId", e.target.value)}
                            className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                            <option value="">From section</option>
                            {previewSections.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.studentCount})</option>)}
                          </select>
                          {fromSec && <p className="text-[10px] text-gray-400 mt-0.5 ml-1">{fromSec.studentCount} students</p>}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <div className="flex-1">
                          <select value={m.toSectionId} onChange={(e) => updateMapping(i, "toSectionId", e.target.value)}
                            className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                            <option value="">To section</option>
                            {toSections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                        <button onClick={() => removeMapping(i)} className="p-1 text-gray-300 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {mappings.some((m) => m.fromSectionId && m.toSectionId) && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{totalStudents} students will be promoted across {mappings.filter((m) => m.fromSectionId && m.toSectionId).length} section(s).</span>
                </div>
              )}
            </>
          )}
        </div>
        {!result && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Close</button>
            <button onClick={handlePromote} disabled={promoting || mappings.filter((m) => m.fromSectionId && m.toSectionId).length === 0}
              className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-medium">
              {promoting ? "Promoting..." : `Promote ${totalStudents > 0 ? totalStudents + " " : ""}Students`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Year Card ─────────────────────────────────────────────────────────────────

function YearCard({ year, onEdit, onDelete, onSetActive, activating }: {
  year: any; onEdit: () => void; onDelete: () => void;
  onSetActive: () => void; activating: boolean;
}) {
  const fmt = (d: string) => fmtBS(d, true);
  const menuItems = [
    ...(!year.isActive ? [{ label: "Set as Current", icon: <CheckCircle className="w-3.5 h-3.5" />, onClick: onSetActive, disabled: activating }] : []),
    { label: "Edit", icon: <Edit3 className="w-3.5 h-3.5" />, onClick: onEdit },
    { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: onDelete, variant: "danger" as const },
  ];

  return (
    <div className={cn("px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors", year.isActive && "bg-emerald-50/30")}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", year.isActive ? "bg-emerald-500 shadow-sm shadow-emerald-200" : "bg-gray-200")} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{year.name}</p>
            {year.isActive && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{fmt(year.startDate)} — {fmt(year.endDate)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{year._count?.grades ?? 0} grades</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{year._count?.enrollments ?? 0} enrolled</span>
        </div>
        <PortalMenu items={menuItems} />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Academic() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearModal, setYearModal] = useState(false);
  const [editYear, setEditYear] = useState<any>(null);
  const [deleteYear, setDeleteYear] = useState<any>(null);
  const [promoteModal, setPromoteModal] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const load = () => {
    setLoading(true);
    api.admin.academicYears()
      .then((ys) => setYears(Array.isArray(ys) ? ys : []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const activeYear = years.find((y) => y.isActive);
  const totalEnrolled = years.reduce((s, y) => s + (y._count?.enrollments ?? 0), 0);
  const totalGrades = years.reduce((s, y) => s + (y._count?.grades ?? 0), 0);

  const handleSetActive = async (id: string) => {
    setActivating(id);
    try { await (api.admin as any).updateAcademicYear(id, { isActive: true }); load(); }
    catch { /* ignore */ }
    finally { setActivating(null); }
  };

  return (
    <>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Academic Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage academic years and promote students</p>
          </div>
          <div className="flex gap-2 flex-wrap">
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Academic Years", value: years.length, icon: Calendar, color: "blue" },
            { label: "Current Year", value: activeYear?.name ?? "—", icon: CheckCircle, color: "emerald" },
            { label: "Total Enrolled", value: totalEnrolled, icon: Users, color: "violet" },
            { label: "Total Grades", value: totalGrades, icon: BookOpen, color: "amber" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3",
                color === "blue" && "bg-blue-50",
                color === "emerald" && "bg-emerald-50",
                color === "violet" && "bg-violet-50",
                color === "amber" && "bg-amber-50",
              )}>
                <Icon className={cn("w-4 h-4",
                  color === "blue" && "text-blue-600",
                  color === "emerald" && "text-emerald-600",
                  color === "violet" && "text-violet-600",
                  color === "amber" && "text-amber-600",
                )} />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Academic Years List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Academic Years</h2>
            <span className="text-xs text-gray-400">{years.length} years</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : years.length === 0 ? (
            <div className="py-14 text-center">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No academic years yet.</p>
              <button onClick={() => setYearModal(true)} className="mt-3 text-xs text-blue-600 hover:underline">Create first year →</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {years.map((y: any) => (
                <YearCard
                  key={y.id} year={y}
                  onEdit={() => setEditYear(y)}
                  onDelete={() => setDeleteYear(y)}
                  onSetActive={() => handleSetActive(y.id)}
                  activating={activating === y.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Promotion Info */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowTips((v) => !v)}
            className="w-full flex items-start gap-3 p-5 text-left"
          >
            <GraduationCap className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 text-sm">How Student Promotion Works</p>
              <p className="text-xs text-amber-700 mt-0.5 line-clamp-1">Understand the promotion process before moving students to the next year.</p>
            </div>
            {showTips ? <ChevronUp className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
          </button>
          {showTips && (
            <div className="px-5 pb-5 space-y-2 border-t border-amber-100">
              {[
                "Select the source (old) year and destination (new) year.",
                "Add section mappings: which section's students move to which new section.",
                "Students already enrolled in the target year are automatically skipped.",
                "Promoted students' old enrollment status changes to 'Graduated'.",
                "You can add multiple section mappings in one promotion run.",
              ].map((tip, i) => (
                <div key={i} className="flex gap-2 items-start mt-3">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-amber-800">{tip}</p>
                </div>
              ))}
              <button onClick={() => setPromoteModal(true)} className="mt-4 text-xs font-semibold text-amber-800 underline block">
                Start promotion →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <YearModal open={yearModal} onClose={() => setYearModal(false)}
        onSave={async (d) => { await api.admin.createAcademicYear(d); load(); }} />

      <YearModal open={!!editYear} onClose={() => setEditYear(null)} initial={editYear}
        onSave={async (d) => { await (api.admin as any).updateAcademicYear(editYear.id, d); load(); }} />

      <DeleteYearModal open={!!deleteYear} year={deleteYear} onClose={() => setDeleteYear(null)}
        onConfirm={async () => { await (api.admin as any).deleteAcademicYear(deleteYear.id); load(); }} />

      <PromoteModal open={promoteModal} onClose={() => setPromoteModal(false)} years={years}
        onPromote={async (d) => { const res = await api.admin.promoteStudents(d); load(); return res; }} />
    </>
  );
}
