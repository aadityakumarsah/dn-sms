import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

const SUBJECTS = [
  { name: "Mathematics", teacher: "Nabin Thapa", chapter: "Ch. 6 – Quadratic Equations", progress: 72, lastScore: 88 },
  { name: "English", teacher: "Sunita Karki", chapter: "Ch. 5 – Letter Writing", progress: 65, lastScore: 76 },
  { name: "Nepali", teacher: "Gita Rai", chapter: "Ch. 7 – निबन्ध लेखन", progress: 70, lastScore: 82 },
  { name: "Science", teacher: "Binod Shrestha", chapter: "Ch. 8 – Light & Optics", progress: 60, lastScore: 79 },
  { name: "Social Studies", teacher: "Mina Gurung", chapter: "Ch. 6 – Economic Development", progress: 68, lastScore: 85 },
  { name: "Computer", teacher: "Ramesh Adhikari", chapter: "Ch. 4 – Spreadsheets", progress: 80, lastScore: 44 },
  { name: "Optional Math", teacher: "Nabin Thapa", chapter: "Ch. 5 – Vectors", progress: 55, lastScore: 78 },
];

const subjectColors = [
  "bg-blue-50 border-blue-100 text-blue-700",
  "bg-emerald-50 border-emerald-100 text-emerald-700",
  "bg-amber-50 border-amber-100 text-amber-700",
  "bg-purple-50 border-purple-100 text-purple-700",
  "bg-teal-50 border-teal-100 text-teal-700",
  "bg-sky-50 border-sky-100 text-sky-700",
  "bg-rose-50 border-rose-100 text-rose-700",
];

export default function Subjects() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Subjects</h1>
        <p className="text-sm text-gray-500 mt-0.5">Class 10 A — Academic Year 2081</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {SUBJECTS.map((s, i) => (
          <div key={s.name} className={cn("bg-white rounded-2xl border p-5 space-y-3", subjectColors[i].split(" ")[1])}>
            <div className="flex items-start justify-between">
              <div className={cn("rounded-xl p-2.5 border", subjectColors[i])}>
                <BookOpen size={16} />
              </div>
              <span className={cn("text-xs px-2 py-1 rounded-lg font-semibold", subjectColors[i])}>
                Last: {s.lastScore}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{s.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{s.teacher}</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">{s.chapter}</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Syllabus Progress</span>
                <span className="font-semibold text-gray-700">{s.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", subjectColors[i].replace("bg-", "bg-").split(" ")[0])}
                  style={{ width: `${s.progress}%` }}
                />
              </div>
            </div>
            <button className="text-xs font-medium text-sky-600 hover:underline">
              View Syllabus →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
