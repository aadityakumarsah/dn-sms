import { useState, useEffect } from "react";
import { ClipboardCheck, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const CRITERIA = [
  { key: "teachingQuality", label: "Teaching Quality" },
  { key: "punctuality", label: "Punctuality" },
  { key: "studentFeedback", label: "Student Feedback" },
  { key: "collaboration", label: "Collaboration" },
];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={cn("w-5 h-5", n <= value ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
        </button>
      ))}
    </div>
  );
}

export default function TeacherEvaluation() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.teacherEvaluations());
  const [teachers, setTeachers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ teacherId: "", period: "", teachingQuality: 3, punctuality: 3, studentFeedback: 3, collaboration: 3, remarks: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => { api.admin.teachers().then((r) => setTeachers(r.teachers ?? r ?? [])).catch(() => {}); }, []);

  const openNew = () => { setForm({ teacherId: "", period: "", teachingQuality: 3, punctuality: 3, studentFeedback: 3, collaboration: 3, remarks: "" }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.teacherId || !form.period) { setError("Teacher and period are required"); return; }
    setSaving(true); setError(null);
    try { await api.admin.createTeacherEvaluation(form); setOpen(false); reload(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const scoreColor = (s: number) => s >= 4 ? "text-emerald-600" : s >= 3 ? "text-blue-600" : s >= 2 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Teacher Evaluation & Analytics" subtitle="Periodic performance reviews of teaching staff"
        onRefresh={reload} loading={loading} action={{ label: "New Evaluation", onClick: openNew }} />

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<ClipboardCheck className="w-8 h-8" />} text="No evaluations yet" action={{ label: "Add one", onClick: openNew }} /></div>
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.teacherName}</p>
                    <span className="text-xs text-gray-400">{e.period}</span>
                  </div>
                  <button onClick={async () => { if (confirm("Delete this evaluation?")) { await api.admin.deleteTeacherEvaluation(e.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-3xl font-bold", scoreColor(e.overallScore))}>{e.overallScore.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">/ 5.0 overall</span>
                </div>
                <div className="space-y-1.5">
                  {CRITERIA.map((c) => (
                    <div key={c.key} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{c.label}</span>
                      <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("w-3 h-3", n <= e[c.key] ? "fill-amber-400 text-amber-400" : "text-gray-200")} />)}</div>
                    </div>
                  ))}
                </div>
                {e.remarks && <p className="text-xs text-gray-500 border-t border-gray-50 pt-2">{e.remarks}</p>}
              </div>
            ))}
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Teacher Evaluation"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Teacher" required>
          <Select value={form.teacherId} onChange={(e) => set("teacherId", e.target.value)}>
            <option value="">— Select teacher —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name ?? t.fullName ?? t.email}</option>)}
          </Select>
        </Field>
        <Field label="Period" required hint="e.g. 2081 Term 1, or Q1 2025"><TextInput value={form.period} onChange={(e) => set("period", e.target.value)} /></Field>
        <div className="space-y-3">
          {CRITERIA.map((c) => (
            <div key={c.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{c.label}</span>
              <StarPicker value={form[c.key]} onChange={(v) => set(c.key, v)} />
            </div>
          ))}
        </div>
        <Field label="Remarks"><Textarea rows={2} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
