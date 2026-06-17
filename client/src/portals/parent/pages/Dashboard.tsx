import { useState, useEffect } from "react";
import { CalendarCheck, TrendingUp, DollarSign, Bell } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { api } from "@/lib/api";
import { dummyAvatar } from "@/lib/utils";

export default function ParentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChild, setActiveChild] = useState(0);

  useEffect(() => {
    api.parent.dashboard()
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const children = data?.children ?? [];
  const child = children[activeChild];
  const notices = data?.notices ?? [];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-sm text-gray-400">
          No children linked to your account yet.
        </div>
      </div>
    );
  }

  const subtitle = [child.className, child.rollNo ? `Roll No. ${child.rollNo}` : null].filter(Boolean).join(" · ") || "—";
  const topGrade = child.recentResults?.[0]?.grade ?? "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Child switcher (only if more than one child) */}
      {children.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {children.map((c: any, i: number) => (
            <button
              key={c.id}
              onClick={() => setActiveChild(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                i === activeChild ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <img src={c.avatar || dummyAvatar(c.name)} alt={c.name} className="w-5 h-5 rounded-full object-cover" />
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Child info card */}
      <div className="bg-teal-600 rounded-xl p-5 mb-6 text-white flex items-center gap-4">
        <img
          src={child.avatar || dummyAvatar(child.name)}
          alt={child.name}
          className="w-14 h-14 rounded-full object-cover bg-white/20 shrink-0 ring-2 ring-white/30"
        />
        <div className="min-w-0">
          <p className="font-bold text-lg truncate">{child.name}</p>
          <p className="text-teal-100 text-sm truncate">{subtitle}</p>
        </div>
        {child.stream && (
          <span className="ml-auto text-xs font-medium bg-white/20 px-3 py-1 rounded-lg whitespace-nowrap">{child.stream}</span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Attendance" value={`${child.attendancePct ?? 0}%`} icon={CalendarCheck} color="green" />
        <StatCard title="Latest Grade" value={topGrade} icon={TrendingUp} color="teal" />
        <StatCard title="Fee Due" value={`NPR ${(child.pendingFeeTotal ?? 0).toLocaleString()}`} icon={DollarSign} color={child.pendingFeeTotal ? "red" : "blue"} />
        <StatCard title="New Notices" value={notices.length} icon={Bell} color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Latest results */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Latest Results</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(child.recentResults ?? []).length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No results published yet.</p>
            ) : (
              child.recentResults.map((r: any, i: number) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.subject}</p>
                  <div className="flex items-center gap-4 shrink-0 ml-3">
                    <span className="text-sm text-gray-600">{r.marksObtained}/{r.fullMarks}</span>
                    {r.grade && <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{r.grade}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Latest Notices</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {notices.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No notices right now.</p>
            ) : (
              notices.map((n: any) => (
                <div key={n.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {n.isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
