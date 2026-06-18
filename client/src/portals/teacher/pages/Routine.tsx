import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CalendarRange, Clock, MapPin, Sun, Sunrise, BookText } from "lucide-react";
import { api } from "@/lib/api";

type Slot = {
  id: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: number; // 0=Sunday .. 6=Saturday
  periodNumber: number;
  startTime: string; // "10:00"
  endTime: string;
  roomNo: string | null;
  shift: "MORNING" | "DAY";
  materials: string | null;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ShiftBadge({ shift }: { shift: Slot["shift"] }) {
  const morning = shift === "MORNING";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap border",
        morning
          ? "bg-amber-50 text-amber-600 border-amber-100"
          : "bg-sky-50 text-sky-600 border-sky-100",
      )}
    >
      {morning ? <Sunrise size={11} /> : <Sun size={11} />}
      {morning ? "Morning" : "Day"}
    </span>
  );
}

export default function Routine() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.teacher.routine()
      .then((r) => setSlots(Array.isArray(r) ? (r as Slot[]) : []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, []);

  const todayIdx = new Date().getDay();
  const todays = slots
    .filter((s) => s.dayOfWeek === todayIdx)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Routine</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your weekly teaching periods</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <CalendarRange className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No periods assigned to you yet.</p>
        </div>
      ) : (
        <>
          {/* Today's Classes */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900">Today's Classes</h2>
              <span className="text-xs text-gray-400">{DAYS[todayIdx]}</span>
            </div>
            {todays.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">No classes scheduled for today.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {todays.map((s) => (
                  <div key={s.id} className="px-5 py-4 hover:bg-gray-50/60">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 shrink-0 w-32">
                        <Clock size={13} className="text-gray-400" />
                        {s.startTime} – {s.endTime}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{s.sectionName}</p>
                          <ShiftBadge shift={s.shift} />
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{s.subjectName}</p>
                        {s.roomNo && (
                          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <MapPin size={11} /> Room {s.roomNo}
                          </p>
                        )}
                        {s.materials && (
                          <p className="flex items-start gap-1.5 text-xs text-gray-500 mt-1.5">
                            <BookText size={12} className="text-gray-400 mt-0.5 shrink-0" />
                            <span>{s.materials}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly view */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Weekly Schedule</h2>
            <div className="space-y-4">
              {DAYS.map((dayName, dayIdx) => {
                const dayslots = slots
                  .filter((s) => s.dayOfWeek === dayIdx)
                  .sort((a, b) => a.periodNumber - b.periodNumber);
                if (dayslots.length === 0) return null;
                return (
                  <div key={dayIdx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div
                      className={cn(
                        "px-5 py-3 border-b border-gray-100 flex items-center justify-between",
                        dayIdx === todayIdx && "bg-green-50/60",
                      )}
                    >
                      <h3 className="font-semibold text-gray-900">{dayName}</h3>
                      {dayIdx === todayIdx && (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-lg">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-gray-50">
                      {dayslots.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60">
                          <span className="text-xs text-gray-400 w-6 shrink-0">
                            {String(s.periodNumber).padStart(2, "0")}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-gray-700 w-32 shrink-0">
                            <Clock size={12} className="text-gray-400" />
                            {s.startTime}–{s.endTime}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{s.sectionName}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {s.subjectName}
                              {s.roomNo && ` · Room ${s.roomNo}`}
                            </p>
                          </div>
                          <ShiftBadge shift={s.shift} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
