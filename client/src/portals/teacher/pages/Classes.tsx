import { useState, useEffect } from "react";
import { cn, dummyAvatar } from "@/lib/utils";
import { Users, ChevronRight, ArrowLeft, GraduationCap } from "lucide-react";
import { api } from "@/lib/api";

export default function Classes() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.teacher.classes()
      .then((c) => setClasses(Array.isArray(c) ? c : []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  // Roster detail view
  if (selected) {
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back to classes
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{selected.name} — Roster</h1>
          <p className="text-sm text-gray-500 mt-0.5">{selected.students.length} students</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {selected.students.length === 0 ? (
            <p className="py-14 text-center text-sm text-gray-400">No students enrolled in this class.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {selected.students.map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60">
                  <span className="text-xs text-gray-400 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <img src={s.avatar || dummyAvatar(s.name)} alt={s.name} className="w-9 h-9 rounded-full object-cover bg-green-100 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    {s.rollNo && <p className="text-xs text-gray-400">Roll {s.rollNo}</p>}
                  </div>
                  {s.stream && (
                    <span className="text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-1 rounded-lg whitespace-nowrap">{s.stream}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Classes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your assigned classes and student rosters</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No classes assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelected(cls)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden text-left hover:shadow-md hover:border-green-200 transition-all"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Grade {cls.gradeNumber}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                  <Users size={11} />
                  {cls.students.length}
                </span>
              </div>
              {/* avatar stack preview */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {cls.students.slice(0, 6).map((s: any) => (
                    <img
                      key={s.id}
                      src={s.avatar || dummyAvatar(s.name)}
                      alt={s.name}
                      title={s.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white bg-green-100"
                    />
                  ))}
                  {cls.students.length > 6 && (
                    <span className="w-8 h-8 rounded-full ring-2 ring-white bg-gray-100 text-gray-500 text-[10px] font-semibold flex items-center justify-center">
                      +{cls.students.length - 6}
                    </span>
                  )}
                  {cls.students.length === 0 && <span className="text-xs text-gray-400">No students</span>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
              <div className="px-5 pb-4">
                <span className={cn("w-full block text-center bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium")}>
                  View Roster
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
