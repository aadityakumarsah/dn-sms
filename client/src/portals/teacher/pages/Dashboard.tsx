import { useState, useEffect } from "react";
import { BookOpen, Users, ClipboardList, Bell } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { dummyAvatar } from "@/lib/utils";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.teacher.dashboard()
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const profile = data?.profile;
  const name = profile?.name || user?.name || "Teacher";
  const myClasses = data?.myClasses ?? [];
  const notices = data?.recentNotices ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Profile header */}
      <div className="mb-6 flex items-center gap-4">
        <img
          src={profile?.avatar || dummyAvatar(name)}
          alt={name}
          className="w-14 h-14 rounded-2xl object-cover bg-green-100 shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">Welcome, {name.split(" ")[0]}</h1>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {profile?.specialization || (myClasses.length ? `${myClasses.length} classes assigned` : "No classes assigned yet")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Classes" value={loading ? "…" : myClasses.length} icon={BookOpen} color="green" />
        <StatCard title="Total Students" value={loading ? "…" : (data?.totalStudents ?? 0)} icon={Users} color="blue" />
        <StatCard title="Pending Assignments" value={loading ? "…" : (data?.pendingAssignments ?? 0)} icon={ClipboardList} color="orange" />
        <StatCard title="Notices" value={loading ? "…" : notices.length} icon={Bell} color="teal" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Classes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="px-5 py-3"><div className="h-8 bg-gray-50 rounded-lg animate-pulse" /></div>)
            ) : myClasses.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No classes assigned yet.</p>
            ) : (
              myClasses.map((c: any) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">{c.students} students</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Notices</h2>
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
