import { cn } from "@/lib/utils";
import { useState } from "react";
import { Download } from "lucide-react";

const EXAMS = ["First Terminal", "Second Terminal", "Final Examination"];

const MY_RESULTS: Record<string, { subject: string; full: number; obtained: number; classAvg: number }[]> = {
  "First Terminal": [
    { subject: "Mathematics", full: 100, obtained: 72, classAvg: 68 },
    { subject: "English", full: 100, obtained: 68, classAvg: 65 },
    { subject: "Nepali", full: 100, obtained: 75, classAvg: 72 },
    { subject: "Science", full: 100, obtained: 70, classAvg: 67 },
    { subject: "Social Studies", full: 100, obtained: 80, classAvg: 74 },
    { subject: "Computer", full: 50, obtained: 42, classAvg: 38 },
    { subject: "Optional Math", full: 100, obtained: 65, classAvg: 60 },
  ],
  "Second Terminal": [
    { subject: "Mathematics", full: 100, obtained: 88, classAvg: 72 },
    { subject: "English", full: 100, obtained: 76, classAvg: 70 },
    { subject: "Nepali", full: 100, obtained: 82, classAvg: 75 },
    { subject: "Science", full: 100, obtained: 79, classAvg: 71 },
    { subject: "Social Studies", full: 100, obtained: 85, classAvg: 76 },
    { subject: "Computer", full: 50, obtained: 44, classAvg: 40 },
    { subject: "Optional Math", full: 100, obtained: 78, classAvg: 65 },
  ],
  "Final Examination": [
    { subject: "Mathematics", full: 100, obtained: 91, classAvg: 75 },
    { subject: "English", full: 100, obtained: 84, classAvg: 72 },
    { subject: "Nepali", full: 100, obtained: 88, classAvg: 78 },
    { subject: "Science", full: 100, obtained: 86, classAvg: 73 },
    { subject: "Social Studies", full: 100, obtained: 90, classAvg: 79 },
    { subject: "Computer", full: 50, obtained: 47, classAvg: 41 },
    { subject: "Optional Math", full: 100, obtained: 85, classAvg: 68 },
  ],
};

function grade(pct: number) {
  if (pct >= 90) return { label: "A+", color: "bg-emerald-50 text-emerald-700" };
  if (pct >= 80) return { label: "A", color: "bg-emerald-50 text-emerald-700" };
  if (pct >= 70) return { label: "B+", color: "bg-blue-50 text-blue-700" };
  if (pct >= 60) return { label: "B", color: "bg-blue-50 text-blue-700" };
  if (pct >= 50) return { label: "C+", color: "bg-amber-50 text-amber-700" };
  return { label: "C", color: "bg-amber-50 text-amber-700" };
}

export default function Results() {
  const [exam, setExam] = useState("Second Terminal");
  const rows = MY_RESULTS[exam];
  const totalObtained = rows.reduce((s, r) => s + r.obtained, 0);
  const totalFull = rows.reduce((s, r) => s + r.full, 0);
  const pct = Math.round((totalObtained / totalFull) * 100);
  const overall = grade(pct);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">Class 10 A — Aarav Sharma</p>
        </div>
        <button className="bg-sky-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-sky-600 flex items-center gap-2">
          <Download size={14} />
          Download Report Card
        </button>
      </div>

      <div className="flex gap-2">
        {EXAMS.map((e) => (
          <button
            key={e}
            onClick={() => setExam(e)}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors", exam === e ? "bg-sky-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{exam} — Subject Performance</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Subject", "Full Marks", "Your Score", "Class Avg", "Difference", "Grade"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pctSubj = Math.round((r.obtained / r.full) * 100);
              const g = grade(pctSubj);
              const diff = r.obtained - r.classAvg;
              return (
                <tr key={r.subject} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{r.subject}</td>
                  <td className="px-5 py-3.5 text-gray-500">{r.full}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-800">{r.obtained}</td>
                  <td className="px-5 py-3.5 text-gray-500">{r.classAvg}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("font-semibold", diff >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {diff >= 0 ? "+" : ""}{diff}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", g.color)}>{g.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Progress Chart — Your Score vs Class Average</h2>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.subject}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="font-medium text-gray-700">{r.subject}</span>
                <span>You: <strong className="text-sky-600">{r.obtained}</strong> · Avg: <strong className="text-gray-500">{r.classAvg}</strong></span>
              </div>
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="absolute h-full bg-gray-300 rounded-full" style={{ width: `${(r.classAvg / r.full) * 100}%` }} />
                <div className="absolute h-full bg-sky-500 rounded-full opacity-80" style={{ width: `${(r.obtained / r.full) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-100 rounded-2xl px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">Overall — {exam}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total: {totalObtained} / {totalFull}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-sky-700">{pct}%</p>
          <span className={cn("text-sm font-semibold px-3 py-1 rounded-xl", overall.color)}>{overall.label}</span>
        </div>
      </div>
    </div>
  );
}
