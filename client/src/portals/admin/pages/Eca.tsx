import { useState } from "react";
import { Trophy, Trash2, Edit3, Clock, User } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const CATEGORIES = ["Sports", "Music", "Dance", "Art", "Debate", "Science Club", "Scout", "Drama", "Other"];

export default function Eca() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.eca());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: "", category: "Sports", description: "", inchargeName: "", schedule: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openNew = () => { setEdit(null); setForm({ name: "", category: "Sports", description: "", inchargeName: "", schedule: "" }); setError(null); setOpen(true); };
  const openEdit = (e: any) => { setEdit(e); setForm({ name: e.name, category: e.category, description: e.description ?? "", inchargeName: e.inchargeName ?? "", schedule: e.schedule ?? "" }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.name) { setError("Activity name is required"); return; }
    setSaving(true); setError(null);
    try {
      if (edit) await api.admin.updateEcaActivity(edit.id, form);
      else await api.admin.createEcaActivity(form);
      setOpen(false); reload();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Extra-Curricular Activities" subtitle="Manage ECA clubs, sports and activity logs"
        onRefresh={reload} loading={loading} action={{ label: "Add Activity", onClick: openNew }} />

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<Trophy className="w-8 h-8" />} text="No activities yet" action={{ label: "Add one", onClick: openNew }} /></div>
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Trophy className="w-4 h-4" /></div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e)} className="p-1 text-gray-300 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={async () => { if (confirm("Delete this activity?")) { await api.admin.deleteEcaActivity(e.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{e.name}</p>
                  <span className="text-xs text-gray-400">{e.category}</span>
                </div>
                {e.description && <p className="text-xs text-gray-500 line-clamp-2">{e.description}</p>}
                <div className="mt-auto space-y-1 pt-2 border-t border-gray-50">
                  {e.inchargeName && <p className="text-xs text-gray-500 flex items-center gap-1.5"><User className="w-3 h-3" /> {e.inchargeName}</p>}
                  {e.schedule && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {e.schedule}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Edit Activity" : "Add Activity"}
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Activity name" required><TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Football Club" /></Field>
        <Field label="Category"><Select value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="In-charge"><TextInput value={form.inchargeName} onChange={(e) => set("inchargeName", e.target.value)} placeholder="Teacher / coordinator" /></Field>
          <Field label="Schedule"><TextInput value={form.schedule} onChange={(e) => set("schedule", e.target.value)} placeholder="e.g. Fri 3-4 PM" /></Field>
        </div>
      </Modal>
    </div>
  );
}
