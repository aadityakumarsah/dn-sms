import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { CalendarDays, Clock, MapPin, User, BookText } from "lucide-react";

type Slot = {
  id: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  sectionName: string;
  subjectName: string;
  teacherName: string | null;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNo: string | null;
  shift: "MORNING" | "DAY";
  materials: string | null;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SUBJECT_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-purple-50 text-purple-700 border-purple-100",
  "bg-teal-50 text-teal-700 border-teal-100",
  "bg-sky-50 text-sky-700 border-sky-100",
  "bg-rose-50 text-rose-700 border-rose-100",
];

function subjectColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
}

const SHIFT_BADGE: Record<Slot["shift"], string> = {
  MORNING: "bg-orange-50 text-orange-600 border-orange-100",
  DAY: "bg-sky-50 text-sky-600 border-sky-100",
};
const SHIFT_LABEL: Record<Slot["shift"], string> = { MORNING: "Morning", DAY: "Day" };

function fmtTime(t: string) {
  return t;
}

function byPeriod(a: Slot, b: Slot) {
  return a.periodNumber - b.periodNumber;
}

type ShiftFilter = "ALL" | "MORNING" | "DAY";

export default function Timetable() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");
  const [enrolled, setEnrolled] = useState(true);

  useEffect(() => {
    api.student
      .routine()
      .then((d: any) => {
        if (d && Array.isArray(d.slots)) {
          setSlots(d.slots as Slot[]);
          setEnrolled(d.enrolled !== false);
        } else if (Array.isArray(d)) {
          setSlots(d as Slot[]);
          setEnrolled(true);
        } else {
          setSlots([]);
          setEnrolled(true);
        }
      })
      .catch(() => { setSlots([]); setEnrolled(true); })
      .finally(() => setLoading(false));
  }, []);

  const hasMorning = useMemo(() => slots.some((s) => s.shift === "MORNING"), [slots]);
  const hasDay = useMemo(() => slots.some((s) => s.shift === "DAY"), [slots]);
  const showFilter = hasMorning && hasDay;

  const filtered = useMemo(
    () => (shiftFilter === "ALL" ? slots : slots.filter((s) => s.shift === shiftFilter)),
    [slots, shiftFilter]
  );

  const todayIdx = new Date().getDay();

  const todayClasses = useMemo(
    () => filtered.filter((s) => s.dayOfWeek === todayIdx).sort(byPeriod),
    [filtered, todayIdx]
  );

  const byDay = useMemo(() => {
    const map: Record<number, Slot[]> = {};
    for (const s of filtered) (map[s.dayOfWeek] ??= []).push(s);
    for (const arr of Object.values(map)) arr.sort(byPeriod);
    return map;
  }, [filtered]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Timetable</h1>
        <p className="text-sm text-gray-500 mb-8">Your weekly class schedule.</p>
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No routine published yet.</p>
        </div>
      </div>
    );
  }

  const sectionName = slots[0]?.sectionName;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Timetable</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sectionName ? `${sectionName} — ` : ""}Weekly Schedule
          </p>
        </div>
        {showFilter && (
          <div className="flex gap-2">
            {([
              { key: "ALL", label: "All" },
              { key: "MORNING", label: "Morning" },
              { key: "DAY", label: "Day" },
            ] as { key: ShiftFilter; label: string }[]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setShiftFilter(opt.key)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  shiftFilter === opt.key
                    ? "bg-secondary text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!enrolled && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-700 font-medium">You are not currently enrolled in any class. Please contact your class teacher.</p>
        </div>
      )}

      {/* Today's Classes */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Today's Classes — {DAY_NAMES[todayIdx]}
          </h2>
        </div>
        <div className="p-4">
          {todayClasses.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-2.5">
              {todayClasses.map((s) => (
                <div
                  key={s.id}
                  className={cn("rounded-xl border p-3.5", subjectColor(s.subjectName))}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold leading-tight">{s.subjectName}</h3>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium border",
                            SHIFT_BADGE[s.shift]
                          )}
                        >
                          {SHIFT_LABEL[s.shift]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs opacity-80 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                        </span>
                        {s.teacherName && (
                          <span className="flex items-center gap-1">
                            <User size={12} /> {s.teacherName}
                          </span>
                        )}
                        {s.roomNo && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {s.roomNo}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium opacity-60 shrink-0">
                      Period {s.periodNumber}
                    </span>
                  </div>
                  {s.materials && (
                    <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-700">
                      <BookText size={13} className="shrink-0" />
                      <span>Bring: {s.materials}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly schedule grouped by day */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Weekly Schedule</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {DAY_NAMES.map((dayName, di) => {
            const periods = byDay[di] ?? [];
            const isToday = di === todayIdx;
            return (
              <div key={dayName} className={cn("px-5 py-4", isToday && "bg-secondary/5")}>
                <div className="flex items-center gap-2 mb-3">
                  <h3
                    className={cn(
                      "text-sm font-semibold",
                      isToday ? "text-secondary font-bold" : "text-gray-700"
                    )}
                  >
                    {dayName}
                  </h3>
                  {isToday && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary/10 text-secondary">
                      Today
                    </span>
                  )}
                </div>
                {periods.length === 0 ? (
                  <p className="text-xs text-gray-400 pl-0.5">No classes</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {periods.map((s) => (
                      <div
                        key={s.id}
                        className={cn("rounded-xl border p-3", subjectColor(s.subjectName))}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm leading-tight">{s.subjectName}</p>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-medium border shrink-0",
                              SHIFT_BADGE[s.shift]
                            )}
                          >
                            {SHIFT_LABEL[s.shift]}
                          </span>
                        </div>
                        <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                          <Clock size={11} /> {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1 text-xs opacity-70 flex-wrap">
                          {s.teacherName && (
                            <span className="flex items-center gap-1">
                              <User size={11} /> {s.teacherName}
                            </span>
                          )}
                          {s.roomNo && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {s.roomNo}
                            </span>
                          )}
                        </div>
                        {s.materials && (
                          <div className="mt-2 flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
                            <BookText size={12} className="shrink-0" />
                            <span className="truncate">Bring: {s.materials}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
