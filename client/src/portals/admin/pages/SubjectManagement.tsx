import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Search, X, Clock, Users, ChevronRight, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHIFTS = ["DAY", "MORNING"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dayLabel(d: number) { return DAYS[d] ?? `Day ${d}`; }
function fmtTime(t: string) {
  if (!t) return t;
  const [h, m] = t.split(":").map(Number);
  const ampm = h! >= 12 ? "PM" : "AM";
  return `${h! % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Add Schedule Slot Modal ───────────────────────────────────────────────────
function AddSlotModal({ subjectId, sections, onClose, onAdded }: {
  subjectId: string; sections: { sectionId: string; sectionName: string; gradeId: string }[];
  onClose: () => void; onAdded: () => void;
}) {
  const [sectionId, setSectionId] = useState(sections[0]?.sectionId ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [period, setPeriod] = useState(1);
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("07:45");
  const [shift, setShift] = useState<"DAY" | "MORNING">("DAY");
  const [roomNo, setRoomNo] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const checkAvailability = async () => {
    setChecking(true);
    try {
      const res = await api.admin.teachersAvailability(dayOfWeek, period, shift);
      setTeachers(res ?? []);
    } catch { /* ignore */ }
    finally { setChecking(false); }
  };

  useEffect(() => { checkAvailability(); }, [dayOfWeek, period, shift]);

  const handleSave = async () => {
    if (!sectionId) { setError("Select a section"); return; }
    setSaving(true); setError("");
    try {
      await api.admin.createRoutineSlot({
        sectionId, subjectId, dayOfWeek, periodNumber: period,
        startTime, endTime, shift, roomNo: roomNo || null,
        teacherId: teacherId || null,
      });
      onAdded();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const free = teachers.filter((t) => !t.isBusy);
  const busy = teachers.filter((t) => t.isBusy);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-900">Add Schedule Slot</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>}

          {/* Section */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Class & Section</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              {sections.map((s) => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
            </select>
          </div>

          {/* Day + Period + Shift */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Period No.</label>
              <input type="number" min="1" max="12" value={period} onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shift</label>
              <select value={shift} onChange={(e) => setShift(e.target.value as any)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="DAY">Day</option>
                <option value="MORNING">Morning</option>
              </select>
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          {/* Room */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Room No. (optional)</label>
            <input value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="e.g. Lab 2"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Teacher availability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Assign Teacher</label>
              {checking && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            </div>
            <p className="text-[11px] text-gray-400 mb-2">
              Showing availability for {dayLabel(dayOfWeek)}, Period {period} ({shift === "MORNING" ? "Morning" : "Day"} shift)
            </p>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2">
              <option value="">— No teacher assigned —</option>
              {free.map((t) => (
                <option key={t.id} value={t.id}>✓ {t.name} (free)</option>
              ))}
              {busy.map((t) => (
                <option key={t.id} value={t.id} className="text-rose-600">⚠ {t.name} (BUSY this slot)</option>
              ))}
            </select>
            {teachers.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-36 overflow-y-auto">
                {teachers.map((t) => (
                  <button key={t.id} onClick={() => setTeacherId(t.id === teacherId ? "" : t.id)}
                    className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-left border transition-colors",
                      t.id === teacherId ? "border-blue-400 bg-blue-50 text-blue-700" :
                      t.isBusy ? "border-rose-100 bg-rose-50/50 text-rose-600" :
                      "border-gray-100 hover:border-gray-200 text-gray-700")}>
                    {t.isBusy
                      ? <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" />
                      : <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />}
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Add Slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subject Detail View ───────────────────────────────────────────────────────
function SubjectDetail({ subjectId, onBack }: { subjectId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.admin.subjectDetail(subjectId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [subjectId]);

  const removeSlot = async (id: string) => {
    if (!confirm("Remove this schedule slot?")) return;
    setDeletingSlot(id);
    try { await api.admin.deleteRoutineSlot(id); load(); }
    catch (e: any) { alert(e.message); }
    finally { setDeletingSlot(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
    </div>
  );
  if (!data) return null;

  // Group slots by day
  const slotsByDay: Record<number, any[]> = {};
  for (const s of data.slots ?? []) {
    if (!slotsByDay[s.dayOfWeek]) slotsByDay[s.dayOfWeek] = [];
    slotsByDay[s.dayOfWeek].push(s);
  }

  return (
    <div className="space-y-6">
      {showSlotModal && (
        <AddSlotModal
          subjectId={subjectId}
          sections={data.sections ?? []}
          onClose={() => setShowSlotModal(false)}
          onAdded={() => { setShowSlotModal(false); load(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-gray-900">{data.name}</h2>
            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{data.code}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", data.isElective ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700")}>
              {data.isElective ? "Elective" : "Core"}
            </span>
            <span className="text-xs text-gray-400">{data.creditHours} credit hrs</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Taught in {data.sections?.length ?? 0} section{(data.sections?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
            {data.slots?.length ?? 0} scheduled slot{(data.slots?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setShowSlotModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 font-medium shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add Slot
        </button>
      </div>

      {/* Sections assigned to */}
      {(data.sections ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assigned to sections</p>
          <div className="flex flex-wrap gap-2">
            {data.sections.map((s: any) => (
              <span key={s.assignmentId} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">{s.sectionName}</span>
            ))}
          </div>
        </div>
      )}

      {/* Teacher assignments */}
      {(data.teacherAssignments ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Teacher assignments</p>
          <div className="space-y-2">
            {data.teacherAssignments.map((a: any) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-900">{a.teacherName}</span>
                {a.sectionName && <span className="text-gray-400">→ {a.sectionName}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule slots grouped by day */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Weekly Schedule</p>
          </div>
        </div>
        {(data.slots ?? []).length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-7 h-7 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No schedule slots yet.</p>
            <button onClick={() => setShowSlotModal(true)} className="mt-1 text-sm text-blue-600 hover:underline">Add the first slot →</button>
          </div>
        ) : (
          Object.entries(slotsByDay)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, slots]) => (
              <div key={day} className="border-t border-gray-50 first:border-t-0">
                <div className="px-5 py-2 bg-gray-50/60">
                  <p className="text-xs font-semibold text-gray-500">{dayLabel(Number(day))}</p>
                </div>
                {(slots as any[]).map((s) => (
                  <div key={s.id} className="px-5 py-3 border-t border-gray-50 flex items-center gap-4 hover:bg-gray-50/40 group">
                    <div className="w-24 shrink-0">
                      <p className="text-xs font-mono font-semibold text-gray-900">P{s.periodNumber}</p>
                      <p className="text-[11px] text-gray-400">{fmtTime(s.startTime)} – {fmtTime(s.endTime)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.sectionName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {s.teacherName
                          ? <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">{s.teacherName}</span>
                          : <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">No teacher assigned</span>}
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-md", s.shift === "MORNING" ? "bg-sky-50 text-sky-700" : "bg-orange-50 text-orange-700")}>
                          {s.shift === "MORNING" ? "Morning" : "Day"} shift
                        </span>
                        {s.roomNo && <span className="text-xs text-gray-400">Room {s.roomNo}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeSlot(s.id)} disabled={deletingSlot === s.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-40">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ─── Subject list ──────────────────────────────────────────────────────────────
function SubjectList({ onSelect }: { onSelect: (id: string) => void }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newHours, setNewHours] = useState("5");
  const [isElective, setIsElective] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const autoCode = (n: string) =>
    n.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 6) || n.slice(0, 4).toUpperCase();

  const load = () => {
    setLoading(true);
    api.admin.subjects().then(setSubjects).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setCreateError("Name required"); return; }
    setCreating(true); setCreateError("");
    try {
      await api.admin.createSubject({ name: newName.trim(), code: newCode.trim() || autoCode(newName), creditHours: parseInt(newHours) || 5, isElective });
      setNewName(""); setNewCode(""); setNewHours("5"); setIsElective(false); setShowCreate(false);
      load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? It will be removed from all sections and schedules.`)) return;
    setDeleting(id);
    try { await api.admin.deleteSubject(id); setSubjects((p) => p.filter((s) => s.id !== id)); }
    catch (e: any) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const filtered = query ? subjects.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.code.toLowerCase().includes(query.toLowerCase())) : subjects;

  return (
    <div className="space-y-4">
      {/* Search + create */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subjects…"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
        </div>
        <button onClick={() => setShowCreate((v) => !v)}
          className={cn("flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-colors",
            showCreate ? "bg-gray-100 text-gray-700" : "bg-blue-600 text-white hover:bg-blue-700")}>
          {showCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showCreate ? "Cancel" : "New Subject"}
        </button>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <form onSubmit={create} className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-3">
          {createError && <p className="text-xs text-rose-600">{createError}</p>}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">Subject Name</label>
              <input value={newName} onChange={(e) => { setNewName(e.target.value); if (!newCode) setNewCode(autoCode(e.target.value)); }}
                placeholder="e.g. Physics" autoFocus
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="w-28">
              <label className="block text-xs text-gray-500 mb-1">Code</label>
              <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="PHY"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 font-mono" />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">Credit Hrs</label>
              <input type="number" min="1" max="20" value={newHours} onChange={(e) => setNewHours(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input type="checkbox" checked={isElective} onChange={(e) => setIsElective(e.target.checked)} className="rounded" />
              Elective (optional)
            </label>
            <button type="submit" disabled={creating}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-1.5">
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{query ? "No match" : "No subjects yet."}</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-2 bg-gray-50/60 border-b border-gray-50 grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4">
              {["Name", "Code", "Credit Hrs", "Type", ""].map((h) => (
                <div key={h} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</div>
              ))}
            </div>
            {filtered.map((s) => (
              <div key={s.id} className="border-t border-gray-50 hover:bg-gray-50/40 grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center group">
                <button onClick={() => onSelect(s.id)} className="px-5 py-3.5 flex items-center gap-2 text-left">
                  <span className="text-sm font-medium text-gray-900 truncate">{s.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                </button>
                <div className="font-mono text-xs text-gray-500 py-3.5">{s.code}</div>
                <div className="text-sm text-gray-600 py-3.5">{s.creditHours}</div>
                <div className="py-3.5">
                  <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", s.isElective ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700")}>
                    {s.isElective ? "Elective" : "Core"}
                  </span>
                </div>
                <div className="pr-4 py-3.5">
                  <button onClick={() => remove(s.id, s.name)} disabled={deleting === s.id}
                    className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="px-5 py-2 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-400">
              {filtered.length} subject{filtered.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SubjectManagement() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Subject Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {selectedId ? "View and manage subject schedule & teacher assignments" : "Create subjects, assign to classes, and schedule periods"}
        </p>
      </div>

      {selectedId
        ? <SubjectDetail subjectId={selectedId} onBack={() => setSelectedId(null)} />
        : <SubjectList onSelect={setSelectedId} />
      }
    </div>
  );
}
