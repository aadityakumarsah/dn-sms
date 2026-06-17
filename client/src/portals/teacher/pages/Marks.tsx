import { cn } from "@/lib/utils";
import { useState } from "react";

const STUDENTS = [
  { name: "Aarav Sharma", roll: "01" },
  { name: "Bibek KC", roll: "02" },
  { name: "Chhaya Thapa", roll: "03" },
  { name: "Dipesh Rai", roll: "04" },
  { name: "Elina Gurung", roll: "05" },
  { name: "Firoj Magar", roll: "06" },
  { name: "Gita Shrestha", roll: "07" },
  { name: "Hari Tamang", roll: "08" },
];

const SUBJECTS = ["Math", "English", "Nepali", "Science", "Social"];

const DEFAULT_MARKS: Record<string, Record<string, string>> = {
  "01": { Math: "88", English: "76", Nepali: "82", Science: "79", Social: "85" },
  "02": { Math: "72", English: "68", Nepali: "74", Science: "65", Social: "70" },
  "03": { Math: "91", English: "88", Nepali: "90", Science: "94", Social: "87" },
  "04": { Math: "55", English: "60", Nepali: "58", Science: "52", Social: "63" },
  "05": { Math: "78", English: "82", Nepali: "80", Science: "75", Social: "88" },
  "06": { Math: "38", English: "42", Nepali: "45", Science: "35", Social: "40" },
  "07": { Math: "95", English: "91", Nepali: "93", Science: "97", Social: "92" },
  "08": { Math: "62", English: "70", Nepali: "68", Science: "60", Social: "74" },
};

export default function Marks() {
  const [exam, setExam] = useState("Second Terminal");
  const [cls, setCls] = useState("Class 10 A");
  const [marks, setMarks] = useState(DEFAULT_MARKS);

  const setMark = (roll: string, subject: string, val: string) => {
    setMarks((prev) => ({
      ...prev,
      [roll]: { ...prev[roll], [subject]: val },
    }));
  };

  const total = (roll: string) =>
    SUBJECTS.reduce((sum, s) => sum + (parseInt(marks[roll]?.[s] || "0") || 0), 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Marks Entry</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter and manage student examination marks</p>
      </div>

      <div className="flex gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Exam</label>
          <select value={exam} onChange={(e) => setExam(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            {["First Terminal", "Second Terminal", "Final Examination"].map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Class</label>
          <select value={cls} onChange={(e) => setCls(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            {["Class 10 A", "Class 9 B", "Class 8 A"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{cls} — {exam}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Roll</th>
                {SUBJECTS.map((s) => (
                  <th key={s} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">{s}</th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {STUDENTS.map((st) => {
                const t = total(st.roll);
                return (
                  <tr key={st.roll} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{st.name}</td>
                    <td className="px-3 py-3 text-center text-gray-500 text-xs">{st.roll}</td>
                    {SUBJECTS.map((subj) => {
                      const val = parseInt(marks[st.roll]?.[subj] || "0") || 0;
                      const pass = val >= 40;
                      return (
                        <td key={subj} className="px-3 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={marks[st.roll]?.[subj] ?? ""}
                            onChange={(e) => setMark(st.roll, subj, e.target.value)}
                            className={cn(
                              "w-16 text-center border rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500",
                              marks[st.roll]?.[subj]
                                ? pass
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-red-200 bg-red-50 text-red-600"
                                : "border-gray-200 bg-white text-gray-700"
                            )}
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold text-gray-800">{t}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-green-700">
            Save Marks
          </button>
        </div>
      </div>
    </div>
  );
}
