import { LayoutDashboard, Users, CalendarCheck, DollarSign, Package, Settings } from "lucide-react";
import type { NavSection } from "@/types";

export const staffNav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
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
