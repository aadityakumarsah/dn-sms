import { useState, useEffect } from "react";
import { BookOpen, CalendarCheck, TrendingUp, IndianRupee, Bell } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { dummyAvatar, cn } from "@/lib/utils";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconTextColor: string;
  className?: string;
}

function DashboardStatCard({ title, value, icon: Icon, iconBgColor, iconTextColor, className = "" }: DashboardStatCardProps) {
  return (
    <div className={cn(
      "rounded-xl bg-white border-2 border-gray-100 shadow-sm relative transition-all duration-300 ease-in-out p-5 flex items-start justify-between h-full group overflow-hidden hover:shadow-md hover:border-blue-400/70",
      className
    )}>
      <div className="flex flex-col justify-between h-full space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={cn(
        "rounded-full p-2.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm",
        iconBgColor,
        iconTextColor
      )}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* SalesSphere Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            {getGreeting()}, <span className="text-secondary">{name.split(" ")[0]}!</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                })}
            </span>
            {subtitle !== "—" && (
              <>
                <span className="text-gray-300 font-normal">|</span>
                <span className="text-gray-600 font-semibold">{subtitle}</span>
              </>
            )}
            {profile?.stream && (
              <>
                <span className="text-gray-300 font-normal">|</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {profile.stream}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="Attendance"
          value={loading ? "…" : `${data?.attendancePct ?? 0}%`}
          icon={CalendarCheck}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-600"
        />
        <DashboardStatCard
          title="Subjects"
          value={loading ? "…" : (data?.subjectsCount ?? 0)}
          icon={BookOpen}
          iconBgColor="bg-purple-50"
          iconTextColor="text-purple-600"
        />
        <DashboardStatCard
          title="Pending Fees"
          value={loading ? "…" : `NPR ${(data?.pendingFeeTotal ?? 0).toLocaleString()}`}
          icon={IndianRupee}
          iconBgColor={data?.pendingFeeTotal ? "bg-rose-50" : "bg-emerald-50"}
          iconTextColor={data?.pendingFeeTotal ? "text-rose-600" : "text-emerald-600"}
        />
        <DashboardStatCard
          title="Notices"
          value={loading ? "…" : notices.length}
          icon={Bell}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-600"
        />
      </div>

      {/* Primary content grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent results */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center shadow-sm">
                <TrendingUp className="w-4.5 h-4.5 text-secondary" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">Recent Test Results</h2>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-3">
                  <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                </div>
              ))
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No results published yet.</p>
              </div>
            ) : (
              results.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 border border-gray-100/50 transition-all duration-200 mb-3 group">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200/50 flex items-center justify-center text-xs font-bold text-gray-600 uppercase tracking-wider shrink-0">
                      {m.subject.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-700 truncate group-hover:text-gray-900">{m.subject}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-0.5 truncate">{m.exam}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3 flex flex-col items-end">
                    <p className="text-sm font-bold text-gray-800">{m.marksObtained} / {m.fullMarks}</p>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 shadow-sm border",
                      m.isPassed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {m.grade ?? `${Math.round((m.marksObtained / m.fullMarks) * 100)}%`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                <Bell className="w-4.5 h-4.5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">Latest Notices</h2>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-3">
                  <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                </div>
              ))
            ) : notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No notices right now.</p>
              </div>
            ) : (
              notices.map((n: any) => (
                <div key={n.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 border border-gray-100/50 transition-all duration-200 mb-3 group">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        n.isUrgent ? "bg-rose-500 animate-pulse" : "bg-primary"
                      )} />
                      <p className="text-sm font-bold text-gray-700 truncate group-hover:text-gray-900">{n.title}</p>
                    </div>
                    {n.isUrgent && (
                      <span className="text-[9px] bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 shadow-sm">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium pl-4 line-clamp-2 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
