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
      { label: "Calendar", href: "/admin/calendar", icon: Calendar, feature: "calendar_routine" },
    ],
  },
  {
    section: "Admissions",
    items: [
      { label: "Applications", href: "/admin/admissions", icon: UserPlus, feature: "admissions" },
      { label: "Academic Promotion", href: "/admin/academic", icon: ArrowUpCircle, feature: "academic_promotion" },
    ],
  },
  {
    section: "People",
    items: [
      { label: "Students", href: "/admin/students", icon: GraduationCap, feature: "students" },
      { label: "Teachers", href: "/admin/teachers", icon: UserCheck, feature: "teachers" },
      { label: "Staff", href: "/admin/staff-mgmt", icon: Users, feature: "staff_mgmt" },
    ],
  },
  {
    section: "Academics",
    items: [
      { label: "Classes & Sections", href: "/admin/classes", icon: BookOpen, feature: "classes_sections" },
      { label: "Section Management", href: "/admin/sections", icon: LayoutGrid, feature: "section_mgmt" },
      { label: "Subjects", href: "/admin/subjects", icon: BookOpen, feature: "classes_sections" },
      { label: "Subject Management", href: "/admin/subject-management", icon: BookMarked, feature: "classes_sections" },
      { label: "Departments", href: "/admin/departments", icon: Building2, feature: "departments" },
      { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck, feature: "attendance_leave" },
      { label: "Examinations", href: "/admin/exams", icon: ClipboardList, feature: "exams_ledger" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Transport", href: "/admin/transport", icon: Bus, feature: "transport" },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "Fee Management", href: "/admin/fees", icon: DollarSign, feature: "billing_finance" },
    ],
  },
  {
    section: "Library",
    items: [
      { label: "Book Catalog", href: "/admin/library", icon: Library, feature: "library_mgmt" },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Notices", href: "/admin/notices", icon: Megaphone, feature: "notifications" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Reports", href: "/admin/reports", icon: FileText, feature: "reports" },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
