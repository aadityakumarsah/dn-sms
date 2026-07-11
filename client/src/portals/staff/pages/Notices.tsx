import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import NoticesFeed from "@/components/notifications/NoticesFeed";

export default function Notices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [n, notifs] = await Promise.all([
      api.di.notices().catch(() => []),
      api.di.notifications().catch(() => []),
    ]);
    setNotices(n ?? []);
    setNotifications(notifs ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notices & Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">School notices, announcements, and staff updates</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 disabled:opacity-50 shrink-0">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-20 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <NoticesFeed notices={notices} notifications={notifications} />
      )}
    </div>
  );
}