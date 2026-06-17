import { cn } from "@/lib/utils";

const MONTH_NAME = "Falgun 2081";
const DAYS_IN_MONTH = 28;
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

const LOG = [
  { date: "Falgun 1, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 2, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 6, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 7, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 8, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 9, 2081", status: "absent", remarks: "Sick leave" },
  { date: "Falgun 10, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 13, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 14, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 16, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 17, 2081", status: "late", remarks: "Arrived 10:15 AM" },
  { date: "Falgun 20, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 21, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 22, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 23, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 24, 2081", status: "absent", remarks: "Unwell" },
  { date: "Falgun 27, 2081", status: "present", remarks: "On time" },
  { date: "Falgun 28, 2081", status: "present", remarks: "On time" },
];

const cellColor: Record<DayStatus, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-600",
  late: "bg-amber-100 text-amber-700",
  holiday: "bg-purple-100 text-purple-600",
  weekend: "bg-gray-100 text-gray-400",
};

const badgeColor: Record<DayStatus, string> = {
  present: "bg-emerald-50 text-emerald-700",
  absent: "bg-red-50 text-red-600",
  late: "bg-amber-50 text-amber-700",
  holiday: "bg-purple-50 text-purple-600",
  weekend: "bg-gray-100 text-gray-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusCounts = Object.values(DAY_DATA).reduce((acc, s) => {
  acc[s] = (acc[s] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const schoolDays = (statusCounts.present || 0) + (statusCounts.absent || 0) + (statusCounts.late || 0);
const attendancePct = Math.round(((statusCounts.present || 0) + (statusCounts.late || 0)) / schoolDays * 100);

const cells: (number | null)[] = [
  ...Array(START_DAY).fill(null),
  ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
];
while (cells.length % 7 !== 0) cells.push(null);

export default function Attendance() {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (attendancePct / 100) * circumference;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Class 10 A · {MONTH_NAME}</p>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-3">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={attendancePct >= 90 ? "#10b981" : attendancePct >= 75 ? "#f59e0b" : "#ef4444"}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
            />
            <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">{attendancePct}%</text>
          </svg>
          <div>
            <p className="text-sm font-semibold text-gray-800">Attendance Rate</p>
            <p className="text-xs text-gray-500">{MONTH_NAME}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Present", value: statusCounts.present || 0, color: "text-emerald-600 bg-emerald-50" },
          { label: "Absent", value: statusCounts.absent || 0, color: "text-red-500 bg-red-50" },
          { label: "Late", value: statusCounts.late || 0, color: "text-amber-600 bg-amber-50" },
          { label: "Holidays", value: statusCounts.holiday || 0, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl px-5 py-4", s.color)}>
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
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const status = DAY_DATA[day];
              return (
                <div key={i} className={cn("rounded-xl py-2 flex items-center justify-center text-xs font-semibold", cellColor[status])}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 flex-wrap">
            {(["present", "absent", "late", "holiday", "weekend"] as DayStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={cn("w-3 h-3 rounded-sm inline-block", cellColor[s])} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Attendance Log</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Status", "Remarks"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LOG.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                <td className="px-5 py-3 text-gray-700 font-medium">{row.date}</td>
                <td className="px-5 py-3">
                  <span className={cn("text-xs px-2 py-1 rounded-lg font-medium capitalize", badgeColor[row.status as DayStatus])}>
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">{row.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
