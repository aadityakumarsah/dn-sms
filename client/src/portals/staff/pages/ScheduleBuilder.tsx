import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Plus, Trash2, RefreshCw, AlertCircle,
  CheckCircle2, Loader2, X, ChevronDown, Users, BookOpen,
  Clock, FlaskConical, ShieldCheck, Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_DAYS = [
  { value: 0, label: "Sunday",    short: "Sun" },
  { value: 1, label: "Monday",    short: "Mon" },
  { value: 2, label: "Tuesday",   short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday",  short: "Thu" },
  { value: 5, label: "Friday",    short: "Fri" },
  { value: 6, label: "Saturday",  short: "Sat" },
];
const SHIFTS     = [{ value: "DAY", label: "Day" }, { value: "MORNING", label: "Morning" }];
const DUTY_TYPES = ["Gate Duty","Assembly Duty","Exam Supervision","Lab Supervision","Library Duty","Canteen Duty","Sports Duty","Bus Duty","General Duty"];
const LAB_ROOMS  = ["Computer Lab","Science Lab","Physics Lab","Chemistry Lab","Biology Lab","Math Lab","Language Lab","Art Room","Music Room"];
const WORKING_DAYS_KEY = "dn_sms_working_days";

function fmtTime(t: string) {
  if (!t) return t;
  const [h, m] = t.split(":").map(Number);
  const ampm = h! >= 12 ? "PM" : "AM";
  return `${h! % 12 || 12}:${String(m!).padStart(2, "0")} ${ampm}`;
}

// ─── Shared: Teacher Availability Picker ──────────────────────────────────────
function TeacherPicker({ teachers, dayOfWeek, periodNumber, shift, value, onChange }: {
  teachers: any[]; dayOfWeek: number; periodNumber: number; shift: string;
  value: string; onChange: (id: string) => void;
}) {
  const [availability, setAvailability] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setChecking(true);
    api.scheduleManager.teachersFree(dayOfWeek, periodNumber, shift)
      .then((r) => setAvailability(r ?? []))
      .catch(() => setAvailability(teachers.map((t) => ({ ...t, isBusy: false }))))
      .finally(() => setChecking(false));
  }, [dayOfWeek, periodNumber, shift]);

  const free = availability.filter((t) => !t.isBusy);
  const busy = availability.filter((t) => t.isBusy);
  const list = availability.length > 0 ? availability : teachers;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-600">Assign Teacher</label>
        {checking && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
      </div>
      {availability.length > 0 && (
        <p className="text-[11px] text-gray-400 mb-2">
          <span className="text-emerald-600">{free.length} free</span>
          {busy.length > 0 && <span className="text-rose-500"> · {busy.length} busy</span>}
          {" "}at period {periodNumber}
        </p>
      )}
      {availability.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 mb-2 max-h-36 overflow-y-auto pr-1">
          {availability.map((t) => (
            <button key={t.id} type="button" onClick={() => onChange(t.id === value ? "" : t.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs text-left border transition-all",
                t.id === value ? "border-blue-400 bg-blue-50 text-blue-800 shadow-sm"
                  : t.isBusy ? "border-rose-100 bg-rose-50/50 text-rose-500 opacity-60"
                  : "border-gray-100 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
              )}>
              {t.isBusy ? <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" /> : <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />}
              <span className="truncate font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 bg-white">
        <option value="">— No teacher assigned —</option>
        {list.map((t) => (
          <option key={t.id} value={t.id}>{availability.length > 0 ? (t.isBusy ? "⚠ " : "✓ ") : ""}{t.name}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Shared: Day Column ────────────────────────────────────────────────────────
function SlotCard({ slot, onDelete, deletingId, accent }: {
  slot: any; onDelete: (id: string) => void; deletingId: string | null; accent?: string;
}) {
  return (
    <div className="px-4 py-3 hover:bg-gray-50/40 group flex items-start gap-3">
      <div className="w-8 shrink-0 text-center mt-0.5">
        <span className="text-xs font-bold text-gray-500">P{slot.periodNumber || "—"}</span>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{fmtTime(slot.startTime)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold truncate", accent ?? "text-gray-900")}>
          {slot.subjectName ?? slot.dutyType}
          {slot.subjectCode && slot.subjectCode !== "__duty__" && (
            <span className="ml-1.5 text-xs font-normal text-gray-400">({slot.subjectCode})</span>
          )}
        </p>
        {slot.sectionName && <p className="text-xs text-indigo-600 truncate mt-0.5">{slot.sectionName}</p>}
        <div className="flex flex-wrap gap-1 mt-1">
          {slot.teacherName
            ? <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">{slot.teacherName}</span>
            : <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">No teacher</span>}
          {slot.roomNo && <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{slot.roomNo}</span>}
          {slot.shift && <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md",
            slot.shift === "MORNING" ? "text-sky-700 bg-sky-50" : "text-orange-700 bg-orange-50")}>
            {slot.shift === "MORNING" ? "Morning" : "Day"}
          </span>}
          {slot.description && <span className="text-[11px] text-gray-400 truncate max-w-[120px]">{slot.description}</span>}
        </div>
      </div>
      <button onClick={() => onDelete(slot.id)} disabled={deletingId === slot.id}
        className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-40 mt-0.5">
        {deletingId === slot.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function DayColumn({ day, slots, onAdd, onDelete, deletingId, slotAccent }: {
  day: { value: number; label: string; short: string }; slots: any[];
  onAdd: () => void; onDelete: (id: string) => void; deletingId: string | null; slotAccent?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const byShift: Record<string, any[]> = {};
  for (const s of slots) {
    const k = s.shift ?? "DAY";
    if (!byShift[k]) byShift[k] = [];
    byShift[k].push(s);
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/60 select-none"
        onClick={() => setCollapsed((v) => !v)}>
        <div className="flex items-center gap-2">
          <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", collapsed && "-rotate-90")} />
          <p className="text-sm font-semibold text-gray-900">{day.label}</p>
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{slots.length}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onAdd(); }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {!collapsed && (
        <div className="flex-1 divide-y divide-gray-50">
          {slots.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-gray-400">Nothing scheduled</p>
              <button onClick={onAdd} className="mt-1 text-xs text-blue-500 hover:underline">Add first →</button>
            </div>
          ) : (
            Object.entries(byShift).map(([sh, shSlots]) => (
              <div key={sh}>
                <div className="px-4 py-1.5 bg-gray-50/60">
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wide",
                    sh === "MORNING" ? "text-sky-600" : "text-orange-500")}>
                    {sh === "MORNING" ? "Morning" : "Day"} Shift
                  </span>
                </div>
                {(shSlots as any[])
                  .sort((a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0))
                  .map((s) => <SlotCard key={s.id} slot={s} onDelete={onDelete} deletingId={deletingId} accent={slotAccent} />)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Class / Lab Slot Modal ────────────────────────────────────────────────
function AddClassSlotModal({ resources, dayOfWeek, isLab, onClose, onAdded }: {
  resources: any; dayOfWeek: number; isLab: boolean; onClose: () => void; onAdded: () => void;
}) {
  const fld = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const [sectionId,  setSectionId]  = useState("");
  const [subjectId,  setSubjectId]  = useState("");
  const [teacherId,  setTeacherId]  = useState("");
  const [period,     setPeriod]     = useState(1);
  const [startTime,  setStartTime]  = useState("07:00");
  const [endTime,    setEndTime]    = useState("07:45");
  const [shift,      setShift]      = useState("DAY");
  const [roomNo,     setRoomNo]     = useState(isLab ? LAB_ROOMS[0] : "");
  const [customRoom, setCustomRoom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const save = async () => {
    if (!sectionId) { setError("Select a class/section"); return; }
    if (!subjectId) { setError("Select a subject"); return; }
    setSaving(true); setError("");
    const room = roomNo === "__custom__" ? customRoom : roomNo;
    try {
      await api.scheduleManager.createSlot({ sectionId, subjectId, dayOfWeek, periodNumber: period, startTime, endTime, shift, roomNo: room || null, teacherId: teacherId || null });
      onAdded();
    } catch (e: any) { setError(e.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {isLab ? <FlaskConical className="w-4 h-4 text-purple-500" /> : <BookOpen className="w-4 h-4 text-blue-500" />}
            <h2 className="text-base font-semibold text-gray-900">Add {isLab ? "Lab" : "Class"} Slot — {ALL_DAYS.find((d) => d.value === dayOfWeek)?.label}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Class & Section <span className="text-rose-500">*</span></label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={fld}>
              <option value="">— Select —</option>
              {(resources.sections ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject <span className="text-rose-500">*</span></label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fld}>
              <option value="">— Select —</option>
              {(resources.subjects ?? []).filter((s: any) => s.code !== "__duty__").map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Period No.</label>
              <input type="number" min="1" max="12" value={period} onChange={(e) => setPeriod(Number(e.target.value))} className={fld.replace("bg-white","")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Shift</label>
              <select value={shift} onChange={(e) => setShift(e.target.value)} className={fld}>
                {SHIFTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={fld.replace("bg-white","")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={fld.replace("bg-white","")} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{isLab ? "Lab Room" : "Room No."} (optional)</label>
            {isLab ? (
              <>
                <select value={roomNo} onChange={(e) => setRoomNo(e.target.value)} className={fld}>
                  {LAB_ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
                  <option value="__custom__">Other…</option>
                </select>
                {roomNo === "__custom__" && (
                  <input value={customRoom} onChange={(e) => setCustomRoom(e.target.value)} placeholder="Enter room name" className={cn(fld.replace("bg-white",""), "mt-2")} />
                )}
              </>
            ) : (
              <input value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="e.g. Room 101" className={fld.replace("bg-white","")} />
            )}
          </div>
          <TeacherPicker teachers={resources.teachers ?? []} dayOfWeek={dayOfWeek} periodNumber={period} shift={shift} value={teacherId} onChange={setTeacherId} />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{saving ? "Saving…" : "Add Slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Duty Modal ────────────────────────────────────────────────────────────
function AddDutyModal({ resources, dayOfWeek, onClose, onAdded }: {
  resources: any; dayOfWeek: number; onClose: () => void; onAdded: () => void;
}) {
  const fld = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const [dutyType,    setDutyType]    = useState(DUTY_TYPES[0]);
  const [customDuty,  setCustomDuty]  = useState("");
  const [teacherId,   setTeacherId]   = useState("");
  const [startTime,   setStartTime]   = useState("07:00");
  const [endTime,     setEndTime]     = useState("07:45");
  const [shift,       setShift]       = useState("DAY");
  const [roomNo,      setRoomNo]      = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const save = async () => {
    const finalDuty = dutyType === "__custom__" ? customDuty : dutyType;
    if (!finalDuty) { setError("Select a duty type"); return; }
    setSaving(true); setError("");
    try {
      await api.scheduleManager.createDuty({ dayOfWeek, startTime, endTime, shift, roomNo: roomNo || null, teacherId: teacherId || null, dutyType: finalDuty, description, periodNumber: 0 });
      onAdded();
    } catch (e: any) { setError(e.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">Add Duty — {ALL_DAYS.find((d) => d.value === dayOfWeek)?.label}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Duty Type <span className="text-rose-500">*</span></label>
            <select value={dutyType} onChange={(e) => setDutyType(e.target.value)} className={fld}>
              {DUTY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              <option value="__custom__">Other…</option>
            </select>
            {dutyType === "__custom__" && (
              <input value={customDuty} onChange={(e) => setCustomDuty(e.target.value)} placeholder="Enter duty name" className={cn(fld.replace("bg-white",""), "mt-2")} />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Check student ID cards at main gate" className={fld.replace("bg-white","")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={fld.replace("bg-white","")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={fld.replace("bg-white","")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Shift</label>
              <select value={shift} onChange={(e) => setShift(e.target.value)} className={fld}>
                {SHIFTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Location (optional)</label>
              <input value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="e.g. Main Gate" className={fld.replace("bg-white","")} />
            </div>
          </div>
          <TeacherPicker teachers={resources.teachers ?? []} dayOfWeek={dayOfWeek} periodNumber={0} shift={shift} value={teacherId} onChange={setTeacherId} />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 font-medium flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{saving ? "Saving…" : "Add Duty"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Class Timetable ──────────────────────────────────────────────────────
function ClassTimetableTab({ resources, slots, workingDays, onRefresh }: { resources: any; slots: any[]; workingDays: number[]; onRefresh: () => void }) {
  const [addDay, setAddDay] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const classSlots = slots.filter((s) => s.subjectCode !== "__duty__");
  const stats = {
    total: classSlots.length,
    withTeacher: classSlots.filter((s) => s.teacherName).length,
    sections: new Set(classSlots.map((s) => s.sectionId)).size,
  };
  const del = async (id: string) => {
    setDeletingId(id);
    try { await api.scheduleManager.deleteSlot(id); onRefresh(); }
    catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  };
  return (
    <div className="space-y-4">
      {addDay !== null && <AddClassSlotModal resources={resources} dayOfWeek={addDay} isLab={false} onClose={() => setAddDay(null)} onAdded={() => { setAddDay(null); onRefresh(); }} />}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Periods", value: stats.total,              icon: Clock,    color: "text-blue-600 bg-blue-50" },
          { label: "With Teacher",  value: `${stats.withTeacher}/${stats.total}`, icon: Users, color: "text-emerald-600 bg-emerald-50" },
          { label: "Sections",      value: stats.sections,           icon: BookOpen, color: "text-indigo-600 bg-indigo-50" },
        ].map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.color)}><Icon className="w-4 h-4" /></div>
            <div><p className="text-xs text-gray-400">{s.label}</p><p className="text-lg font-bold text-gray-900">{s.value}</p></div>
          </div>
        ); })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ALL_DAYS.filter((d) => workingDays.includes(d.value)).map((day) => (
          <DayColumn key={day.value} day={day}
            slots={classSlots.filter((s) => s.dayOfWeek === day.value)}
            onAdd={() => setAddDay(day.value)} onDelete={del} deletingId={deletingId} />
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Lab Schedule ────────────────────────────────────────────────────────
function LabScheduleTab({ resources, slots, workingDays, onRefresh }: { resources: any; slots: any[]; workingDays: number[]; onRefresh: () => void }) {
  const [addDay, setAddDay] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const labSlots = slots.filter((s) =>
    s.subjectCode !== "__duty__" && s.roomNo &&
    (LAB_ROOMS.map((r) => r.toLowerCase()).includes(s.roomNo.toLowerCase()) || s.roomNo.toLowerCase().includes("lab") || s.roomNo.toLowerCase().includes("room"))
  );
  const del = async (id: string) => {
    setDeletingId(id);
    try { await api.scheduleManager.deleteSlot(id); onRefresh(); }
    catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  };
  const byRoom: Record<string, any[]> = {};
  for (const s of labSlots) { const r = s.roomNo ?? "Unknown"; if (!byRoom[r]) byRoom[r] = []; byRoom[r].push(s); }

  return (
    <div className="space-y-4">
      {addDay !== null && <AddClassSlotModal resources={resources} dayOfWeek={addDay} isLab={true} onClose={() => setAddDay(null)} onAdded={() => { setAddDay(null); onRefresh(); }} />}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add lab slot for day</p>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.filter((d) => workingDays.includes(d.value)).map((d) => (
            <button key={d.value} onClick={() => setAddDay(d.value)}
              className="px-3 py-1.5 text-sm border border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> {d.short}
            </button>
          ))}
        </div>
      </div>
      {labSlots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <FlaskConical className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No lab slots yet</p>
          <p className="text-xs text-gray-400 mt-1">Add a class slot and choose a lab room from the dropdown</p>
        </div>
      ) : (
        Object.entries(byRoom).map(([room, roomSlots]) => (
          <div key={room} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-purple-50/50">
              <FlaskConical className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-semibold text-purple-900">{room}</p>
              <span className="text-xs text-purple-400 bg-purple-100 px-1.5 py-0.5 rounded-md">{roomSlots.length} slot{roomSlots.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {(roomSlots as any[]).sort((a, b) => a.dayOfWeek - b.dayOfWeek || (a.periodNumber ?? 0) - (b.periodNumber ?? 0)).map((s) => (
                <div key={s.id} className="px-4 py-3 hover:bg-gray-50/40 group flex items-start gap-3">
                  <div className="w-16 shrink-0">
                    <span className="text-xs font-semibold text-gray-500">{ALL_DAYS.find((d) => d.value === s.dayOfWeek)?.short} P{s.periodNumber}</span>
                    <p className="text-[10px] text-gray-400">{fmtTime(s.startTime)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-900 truncate">{s.subjectName}</p>
                    <p className="text-xs text-indigo-600 truncate">{s.sectionName}</p>
                    {s.teacherName && <p className="text-[11px] text-emerald-700 mt-0.5">{s.teacherName}</p>}
                  </div>
                  <button onClick={() => del(s.id)} disabled={deletingId === s.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-40">
                    {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Tab: Duty Roster ──────────────────────────────────────────────────────────
function DutyRosterTab({ resources, duties, workingDays, onRefresh }: { resources: any; duties: any[]; workingDays: number[]; onRefresh: () => void }) {
  const [addDay, setAddDay] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const del = async (id: string) => {
    setDeletingId(id);
    try { await api.scheduleManager.deleteDuty(id); onRefresh(); }
    catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  };
  const byTeacher: Record<string, any[]> = {};
  for (const d of duties) { const n = d.teacherName ?? "Unassigned"; if (!byTeacher[n]) byTeacher[n] = []; byTeacher[n].push(d); }
  return (
    <div className="space-y-4">
      {addDay !== null && <AddDutyModal resources={resources} dayOfWeek={addDay} onClose={() => setAddDay(null)} onAdded={() => { setAddDay(null); onRefresh(); }} />}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ALL_DAYS.filter((d) => workingDays.includes(d.value)).map((day) => (
          <DayColumn key={day.value} day={day}
            slots={duties.filter((d) => d.dayOfWeek === day.value)}
            onAdd={() => setAddDay(day.value)} onDelete={del} deletingId={deletingId} slotAccent="text-amber-800" />
        ))}
      </div>
      {duties.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50/50 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-900">Teacher Duty Summary</p>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(byTeacher).map(([name, slots]) => (
              <div key={name} className="px-5 py-3 flex items-center gap-4">
                <p className="text-sm font-medium text-gray-800 w-40 shrink-0 truncate">{name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(slots as any[]).map((s) => (
                    <span key={s.id} className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">
                      {ALL_DAYS.find((d) => d.value === s.dayOfWeek)?.short} · {s.dutyType}
                    </span>
                  ))}
                </div>
                <span className="ml-auto text-xs text-gray-400 shrink-0">{slots.length} duty{slots.length !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
type TabId = "class" | "lab" | "duty";
const TABS: { id: TabId; label: string; icon: any; color: string }[] = [
  { id: "class", label: "Class Timetable", icon: CalendarDays,  color: "text-blue-600"   },
  { id: "lab",   label: "Lab Schedule",    icon: FlaskConical,  color: "text-purple-600" },
  { id: "duty",  label: "Duty Roster",     icon: ShieldCheck,   color: "text-amber-600"  },
];

export default function ScheduleBuilder() {
  const [resources,    setResources]    = useState<any | null>(null);
  const [slots,        setSlots]        = useState<any[]>([]);
  const [duties,       setDuties]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [tab,          setTab]          = useState<TabId>("class");
  const [showDayPicker,setShowDayPicker]= useState(false);
  const [workingDays,  setWorkingDays]  = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(WORKING_DAYS_KEY) ?? "null") ?? [0,1,2,3,4,5]; }
    catch { return [0,1,2,3,4,5]; }
  });
  // keep resources ref stable across refreshes
  const resourcesRef = { current: resources };

  const load = useCallback(async (keepRes = false) => {
    setLoading(true); setError("");
    try {
      const [res, sl, dt] = await Promise.all([
        keepRes && resourcesRef.current ? Promise.resolve(resourcesRef.current) : api.scheduleManager.resources(),
        api.scheduleManager.slots(),
        api.scheduleManager.duties(),
      ]);
      setResources(res);
      setSlots(sl ?? []);
      setDuties(dt ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleDaysChange = (days: number[]) => {
    setWorkingDays(days);
    localStorage.setItem(WORKING_DAYS_KEY, JSON.stringify(days));
  };

  const classCount = slots.filter((s) => s.subjectCode !== "__duty__").length;
  const labCount   = slots.filter((s) => s.subjectCode !== "__duty__" && s.roomNo && (s.roomNo.toLowerCase().includes("lab") || s.roomNo.toLowerCase().includes("room"))).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            Schedule Manager
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Build the school's weekly timetable — classes, labs and teacher duties</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDayPicker((v) => !v)}
            className={cn("flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-colors font-medium",
              showDayPicker ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
            <Settings2 className="w-3.5 h-3.5" /> Working Days
          </button>
          <button onClick={() => load(true)} disabled={loading}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Working days picker */}
      {showDayPicker && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Working days</p>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((d) => (
              <button key={d.value} type="button"
                onClick={() => handleDaysChange(workingDays.includes(d.value) ? workingDays.filter((x) => x !== d.value) : [...workingDays, d.value].sort((a,b)=>a-b))}
                className={cn("px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors",
                  workingDays.includes(d.value) ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                {d.short}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{workingDays.map((d) => ALL_DAYS.find((x) => x.value === d)?.label).join(", ")}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error.includes("Schedule Manager")
            ? 'Your account needs the designation "Schedule Manager" — ask your admin to update your staff profile.'
            : error}
        </div>
      )}

      {/* Tabs */}
      {!error && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const count = t.id === "class" ? classCount : t.id === "lab" ? labCount : duties.length;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn("flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    tab === t.id ? cn("border-current", t.color) : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/60")}>
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {count > 0 && <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md", tab === t.id ? "bg-gray-100" : "bg-gray-100 text-gray-500")}>{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="p-5">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({length:6}).map((_,i) => <div key={i} className="bg-gray-50 rounded-2xl h-48 animate-pulse" />)}
              </div>
            ) : resources ? (
              <>
                {tab === "class" && <ClassTimetableTab resources={resources} slots={slots} workingDays={workingDays} onRefresh={() => load(true)} />}
                {tab === "lab"   && <LabScheduleTab    resources={resources} slots={slots} workingDays={workingDays} onRefresh={() => load(true)} />}
                {tab === "duty"  && <DutyRosterTab     resources={resources} duties={duties} workingDays={workingDays} onRefresh={() => load(true)} />}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
