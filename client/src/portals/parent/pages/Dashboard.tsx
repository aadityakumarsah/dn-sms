import { CalendarCheck, TrendingUp, DollarSign, Bell } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";

const CHILD = { name: "Bibek KC", class: "Class 10 A", roll: 1, photo: null };

const RECENT_RESULTS = [
  { subject: "Mathematics", marks: 87, total: 100, grade: "A" },
  { subject: "Science", marks: 79, total: 100, grade: "B+" },
  { subject: "English", marks: 91, total: 100, grade: "A+" },
  { subject: "Nepali", marks: 75, total: 100, grade: "B+" },
];

export default function ParentDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Child info card */}
      <div className="bg-teal-600 rounded-xl p-5 mb-6 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
          {CHILD.name[0]}
        </div>
        <div>
          <p className="font-bold text-lg">{CHILD.name}</p>
          <p className="text-teal-100 text-sm">{CHILD.class} · Roll No. {CHILD.roll}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Attendance" value="92%" icon={CalendarCheck} change="This month" positive color="green" />
        <StatCard title="Overall Grade" value="A" icon={TrendingUp} color="teal" />
        <StatCard title="Fee Due" value="NPR 0" icon={DollarSign} change="All cleared" positive color="blue" />
        <StatCard title="New Notices" value="2" icon={Bell} color="orange" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Latest Results</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {RECENT_RESULTS.map((r) => (
            <div key={r.subject} className="px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">{r.subject}</p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{r.marks}/{r.total}</span>
                <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{r.grade}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
