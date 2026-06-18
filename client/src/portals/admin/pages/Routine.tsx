import { useState, useEffect } from "react";
import { CalendarRange, Trash2, Sun, Sunrise, BookText } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SHIFT_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  MORNING: { label: "Morning", cls: "bg-orange-50 text-orange-600", icon: Sunrise },
  DAY: { label: "Day", cls: "bg-sky-50 text-sky-600", icon: Sun },
};

export default function Routine() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.routine());
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ sectionId: "", subjectId: "", teacherId: "", dayOfWeek: 0, periodNumber: 1, startTime: "10:00", endTime: "10:45", roomNo: "", shift: "DAY", materials: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.admin.classes().then((r) => {
      const secs = (r.grades ?? []).flatMap((g: any) => (g.sections ?? []).map((s: any) => ({ id: s.id, name: `${g.name} ${s.name}` })));
      setSections(secs);
      if (secs[0]) setActiveSection(secs[0].id);
    }).catch(() => {});
    api.admin.subjects().then((r: any) => setSubjects(Array.isArray(r) ? r : (r.subjects ?? []))).catch(() => {});
    api.admin.teachers().then((r) => setTeachers(r.teachers ?? r ?? [])).catch(() => {});
  }, []);

  const slots = (data ?? []).filter((s) => (!activeSection || s.sectionId === activeSection) && (!shiftFilter || s.shift === shiftFilter));

  const openNew = () => { setForm({ sectionId: activeSection || (sections[0]?.id ?? ""), subjectId: "", teacherId: "", dayOfWeek: 0, periodNumber: 1, startTime: "10:00", endTime: "10:45", roomNo: "", shift: shiftFilter || "DAY", materials: "" }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.sectionId || !form.subjectId || !form.startTime || !form.endTime) { setError("Section, subject and times are required"); return; }
    setSaving(true); setError(null);
    try { await api.admin.createRoutineSlot(form); setOpen(false); reload(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Class Routine" subtitle="Build weekly timetables per section & shift"
        onRefresh={reload} loading={loading} action={{ label: "Add Period", onClick: openNew }} />

      <div className="flex flex-col gap-3">
        {sections.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {sections.map((s) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn("text-sm px-3 py-1.5 rounded-lg border transition-colors", activeSection === s.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")}>
                {s.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          {([["", "All shifts"], ["MORNING", "Morning"], ["DAY", "Day"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setShiftFilter(val)}
              className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors", shiftFilter === val ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : slots.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<CalendarRange className="w-8 h-8" />} text="No periods scheduled for this section / shift" action={{ label: "Add a period", onClick: openNew }} /></div>
        : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAYS.map((day, di) => {
              const daySlots = slots.filter((s) => s.dayOfWeek === di).sort((a, b) => a.periodNumber - b.periodNumber);
              if (daySlots.length === 0) return null;
              return (
                <div key={day} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><p className="text-sm font-semibold text-gray-700">{day}</p></div>
                  <div className="divide-y divide-gray-50">
                    {daySlots.map((s) => {
                      const sb = SHIFT_BADGE[s.shift] ?? SHIFT_BADGE.DAY!;
                      return (
                        <div key={s.id} className="px-4 py-3 flex items-start gap-3 group">
                          <div className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">{s.startTime}–{s.endTime}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900">{s.subjectName}</p>
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", sb.cls)}>{sb.label}</span>
                            </div>
                            <p className="text-xs text-gray-400">{s.teacherName ?? "—"}{s.roomNo ? ` · Room ${s.roomNo}` : ""}</p>
                            {s.materials && <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1"><BookText className="w-3 h-3 shrink-0" /> {s.materials}</p>}
                          </div>
                          <button onClick={async () => { if (confirm("Remove this period?")) { await api.admin.deleteRoutineSlot(s.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Period"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Section" required>
          <Select value={form.sectionId} onChange={(e) => set("sectionId", e.target.value)}>
            <option value="">— Select section —</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject" required>
            <Select value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
              <option value="">— Select subject —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Shift">
            <Select value={form.shift} onChange={(e) => set("shift", e.target.value)}>
              <option value="DAY">Day shift</option>
              <option value="MORNING">Morning shift</option>
            </Select>
          </Field>
        </div>
        <Field label="Teacher">
          <Select value={form.teacherId} onChange={(e) => set("teacherId", e.target.value)}>
            <option value="">— Optional —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name ?? t.fullName ?? t.email}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Day"><Select value={form.dayOfWeek} onChange={(e) => set("dayOfWeek", Number(e.target.value))}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select></Field>
          <Field label="Period #"><TextInput type="number" min={1} value={form.periodNumber} onChange={(e) => set("periodNumber", Number(e.target.value))} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Start"><TextInput type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} /></Field>
          <Field label="End"><TextInput type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} /></Field>
          <Field label="Room"><TextInput value={form.roomNo} onChange={(e) => set("roomNo", e.target.value)} /></Field>
        </div>
        <Field label="Materials / Books to bring" hint="Shown to students & parents for this period">
          <TextInput value={form.materials} onChange={(e) => set("materials", e.target.value)} placeholder="e.g. Math textbook, geometry box, graph copy" />
        </Field>
      </Modal>
    </div>
  );
}
