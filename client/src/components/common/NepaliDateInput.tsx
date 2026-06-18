import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import NepaliDate from "nepali-date-converter";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { BS_MONTHS, adToBs, bsToAd, fmtBS } from "@/lib/nepali-date";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function daysInBSMonth(year: number, month: number): number {
  for (let d = 32; d >= 28; d--) {
    try { new NepaliDate(year, month, d); return d; } catch { }
  }
  return 30;
}

function firstWeekdayOfBSMonth(year: number, month: number): number {
  const ad = bsToAd(year, month, 1);
  if (!ad) return 0;
  return new Date(ad + "T00:00:00").getDay();
}

const YEARS = Array.from({ length: 16 }, (_, i) => 2078 + i);

interface Props {
  value: string;
  onChange: (adIso: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function NepaliDateInput({ value, onChange, className, disabled, placeholder }: Props) {
  const today = adToBs(new Date().toISOString().slice(0, 10))!;
  const bs = adToBs(value) ?? today;

  const [open, setOpen] = useState(false);
  const [nav, setNav] = useState({ year: bs.year, month: bs.month });
  // Position of the calendar portal (fixed, relative to trigger button)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const b = adToBs(value);
    if (b) setNav({ year: b.year, month: b.month });
  }, [value]);

  // Recalculate position when opening
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const calH = 340; // approximate calendar height
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= calH ? rect.bottom + 4 : rect.top - calH - 4;
    setPos({ top, left: rect.left, width: rect.width });
  }, [open]);

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("mousedown", (e) => {
      const cal = document.getElementById("ndi-calendar");
      if (!cal?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) close();
    });
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  const prevMonth = () => setNav(n => n.month === 0 ? { year: n.year - 1, month: 11 } : { ...n, month: n.month - 1 });
  const nextMonth = () => setNav(n => n.month === 11 ? { year: n.year + 1, month: 0 } : { ...n, month: n.month + 1 });

  const selectDay = (day: number) => {
    const ad = bsToAd(nav.year, nav.month, day);
    if (ad) { onChange(ad); setOpen(false); }
  };

  const totalDays = daysInBSMonth(nav.year, nav.month);
  const startOffset = firstWeekdayOfBSMonth(nav.year, nav.month);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedBs = adToBs(value);
  const isSelected = (d: number) =>
    selectedBs && selectedBs.year === nav.year && selectedBs.month === nav.month && selectedBs.day === d;
  const isToday = (d: number) =>
    today.year === nav.year && today.month === nav.month && today.day === d;

  const calendar = open ? createPortal(
    <div
      id="ndi-calendar"
      style={{ position: "fixed", top: pos.top, left: pos.left, minWidth: Math.max(pos.width, 272), zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          <select value={nav.month} onChange={e => setNav(n => ({ ...n, month: +e.target.value }))}
            className="text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer">
            {BS_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={nav.year} onChange={e => setNav(n => ({ ...n, year: +e.target.value }))}
            className="text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-xs text-gray-400">BS</span>
        </div>
        <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day ? (
              <button type="button" onClick={() => selectDay(day)}
                className={cn(
                  "w-8 h-8 text-xs rounded-full transition-colors font-medium",
                  isSelected(day) ? "bg-blue-600 text-white"
                    : isToday(day) ? "border border-blue-400 text-blue-600 hover:bg-blue-50"
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Today shortcut */}
      <div className="mt-2 pt-2 border-t border-gray-100 text-center">
        <button type="button" onClick={() => {
          const todayAd = new Date().toISOString().slice(0, 10);
          onChange(todayAd);
          const b = adToBs(todayAd)!;
          setNav({ year: b.year, month: b.month });
          setOpen(false);
        }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          Today ({today.day} {BS_MONTHS[today.month]} {today.year} BS)
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-xl outline-none transition-all bg-gray-50",
          "hover:border-blue-400 focus:ring-2 focus:ring-blue-400",
          open ? "border-blue-400 ring-2 ring-blue-400" : "border-gray-200",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value ? fmtBS(value) : (placeholder ?? "Select BS date")}
        </span>
      </button>
      {calendar}
    </div>
  );
}
