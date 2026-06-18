import { useState } from "react";
import { FileText, Trash2, ExternalLink, Download } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, SearchBar, useList } from "./_ui";

const CATEGORIES = ["General", "Policy", "Form", "Circular", "Report", "Certificate", "Syllabus", "Other"];

export default function Documents() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.documents());
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ title: "", category: "General", fileUrl: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = (data ?? []).filter((d) => d.title.toLowerCase().includes(q.toLowerCase()) || d.category.toLowerCase().includes(q.toLowerCase()));
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title || !form.fileUrl) { setError("Title and file link are required"); return; }
    setSaving(true); setError(null);
    try {
      await api.admin.createDocument(form);
      setOpen(false); setForm({ title: "", category: "General", fileUrl: "", description: "" }); reload();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Document Management" subtitle="Store and share school documents & resources"
        onRefresh={reload} loading={loading} action={{ label: "Add Document", onClick: () => setOpen(true) }} />

      <div className="max-w-sm"><SearchBar value={q} onChange={setQ} placeholder="Search documents…" /></div>

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<FileText className="w-8 h-8" />} text="No documents yet" action={{ label: "Add one", onClick: () => setOpen(true) }} /></div>
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
                  <button onClick={async () => { if (confirm("Delete this document?")) { await api.admin.deleteDocument(d.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{d.title}</p>
                  <span className="text-xs text-gray-400">{d.category}</span>
                </div>
                {d.description && <p className="text-xs text-gray-500 line-clamp-2">{d.description}</p>}
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open document
                </a>
              </div>
            ))}
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Document"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Title" required><TextInput value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Category"><Select value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="File link (URL)" required hint="Paste a link to the file (Google Drive, Dropbox, etc.)"><TextInput value={form.fileUrl} onChange={(e) => set("fileUrl", e.target.value)} placeholder="https://…" /></Field>
        <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
