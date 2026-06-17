import { useState, useEffect } from "react";
import { GraduationCap, Users, DollarSign, CalendarCheck, AlertTriangle, TrendingUp, ArrowUpRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.admin.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const stats = data?.stats;
  const feesPct = stats ? (stats.feesTotal > 0 ? Math.round((stats.feesCollected / stats.feesTotal) * 100) : 0) : 0;

  const KPI_CARDS = stats ? [
    { label: "Total Students", value: stats.totalStudents, sub: "enrolled", icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
    { label: "Total Teachers", value: stats.totalTeachers, sub: `+ ${stats.totalStaff} staff`, icon: Users, color: "text-green-600 bg-green-50" },
    { label: "Fees Collected", value: `NPR ${(stats.feesCollected / 1000).toFixed(1)}K`, sub: `${feesPct}% of total due`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    { label: "Today's Attendance", value: stats.todayTotal > 0 ? `${stats.todayAttendancePct}%` : "Not marked", sub: stats.todayTotal > 0 ? `${stats.todayPresent}/${stats.todayTotal} present` : "Mark attendance", icon: CalendarCheck, color: "text-teal-600 bg-teal-50" },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">School Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.schoolName}</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-28 animate-pulse">
            <div className="w-9 h-9 bg-gray-100 rounded-xl mb-4" />
            <div className="h-5 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        )) : KPI_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {stats?.pendingFees > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{stats.pendingFees} pending fee collections</p>
            <p className="text-xs text-amber-600">Some students have overdue or pending fee payments.</p>
          </div>
          <a href="/admin/fees" className="ml-auto text-xs text-amber-700 font-semibold border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100">View Fees →</a>
        </div>
      )}

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Attendance Rate</h2>
              <p className="text-xs text-gray-400 mt-0.5">Today's overview</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          {stats?.todayTotal > 0 ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Present</span><span className="font-semibold text-emerald-600">{stats.todayPresent}</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.todayAttendancePct}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Absent</span><span className="font-semibold text-rose-500">{stats.todayTotal - stats.todayPresent}</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-rose-400 h-2 rounded-full" style={{ width: `${100 - stats.todayAttendancePct}%` }} /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900 text-center pt-2">{stats.todayAttendancePct}%</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">No attendance marked today</p>
              <a href="/admin/attendance" className="text-xs text-blue-600 font-medium mt-1 inline-block">Mark now →</a>
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Notices</h2>
            <a href="/admin/notices" className="text-xs text-blue-600 hover:underline">Manage →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex gap-3 animate-pulse">
                <div className="w-4 h-4 bg-gray-100 rounded mt-0.5 shrink-0" />
                <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-2.5 bg-gray-100 rounded w-1/2" /></div>
              </div>
            )) : data?.recentNotices?.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No notices yet. <a href="/admin/notices" className="text-blue-600">Create one →</a></div>
            ) : data?.recentNotices?.map((n: any) => (
              <div key={n.id} className="px-5 py-3 flex items-start gap-3">
                {n.isUrgent ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.authorName} · {new Date(n.publishedAt).toLocaleDateString()}</p>
                </div>
                {n.isUrgent && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg font-medium shrink-0">Urgent</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
