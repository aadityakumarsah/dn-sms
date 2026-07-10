import { LayoutDashboard, BookOpen, CalendarCheck, FileText, Clock, Megaphone, Settings, GraduationCap, User } from "lucide-react";
import type { NavSection } from "@/types";

export const studentNav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/student", icon: LayoutDashboard },
      { label: "My Profile", href: "/student/profile", icon: User },
    ],
  },
  {
    section: "Academics",
    items: [
      { label: "My Subjects", href: "/student/subjects", icon: BookOpen },
      { label: "Timetable", href: "/student/timetable", icon: Clock },
      { label: "Attendance", href: "/student/attendance", icon: CalendarCheck },
      { label: "Exams", href: "/student/exams", icon: GraduationCap },
      { label: "Results", href: "/student/results", icon: FileText },
    ],
  },
  {
    section: "School",
    items: [
      { label: "Notices", href: "/student/notices", icon: Megaphone, badge: 2 },
      { label: "Settings", href: "/student/settings", icon: Settings },
    ],
  },
];
