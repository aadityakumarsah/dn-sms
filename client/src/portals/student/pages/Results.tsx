import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BookOpen } from "lucide-react";

function grade(pct: number) {
  if (pct >= 90) return { label: "A+", color: "bg-emerald-50 text-emerald-700" };
  if (pct >= 80) return { label: "A",  color: "bg-emerald-50 text-emerald-700" };
  if (pct >= 70) return { label: "B+", color: "bg-blue-50 text-blue-700" };
  if (pct >= 60) return { label: "B",  color: "bg-blue-50 text-blue-700" };
  if (pct >= 50) return { label: "C+", color: "bg-amber-50 text-amber-700" };
  if (pct >= 40) return { label: "C",  color: "bg-amber-50 text-amber-700" };
  return { label: "F", color: "bg-rose-50 text-rose-700" };
}

export default function Results() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<string>("");

  useEffect(() => {
    api.student.results()
      .then((data: any) => {
        const arr = Array.isArray(data) ? data : [];
        setGroups(arr);
        if (arr.length > 0) setActiveExam(arr[0].exam?.name ?? "");
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const current = groups.find((g) => g.exam?.name === activeExam);
  const rows: any[] = current?.results ?? [];
  const totalObtained = rows.reduce((s: number, r: any) => s + Number(r.marksObtained ?? 0), 0);
  const totalFull = rows.reduce((s: number, r: any) => s + Number(r.fullMarks ?? 100), 0);
  const overallPct = totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0;
  const overall = grade(overallPct);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">My Results</h1>
        <p className="text-sm text-gray-500 mb-8">Exam results will appear here once published.</p>
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No exam results yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Results</h1>
        <p className="text-sm text-gray-500 mt-0.5">{groups.length} exam{groups.length !== 1 ? "s" : ""} on record</p>
      </div>

      {/* Exam tabs */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <button key={g.exam?.id ?? g.exam?.name} onClick={() => setActiveExam(g.exam?.name ?? "")}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              activeExam === g.exam?.name ? "bg-sky-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
            {g.exam?.name}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <p className="text-sm text-gray-400">No results entered for this exam yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">{activeExam} — Subject Performance</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Subject", "Full Marks", "Your Score", "Pass Marks", "Grade"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => {
                  const obtained = Number(r.marksObtained ?? 0);
                  const full = Number(r.fullMarks ?? 100);
                  const pass = Number(r.passMarks ?? 40);
                  const pct = full > 0 ? Math.round((obtained / full) * 100) : 0;
                  const g = r.grade ? { label: r.grade, color: pct >= 50 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700" } : grade(pct);
                  return (
                    <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{r.subject?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-gray-500">{full}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("font-bold", obtained >= pass ? "text-gray-800" : "text-rose-600")}>{obtained}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">{pass}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", g.color)}>{g.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Progress bars */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Score vs Pass Mark</h2>
            <div className="space-y-3">
              {rows.map((r: any) => {
                const obtained = Number(r.marksObtained ?? 0);
                const full = Number(r.fullMarks ?? 100);
                const pass = Number(r.passMarks ?? 40);
                return (
                  <div key={r.id}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-700">{r.subject?.name}</span>
                      <span>Score: <strong className="text-sky-600">{obtained}</strong> / {full}</span>
                    </div>
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div className="absolute h-full bg-gray-300 rounded-full" style={{ width: `${(pass / full) * 100}%` }} />
                      <div className={cn("absolute h-full rounded-full opacity-80", obtained >= pass ? "bg-sky-500" : "bg-rose-400")} style={{ width: `${(obtained / full) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Overall — {activeExam}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total: {totalObtained} / {totalFull}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-sky-700">{overallPct}%</p>
              <span className={cn("text-sm font-semibold px-3 py-1 rounded-xl", overall.color)}>{overall.label}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
