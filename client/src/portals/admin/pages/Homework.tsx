import { useState, useEffect } from "react";
import { BookMarked, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

export default function Homework() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.homework());
  const [teachers, setTeachers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({ teacherId: "", title: "", description: "", dueDate: today, maxMarks: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => { api.admin.teachers().then((r) => setTeachers(r.teachers ?? r ?? [])).catch(() => {}); }, []);

  const openNew = () => { setForm({ teacherId: "", title: "", description: "", dueDate: today, maxMarks: "" }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.teacherId || !form.title || !form.dueDate) { setError("Teacher, title and due date are required"); return; }
    setSaving(true); setError(null);
    try { await api.admin.createHomework(form); setOpen(false); reload(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Homework Management" subtitle="Oversee assignments across all teachers"
        onRefresh={reload} loading={loading} action={{ label: "New Homework", onClick: openNew }} />

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<BookMarked className="w-8 h-8" />} text="No homework assigned yet" action={{ label: "Add one", onClick: openNew }} /></div>
        : (
          <div className="space-y-2">
            {list.map((a) => {
              const overdue = new Date(a.dueDate) < new Date();
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0"><BookMarked className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    {a.description && <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{a.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>By {a.teacherName}</span>
                      <span className={cn(overdue ? "text-rose-500" : "text-gray-400")}>Due {new Date(a.dueDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {a.submissionCount} submitted</span>
                      {a.maxMarks != null && <span>{a.maxMarks} marks</span>}
                    </div>
                  </div>
                  <button onClick={async () => { if (confirm("Delete this homework?")) { await api.admin.deleteHomework(a.id); reload(); } }} className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Homework"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Assign as teacher" required>
          <Select value={form.teacherId} onChange={(e) => set("teacherId", e.target.value)}>
            <option value="">— Select teacher —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name ?? t.fullName ?? t.email}</option>)}
          </Select>
        </Field>
        <Field label="Title" required><TextInput value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Due date" required><TextInput type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></Field>
          <Field label="Max marks"><TextInput type="number" value={form.maxMarks} onChange={(e) => set("maxMarks", e.target.value)} /></Field>
        </div>
      </Modal>
    </div>
  );
}
