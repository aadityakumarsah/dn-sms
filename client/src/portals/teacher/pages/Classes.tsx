import { cn } from "@/lib/utils";
import { Users, Clock, BookOpen } from "lucide-react";

const CLASSES = [
  {
    name: "Class 10 A",
    subject: "Mathematics",
    students: 36,
    nextClass: "Sun 7:00–8:00 AM",
    sessions: [
      { date: "Magh 28", topic: "Quadratic Equations" },
      { date: "Magh 26", topic: "Factorisation" },
      { date: "Magh 24", topic: "Polynomials – Revision" },
    ],
  },
  {
    name: "Class 9 B",
    subject: "Mathematics",
    students: 33,
    nextClass: "Sun 9:00–10:00 AM",
    sessions: [
      { date: "Magh 28", topic: "Trigonometry Intro" },
      { date: "Magh 26", topic: "Pythagoras Theorem" },
      { date: "Magh 24", topic: "Geometry – Circles" },
    ],
  },
  {
    name: "Class 8 A",
    subject: "Mathematics",
    students: 35,
    nextClass: "Mon 11:00 AM–12:00 PM",
    sessions: [
      { date: "Magh 27", topic: "Ratio & Proportion" },
      { date: "Magh 25", topic: "Linear Equations" },
      { date: "Magh 23", topic: "Fractions & Decimals" },
    ],
  },
];

const SCHEDULE = [
  { day: "Sun", periods: ["Class 10A – Math", "Class 9B – Math", "—", "—", "—", "—"] },
  { day: "Mon", periods: ["—", "—", "Class 8A – Math", "—", "—", "—"] },
  { day: "Tue", periods: ["Class 10A – Math", "—", "—", "Class 9B – Math", "—", "—"] },
  { day: "Wed", periods: ["—", "Class 8A – Math", "—", "—", "Class 10A – Math", "—"] },
  { day: "Thu", periods: ["—", "—", "Class 9B – Math", "—", "—", "Class 8A – Math"] },
  { day: "Fri", periods: ["Class 10A – Math", "—", "—", "—", "Class 9B – Math", "—"] },
];

const PERIODS = ["7–8 AM", "8–9 AM", "9–10 AM", "10–11 AM", "11–12 PM", "12–1 PM"];

export default function Classes() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Classes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your assigned classes and recent sessions</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {CLASSES.map((cls) => (
          <div key={cls.name} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-xs text-green-600 font-medium mt-0.5">{cls.subject}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                <Users size={11} />
                {cls.students}
              </span>
            </div>
            <div className="px-5 py-3 border-b border-gray-50">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock size={11} />
                Next: <span className="font-medium text-gray-700">{cls.nextClass}</span>
              </p>
            </div>
            <div className="px-5 py-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Sessions</p>
              {cls.sessions.map((s) => (
                <div key={s.date} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{s.date}</span>
                  <span className="text-gray-700 font-medium truncate ml-2">{s.topic}</span>
                </div>
              ))}
            </div>
            <div className="px-5 pb-4">
              <button className="w-full bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700">
                View Roster
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BookOpen size={15} className="text-green-600" />
            Weekly Schedule
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Day</th>
                {PERIODS.map((p) => (
                  <th key={p} className="px-3 py-2.5 font-semibold text-gray-500 text-center">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((row) => (
                <tr key={row.day} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-2.5 font-semibold text-gray-700">{row.day}</td>
                  {row.periods.map((p, i) => (
                    <td key={i} className="px-3 py-2.5 text-center">
                      {p !== "—" ? (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg font-medium whitespace-nowrap">{p}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
