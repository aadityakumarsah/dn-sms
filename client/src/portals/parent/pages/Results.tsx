import { cn } from "@/lib/utils";
import { useState } from "react";
import { Download } from "lucide-react";

const EXAMS = ["First Terminal", "Second Terminal", "Final Examination"];

const RESULTS: Record<string, { subject: string; full: number; pass: number; obtained: number; remarks: string }[]> = {
  "First Terminal": [
    { subject: "Mathematics", full: 100, pass: 40, obtained: 72, remarks: "Good" },
    { subject: "English", full: 100, pass: 40, obtained: 68, remarks: "Satisfactory" },
    { subject: "Nepali", full: 100, pass: 40, obtained: 75, remarks: "Good" },
    { subject: "Science", full: 100, pass: 40, obtained: 70, remarks: "Good" },
    { subject: "Social Studies", full: 100, pass: 40, obtained: 80, remarks: "Very Good" },
    { subject: "Computer", full: 50, pass: 20, obtained: 42, remarks: "Very Good" },
    { subject: "Optional Math", full: 100, pass: 40, obtained: 65, remarks: "Good" },
  ],
  "Second Terminal": [
    { subject: "Mathematics", full: 100, pass: 40, obtained: 88, remarks: "Very Good" },
    { subject: "English", full: 100, pass: 40, obtained: 76, remarks: "Good" },
    { subject: "Nepali", full: 100, pass: 40, obtained: 82, remarks: "Very Good" },
    { subject: "Science", full: 100, pass: 40, obtained: 79, remarks: "Good" },
    { subject: "Social Studies", full: 100, pass: 40, obtained: 85, remarks: "Very Good" },
    { subject: "Computer", full: 50, pass: 20, obtained: 44, remarks: "Very Good" },
    { subject: "Optional Math", full: 100, pass: 40, obtained: 78, remarks: "Good" },
  ],
  "Final Examination": [
    { subject: "Mathematics", full: 100, pass: 40, obtained: 91, remarks: "Excellent" },
    { subject: "English", full: 100, pass: 40, obtained: 84, remarks: "Very Good" },
    { subject: "Nepali", full: 100, pass: 40, obtained: 88, remarks: "Very Good" },
    { subject: "Science", full: 100, pass: 40, obtained: 86, remarks: "Very Good" },
    { subject: "Social Studies", full: 100, pass: 40, obtained: 90, remarks: "Excellent" },
    { subject: "Computer", full: 50, pass: 20, obtained: 47, remarks: "Excellent" },
    { subject: "Optional Math", full: 100, pass: 40, obtained: 85, remarks: "Very Good" },
  ],
};

function grade(pct: number) {
  if (pct >= 90) return { label: "A+", color: "bg-emerald-50 text-emerald-700" };
  if (pct >= 80) return { label: "A", color: "bg-emerald-50 text-emerald-700" };
  if (pct >= 70) return { label: "B+", color: "bg-blue-50 text-blue-700" };
  if (pct >= 60) return { label: "B", color: "bg-blue-50 text-blue-700" };
  if (pct >= 50) return { label: "C+", color: "bg-amber-50 text-amber-700" };
  if (pct >= 40) return { label: "C", color: "bg-amber-50 text-amber-700" };
  return { label: "D", color: "bg-red-50 text-red-600" };
}

export default function Results() {
  const [exam, setExam] = useState("Second Terminal");
  const rows = RESULTS[exam];
  const totalObtained = rows.reduce((s, r) => s + r.obtained, 0);
  const totalFull = rows.reduce((s, r) => s + r.full, 0);
  const pct = Math.round((totalObtained / totalFull) * 100);
  const overall = grade(pct);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">Aarav Sharma — Class 10 A</p>
        </div>
        <button className="bg-teal-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
          <Download size={14} />
          Download Report Card
        </button>
      </div>

      <div className="flex gap-2">
        {EXAMS.map((e) => (
          <button
            key={e}
            onClick={() => setExam(e)}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors", exam === e ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{exam} — Subject-wise Marks</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Subject", "Full Marks", "Pass Marks", "Obtained", "Grade", "Remarks"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pctSubj = Math.round((r.obtained / r.full) * 100);
              const g = grade(pctSubj);
              return (
                <tr key={r.subject} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{r.subject}</td>
                  <td className="px-5 py-3.5 text-gray-500">{r.full}</td>
                  <td className="px-5 py-3.5 text-gray-500">{r.pass}</td>
                  <td className={cn("px-5 py-3.5 font-semibold", r.obtained >= r.pass ? "text-gray-800" : "text-red-500")}>
                    {r.obtained}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", g.color)}>{g.label}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{r.remarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={cn("rounded-2xl px-6 py-5 flex items-center justify-between", overall.color.replace("text-", "border-").replace("bg-", "bg-"))}>
        <div>
          <p className="text-sm font-semibold text-gray-700">Overall Result — {exam}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total: {totalObtained} / {totalFull}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{pct}%</p>
          <span className={cn("text-sm font-semibold px-3 py-1 rounded-xl", overall.color)}>{overall.label}</span>
        </div>
      </div>
    </div>
  );
}
