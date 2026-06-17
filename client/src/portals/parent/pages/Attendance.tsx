import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { CalendarDays } from "lucide-react";

type DayStatus = "present" | "absent" | "late" | "weekend";

const cellColor: Record<DayStatus, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent:  "bg-red-100 text-red-600",
  late:    "bg-amber-100 text-amber-700",
  weekend: "bg-gray-100 text-gray-400",
};
const badgeColor: Record<string, string> = {
  present: "bg-emerald-50 text-emerald-700",
  absent:  "bg-red-50 text-red-600",
  late:    "bg-amber-50 text-amber-700",
};
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendar(year: number, month: number, dayMap: Record<string, string>) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const cells: { day: number | null; status: DayStatus }[] = [
    ...Array(startDay).fill({ day: null, status: "weekend" as DayStatus }),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const s = dayMap[key]?.toLowerCase() as DayStatus;
      const dow = (startDay + i) % 7;
      return { day: d, status: s ?? (dow === 0 || dow === 6 ? "weekend" : undefined) };
    }),
  ] as any[];
  while (cells.length % 7 !== 0) cells.push({ day: null, status: "weekend" });
  return cells;
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function Attendance() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChild, setActiveChild] = useState<string>("");
  const [activeMonth, setActiveMonth] = useState<string>("");

  useEffect(() => {
    api.parent.attendance()
      .then((d: any) => {
        const arr = Array.isArray(d) ? d : [];
        setChildren(arr);
        if (arr.length > 0) {
          setActiveChild(arr[0].studentId);
          const recs = arr[0].records ?? [];
          if (recs.length > 0) {
            const latest = [...recs].sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
            setActiveMonth(latest.date.slice(0, 7));
          }
        }
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChildChange = (studentId: string) => {
    setActiveChild(studentId);
    const child = children.find((c) => c.studentId === studentId);
    const recs = child?.records ?? [];
    if (recs.length > 0) {
      const latest = [...recs].sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
      setActiveMonth(latest.date.slice(0, 7));
    }
  };

  const currentChild = children.find((c) => c.studentId === activeChild);
  const records: any[] = currentChild?.records ?? [];
  const present = currentChild?.present ?? 0;
  const absent  = currentChild?.absent  ?? 0;
  const late    = currentChild?.late    ?? 0;
  const pct     = currentChild?.pct     ?? 0;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Attendance</h1>
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center mt-6">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No attendance records found.</p>
        </div>
      </div>
    );
  }

  const months = [...new Set(records.map((r: any) => r.date.slice(0, 7)))].sort().reverse();
  const dayMap: Record<string, string> = {};
  for (const r of records) dayMap[r.date.slice(0, 10)] = r.status;

  const currentMonthKey = activeMonth || months[0] || "";
  const [yearStr, monthStr] = currentMonthKey.split("-");
  const cells = currentMonthKey ? buildCalendar(Number(yearStr), Number(monthStr) - 1, dayMap) : [];

  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;
  const strokeColor = pct >= 90 ? "#10b981" : pct >= 75 ? "#f59e0b" : "#ef4444";

  const monthRecords = records
    .filter((r: any) => r.date.startsWith(currentMonthKey))
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your child's attendance record</p>
        </div>
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-3 shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle cx="32" cy="32" r="28" fill="none" stroke={strokeColor} strokeWidth="6"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 32 32)" />
            <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">{pct}%</text>
          </svg>
          <div>
            <p className="text-sm font-semibold text-gray-800">Attendance Rate</p>
            <p className="text-xs text-gray-500">Overall</p>
          </div>
        </div>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c) => (
            <button key={c.studentId} onClick={() => handleChildChange(c.studentId)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                activeChild === c.studentId ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {currentChild && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl px-5 py-3 text-sm text-teal-800">
          <span className="font-semibold">{currentChild.name}</span>
          <span className="text-teal-600 ml-2">· {currentChild.admissionNo}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Present", value: present, color: "text-emerald-600 bg-emerald-50" },
          { label: "Absent",  value: absent,  color: "text-red-500 bg-red-50" },
          { label: "Late",    value: late,    color: "text-amber-600 bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl px-5 py-4", s.color)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {months.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {months.map((m) => (
            <button key={m} onClick={() => setActiveMonth(m)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                activeMonth === m ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
              {monthLabel(m + "-01")}
            </button>
          ))}
        </div>
      )}

      {cells.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">{monthLabel(currentMonthKey + "-01")} Calendar</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell, i) => {
                if (!cell.day) return <div key={i} />;
                const s = (cell.status ?? "weekend") as DayStatus;
                return (
                  <div key={i} className={cn("rounded-xl py-2 flex items-center justify-center text-xs font-semibold", cellColor[s])}>
                    {cell.day}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 flex-wrap">
              {(["present", "absent", "late", "weekend"] as DayStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={cn("w-3 h-3 rounded-sm inline-block", cellColor[s])} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {monthRecords.length > 0 && (
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
              {monthRecords.map((row: any) => {
                const status = (row.status ?? "").toLowerCase();
                const dateStr = new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3 text-gray-700 font-medium">{dateStr}</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs px-2 py-1 rounded-lg font-medium capitalize", badgeColor[status] ?? "bg-gray-100 text-gray-500")}>
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{row.remarks ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
