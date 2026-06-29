import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, ChevronRight, UserPlus, Search, X, Loader2, BookOpen, Plus, Pencil, Check, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const PERF_CFG: Record<string, { label: string; color: string }> = {
  EXCELLENT:     { label: "Excellent",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  GOOD:          { label: "Good",       color: "bg-blue-50 text-blue-700 border-blue-200" },
  AVERAGE:       { label: "Average",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  BELOW_AVERAGE: { label: "Below Avg",  color: "bg-rose-50 text-rose-700 border-rose-200" },
};
const FEE_BADGE: Record<string, string> = { paid: "bg-emerald-50 text-emerald-700", pending: "bg-amber-50 text-amber-700", overdue: "bg-rose-50 text-rose-600" };

function AddStudentModal({ sectionId, onClose, onAdded }: { sectionId: string; onClose: () => void; onAdded: () => void }) {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [rollNo, setRollNo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      // Fetch students NOT in any section (no sectionId filter) and filter client-side,
      // or just search all students and let the server return unallocated ones.
      api.admin.students({ search: search || undefined, status: "ACTIVE" })
        .then((res) => setStudents(res.students ?? []))
        .catch(() => setStudents([]))
        .finally(() => setLoading(false));
    }, 300);
  }, [search]);

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await api.admin.allocateStudent(selected.id, { sectionId, rollNo: rollNo || undefined });
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to add student");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Student to Section</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Search by name or admission no…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No students found</p>
          ) : (
            students.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelected(st)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors",
                  selected?.id === st.id && "bg-blue-50"
                )}
              >
                <p className="text-sm font-medium text-gray-900">{st.name}</p>
                <p className="text-xs text-gray-400">{st.admissionNo}{st.className ? ` · Currently: ${st.className}` : " · Unassigned"}</p>
              </button>
            ))
          )}
        </div>

        {/* Roll no + confirm */}
        {selected && (
          <div className="px-4 py-3 border-t border-gray-100 space-y-3">
            <p className="text-sm text-gray-700">Adding <span className="font-semibold">{selected.name}</span></p>
            <input
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Roll number (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 py-2 text-sm rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const STREAMS = ["Science", "Management", "Arts", "Humanities", "Technical", "General"];

function StreamEditor({ sectionId, current, onUpdated }: { sectionId: string; current: string | null; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await api.admin.updateSection(sectionId, { stream: value || null }); onUpdated(); setEditing(false); }
    catch { } finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <select value={value} onChange={(e) => setValue(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">None</option>
            {STREAMS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={save} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setEditing(false); setValue(current ?? ""); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-3.5 h-3.5" /></button>
        </>
      ) : (
        <>
          {current ? <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-medium">{current}</span>
            : <span className="text-xs text-gray-400">No stream set</span>}
          <button onClick={() => { setEditing(true); setValue(current ?? ""); }} className="p-1 text-gray-300 hover:text-blue-600 rounded-lg"><Pencil className="w-3 h-3" /></button>
        </>
      )}
    </div>
  );
}

function SectionSubjectsCard({ sectionId, gradeId, initialSubjects, onUpdated }: { sectionId: string; gradeId: string; initialSubjects: any[]; onUpdated: () => void }) {
  const [subjects, setSubjects] = useState<any[]>(initialSubjects);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newHours, setNewHours] = useState("5");
  const [isElective, setIsElective] = useState(false);
  const [applyAll, setApplyAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = () => api.admin.sectionSubjects(sectionId).then(setSubjects).catch(() => {});

  useEffect(() => { api.admin.subjects().then(setAllSubjects).catch(() => {}); }, []);

  const assignedIds = new Set(subjects.map((s) => s.subjectId));
  const available = allSubjects.filter((s) => !assignedIds.has(s.id));

  const autoCode = (name: string) =>
    name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 6) || name.slice(0, 4).toUpperCase();

  const reset = () => { setAdding(false); setError(""); setSelectedId(""); setNewName(""); setNewCode(""); setNewHours("5"); setIsElective(false); setApplyAll(false); setMode("pick"); };

  const add = async () => {
    setSaving(true); setError("");
    try {
      if (applyAll) {
        // Assign to all sections of the grade
        const payload = mode === "create"
          ? { name: newName.trim(), code: newCode.trim() || autoCode(newName), creditHours: parseInt(newHours) || 5, isElective }
          : { subjectId: selectedId };
        if (mode === "create" && !newName.trim()) { setError("Subject name is required"); setSaving(false); return; }
        if (mode === "pick" && !selectedId) { setError("Select a subject"); setSaving(false); return; }
        await api.admin.assignSubjectToGrade(gradeId, payload);
        reload(); onUpdated(); reset();
      } else {
        // Single section
        let subjectId = selectedId;
        if (mode === "create") {
          if (!newName.trim()) { setError("Subject name is required"); setSaving(false); return; }
          const created = await api.admin.createSubject({ name: newName.trim(), code: newCode.trim() || autoCode(newName), creditHours: parseInt(newHours) || 5, isElective });
          subjectId = created.id;
          setAllSubjects((prev) => [...prev, created]);
        } else if (!subjectId) { setError("Select a subject"); setSaving(false); return; }
        await api.admin.addSectionSubject(sectionId, subjectId);
        reload(); onUpdated(); reset();
      }
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (assignmentId: string) => {
    if (!confirm("Remove this subject from the section?")) return;
    try { await api.admin.removeSectionSubject(assignmentId); reload(); onUpdated(); } catch { }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Subjects &amp; Teachers</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{subjects.length}</span>
        </div>
        {!adding && (
          <button onClick={() => { setAdding(true); setError(""); }}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Add Subject
          </button>
        )}
      </div>

      {adding && (
        <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/30 space-y-3">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg w-fit">
            <button onClick={() => setMode("pick")} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${mode === "pick" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Pick existing
            </button>
            <button onClick={() => setMode("create")} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${mode === "create" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              + Create new
            </button>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          {mode === "pick" ? (
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">Select subject…</option>
              {available.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              {available.length === 0 && <option disabled>All subjects already assigned</option>}
            </select>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <input value={newName} onChange={(e) => { setNewName(e.target.value); if (!newCode) setNewCode(autoCode(e.target.value)); }}
                  placeholder="Subject name (e.g. Mathematics)"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Code (e.g. MATH)"
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-400 font-mono" />
              <input type="number" value={newHours} onChange={(e) => setNewHours(e.target.value)}
                placeholder="Credit hours"
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-400" />
              <label className="col-span-2 flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={isElective} onChange={(e) => setIsElective(e.target.checked)} className="rounded" />
                Elective subject (optional / not compulsory)
              </label>
            </div>
          )}

          {/* Apply to whole class */}
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="rounded" />
            <span>Apply to <strong>all sections</strong> of this class (not just this section)</span>
          </label>

          <div className="flex gap-2 justify-end">
            <button onClick={reset} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            <button onClick={add} disabled={saving}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? "Saving…" : applyAll ? "Add to Whole Class" : "Add to This Section"}
            </button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="py-10 text-center">
          <BookOpen className="w-7 h-7 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No subjects assigned yet.</p>
          {!adding && <button onClick={() => setAdding(true)} className="mt-2 text-xs text-blue-600 hover:underline">Add the first subject</button>}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">
            {["Subject", "Code", "Hrs", "Type", "Teacher", ""].map((col) => (
              <th key={col} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{col}</th>
            ))}
          </tr></thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-400">{s.code}</td>
                <td className="px-5 py-3 text-gray-600">{s.creditHours}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${s.isElective ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                    {s.isElective ? "Elective" : "Core"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {s.teacher
                    ? <span className="flex items-center gap-1.5 text-gray-700"><GraduationCap className="w-3.5 h-3.5 text-gray-300" />{s.teacher.name}</span>
                    : <span className="text-xs text-gray-400 italic">Not assigned</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => remove(s.id)} className="p-1 text-gray-300 hover:text-rose-500 rounded-lg hover:bg-rose-50">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function SectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sec, setSec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api.admin.sectionDetail(id).then(setSec).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-6"><div className="h-40 bg-gray-50 rounded-2xl animate-pulse" /></div>;
  if (error || !sec) return (
    <div className="p-6">
      <button onClick={() => navigate("/admin/sections")} className="text-sm text-blue-600 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error || "Section not found"}</div>
    </div>
  );

  const perf = (PERF_CFG[sec.performance] ?? PERF_CFG.AVERAGE)!;
  const pct = sec.totalSeats ? Math.round((sec.occupiedSeats / sec.totalSeats) * 100) : 0;

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {showAdd && id && (
        <AddStudentModal sectionId={id} onClose={() => setShowAdd(false)} onAdded={load} />
      )}

      <button onClick={() => navigate("/admin/sections")} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Sections</button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400">{sec.gradeName}{sec.academicYear ? ` · ${sec.academicYear}` : ""}</p>
            <h1 className="text-xl font-bold text-gray-900">Section {sec.name}</h1>
          </div>
          <span className={cn("text-xs px-2.5 py-1 rounded-lg border font-medium", perf.color)}>{perf.label}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="bg-gray-50 rounded-xl py-3"><p className="text-lg font-bold text-gray-900">{sec.occupiedSeats}</p><p className="text-xs text-gray-400">Students</p></div>
          <div className="bg-gray-50 rounded-xl py-3"><p className="text-lg font-bold text-gray-900">{sec.totalSeats}</p><p className="text-xs text-gray-400">Capacity</p></div>
          <div className="bg-gray-50 rounded-xl py-3"><p className={cn("text-lg font-bold", sec.seatsRemaining <= 0 ? "text-rose-600" : "text-emerald-600")}>{sec.seatsRemaining}</p><p className="text-xs text-gray-400">Seats left</p></div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
          <div className={cn("h-full rounded-full", pct >= 90 ? "bg-rose-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        {sec.seatsRemaining <= 0 && <p className="text-xs text-rose-600 mt-2 font-medium">This section is full ({sec.occupiedSeats}/{sec.totalSeats}).</p>}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
          <span className="text-xs text-gray-400 font-medium">Stream:</span>
          {id && <StreamEditor sectionId={id} current={sec.stream} onUpdated={load} />}
        </div>
      </div>

      {id && <SectionSubjectsCard sectionId={id} gradeId={sec.gradeId ?? ""} initialSubjects={sec.subjects ?? []} onUpdated={load} />}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Students in this section</h2>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            disabled={sec.seatsRemaining <= 0}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Student
          </button>
        </div>
        {sec.students.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No students in this section yet.</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-blue-600 hover:underline">Add the first student</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              {["Roll", "Admission", "Student", "Gender", "Fee", ""].map((h) => <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody>
              {sec.students.map((st: any) => (
                <tr key={st.id} className="border-t border-gray-50 hover:bg-gray-50/60 cursor-pointer" onClick={() => navigate(`/admin/students/${st.id}`)}>
                  <td className="px-5 py-3 text-gray-500">{st.rollNo ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{st.admissionNo}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{st.name}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{st.gender?.toLowerCase() ?? "—"}</td>
                  <td className="px-5 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-md font-medium capitalize", FEE_BADGE[st.feeStatus] ?? "bg-gray-100 text-gray-500")}>{st.feeStatus}</span></td>
                  <td className="px-5 py-3 text-right"><ChevronRight className="w-4 h-4 text-gray-300 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
