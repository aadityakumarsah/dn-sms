import { useState } from "react";
import { ClipboardList, Trash2, Plus, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const Q_TYPES = [{ v: "text", l: "Text answer" }, { v: "rating", l: "Rating (1–5)" }, { v: "yesno", l: "Yes / No" }, { v: "choice", l: "Multiple choice" }];

export default function Surveys() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.surveys());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [questions, setQuestions] = useState<any[]>([{ q: "", type: "text", options: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];

  const openNew = () => { setTitle(""); setDescription(""); setTargetRole(""); setQuestions([{ q: "", type: "text", options: "" }]); setError(null); setOpen(true); };
  const setQ = (i: number, k: string, v: string) => setQuestions((qs) => qs.map((q, j) => j === i ? { ...q, [k]: v } : q));

  const save = async () => {
    const cleaned = questions.filter((q) => q.q.trim()).map((q) => ({ q: q.q.trim(), type: q.type, options: q.type === "choice" ? q.options.split(",").map((o: string) => o.trim()).filter(Boolean) : undefined }));
    if (!title || cleaned.length === 0) { setError("Title and at least one question are required"); return; }
    setSaving(true); setError(null);
    try {
      await api.admin.createSurvey({ title, description, targetRole: targetRole || undefined, questions: cleaned });
      setOpen(false); reload();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Surveys" subtitle="Collect feedback from your school community"
        onRefresh={reload} loading={loading} action={{ label: "New Survey", onClick: openNew }} />

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<ClipboardList className="w-8 h-8" />} text="No surveys yet" action={{ label: "Create one", onClick: openNew }} /></div>
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center"><ClipboardList className="w-4 h-4" /></div>
                  <div className="flex items-center gap-1">
                    <button onClick={async () => { await api.admin.updateSurvey(s.id, { isActive: !s.isActive }); reload(); }}
                      className={cn("text-xs px-2 py-0.5 rounded-full font-medium", s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400")}>{s.isActive ? "Active" : "Closed"}</button>
                    <button onClick={async () => { if (confirm("Delete this survey?")) { await api.admin.deleteSurvey(s.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                {s.description && <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>}
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50 text-xs text-gray-400">
                  <span>{(s.questions?.length ?? 0)} questions</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {s.responseCount} responses</span>
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Survey" wide
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Survey title" required><TextInput value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Description"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label="Target audience"><Select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}><option value="">Everyone</option><option value="TEACHER">Teachers</option><option value="STUDENT">Students</option><option value="STAFF">Staff</option><option value="PARENT">Parents</option></Select></Field>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">Questions</label>
            <button onClick={() => setQuestions((qs) => [...qs, { q: "", type: "text", options: "" }])} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add question</button>
          </div>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <TextInput value={q.q} onChange={(e) => setQ(i, "q", e.target.value)} placeholder={`Question ${i + 1}`} />
                  {questions.length > 1 && <button onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} className="p-2 text-gray-300 hover:text-rose-500"><X className="w-4 h-4" /></button>}
                </div>
                <div className="flex gap-2">
                  <Select value={q.type} onChange={(e) => setQ(i, "type", e.target.value)} className="max-w-[180px]">{Q_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</Select>
                  {q.type === "choice" && <TextInput value={q.options} onChange={(e) => setQ(i, "options", e.target.value)} placeholder="Options, comma-separated" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
