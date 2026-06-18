import { useState, useEffect } from "react";
import { Award, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

// CAS = Creativity, Activity, Service + academic areas
const AREAS = ["Creativity", "Activity", "Service", "Academics", "Discipline", "Leadership", "Sports", "Other"];

export default function Assessments() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.assessments());
  const [students, setStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState<any>({ studentId: "", term: "", area: "Creativity", grade: "", score: "", remarks: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = (data ?? []).filter((a) => !filter || a.studentId === filter);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => { api.admin.students({ status: "ACTIVE" }).then((r) => setStudents(r.students ?? [])).catch(() => {}); }, []);

  const openNew = () => { setForm({ studentId: filter || "", term: "", area: "Creativity", grade: "", score: "", remarks: "" }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.studentId || !form.term || !form.area) { setError("Student, term and area are required"); return; }
    setSaving(true); setError(null);
    try { await api.admin.createAssessment(form); setOpen(false); reload(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Student Evaluation (CAS & Record)" subtitle="Continuous assessment beyond exams"
        onRefresh={reload} loading={loading} action={{ label: "New Assessment", onClick: openNew }} />

      <div className="max-w-xs">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All students</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}
        </Select>
      </div>

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<Award className="w-8 h-8" />} text="No assessments recorded yet" action={{ label: "Add one", onClick: openNew }} /></div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">{["Student", "Term", "Area", "Grade", "Score", "Remarks", ""].map((x) => <th key={x} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{x}</th>)}</tr></thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3"><p className="font-medium text-gray-900">{a.studentName}</p><p className="text-xs text-gray-400">{a.admissionNo}</p></td>
                    <td className="px-5 py-3 text-gray-600">{a.term}</td>
                    <td className="px-5 py-3 text-gray-600">{a.area}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{a.grade ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{a.score != null ? a.score : "—"}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-[220px] truncate">{a.remarks ?? "—"}</td>
                    <td className="px-5 py-3 text-right"><button onClick={async () => { if (confirm("Delete?")) { await api.admin.deleteAssessment(a.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Student Assessment"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Student" required>
          <Select value={form.studentId} onChange={(e) => set("studentId", e.target.value)}>
            <option value="">— Select student —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Term" required hint="e.g. Term 1, 2081"><TextInput value={form.term} onChange={(e) => set("term", e.target.value)} /></Field>
          <Field label="Area" required><Select value={form.area} onChange={(e) => set("area", e.target.value)}>{AREAS.map((a) => <option key={a}>{a}</option>)}</Select></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Grade" hint="e.g. A, B+, Excellent"><TextInput value={form.grade} onChange={(e) => set("grade", e.target.value)} /></Field>
          <Field label="Score" hint="optional numeric"><TextInput type="number" value={form.score} onChange={(e) => set("score", e.target.value)} /></Field>
        </div>
        <Field label="Remarks"><Textarea rows={2} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
