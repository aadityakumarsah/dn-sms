import { LayoutDashboard, BookOpen, CalendarCheck, ClipboardList, FileText, MessageSquare, Settings, CalendarRange, GraduationCap } from "lucide-react";
import type { NavSection } from "@/types";

export const teacherNav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    ],
  },
  {
    section: "Teaching",
    items: [
      { label: "My Classes", href: "/teacher/classes", icon: BookOpen },
      { label: "My Routine", href: "/teacher/routine", icon: CalendarRange },
      { label: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
      { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList, badge: 3 },
      { label: "Exam Schedule", href: "/teacher/exams", icon: GraduationCap },
      { label: "Marks Entry", href: "/teacher/marks", icon: FileText },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Messages", href: "/teacher/messages", icon: MessageSquare, badge: 5 },
      { label: "Settings", href: "/teacher/settings", icon: Settings },
    ],
  },
];
