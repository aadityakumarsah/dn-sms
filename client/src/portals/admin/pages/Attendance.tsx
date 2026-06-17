import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, Save, ChevronDown, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
  { value: "ABSENT",  label: "Absent",  icon: XCircle,     color: "text-rose-500",    bg: "bg-rose-50 border-rose-200" },
  { value: "LATE",    label: "Late",    icon: Clock,        color: "text-amber-500",   bg: "bg-amber-50 border-amber-200" },
];

const STATUS_COLOR: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700",
  ABSENT:  "bg-rose-50 text-rose-600",
  LATE:    "bg-amber-50 text-amber-700",
};

export default function Attendance() {
  const [tab, setTab] = useState<"daily" | "range">("daily");

  // Daily state
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState<any[]>([]);

  // Range state
  const [rangeSection, setRangeSection] = useState("");
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [rangeData, setRangeData] = useState<any>(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  useEffect(() => {
    api.admin.attendance().then((d) => { setSections(d.sections ?? []); setLoading(false); });
    api.admin.attendanceSummary(7).then((d) => setSummary(d.summary ?? []));
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    setLoading(true);
    api.admin.attendance({ sectionId: selectedSection, date }).then((d) => {
      setStudents(d.students ?? []);
      const init: Record<string, string> = {};
      (d.students ?? []).forEach((s: any) => { if (s.status) init[s.studentId] = s.status; });
      setAttendance(init);
      setLoading(false);
    });
  }, [selectedSection, date]);

  const setAll = (status: string) => {
    const next: Record<string, string> = {};
    students.forEach((s) => { next[s.studentId] = status; });
    setAttendance(next);
  };

  const handleSave = async () => {
    if (!selectedSection || students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({ studentId: s.studentId, status: attendance[s.studentId] ?? "PRESENT" }));
      await api.admin.markAttendance({ sectionId: selectedSection, date, records });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const loadRange = () => {
    if (!fromDate || !toDate) return;
    setRangeLoading(true);
    api.admin.attendanceRange({ from: fromDate, to: toDate, sectionId: rangeSection || undefined })
      .then(setRangeData).finally(() => setRangeLoading(false));
  };
  useEffect(() => { if (tab === "range") loadRange(); }, [tab, rangeSection, fromDate, toDate]);

  const presentCount = Object.values(attendance).filter((v) => v === "PRESENT").length;
  const absentCount = Object.values(attendance).filter((v) => v === "ABSENT").length;
  const lateCount = Object.values(attendance).filter((v) => v === "LATE").length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mark and track daily student attendance</p>
        </div>
      </div>

      {summary.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Last 7 Days Overview</h3>
          <div className="flex items-end gap-2 h-20">
            {summary.map((d: any) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className={cn("w-full rounded-t transition-all", d.pct >= 90 ? "bg-emerald-500" : d.pct >= 75 ? "bg-amber-400" : "bg-rose-400")}
                  style={{ height: `${Math.max(4, d.pct)}%` }} />
                <span className="text-[10px] text-gray-400">{new Date(d.date).toLocaleDateString("en", { weekday: "short" })}</span>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">{d.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-xs">
        <button onClick={() => setTab("daily")}
          className={cn("flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5",
            tab === "daily" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <Save className="w-3 h-3" /> Daily
        </button>
        <button onClick={() => setTab("range")}
          className={cn("flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5",
            tab === "range" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <BarChart2 className="w-3 h-3" /> Date Range
        </button>
      </div>

      {tab === "daily" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Class</label>
              <div className="relative">
                <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none">
                  <option value="">— Choose class —</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.studentCount} students)</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          {selectedSection && students.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setAll("PRESENT")} className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100">All Present</button>
                  <button onClick={() => setAll("ABSENT")} className="text-xs px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-medium hover:bg-rose-100">All Absent</button>
                  <button onClick={() => {
                    const next: Record<string, string> = {};
                    students.forEach((s) => { next[s.studentId] = attendance[s.studentId] === "ABSENT" ? "ABSENT" : "PRESENT"; });
                    setAttendance(next);
                  }} className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-100">Uncheck Absent</button>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="text-emerald-600 font-semibold">P: {presentCount}</span>
                  <span className="text-rose-500 font-semibold">A: {absentCount}</span>
                  <span className="text-amber-500 font-semibold">L: {lateCount}</span>
                </div>
              </div>

              <div className="divide-y divide-gray-50 -mx-5 px-5">
                {students.map((s) => {
                  const status = attendance[s.studentId] ?? "PRESENT";
                  return (
                    <div key={s.studentId} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-6 text-right">{s.rollNo ?? "—"}</span>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(s.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      </div>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button key={opt.value} onClick={() => setAttendance({ ...attendance, [s.studentId]: opt.value })}
                              className={cn("flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all",
                                status === opt.value ? opt.bg + " " + opt.color : "border-gray-200 text-gray-400 hover:bg-gray-50")}>
                              <Icon className="w-3 h-3" />
                              <span className="hidden sm:inline">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Attendance"}
                </button>
              </div>
            </>
          )}

          {selectedSection && students.length === 0 && !loading && (
            <p className="text-sm text-gray-400 text-center py-6">No students enrolled in this class.</p>
          )}
          {!selectedSection && <p className="text-sm text-gray-400 text-center py-4">Select a class to mark attendance.</p>}
          {loading && selectedSection && <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
        </div>
      )}

      {tab === "range" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Filter by Class</label>
                <div className="relative">
                  <select value={rangeSection} onChange={(e) => setRangeSection(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white appearance-none">
                    <option value="">All classes</option>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">To Date</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
          </div>

          {rangeLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : rangeData ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Records", value: rangeData.total ?? 0 },
                  { label: "Present", value: rangeData.presentCount ?? 0 },
                  { label: "Absent", value: rangeData.absentCount ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">{["Student", "Date", "Section", "Status"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody>
                    {(rangeData.records ?? []).length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">No attendance records in this range.</td></tr>
                    ) : (rangeData.records ?? []).map((r: any, i: number) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium text-gray-900">{r.studentName}</td>
                        <td className="px-5 py-3 text-xs text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{r.sectionName}</td>
                        <td className="px-5 py-3"><span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium", STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-500")}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">Select a date range to view records.</div>}
        </div>
      )}
    </div>
  );
}
