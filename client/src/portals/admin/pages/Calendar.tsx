import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

// BS (Bikram Sambat) calendar utility
// Gregorian to BS conversion lookup table — days in each BS month (1970-2100)
const BS_MONTHS = ["Baisakh","Jestha","Ashadh","Shrawan","Bhadra","Ashwin","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"];
const BS_MONTHS_NP = ["बैशाख","जेठ","असाढ","श्रावण","भाद्र","आश्विन","कार्तिक","मंसिर","पौष","माघ","फाल्गुन","चैत्र"];
const DAYS_NP = ["आइत","सोम","मंगल","बुध","बिहि","शुक्र","शनि"];
const DAYS_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Month lengths for BS years 2078-2090 (representative range)
const BS_YEAR_DATA: Record<number, number[]> = {
  2078: [31,31,32,32,31,30,30,29,30,29,30,30],
  2079: [31,32,31,32,31,30,30,30,29,29,30,30],
  2080: [31,32,31,32,31,30,30,30,29,30,29,31],
  2081: [31,31,31,32,31,31,29,30,30,29,29,31],
  2082: [31,31,32,31,31,31,30,29,30,29,30,30],
  2083: [31,31,32,32,31,30,30,29,30,29,30,30],
  2084: [31,32,31,32,31,30,30,30,29,29,30,30],
  2085: [31,32,31,32,31,30,30,30,29,30,29,31],
  2086: [31,31,31,32,31,31,30,29,29,30,29,31],
  2087: [31,31,32,31,31,31,30,29,30,29,30,30],
  2088: [31,32,31,32,31,30,29,30,29,30,29,31],
  2089: [31,32,31,32,31,30,30,29,30,29,30,30],
  2090: [31,31,32,32,31,30,30,30,29,29,30,31],
};

// Reference: 2081 Baisakh 1 = April 13, 2024
const AD_EPOCH = new Date(2024, 3, 13); // April 13, 2024
const BS_EPOCH = { year: 2081, month: 0, day: 1 }; // Baisakh 1, 2081

function adToBS(date: Date): { year: number; month: number; day: number } {
  const msPerDay = 86400000;
  const diffDays = Math.floor((date.getTime() - AD_EPOCH.getTime()) / msPerDay);
  let year = BS_EPOCH.year;
  let month = BS_EPOCH.month;
  let day = BS_EPOCH.day;
  let remaining = diffDays;

  if (remaining >= 0) {
    while (remaining > 0) {
      const monthLen = (BS_YEAR_DATA[year] ?? BS_YEAR_DATA[2081])[month];
      const daysLeft = monthLen - day + 1;
      if (remaining < daysLeft) { day += remaining; remaining = 0; }
      else { remaining -= daysLeft; month++; day = 1; if (month >= 12) { month = 0; year++; } }
    }
  } else {
    remaining = -remaining;
    while (remaining > 0) {
      if (day > remaining) { day -= remaining; remaining = 0; }
      else { remaining -= day; month--; if (month < 0) { month = 11; year--; } day = (BS_YEAR_DATA[year] ?? BS_YEAR_DATA[2081])[month]; }
    }
  }
  return { year, month, day };
}

function bsFirstWeekday(year: number, month: number): number {
  // Get AD date for BS year/month/day 1 by counting days from epoch
  let days = 0;
  let y = BS_EPOCH.year;
  let m = BS_EPOCH.month;
  // From epoch to target
  while (y < year || (y === year && m < month)) {
    days += (BS_YEAR_DATA[y] ?? BS_YEAR_DATA[2081])[m];
    m++; if (m >= 12) { m = 0; y++; }
  }
  const target = new Date(AD_EPOCH.getTime() + days * 86400000);
  return target.getDay();
}

interface CalEvent { id: string; day: number; title: string; color: string; }

const EVENT_COLORS = ["bg-blue-100 text-blue-800", "bg-emerald-100 text-emerald-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-700", "bg-purple-100 text-purple-800"];
const EVENT_DOT_COLORS = ["bg-blue-400", "bg-emerald-400", "bg-amber-400", "bg-rose-400", "bg-purple-400"];

export default function Calendar() {
  const today = adToBS(new Date());
  const [viewYear, setViewYear] = useState(today.year);
  const [viewMonth, setViewMonth] = useState(today.month);
  const [showNp, setShowNp] = useState(false);
  const [events, setEvents] = useState<CalEvent[]>([
    { id: "1", day: 1, title: "School Begins", color: EVENT_COLORS[1] },
    { id: "2", day: 15, title: "Mid-term Exam", color: EVENT_COLORS[3] },
  ]);
  const [addDay, setAddDay] = useState<number | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[0]);

  const yearData = BS_YEAR_DATA[viewYear] ?? BS_YEAR_DATA[2081];
  const daysInMonth = yearData[viewMonth];
  const firstWeekday = bsFirstWeekday(viewYear, viewMonth);

  const prev = () => { if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); } else setViewMonth(viewMonth - 1); };
  const next = () => { if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); } else setViewMonth(viewMonth + 1); };

  const monthEvents: Record<number, CalEvent[]> = {};
  events.forEach((e) => { if (!monthEvents[e.day]) monthEvents[e.day] = []; monthEvents[e.day].push(e); });

  const isToday = (d: number) => today.year === viewYear && today.month === viewMonth && today.day === d;

  const addEvent = () => {
    if (!newEventTitle.trim() || addDay === null) return;
    setEvents([...events, { id: String(Date.now()), day: addDay, title: newEventTitle.trim(), color: selectedColor }]);
    setNewEventTitle("");
    setAddDay(null);
  };

  const deleteEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEvents(events.filter((ev) => ev.id !== id));
  };

  const cells = Array.from({ length: firstWeekday }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">BS Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bikram Sambat academic calendar</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowNp(!showNp)} className={cn("text-xs px-3 py-1.5 border rounded-xl font-medium transition-colors", showNp ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600")}>
            {showNp ? "नेपाली" : "English"}
          </button>
          <button onClick={() => { setViewYear(today.year); setViewMonth(today.month); }} className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Today</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <button onClick={prev} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
          <div className="text-center">
            <h2 className="font-bold text-gray-900 text-lg">{showNp ? BS_MONTHS_NP[viewMonth] : BS_MONTHS[viewMonth]}</h2>
            <p className="text-sm text-gray-400">{viewYear}</p>
          </div>
          <button onClick={next} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="px-4 pb-4">
          <div className="grid grid-cols-7 mb-1">
            {(showNp ? DAYS_NP : DAYS_EN).map((d) => (
              <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => (
                <div key={di} onClick={() => day && setAddDay(day)}
                  className={cn("min-h-[70px] p-1.5 border border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors",
                    day && isToday(day) ? "bg-blue-50" : "")}>
                  {day && (
                    <>
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1",
                        isToday(day) ? "bg-blue-600 text-white" : "text-gray-700")}>
                        {day}
                      </div>
                      {(monthEvents[day] ?? []).map((e) => (
                        <div key={e.id} className={cn("text-xs px-1.5 py-0.5 rounded-md mb-0.5 font-medium flex items-center gap-0.5 group/ev", e.color)}>
                          <span className="truncate flex-1">{e.title}</span>
                          <button onClick={(ev) => deleteEvent(e.id, ev)} className="shrink-0 opacity-0 group-hover/ev:opacity-100 hover:text-red-600 transition-opacity leading-none">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {addDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAddDay(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-5 max-w-xs w-full">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Add Event — {BS_MONTHS[viewMonth]} {addDay}, {viewYear}</h3>
            <input value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="Event title"
              onKeyDown={(e) => e.key === "Enter" && addEvent()} autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 mb-3" />
            <div className="flex gap-1.5 mb-4">
              {EVENT_COLORS.map((c, i) => (
                <button key={c} type="button" onClick={() => setSelectedColor(c)}
                  className={cn("w-6 h-6 rounded-full border-2 transition-all", EVENT_DOT_COLORS[i],
                    selectedColor === c ? "border-gray-700 scale-110" : "border-transparent")}>
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddDay(null)} className="px-3 py-1.5 text-sm text-gray-500">Cancel</button>
              <button onClick={addEvent} disabled={!newEventTitle.trim()}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
