import { useState, useEffect } from "react";
import { TrendingUp, Users, School, DollarSign, ArrowUpRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const DISTRICT_COLORS = ["bg-purple-500", "bg-blue-500", "bg-sky-400", "bg-teal-400", "bg-emerald-400", "bg-amber-400", "bg-rose-400"];

function MiniBarChart({ data, valueKey, color }: { data: any[]; valueKey: string; color: string }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 mt-2">
      {data.map((d, i) => {
        const pct = (Number(d[valueKey]) / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className={cn("w-full rounded-t transition-all", color, !isLast && "opacity-30")} style={{ height: `${pct}%` }} />
            <span className="text-[9px] text-gray-400 hidden md:block">{d.label?.slice(0, 3)}</span>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
              {d[valueKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.superAdmin.analytics().then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading && !data) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const schools = data?.schools ?? {};
  const users = data?.users ?? {};
  const revenue = data?.revenue ?? {};
  const byStatus = data?.byStatus ?? [];
  const byType = data?.byType ?? [];
  const byDistrict = data?.byDistrict ?? [];
  const byPlan = data?.byPlan ?? [];
  const monthlyGrowth = data?.monthlyGrowth ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform growth & performance overview</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Schools", value: schools.total ?? 0, sub: `${schools.active ?? 0} active, ${schools.trial ?? 0} trial`, icon: School, color: "text-purple-600 bg-purple-50" },
          { label: "Total Users", value: users.total ?? 0, sub: `${users.active ?? 0} active users`, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "All-time Revenue", value: `NPR ${Number(revenue.total ?? 0).toLocaleString()}`, sub: `NPR ${Number(revenue.thisMonth ?? 0).toLocaleString()} this month`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
          { label: "Suspended", value: schools.suspended ?? 0, sub: `${schools.paused ?? 0} paused, ${schools.inactive ?? 0} inactive`, icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", k.color)}>
              <k.icon className="w-4 h-4" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                <p className="text-xs text-gray-400">{k.sub}</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Monthly growth charts */}
      {monthlyGrowth.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-gray-900 text-sm">Schools Over Time</p>
            <p className="text-xs text-gray-400 mt-0.5">Cumulative school count by month</p>
            <MiniBarChart data={monthlyGrowth.map((m: any) => ({ label: m.month, schools: m.schools }))} valueKey="schools" color="bg-purple-500" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-gray-900 text-sm">Revenue (NPR)</p>
            <p className="text-xs text-gray-400 mt-0.5">Monthly revenue collected</p>
            <MiniBarChart data={monthlyGrowth.map((m: any) => ({ label: m.month, revenue: m.revenue }))} valueKey="revenue" color="bg-emerald-500" />
          </div>
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-4">
        {/* By status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Schools by Status</h2>
          <div className="space-y-3">
            {byStatus.map((s: any, i: number) => {
              const maxCount = Math.max(...byStatus.map((x: any) => x.count), 1);
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-sm shrink-0", DISTRICT_COLORS[i % DISTRICT_COLORS.length])} />
                  <span className="text-sm text-gray-700 w-28 capitalize">{s.status.toLowerCase()}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={cn("h-2 rounded-full", DISTRICT_COLORS[i % DISTRICT_COLORS.length])} style={{ width: `${(s.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-6 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By district */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Schools by District</h2>
          {byDistrict.length > 0 ? (
            <>
              <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
                {byDistrict.slice(0, 7).map((d: any, i: number) => {
                  const total = byDistrict.reduce((s: number, x: any) => s + x.count, 0);
                  return (
                    <div key={d.district} className={cn("transition-all", DISTRICT_COLORS[i % DISTRICT_COLORS.length])}
                      style={{ width: `${(d.count / total) * 100}%` }} title={`${d.district}: ${d.count}`} />
                  );
                })}
              </div>
              <div className="space-y-2">
                {byDistrict.slice(0, 7).map((d: any, i: number) => (
                  <div key={d.district} className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-sm shrink-0", DISTRICT_COLORS[i % DISTRICT_COLORS.length])} />
                    <span className="text-sm text-gray-700 flex-1">{d.district || "Unknown"}</span>
                    <span className="text-sm font-bold text-gray-900">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-gray-400">No district data yet.</p>}
        </div>

        {/* By type */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Schools by Type</h2>
          <div className="space-y-3">
            {byType.map((t: any, i: number) => {
              const maxCount = Math.max(...byType.map((x: any) => x.count), 1);
              return (
                <div key={t.type} className="flex items-center gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-sm shrink-0", DISTRICT_COLORS[i % DISTRICT_COLORS.length])} />
                  <span className="text-sm text-gray-700 flex-1 capitalize">{(t.type ?? "unknown").replace(/_/g, " ").toLowerCase()}</span>
                  <div className="w-24 bg-gray-100 rounded-full h-2">
                    <div className={cn("h-2 rounded-full", DISTRICT_COLORS[i % DISTRICT_COLORS.length])} style={{ width: `${(t.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-6 text-right">{t.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By plan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Active Subscriptions by Plan</h2>
          <div className="space-y-3">
            {byPlan.length === 0 ? <p className="text-sm text-gray-400">No subscriptions yet.</p> : byPlan.map((p: any, i: number) => {
              const maxCount = Math.max(...byPlan.map((x: any) => x.count), 1);
              return (
                <div key={p.plan} className="flex items-center gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-sm shrink-0", DISTRICT_COLORS[i % DISTRICT_COLORS.length])} />
                  <span className="text-sm text-gray-700 flex-1 capitalize">{p.plan ?? "None"}</span>
                  <div className="w-24 bg-gray-100 rounded-full h-2">
                    <div className={cn("h-2 rounded-full", DISTRICT_COLORS[i % DISTRICT_COLORS.length])} style={{ width: `${(p.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-6 text-right">{p.count}</span>
                  <span className="text-xs text-emerald-600 font-semibold w-24 text-right">NPR {Number(p.mrr ?? 0).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
