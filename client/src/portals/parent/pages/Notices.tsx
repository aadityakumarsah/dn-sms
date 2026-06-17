import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const NOTICES = [
  {
    id: 1, urgent: true, title: "Fee Payment Reminder — Falgun 2081",
    date: "Falgun 1, 2081", by: "Accounts Office",
    body: "This is a reminder that the Tuition Fee for Falgun 2081 is due by Falgun 15. Please clear the outstanding amount at the school accounts office or via eSewa/Khalti. Late payments will attract a fine of NPR 50 per day.",
  },
  {
    id: 2, urgent: true, title: "Parent-Teacher Meeting — Falgun 10",
    date: "Magh 28, 2081", by: "Principal's Office",
    body: "All parents are cordially invited to the Parent-Teacher Meeting scheduled for Falgun 10, 2081 at 10:00 AM in the school assembly hall. This meeting will cover your child's academic progress, attendance, and behaviour. Please confirm your attendance with the class teacher.",
  },
  {
    id: 3, urgent: false, title: "Second Terminal Exam Schedule Published",
    date: "Magh 20, 2081", by: "Examination Committee",
    body: "The Second Terminal Examination schedule has been published. Exams will be held from Magh 10–25, 2081. Students must bring their admit cards, which are available from the office. No student will be allowed to sit exams without a valid admit card.",
  },
  {
    id: 4, urgent: false, title: "Annual Sports Day — Falgun 15",
    date: "Magh 18, 2081", by: "Sports Department",
    body: "The Annual Sports Day will be held on Falgun 15, 2081 at the school grounds. Students interested in participating in track and field, volleyball, and football events should register with their class teacher by Falgun 5. Parents are welcome to attend.",
  },
  {
    id: 5, urgent: false, title: "School Closed — Maha Shivaratri (Magh 29)",
    date: "Magh 15, 2081", by: "Administration",
    body: "The school will remain closed on Magh 29, 2081 on the occasion of Maha Shivaratri. Regular classes will resume from Falgun 1, 2081. Students are advised to complete any pending assignments during the holiday.",
  },
];

export default function Notices() {
  const [expanded, setExpanded] = useState<number | null>(1);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notices</h1>
        <p className="text-sm text-gray-500 mt-0.5">School notices and announcements</p>
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
