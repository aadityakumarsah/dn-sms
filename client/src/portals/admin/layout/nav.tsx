import {
  LayoutDashboard, GraduationCap, Users, BookOpen, CalendarCheck,
  DollarSign, ClipboardList, Megaphone, FileText, Building2, Settings,
  Library, UserPlus, Calendar, UserCheck, LayoutGrid, Bus,
  ArrowUpCircle, Bell, CalendarRange, BookMarked, MessageCircle, Boxes,
  Wallet, CalendarOff, ClipboardCheck, Award, FolderOpen, UtensilsCrossed,
  LifeBuoy, HeartPulse, Trophy, ShieldCheck
} from "lucide-react";
import type { NavSection } from "@/types";

export const adminNav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Calendar", href: "/admin/calendar", icon: Calendar, feature: "calendar_routine" },
      { label: "Notifications", href: "/admin/notifications", icon: Bell, feature: "notifications" },
    ],
  },
  {
    section: "Admissions",
    items: [
      { label: "Applications", href: "/admin/admissions", icon: UserPlus, feature: "student_staff_mgmt" },
      { label: "Academic Promotion", href: "/admin/academic", icon: ArrowUpCircle, feature: "student_staff_mgmt" },
    ],
  },
  {
    section: "People",
    items: [
      { label: "Students", href: "/admin/students", icon: GraduationCap, feature: "student_staff_mgmt" },
      { label: "Teachers", href: "/admin/teachers", icon: UserCheck, feature: "student_staff_mgmt" },
      { label: "Staff", href: "/admin/staff-mgmt", icon: Users, feature: "student_staff_mgmt" },
    ],
  },
  {
    section: "Academics",
    items: [
      { label: "Classes & Sections", href: "/admin/classes", icon: BookOpen, feature: "student_staff_mgmt" },
      { label: "Section Management", href: "/admin/sections", icon: LayoutGrid, feature: "student_staff_mgmt" },
      { label: "Departments", href: "/admin/departments", icon: Building2, feature: "student_staff_mgmt" },
      { label: "Class Routine", href: "/admin/routine", icon: CalendarRange, feature: "calendar_routine" },
      { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck, feature: "attendance_leave" },
      { label: "Leave Notes", href: "/admin/leaves", icon: CalendarOff, feature: "attendance_leave" },
      { label: "Homework", href: "/admin/homework", icon: BookMarked, feature: "homework_mgmt" },
      { label: "Examinations", href: "/admin/exams", icon: ClipboardList, feature: "exams_ledger" },
    ],
  },
  {
    section: "Evaluation",
    items: [
      { label: "Teacher Evaluation", href: "/admin/teacher-evaluation", icon: ClipboardCheck, feature: "teacher_evaluation" },
      { label: "Student CAS & Record", href: "/admin/assessments", icon: Award, feature: "student_evaluation" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Transport", href: "/admin/transport", icon: Bus, feature: "student_staff_mgmt" },
      { label: "Inventory", href: "/admin/inventory", icon: Boxes, feature: "inventory_payroll" },
      { label: "Payroll", href: "/admin/payroll", icon: Wallet, feature: "inventory_payroll" },
      { label: "Surveys", href: "/admin/surveys", icon: ClipboardList, feature: "inventory_payroll" },
      { label: "Lunch & Canteen", href: "/admin/canteen", icon: UtensilsCrossed, feature: "lunch_canteen" },
      { label: "Infirmary", href: "/admin/infirmary", icon: HeartPulse, feature: "infirmary_sca" },
      { label: "Activities (ECA)", href: "/admin/eca", icon: Trophy, feature: "infirmary_sca" },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "Fee Management", href: "/admin/fees", icon: DollarSign, feature: "billing_finance" },
      { label: "Fee Structures", href: "/admin/fee-structures", icon: Wallet, feature: "billing_finance" },
    ],
  },
  {
    section: "Resources",
    items: [
      { label: "Book Catalog", href: "/admin/library", icon: Library, feature: "library_mgmt" },
      { label: "Documents", href: "/admin/documents", icon: FolderOpen, feature: "document_mgmt" },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Notices", href: "/admin/notices", icon: Megaphone, feature: "notifications" },
      { label: "Chat", href: "/admin/chat", icon: MessageCircle, feature: "chat_system" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "User Management", href: "/admin/user-management", icon: ShieldCheck },
      { label: "Support", href: "/admin/support", icon: LifeBuoy, feature: "dedicated_support" },
      { label: "Reports", href: "/admin/reports", icon: FileText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
