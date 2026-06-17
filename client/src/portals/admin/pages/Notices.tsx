import { useState, useEffect } from "react";
import { Plus, Trash2, X, AlertTriangle, Info, Bell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const TYPE_CONFIG: Record<string, { icon: any; bg: string; text: string }> = {
  info:    { icon: Info,          bg: "bg-blue-50",   text: "text-blue-700" },
  urgent:  { icon: AlertTriangle, bg: "bg-rose-50",   text: "text-rose-700" },
};

const ROLES = ["All", "STUDENT", "TEACHER", "PARENT", "STAFF", "ADMIN"];

function NoticeModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ title: "", content: "", targetRole: "", isUrgent: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setForm({ title: "", content: "", targetRole: "", isUrgent: false }); setError(""); } }, [open]);
  if (!open) return null;

  const handleSave = async () => {
    if (!form.title || !form.content) { setError("Title and content are required"); return; }
    setSaving(true); setError("");
    try { await onSave({ title: form.title, content: form.content, targetRole: form.targetRole || null, isUrgent: form.isUrgent }); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Post Notice</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title <span className="text-rose-400">*</span></label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Notice title..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Content <span className="text-rose-400">*</span></label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4}
              placeholder="Notice details..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Target Audience</label>
              <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">Everyone</option>
                {ROLES.slice(1).map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button type="button" onClick={() => setForm({ ...form, isUrgent: !form.isUrgent })}
                className={cn("relative rounded-full transition-colors shrink-0", form.isUrgent ? "bg-rose-500" : "bg-gray-200")}
                style={{ height: "22px", width: "40px" }}>
                <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", form.isUrgent ? "translate-x-5" : "translate-x-0.5")} />
              </button>
              <span className="text-sm text-gray-600">Mark urgent</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Posting..." : "Post Notice"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Notices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("All");

  const load = () => { setLoading(true); api.admin.notices().then(setNotices).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const filtered = filter === "All" ? notices : notices.filter((n) => n.targetRole === filter);

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notices</h1>
            <p className="text-sm text-gray-500 mt-0.5">{notices.length} notices published</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button onClick={() => setModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Post Notice
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button key={r} onClick={() => setFilter(r)}
              className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                filter === r ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300")}>
              {r === "All" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-28 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          )) : filtered.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
              <Bell className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No notices yet. <button onClick={() => setModal(true)} className="text-blue-600">Post the first one →</button></p>
            </div>
          ) : filtered.map((n) => {
            const cfg = n.isUrgent ? TYPE_CONFIG.urgent : TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div key={n.id} className={cn("bg-white rounded-2xl border p-5 group", n.isUrgent ? "border-rose-100" : "border-gray-100")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                      <Icon className={cn("w-4 h-4", cfg.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{n.title}</h3>
                        {n.isUrgent && <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg font-medium">Urgent</span>}
                        {n.targetRole && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg capitalize">{n.targetRole.toLowerCase()}</span>}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{n.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{n.authorName && `Posted by ${n.authorName} · `}{new Date(n.publishedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={async () => { await api.admin.deleteNotice(n.id); load(); }}
                    className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NoticeModal open={modal} onClose={() => setModal(false)} onSave={async (d) => { await api.admin.createNotice(d); load(); }} />
    </>
  );
}
