import { LayoutDashboard, CalendarCheck, FileText, DollarSign, Megaphone, MessageSquare, Settings, CalendarRange } from "lucide-react";
import type { NavSection } from "@/types";

export const parentNav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    ],
  },
  {
    section: "Child's Progress",
    items: [
      { label: "Class Routine", href: "/parent/routine", icon: CalendarRange },
      { label: "Attendance", href: "/parent/attendance", icon: CalendarCheck },
      { label: "Results", href: "/parent/results", icon: FileText },
    ],
  },
  {
    section: "School",
    items: [
      { label: "Fee Payment", href: "/parent/fees", icon: DollarSign },
      { label: "Notices", href: "/parent/notices", icon: Megaphone, badge: 2 },
      { label: "Messages", href: "/parent/messages", icon: MessageSquare },
      { label: "Settings", href: "/parent/settings", icon: Settings },
    ],
  },
];
