import { LayoutDashboard, Users, CalendarCheck, DollarSign, Package, Settings, CalendarDays, ShieldAlert, Bell } from "lucide-react";
import type { NavSection } from "@/types";

export const staffNav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
      { label: "Notices", href: "/staff/notices", icon: Bell },
    ],
  },
  {
    section: "HR",
    items: [
      { label: "Staff Members", href: "/staff/members", icon: Users },
      { label: "Attendance", href: "/staff/attendance", icon: CalendarCheck },
      { label: "Payroll", href: "/staff/payroll", icon: DollarSign },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Inventory", href: "/staff/inventory", icon: Package },
      { label: "Settings", href: "/staff/settings", icon: Settings },
    ],
  },
];

// Extra nav sections injected for Schedule Manager designation
export const scheduleManagerNav: NavSection[] = [
  ...staffNav,
  {
    section: "Schedule Management",
    items: [
      { label: "Class Schedule", href: "/staff/schedule", icon: CalendarDays },
    ],
  },
];

// Extra nav sections injected for DI (Discipline In-charge) designation
export const diNav: NavSection[] = [
  ...staffNav,
  {
    section: "Discipline",
    items: [
      { label: "Discipline Records", href: "/staff/discipline", icon: ShieldAlert },
    ],
  },
];
