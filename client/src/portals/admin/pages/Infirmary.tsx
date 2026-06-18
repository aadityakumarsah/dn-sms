import { useState, useEffect } from "react";
import { HeartPulse, Trash2, Thermometer, Pill } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

export default function Infirmary() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.infirmary());
  const [students, setStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ studentId: "", visitorName: "", symptoms: "", treatment: "", temperature: "", medication: "", visitDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => { api.admin.students({ status: "ACTIVE" }).then((r) => setStudents(r.students ?? [])).catch(() => {}); }, []);

  const openNew = () => { setForm({ studentId: "", visitorName: "", symptoms: "", treatment: "", temperature: "", medication: "", visitDate: new Date().toISOString().slice(0, 10) }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.symptoms) { setError("Symptoms are required"); return; }
    if (!form.studentId && !form.visitorName) { setError("Select a student or enter a visitor name"); return; }
    setSaving(true); setError(null);
    try {
      await api.admin.createInfirmaryVisit({ ...form, studentId: form.studentId || undefined, visitorName: form.studentId ? undefined : form.visitorName });
      setOpen(false); reload();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Infirmary" subtitle="Record health checkups and clinic visits"
        onRefresh={reload} loading={loading} action={{ label: "Log Visit", onClick: openNew }} />

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<HeartPulse className="w-8 h-8" />} text="No infirmary records yet" action={{ label: "Log a visit", onClick: openNew }} /></div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">{["Date", "Patient", "Symptoms", "Treatment", "Temp", "Medication", ""].map((x) => <th key={x} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{x}</th>)}</tr></thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(v.visitDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{v.patientName}</td>
                    <td className="px-5 py-3 text-gray-600">{v.symptoms}</td>
                    <td className="px-5 py-3 text-gray-500">{v.treatment ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{v.temperature ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{v.medication ?? "—"}</td>
                    <td className="px-5 py-3 text-right"><button onClick={async () => { if (confirm("Delete this record?")) { await api.admin.deleteInfirmaryVisit(v.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log Infirmary Visit"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Student" hint="Leave empty and use visitor name for staff/guests">
          <Select value={form.studentId} onChange={(e) => set("studentId", e.target.value)}>
            <option value="">— Not a student —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>)}
          </Select>
        </Field>
        {!form.studentId && <Field label="Visitor name"><TextInput value={form.visitorName} onChange={(e) => set("visitorName", e.target.value)} placeholder="e.g. staff/guest name" /></Field>}
        <Field label="Symptoms" required><Textarea rows={2} value={form.symptoms} onChange={(e) => set("symptoms", e.target.value)} /></Field>
        <Field label="Treatment given"><Textarea rows={2} value={form.treatment} onChange={(e) => set("treatment", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Temperature"><TextInput value={form.temperature} onChange={(e) => set("temperature", e.target.value)} placeholder="e.g. 99.2°F" /></Field>
          <Field label="Visit date"><TextInput type="date" value={form.visitDate} onChange={(e) => set("visitDate", e.target.value)} /></Field>
        </div>
        <Field label="Medication"><TextInput value={form.medication} onChange={(e) => set("medication", e.target.value)} placeholder="e.g. Paracetamol 500mg" /></Field>
      </Modal>
    </div>
  );
}
