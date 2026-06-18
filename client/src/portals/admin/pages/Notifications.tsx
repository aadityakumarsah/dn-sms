import { useState } from "react";
import { Bell, Trash2, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const TYPE_CFG: Record<string, { color: string; icon: any }> = {
  info: { color: "bg-blue-50 text-blue-700", icon: Info },
  success: { color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  warning: { color: "bg-amber-50 text-amber-700", icon: AlertTriangle },
};

export default function Notifications() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.notifications());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [targetRole, setTargetRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = data ?? [];

  const save = async () => {
    if (!title || !body) { setError("Title and message are required"); return; }
    setSaving(true); setError(null);
    try {
      await api.admin.createNotification({ title, body, type, targetRole: targetRole || undefined });
      setOpen(false); setTitle(""); setBody(""); setType("info"); setTargetRole(""); reload();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Notifications" subtitle="Broadcast in-app notifications to your school"
        onRefresh={reload} loading={loading} action={{ label: "New Notification", onClick: () => setOpen(true) }} />

      {loading ? (
        <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<Bell className="w-8 h-8" />} text="No notifications yet" action={{ label: "Send one", onClick: () => setOpen(true) }} /></div>
      ) : (
        <div className="space-y-2">
          {list.map((n) => {
            const cfg = (TYPE_CFG[n.type] ?? TYPE_CFG.info)!;
            const Icon = cfg.icon;
            return (
              <div key={n.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg.color)}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    {n.targetRole && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{String(n.targetRole).toLowerCase()}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={async () => { if (confirm("Delete this notification?")) { await api.admin.deleteNotification(n.id); reload(); } }}
                  className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Notification"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} label="Send" /></>}>
        <ErrorMsg msg={error} />
        <Field label="Title" required><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holiday Notice" /></Field>
        <Field label="Message" required><Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option></Select></Field>
          <Field label="Target audience"><Select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}><option value="">Everyone</option><option value="TEACHER">Teachers</option><option value="STUDENT">Students</option><option value="STAFF">Staff</option><option value="PARENT">Parents</option></Select></Field>
        </div>
      </Modal>
    </div>
  );
}
