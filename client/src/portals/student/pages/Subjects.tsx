import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BookOpen } from "lucide-react";

const COLORS = [
  "bg-blue-50 border-blue-100 text-blue-700",
  "bg-emerald-50 border-emerald-100 text-emerald-700",
  "bg-amber-50 border-amber-100 text-amber-700",
  "bg-purple-50 border-purple-100 text-purple-700",
  "bg-teal-50 border-teal-100 text-teal-700",
  "bg-sky-50 border-sky-100 text-sky-700",
  "bg-rose-50 border-rose-100 text-rose-700",
];

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.student.subjects()
      .then((d: any) => setSubjects(Array.isArray(d) ? d : []))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">My Subjects</h1>
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center mt-6">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No subjects assigned yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Subjects</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subjects.length} subject{subjects.length !== 1 ? "s" : ""} this year</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {subjects.map((s: any, i: number) => {
          const scheme = COLORS[i % COLORS.length];
          const [bg, border, text] = scheme.split(" ");
          return (
            <div key={s.id} className={cn("bg-white rounded-2xl border p-5 space-y-3", border)}>
              <div className="flex items-start justify-between">
                <div className={cn("rounded-xl p-2.5 border", scheme)}>
                  <BookOpen size={16} />
                </div>
                <span className={cn("text-xs px-2 py-1 rounded-lg font-semibold", `${bg} ${text}`)}>
                  {s.code}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                {s.department?.name && (
                  <p className="text-xs text-gray-500 mt-0.5">{s.department.name}</p>
                )}
                <div className="flex gap-3 mt-1.5">
                  {s.creditHours && (
                    <span className="text-xs text-gray-500">{s.creditHours} credit hrs</span>
                  )}
                  {s.isElective && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Elective</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
