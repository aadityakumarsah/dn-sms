import { useState, useEffect } from "react";
import { Plus, Globe, Trash2, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const TYPE_OPTIONS = ["info", "warning", "success", "critical"];
const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
  critical: "bg-rose-50 text-rose-700",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Announcements() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [targetPlan, setTargetPlan] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.superAdmin.announcements()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.superAdmin.createAnnouncement({ title: title.trim(), body: body.trim(), type, targetPlan: targetPlan || undefined });
      setTitle(""); setBody(""); setType("info"); setTargetPlan("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.superAdmin.deleteAnnouncement(id);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send platform-wide messages to all schools</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-purple-500" />
          <h2 className="font-semibold text-gray-900">New Announcement</h2>
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title..."
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={4}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <select value={targetPlan} onChange={(e) => setTargetPlan(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-600">
              <option value="">All schools</option>
              <option value="free">Free plan only</option>
              <option value="basic">Basic plan only</option>
              <option value="pro">Pro plan only</option>
              <option value="enterprise">Enterprise only</option>
            </select>
          </div>

          <div className="flex gap-2">
            {TYPE_OPTIONS.map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={cn("text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all", type === t ? TYPE_COLORS[t] : "bg-gray-50 text-gray-400 hover:bg-gray-100")}>
                {t}
              </button>
            ))}
          </div>

          <button onClick={handleSend} disabled={!title.trim() || !body.trim() || sending}
            className="ml-auto flex items-center gap-1.5 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors">
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending..." : "Send Announcement"}
          </button>
        </div>
      </div>

      {/* Past announcements */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Past Announcements ({items.length})</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-10 text-center text-sm text-gray-400">
            No announcements yet. Send your first one above.
          </div>
        ) : items.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", TYPE_COLORS[a.type] ?? TYPE_COLORS.info)}>
                    {a.type}
                  </span>
                  {a.targetPlan && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{a.targetPlan} only</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{timeAgo(a.createdAt)}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{a.body}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-gray-300 hover:text-rose-500 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
