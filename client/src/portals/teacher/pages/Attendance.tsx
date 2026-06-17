import { cn, dummyAvatar } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Check } from "lucide-react";

type Status = "PRESENT" | "ABSENT" | "LATE";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const [sections, setSections] = useState<any[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Load class list once
  useEffect(() => {
    api.teacher.attendance()
      .then((d: any) => {
        const secs = d?.sections ?? [];
        setSections(secs);
        if (secs.length) setSectionId(secs[0].id);
      })
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, []);

  // Load roster when class or date changes
  useEffect(() => {
    if (!sectionId) return;
    setLoadingRoster(true);
    setSavedAt(null);
    api.teacher.attendance({ sectionId, date })
      .then((d: any) => {
        const list = d?.students ?? [];
        setStudents(list);
        const init: Record<string, Status> = {};
        for (const s of list) if (s.status) init[s.studentId] = s.status;
        setStatuses(init);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingRoster(false));
  }, [sectionId, date]);

  const toggle = (id: string, s: Status) => setStatuses((prev) => ({ ...prev, [id]: s }));
  const count = (s: Status) => Object.values(statuses).filter((v) => v === s).length;
  const total = students.length;

  const markAll = (s: Status) => {
    const all: Record<string, Status> = {};
    for (const st of students) all[st.studentId] = s;
    setStatuses(all);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const records = students.map((st) => ({ studentId: st.studentId, status: statuses[st.studentId] ?? "PRESENT" }));
      await api.teacher.markAttendance({ sectionId, date, records });
      setSavedAt(new Date().toLocaleTimeString());
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const labels: Record<Status, string> = { PRESENT: "Present", ABSENT: "Absent", LATE: "Late" };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select a class and date, then mark each student.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-wrap items-end gap-5">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Select Class</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={loading || sections.length === 0}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {sections.length === 0 && <option>No classes</option>}
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Date</label>
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-5 ml-auto text-sm">
          <span>Present: <strong className="text-emerald-600">{count("PRESENT")}</strong> / {total}</span>
          <span>Absent: <strong className="text-red-500">{count("ABSENT")}</strong></span>
          <span>Late: <strong className="text-amber-600">{count("LATE")}</strong></span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Student Roster</h2>
          <button onClick={() => markAll("PRESENT")} disabled={!total}
            className="text-xs text-green-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
            Mark all present
          </button>
        </div>

        {loadingRoster ? (
          <div className="p-5 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
        ) : students.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-400">No students enrolled in this class.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {students.map((st, i) => (
              <div key={st.studentId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-400 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <img src={st.avatar || dummyAvatar(st.name)} alt={st.name} className="w-8 h-8 rounded-full object-cover bg-green-100 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-800 block truncate">{st.name}</span>
                    {st.rollNo && <span className="text-xs text-gray-400">Roll {st.rollNo}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {(["PRESENT", "ABSENT", "LATE"] as Status[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => toggle(st.studentId, s)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border",
                        statuses[st.studentId] === s
                          ? s === "PRESENT" ? "bg-emerald-600 text-white border-emerald-600"
                            : s === "ABSENT" ? "bg-red-500 text-white border-red-500"
                            : "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {labels[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          {savedAt && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved at {savedAt}</span>}
          <button onClick={submit} disabled={saving || !total}
            className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? "Saving..." : "Submit Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
