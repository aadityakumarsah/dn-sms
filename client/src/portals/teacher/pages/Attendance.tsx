import { cn } from "@/lib/utils";
import { useState } from "react";

const STUDENTS = [
  "Aarav Sharma", "Bibek KC", "Chhaya Thapa", "Dipesh Rai", "Elina Gurung",
  "Firoj Magar", "Gita Shrestha", "Hari Tamang", "Ishwari Poudel", "Jeevan Bista",
  "Kamala Adhikari", "Laxmi Pun", "Manish Bhattarai", "Nita Pokharel", "Om Karki",
  "Puja Basnet", "Rajan Khadka", "Sarita Magar", "Tikaram Rana", "Uma Devi Chaudhary",
];

type Status = "present" | "absent" | "late";

const PREV_SUMMARY = [
  { date: "Magh 28", present: 19, absent: 1, late: 0 },
  { date: "Magh 27", present: 18, absent: 1, late: 1 },
  { date: "Magh 26", present: 20, absent: 0, late: 0 },
  { date: "Magh 25", present: 17, absent: 2, late: 1 },
  { date: "Magh 24", present: 19, absent: 1, late: 0 },
];

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState("Class 10 A");
  const [statuses, setStatuses] = useState<Record<number, Status>>({});

  const toggle = (i: number, s: Status) =>
    setStatuses((prev) => ({ ...prev, [i]: s }));

  const count = (s: Status) => Object.values(statuses).filter((v) => v === s).length;
  const total = STUDENTS.length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Falgun 1, 2081 (Today)</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-6">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setStatuses({}); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {["Class 10 A", "Class 9 B", "Class 8 A"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-5 ml-auto text-sm">
          <span>Present: <strong className="text-emerald-600">{count("present")}</strong> / {total}</span>
          <span>Absent: <strong className="text-red-500">{count("absent")}</strong></span>
          <span>Late: <strong className="text-amber-600">{count("late")}</strong></span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{selectedClass} — Student Roster</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {STUDENTS.map((name, i) => (
            <div key={name} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6">{String(i + 1).padStart(2, "0")}</span>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700">
                  {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-gray-800">{name}</span>
              </div>
              <div className="flex gap-2">
                {(["present", "absent", "late"] as Status[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => toggle(i, s)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border",
                      statuses[i] === s
                        ? s === "present" ? "bg-emerald-600 text-white border-emerald-600"
                          : s === "absent" ? "bg-red-500 text-white border-red-500"
                          : "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-green-700">
            Submit Attendance
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Previous 5 Days Summary</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Present", "Absent", "Late"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PREV_SUMMARY.map((row) => (
              <tr key={row.date} className="border-t border-gray-50 hover:bg-gray-50/60">
                <td className="px-5 py-3 text-gray-700 font-medium">{row.date}</td>
                <td className="px-5 py-3 text-emerald-600 font-semibold">{row.present}</td>
                <td className="px-5 py-3 text-red-500 font-semibold">{row.absent}</td>
                <td className="px-5 py-3 text-amber-600 font-semibold">{row.late}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
