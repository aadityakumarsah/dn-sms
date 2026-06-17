import { BookOpen, CalendarCheck, TrendingUp, Clock } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useAuth } from "@/contexts/AuthContext";

const TODAY_SCHEDULE = [
  { time: "7:00 AM", subject: "Mathematics", teacher: "Sita Thapa", room: "101" },
  { time: "8:00 AM", subject: "English", teacher: "Ram Prasad", room: "102" },
  { time: "9:00 AM", subject: "Science", teacher: "Hari KC", room: "Lab 1" },
  { time: "11:00 AM", subject: "Nepali", teacher: "Sunita Shrestha", room: "103" },
];

const RECENT_MARKS = [
  { subject: "Mathematics", test: "Unit Test 3", marks: 45, total: 50 },
  { subject: "Science", test: "Practical", marks: 28, total: 30 },
  { subject: "English", test: "Writing", marks: 38, total: 40 },
];

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Hi, {user?.name.split(" ")[0]}!</h1>
        <p className="text-sm text-gray-500 mt-0.5">Class 10 A · Roll No. 1 · Academic Year 2081/82 BS</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Attendance" value="92%" icon={CalendarCheck} color="sky" />
        <StatCard title="Subjects" value="7" icon={BookOpen} color="blue" />
        <StatCard title="Overall %" value="86%" icon={TrendingUp} positive color="green" />
        <StatCard title="Classes Today" value="4" icon={Clock} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {TODAY_SCHEDULE.map((s) => (
              <div key={s.time} className="px-5 py-3 flex items-center gap-4">
                <span className="text-xs text-gray-400 w-16 shrink-0">{s.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.subject}</p>
                  <p className="text-xs text-gray-400">{s.teacher} · Room {s.room}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Test Results</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {RECENT_MARKS.map((m) => (
              <div key={m.subject + m.test} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.subject}</p>
                  <p className="text-xs text-gray-400">{m.test}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{m.marks}/{m.total}</p>
                  <p className="text-xs text-sky-600">{Math.round((m.marks / m.total) * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
