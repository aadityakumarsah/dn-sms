import { useState } from "react";
import { LifeBuoy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700", IN_PROGRESS: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-emerald-50 text-emerald-700", CLOSED: "bg-gray-100 text-gray-500",
};
const PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-500", NORMAL: "bg-sky-50 text-sky-700",
  HIGH: "bg-orange-50 text-orange-700", URGENT: "bg-rose-50 text-rose-700",
};
const CATEGORIES = ["General", "Technical", "Billing", "Feature Request", "Bug", "Account"];

export default function Support() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.support());
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ subject: "", message: "", category: "General", priority: "NORMAL" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openNew = () => { setForm({ subject: "", message: "", category: "General", priority: "NORMAL" }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.subject || !form.message) { setError("Subject and message are required"); return; }
    setSaving(true); setError(null);
    try { await api.admin.createSupportTicket(form); setOpen(false); reload(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => { await api.admin.updateSupportTicket(id, { status }); reload(); setView((v: any) => v && v.id === id ? { ...v, status } : v); };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Dedicated Support" subtitle="Raise and track support tickets"
        onRefresh={reload} loading={loading} action={{ label: "New Ticket", onClick: openNew }} />

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<LifeBuoy className="w-8 h-8" />} text="No tickets yet" action={{ label: "Raise one", onClick: openNew }} /></div>
        : (
          <div className="space-y-2">
            {list.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 cursor-pointer hover:shadow-sm" onClick={() => setView(t)}>
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><LifeBuoy className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{t.subject}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", STATUS_BADGE[t.status])}>{t.status.replace("_", " ")}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", PRIORITY_BADGE[t.priority])}>{t.priority}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{t.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.category} · {new Date(t.createdAt).toLocaleDateString()}{t.raisedByName ? ` · ${t.raisedByName}` : ""}</p>
                </div>
                <button onClick={async (e) => { e.stopPropagation(); if (confirm("Delete this ticket?")) { await api.admin.deleteSupportTicket(t.id); reload(); } }} className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Support Ticket"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} label="Submit" /></>}>
        <ErrorMsg msg={error} />
        <Field label="Subject" required><TextInput value={form.subject} onChange={(e) => set("subject", e.target.value)} /></Field>
        <Field label="Message" required><Textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category"><Select value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Priority"><Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>{["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}</Select></Field>
        </div>
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.subject ?? ""}
        footer={<button onClick={() => setView(null)} className="px-4 py-2 text-sm text-gray-500">Close</button>}>
        {view && (
          <>
            <div className="flex gap-2">
              <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", STATUS_BADGE[view.status])}>{view.status.replace("_", " ")}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", PRIORITY_BADGE[view.priority])}>{view.priority}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{view.message}</p>
            {view.response && <div className="p-3 bg-emerald-50 rounded-xl text-sm text-emerald-800"><span className="font-semibold">Response: </span>{view.response}</div>}
            <Field label="Update status">
              <Select value={view.status} onChange={(e) => updateStatus(view.id, e.target.value)}>
                {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </Select>
            </Field>
          </>
        )}
      </Modal>
    </div>
  );
}
