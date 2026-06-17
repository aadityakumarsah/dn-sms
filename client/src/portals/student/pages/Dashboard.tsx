import { useState, useEffect } from "react";
import { BookOpen, CalendarCheck, TrendingUp, DollarSign, Bell } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { dummyAvatar, cn } from "@/lib/utils";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.student.dashboard()
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const profile = data?.profile;
  const name = profile?.name || user?.name || "Student";
  const subtitle = [profile?.className, profile?.rollNumber ? `Roll No. ${profile.rollNumber}` : null, profile?.academicYear]
    .filter(Boolean).join(" · ") || "—";
  const results = data?.recentResults ?? [];
  const notices = data?.notices ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Profile header */}
      <div className="mb-6 flex items-center gap-4">
        <img
          src={profile?.avatar || dummyAvatar(name)}
          alt={name}
          className="w-14 h-14 rounded-2xl object-cover bg-sky-100 shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">Hi, {name.split(" ")[0]}!</h1>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
        </div>
        {profile?.stream && (
          <span className="ml-auto text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100 px-3 py-1 rounded-lg whitespace-nowrap">
            {profile.stream}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Attendance" value={loading ? "…" : `${data?.attendancePct ?? 0}%`} icon={CalendarCheck} color="sky" />
        <StatCard title="Subjects" value={loading ? "…" : (data?.subjectsCount ?? 0)} icon={BookOpen} color="blue" />
        <StatCard title="Pending Fees" value={loading ? "…" : `NPR ${(data?.pendingFeeTotal ?? 0).toLocaleString()}`} icon={DollarSign} color={data?.pendingFeeTotal ? "red" : "green"} />
        <StatCard title="Notices" value={loading ? "…" : notices.length} icon={Bell} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent results */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <h2 className="font-semibold text-gray-900">Recent Test Results</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="px-5 py-3"><div className="h-8 bg-gray-50 rounded-lg animate-pulse" /></div>)
            ) : results.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No results published yet.</p>
            ) : (
              results.map((m: any) => (
                <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.subject}</p>
                    <p className="text-xs text-gray-400 truncate">{m.exam}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-gray-900">{m.marksObtained}/{m.fullMarks}</p>
                    <p className={cn("text-xs", m.isPassed ? "text-sky-600" : "text-rose-500")}>
                      {m.grade ?? `${Math.round((m.marksObtained / m.fullMarks) * 100)}%`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Latest Notices</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="px-5 py-3"><div className="h-8 bg-gray-50 rounded-lg animate-pulse" /></div>)
            ) : notices.length === 0 ? (
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
