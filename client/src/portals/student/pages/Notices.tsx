import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const NOTICES = [
  {
    id: 1, urgent: true, title: "Second Terminal Exam Schedule",
    date: "Magh 20, 2081", by: "Examination Committee",
    body: "The Second Terminal Examination will be held from Magh 10–25, 2081. All students must collect their admit cards from the school office before Magh 8. Students without admit cards will not be permitted to sit the examination. Seating arrangements will be posted on the notice board.",
  },
  {
    id: 2, urgent: true, title: "Assignment Submission Deadline — Math & Science",
    date: "Falgun 1, 2081", by: "Nabin Thapa (Math) / Binod Shrestha (Science)",
    body: "All pending assignments for Mathematics (Quadratic Equations – Practice Set) and Science (Light & Optics – Lab Report) must be submitted by Falgun 5, 2081. Late submissions will not be accepted. Please submit directly to your subject teacher.",
  },
  {
    id: 3, urgent: false, title: "Annual Sports Day — Falgun 15",
    date: "Magh 18, 2081", by: "Sports Department",
    body: "The Annual Sports Day will be held on Falgun 15, 2081. Students wishing to participate in track events, volleyball, or football must register with their class teacher by Falgun 5. Participation certificates will be awarded to all participants.",
  },
  {
    id: 4, urgent: false, title: "School Holiday — Maha Shivaratri (Magh 29)",
    date: "Magh 15, 2081", by: "Administration",
    body: "The school will remain closed on Magh 29, 2081 on the occasion of Maha Shivaratri. Regular classes resume from Falgun 1. Students are encouraged to complete any pending assignments during the holiday.",
  },
  {
    id: 5, urgent: false, title: "Second Terminal Results — Publication Date",
    date: "Magh 28, 2081", by: "Examination Committee",
    body: "The results for the Second Terminal Examination will be published on Falgun 10, 2081. Students and parents will be notified via SMS. Report cards will be distributed during the Parent-Teacher Meeting on Falgun 10.",
  },
];

export default function Notices() {
  const [expanded, setExpanded] = useState<number | null>(1);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notices</h1>
        <p className="text-sm text-gray-500 mt-0.5">School notices and announcements for students</p>
      </div>

      <div className="space-y-3">
        {NOTICES.map((n) => (
          <div key={n.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === n.id ? null : n.id)}
              className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className={cn(
                  "text-xs px-2 py-1 rounded-lg font-medium shrink-0 mt-0.5",
                  n.urgent ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                )}>
                  {n.urgent ? "Urgent" : "Normal"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.date} · {n.by}</p>
                </div>
              </div>
              <span className="text-gray-400 shrink-0 mt-0.5">
                {expanded === n.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {expanded === n.id && (
              <div className="px-5 pb-5 border-t border-gray-50">
                <p className="text-sm text-gray-600 leading-relaxed pt-4">{n.body}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
