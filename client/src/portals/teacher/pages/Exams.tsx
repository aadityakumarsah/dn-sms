import { useState } from "react";
import { Calendar, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useList } from "../../../portals/admin/pages/_ui";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SCHEDULED: { label: "Scheduled", color: "bg-blue-50 text-blue-700",       icon: Calendar },
  ONGOING:   { label: "Ongoing",   color: "bg-amber-50 text-amber-700",     icon: Clock },
  COMPLETED: { label: "Completed", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500",      icon: AlertTriangle },
};

export default function TeacherExams() {
  const { data, loading } = useList<any[]>(() => api.teacher.exams());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const exams = data ?? [];

  const toggle = (id: string) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Exam Schedule</h1>
        <p className="text-sm text-gray-500 mt-0.5">School exam timetable and subject routines</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />)}</div>
      ) : exams.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No exams scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const cfg = (STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.SCHEDULED)!;
            const Icon = cfg.icon;
            const isExpanded = expanded.has(exam.id);
            const subjects: any[] = exam.examSubjects ?? [];
            return (
              <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggle(exam.id)} className="mt-0.5 text-gray-400 hover:text-gray-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-lg font-medium">{exam.type?.replace(/_/g, " ")}</span>
                          <span>{new Date(exam.startDate).toLocaleDateString()} → {new Date(exam.endDate).toLocaleDateString()}</span>
                          <span className="text-indigo-600 font-medium cursor-pointer" onClick={() => toggle(exam.id)}>
                            {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium shrink-0", cfg.color)}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                </div>

                {isExpanded && subjects.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    <div className="inline-flex bg-gray-100 rounded-lg p-0.5 mb-3">
                      {(["DAY", "MORNING"] as const).map((sh) => {
                        const count = subjects.filter((s) => (s.shift ?? "DAY") === sh).length;
                        return count > 0 ? (
                          <span key={sh} className="text-xs px-3 py-1 rounded-md font-medium text-gray-500">
                            {sh === "DAY" ? "☀️ Day" : "🌅 Morning"} ({count})
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-gray-50">{["Date", "Subject", "Shift", "Time", "Full Marks"].map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                        <tbody>
                          {subjects.map((s: any) => (
                            <tr key={s.id} className="border-t border-gray-50">
                              <td className="px-4 py-2 font-medium text-gray-700">{s.examDate ? new Date(s.examDate).toLocaleDateString("en", { month: "short", day: "numeric", weekday: "short" }) : "—"}</td>
                              <td className="px-4 py-2 font-semibold text-gray-900">{s.subject?.name ?? "—"}</td>
                              <td className="px-4 py-2"><span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium", (s.shift ?? "DAY") === "MORNING" ? "bg-orange-50 text-orange-600" : "bg-sky-50 text-sky-600")}>{(s.shift ?? "DAY") === "MORNING" ? "Morning" : "Day"}</span></td>
                              <td className="px-4 py-2 text-gray-500">{s.examTime ?? "—"}</td>
                              <td className="px-4 py-2 text-gray-600">{s.fullMarks ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {isExpanded && subjects.length === 0 && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    <p className="text-xs text-gray-400">No routine added for this exam yet.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
