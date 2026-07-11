import { useState, useMemo } from "react";
import { Info, AlertTriangle, CheckCircle2, Bell, ChevronDown, ChevronUp, Clock, User, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoticeItem {
  id: string;
  title: string;
  body?: string;
  content?: string;
  createdAt: string;
  publishedAt?: string;
  type?: string;
  isUrgent?: boolean;
  targetRole?: string | null;
  authorName?: string;
  source: "notice" | "notification";
}

const TYPE_CFG: Record<string, { color: string; icon: any; label: string }> = {
  urgent: { color: "bg-rose-50 text-rose-700 border-rose-100", icon: AlertTriangle, label: "Urgent" },
  info: { color: "bg-blue-50 text-blue-700 border-blue-100", icon: Info, label: "Info" },
  success: { color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2, label: "Success" },
  warning: { color: "bg-amber-50 text-amber-700 border-amber-100", icon: AlertTriangle, label: "Warning" },
};

function getType(item: NoticeItem): string {
  if (item.isUrgent) return "urgent";
  return item.type ?? "info";
}

function fmtDate(d: string) {
  try {
    const dt = new Date(d);
    const now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate()) return `Today at ${dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    if (diff < 172800000 && dt.getDate() === now.getDate() - 1) return `Yesterday at ${dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

export default function NoticesFeed({ notices = [], notifications = [] }: { notices?: NoticeItem[]; notifications?: NoticeItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const items = useMemo(() => {
    const mapped: NoticeItem[] = [
      ...notices.map((n) => ({ ...n, source: "notice" as const })),
      ...notifications.map((n) => ({ ...n, source: "notification" as const })),
    ];
    mapped.sort((a, b) => new Date(b.createdAt || b.publishedAt || "").getTime() - new Date(a.createdAt || a.publishedAt || "").getTime());
    return mapped;
  }, [notices, notifications]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No notices or notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const t = getType(item);
        const cfg = (TYPE_CFG[t] ?? TYPE_CFG.info)!;
        const Icon = cfg.icon;
        const isOpen = expanded === item.id;
        const dateStr = fmtDate(item.createdAt || item.publishedAt || "");
        const body = item.body || item.content || "";

        return (
          <div key={`${item.source}-${item.id}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-sm">
            <button
              onClick={() => setExpanded(isOpen ? null : item.id)}
              className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border", cfg.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</p>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {dateStr}</span>
                    {item.authorName && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.authorName}</span>}
                    {item.targetRole && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize">
                          {item.targetRole.toLowerCase()}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-gray-300 shrink-0 mt-1">
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {isOpen && body && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <p className="text-sm text-gray-600 leading-relaxed pt-3 whitespace-pre-wrap">{body}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}