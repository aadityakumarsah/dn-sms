import { useEffect, useState } from "react";
import { School, Users, DollarSign, TrendingUp, ArrowUpRight, MoreHorizontal, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-100" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
};

const PLAN_BADGE: Record<string, string> = {
  Enterprise: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  Pro: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  Basic: "bg-gray-100 text-gray-600",
  Free: "bg-gray-50 text-gray-400",
  None: "bg-gray-50 text-gray-400",
};

const PLAN_COLORS = ["bg-purple-500", "bg-blue-500", "bg-sky-400", "bg-gray-300", "bg-gray-200"];

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.superAdmin.dashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-6 flex items-center justify-center h-64">
      <p className="text-sm text-rose-500">Failed to load: {error}</p>
    </div>
  );

  const { stats, recentSchools = [], planDistribution = [], plans = [] } = data ?? {};

  const kpis = [
    { label: "Total Schools", value: String(stats?.totalSchools ?? 0), change: `${stats?.activeSchools ?? 0} active`, positive: true, sub: "on platform", icon: School, color: "purple" },
    { label: "Trial Schools", value: String(stats?.trialSchools ?? 0), change: `${stats?.suspendedSchools ?? 0} suspended`, positive: true, sub: "evaluating", icon: Users, color: "blue" },
    { label: "Total Revenue", value: `NPR ${((stats?.totalRevenuePaid ?? 0) / 1000).toFixed(1)}K`, change: "paid", positive: true, sub: "all time", icon: DollarSign, color: "emerald" },
    { label: "Active Schools", value: String(stats?.activeSchools ?? 0), change: `of ${stats?.totalSchools ?? 0}`, positive: true, sub: "subscribed", icon: TrendingUp, color: "rose" },
  ];

  // Build plan distribution with names
  const planMap: Record<string, string> = {};
  for (const p of plans) planMap[p.id] = p.name;
  const distTotal = planDistribution.reduce((s: number, p: any) => s + p.count, 0) || 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">All systems operational</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full ring-1 ring-emerald-200">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((s) => {
          const Icon = s.icon;
          const c = COLOR_MAP[s.color] ?? COLOR_MAP.purple;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center ring-4", c.bg, c.text, c.ring)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={cn("flex items-center gap-0.5 text-xs font-semibold", s.positive ? "text-emerald-600" : "text-rose-500")}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Recent Schools */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Schools</h2>
            <button className="text-xs text-gray-400 hover:text-purple-600 transition-colors">View all →</button>
          </div>
          {recentSchools.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">No schools yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">School</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Plan</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {recentSchools.map((s: any) => (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.district ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", PLAN_BADGE[s.plan] ?? PLAN_BADGE.None)}>{s.plan}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(s.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("flex items-center gap-1.5 text-xs font-medium", s.status === "ACTIVE" ? "text-emerald-600" : "text-gray-400")}>
                        {s.status === "ACTIVE" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Plan Distribution</h2>
          <p className="text-xs text-gray-400 mb-5">{stats?.totalSchools ?? 0} total schools</p>
          <div className="space-y-3">
            {planDistribution.map((p: any, i: number) => {
              const pct = Math.round((p.count / distTotal) * 100);
              return (
                <div key={p.planId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{planMap[p.planId] ?? "Unknown"}</span>
                    <span className="text-xs text-gray-400">{p.count} school{p.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={cn("h-2 rounded-full transition-all", PLAN_COLORS[i % PLAN_COLORS.length])} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {planDistribution.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No subscriptions yet.</p>
            )}
          </div>

          {planDistribution.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Distribution bar</p>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {planDistribution.map((p: any, i: number) => (
                  <div key={p.planId} className={cn("transition-all", PLAN_COLORS[i % PLAN_COLORS.length])} style={{ width: `${Math.round((p.count / distTotal) * 100)}%` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
