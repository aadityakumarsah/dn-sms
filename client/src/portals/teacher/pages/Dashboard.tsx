import { BookOpen, Users, ClipboardList, CalendarCheck } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useAuth } from "@/contexts/AuthContext";

const MY_CLASSES = [
  { name: "Class 10 A", subject: "Mathematics", students: 38, nextClass: "Today 10:00 AM" },
  { name: "Class 9 B", subject: "Mathematics", students: 35, nextClass: "Today 12:00 PM" },
  { name: "Class 11 Science", subject: "Calculus", students: 30, nextClass: "Tomorrow 9:00 AM" },
];

const PENDING_TASKS = [
  { task: "Grade Assignment — Class 10 A (Chapter 5)", due: "Today" },
  { task: "Mark attendance — Class 9 B", due: "Overdue" },
  { task: "Submit monthly report", due: "Falgun 3" },
];

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Good morning, {user?.name.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500 mt-0.5">You have 3 classes today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Classes" value="3" icon={BookOpen} color="green" />
        <StatCard title="Total Students" value="103" icon={Users} color="blue" />
        <StatCard title="Pending Tasks" value="3" icon={ClipboardList} color="orange" />
        <StatCard title="Avg Attendance" value="88%" icon={CalendarCheck} color="teal" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Classes Today</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {MY_CLASSES.map((c) => (
              <div key={c.name} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.subject} · {c.students} students</p>
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">{c.nextClass}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pending Tasks</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {PENDING_TASKS.map((t, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-700 flex-1">{t.task}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${t.due === "Overdue" ? "bg-red-50 text-red-600" : t.due === "Today" ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600"}`}>
                  {t.due}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
