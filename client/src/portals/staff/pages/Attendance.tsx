import { cn } from "@/lib/utils";
import { useState } from "react";

const DAYS_IN_MONTH = 28;
const MONTH_NAME = "Falgun 2081";
const START_DAY = 5;

type DayStatus = "present" | "absent" | "late" | "holiday" | "weekend";

const DAY_DATA: Record<number, DayStatus> = {
  1: "present", 2: "present", 3: "holiday", 4: "weekend", 5: "weekend",
  6: "present", 7: "present", 8: "present", 9: "absent", 10: "present",
  11: "weekend", 12: "weekend", 13: "present", 14: "present", 15: "holiday",
  16: "present", 17: "late", 18: "weekend", 19: "weekend", 20: "present",
  21: "present", 22: "present", 23: "present", 24: "absent", 25: "weekend",
  26: "weekend", 27: "present", 28: "present",
};

const DETAIL_ROWS = [
  { name: "Ramesh Dhakal", checkin: "9:52 AM", checkout: "5:05 PM", hours: "7h 13m", status: "present" },
  { name: "Sunita Oli", checkin: "10:05 AM", checkout: "5:00 PM", hours: "6h 55m", status: "present" },
  { name: "Kalu Bahadur Thapa", checkin: "9:45 AM", checkout: "5:10 PM", hours: "7h 25m", status: "present" },
  { name: "Bikram Bohara", checkin: "—", checkout: "—", hours: "—", status: "absent" },
  { name: "Mina Khatri", checkin: "10:22 AM", checkout: "5:00 PM", hours: "6h 38m", status: "late" },
  { name: "Hari Prasad Koirala", checkin: "9:58 AM", checkout: "5:00 PM", hours: "7h 02m", status: "present" },
  { name: "Prakash Sah", checkin: "9:30 AM", checkout: "5:30 PM", hours: "8h 00m", status: "present" },
];

const statusDot: Record<DayStatus, string> = {
  present: "bg-emerald-400",
  absent: "bg-red-400",
  late: "bg-amber-400",
  holiday: "bg-purple-300",
  weekend: "bg-gray-200",
};

const statusLabel: Record<DayStatus, string> = {
  present: "bg-emerald-50 text-emerald-700",
  absent: "bg-red-50 text-red-600",
  late: "bg-amber-50 text-amber-700",
  holiday: "bg-purple-50 text-purple-700",
  weekend: "bg-gray-100 text-gray-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Attendance() {
  const [selectedDay, setSelectedDay] = useState(28);

  const cells: (number | null)[] = [
    ...Array(START_DAY).fill(null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Staff Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">{MONTH_NAME} — Monthly overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Present", value: 38, color: "text-emerald-600 bg-emerald-50" },
          { label: "Absent", value: 4, color: "text-red-500 bg-red-50" },
          { label: "Late", value: 2, color: "text-amber-600 bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl px-5 py-4 flex items-center gap-3", s.color)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{MONTH_NAME} Calendar</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const status = DAY_DATA[day];
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "rounded-xl p-2 flex flex-col items-center gap-1 hover:bg-gray-50 transition-colors",
                    selectedDay === day && "ring-2 ring-orange-400"
                  )}
                >
                  <span className="text-xs font-medium text-gray-700">{day}</span>
                  <span className={cn("w-2 h-2 rounded-full", statusDot[status])} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Falgun {selectedDay} — Staff Detail</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Staff Name", "Check-in", "Check-out", "Hours", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DETAIL_ROWS.map((r, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                <td className="px-5 py-3.5 font-medium text-gray-900">{r.name}</td>
                <td className="px-5 py-3.5 text-gray-600">{r.checkin}</td>
                <td className="px-5 py-3.5 text-gray-600">{r.checkout}</td>
                <td className="px-5 py-3.5 text-gray-600">{r.hours}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("text-xs px-2 py-1 rounded-lg font-medium capitalize", statusLabel[r.status as DayStatus])}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
