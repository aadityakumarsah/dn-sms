import { cn } from "@/lib/utils";

const PERIODS = [
  "7:00–8:00",
  "8:00–9:00",
  "9:00–10:00",
  "10:00–11:00",
  "11:00–12:00",
  "12:00–1:00",
  "1:00–2:00",
  "2:00–3:00",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

type Cell = { subject: string; teacher: string } | null;

const TIMETABLE: Cell[][] = [
  [
    { subject: "Mathematics", teacher: "N.T" },
    { subject: "English", teacher: "S.K" },
    { subject: "Nepali", teacher: "G.R" },
    null,
    { subject: "Science", teacher: "B.S" },
    { subject: "Social", teacher: "M.G" },
    { subject: "Computer", teacher: "R.A" },
    null,
  ],
  [
    { subject: "English", teacher: "S.K" },
    { subject: "Mathematics", teacher: "N.T" },
    { subject: "Opt. Math", teacher: "N.T" },
    null,
    { subject: "Nepali", teacher: "G.R" },
    { subject: "Science", teacher: "B.S" },
    null,
    { subject: "Social", teacher: "M.G" },
  ],
  [
    { subject: "Nepali", teacher: "G.R" },
    { subject: "Science", teacher: "B.S" },
    { subject: "Mathematics", teacher: "N.T" },
    null,
    { subject: "English", teacher: "S.K" },
    { subject: "Computer", teacher: "R.A" },
    { subject: "Opt. Math", teacher: "N.T" },
    null,
  ],
  [
    { subject: "Science", teacher: "B.S" },
    { subject: "Social", teacher: "M.G" },
    { subject: "English", teacher: "S.K" },
    null,
    { subject: "Mathematics", teacher: "N.T" },
    { subject: "Nepali", teacher: "G.R" },
    null,
    { subject: "Computer", teacher: "R.A" },
  ],
  [
    { subject: "Social", teacher: "M.G" },
    { subject: "Opt. Math", teacher: "N.T" },
    { subject: "Science", teacher: "B.S" },
    null,
    { subject: "Computer", teacher: "R.A" },
    { subject: "Mathematics", teacher: "N.T" },
    { subject: "English", teacher: "S.K" },
    null,
  ],
  [
    { subject: "Computer", teacher: "R.A" },
    { subject: "Nepali", teacher: "G.R" },
    { subject: "Social", teacher: "M.G" },
    null,
    { subject: "Opt. Math", teacher: "N.T" },
    { subject: "English", teacher: "S.K" },
    { subject: "Science", teacher: "B.S" },
    null,
  ],
];

const subjectColors: Record<string, string> = {
  "Mathematics": "bg-blue-50 text-blue-700 border-blue-100",
  "English": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Nepali": "bg-amber-50 text-amber-700 border-amber-100",
  "Science": "bg-purple-50 text-purple-700 border-purple-100",
  "Social": "bg-teal-50 text-teal-700 border-teal-100",
  "Computer": "bg-sky-50 text-sky-700 border-sky-100",
  "Opt. Math": "bg-rose-50 text-rose-700 border-rose-100",
};

const NOW_DAY = 0;
const NOW_PERIOD = 1;

const TODAY_CLASSES = TIMETABLE[NOW_DAY]
  .map((cell, i) => cell ? { ...cell, period: PERIODS[i] } : null)
  .filter(Boolean) as { subject: string; teacher: string; period: string }[];

export default function Timetable() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Timetable</h1>
        <p className="text-sm text-gray-500 mt-0.5">Class 10 A — Weekly Schedule</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Today's Classes — Sunday</h2>
        <div className="flex gap-2 flex-wrap">
          {TODAY_CLASSES.map((c, i) => (
            <div key={i} className={cn("rounded-xl border px-3 py-2 text-xs font-medium", subjectColors[c.subject] ?? "bg-gray-50 text-gray-700 border-gray-100", i === NOW_PERIOD && "ring-2 ring-sky-400")}>
              <p className="font-semibold">{c.subject}</p>
              <p className="opacity-70">{c.period} · {c.teacher}</p>
              {i === NOW_PERIOD && <p className="text-sky-600 font-semibold mt-0.5">Now</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Weekly Timetable</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide w-24">Period</th>
                {DAYS.map((d, i) => (
                  <th key={d} className={cn("px-3 py-3 font-semibold text-gray-500 uppercase tracking-wide text-center", i === NOW_DAY && "text-sky-600 bg-sky-50")}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, pi) => (
                <tr key={period} className="border-t border-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-500 whitespace-nowrap">{period}</td>
                  {DAYS.map((_, di) => {
                    const cell = TIMETABLE[di][pi];
                    const isNow = di === NOW_DAY && pi === NOW_PERIOD;
                    return (
                      <td key={di} className={cn("px-2 py-2 text-center", di === NOW_DAY && "bg-sky-50/50")}>
                        {cell ? (
                          <div className={cn("rounded-lg px-2 py-1.5 border inline-block min-w-16", subjectColors[cell.subject] ?? "bg-gray-50 text-gray-700 border-gray-100", isNow && "ring-2 ring-sky-400")}>
                            <p className="font-semibold leading-tight">{cell.subject}</p>
                            <p className="opacity-60 text-xs">{cell.teacher}</p>
                            {isNow && <p className="text-sky-600 font-bold text-xs">Now</p>}
                          </div>
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
