import { useState, useEffect } from "react";
import { Clock, MapPin, User, BookOpen, CalendarDays, Sun, Sunrise } from "lucide-react";
import { api } from "@/lib/api";
import { cn, dummyAvatar } from "@/lib/utils";

interface Slot {
  id: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: number; // 0=Sunday..6=Saturday
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNo: string | null;
  shift: "MORNING" | "DAY";
  materials: string | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ShiftBadge({ shift }: { shift: Slot["shift"] }) {
  const isMorning = shift === "MORNING";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
        isMorning ? "bg-orange-50 text-orange-600" : "bg-sky-50 text-sky-600"
      )}
    >
      {isMorning ? <Sunrise className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
      {isMorning ? "Morning" : "Day"}
    </span>
  );
}

function SlotCard({ slot }: { slot: Slot }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{slot.subjectName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {slot.startTime} – {slot.endTime}
            </span>
            {slot.teacherName && (
              <span className="inline-flex items-center gap-1 truncate">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{slot.teacherName}</span>
              </span>
            )}
            {slot.roomNo && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Room {slot.roomNo}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[11px] font-medium text-gray-400">Period {slot.periodNumber}</span>
          <ShiftBadge shift={slot.shift} />
        </div>
      </div>
      {slot.materials && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Bring: {slot.materials}</span>
        </div>
      )}
    </div>
  );
}

export default function ParentRoutine() {
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState(0);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingRoutine, setLoadingRoutine] = useState(false);

  // Load children on mount.
  useEffect(() => {
    api.parent
      .dashboard()
      .then((d) => setChildren(d?.children ?? []))
      .catch(() => setChildren([]))
      .finally(() => setLoadingChildren(false));
  }, []);

  const child = children[activeChild];

  // Fetch routine whenever the selected child changes.
  useEffect(() => {
    if (!child) {
      setSlots([]);
      return;
    }
    setLoadingRoutine(true);
    api.parent
      .routine(child.id)
      .then((s) => setSlots(Array.isArray(s) ? s : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingRoutine(false));
  }, [child?.id]);

  if (loadingChildren) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-sm text-gray-400">
          No children linked to your account yet.
        </div>
      </div>
    );
  }

  const todayIdx = new Date().getDay();
  const todaySlots = slots
    .filter((s) => s.dayOfWeek === todayIdx)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Group by day of week, Sunday..Saturday.
  const byDay = DAYS.map((name, idx) => ({
    name,
    idx,
    slots: slots
      .filter((s) => s.dayOfWeek === idx)
      .sort((a, b) => a.periodNumber - b.periodNumber),
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-teal-600" />
          Class Routine
        </h1>
        {child.className && <p className="text-sm text-gray-500 mt-0.5">{child.className}</p>}
      </div>

      {/* Child switcher (only if more than one child) */}
      {children.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {children.map((c: any, i: number) => (
            <button
              key={c.id}
              onClick={() => setActiveChild(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm border transition-colors",
                i === activeChild
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              <img src={c.avatar || dummyAvatar(c.name)} alt={c.name} className="w-5 h-5 rounded-full object-cover" />
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {loadingRoutine ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-sm text-gray-400">
          No routine has been set for {child.name.split(" ")[0]} yet.
        </div>
      ) : (
        <>
          {/* Today's classes */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Today&rsquo;s Classes</h2>
              <span className="text-xs text-gray-400">{DAYS[todayIdx]}</span>
            </div>
            {todaySlots.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-8 text-center text-sm text-gray-400">
                No classes scheduled for today. Enjoy the day off!
              </div>
            ) : (
              <div className="space-y-3">
                {todaySlots.map((s) => (
                  <SlotCard key={s.id} slot={s} />
                ))}
              </div>
            )}
          </section>

          {/* Weekly view */}
          <section>
            <h2 className="font-semibold text-gray-900 mb-3">Weekly Schedule</h2>
            <div className="space-y-6">
              {byDay
                .filter((d) => d.slots.length > 0)
                .map((d) => (
                  <div key={d.idx}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className={cn(
                          "text-sm font-semibold",
                          d.idx === todayIdx ? "text-teal-600" : "text-gray-700"
                        )}
                      >
                        {d.name}
                      </h3>
                      {d.idx === todayIdx && (
                        <span className="text-[11px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {d.slots.map((s) => (
                        <SlotCard key={s.id} slot={s} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
