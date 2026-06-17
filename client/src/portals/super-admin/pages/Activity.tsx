import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function dateLabel(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const ACTION_COLORS: Record<string, string> = {
  "school.created": "bg-blue-50 text-blue-600",
  "subscription.activated": "bg-emerald-50 text-emerald-600",
  "subscription.cancelled": "bg-rose-50 text-rose-600",
  "school.suspended": "bg-amber-50 text-amber-600",
};

const ACTION_ICONS: Record<string, string> = {
  "school.created": "🏫",
  "subscription.activated": "✅",
  "subscription.cancelled": "❌",
  "school.suspended": "⚠️",
};

export default function Activity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.superAdmin.activity({ page })
      .then((res) => { setLogs(res.logs); setTotal(res.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  // Group by date
  const grouped: Record<string, any[]> = {};
  for (const log of logs) {
    const key = dateLabel(log.createdAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total events recorded</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-16 text-center text-sm text-gray-400">
          No activity logged yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{date}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {entries.map((log) => (
                  <div key={log.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                    <span className="text-base shrink-0 mt-0.5">{ACTION_ICONS[log.action] ?? "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-500")}>
                          {log.action}
                        </span>
                        {log.school?.name && (
                          <span className="text-xs text-gray-500">{log.school.name}</span>
                        )}
                      </div>
                      {log.entityType && (
                        <p className="text-xs text-gray-400 mt-0.5">{log.entityType} · {log.entityId?.slice(0, 8)}…</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 50 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
          <span className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg">{page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={logs.length < 50}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
