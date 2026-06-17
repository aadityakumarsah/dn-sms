import {
  LayoutDashboard, GraduationCap, Users, BookOpen, CalendarCheck,
  DollarSign, ClipboardList, Megaphone, FileText, Building2, Settings,
  Library, UserPlus, BookMarked, Calendar, Wrench, GraduationCapIcon,
  ArrowUpCircle, UserCheck, LayoutGrid, Bus
} from "lucide-react";
import type { NavSection } from "@/types";

export const adminNav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Calendar", href: "/admin/calendar", icon: Calendar },
    ],
  },
  {
    section: "Admissions",
    items: [
      { label: "Applications", href: "/admin/admissions", icon: UserPlus },
      { label: "Academic Promotion", href: "/admin/academic", icon: ArrowUpCircle },
    ],
  },
  {
    section: "People",
    items: [
      { label: "Students", href: "/admin/students", icon: GraduationCap },
      { label: "Teachers", href: "/admin/teachers", icon: UserCheck },
      { label: "Staff", href: "/admin/staff-mgmt", icon: Users },
    ],
  },
  {
    section: "Academics",
    items: [
      { label: "Classes & Sections", href: "/admin/classes", icon: BookOpen },
      { label: "Section Management", href: "/admin/sections", icon: LayoutGrid },
      { label: "Departments", href: "/admin/departments", icon: Building2 },
      { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
      { label: "Examinations", href: "/admin/exams", icon: ClipboardList },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Transport", href: "/admin/transport", icon: Bus },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "Fee Management", href: "/admin/fees", icon: DollarSign },
    ],
  },
  {
    section: "Library",
    items: [
      { label: "Book Catalog", href: "/admin/library", icon: Library },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Notices", href: "/admin/notices", icon: Megaphone },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Reports", href: "/admin/reports", icon: FileText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
