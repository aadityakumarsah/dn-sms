import type { PortalConfig, UserRole } from "@/types";

export const APP_NAME = "DN-SMS";
export const APP_FULL_NAME = "DN School Management System";
export const APP_TAGLINE = "Empowering Nepal's Schools with Modern Technology";

export const PORTAL_CONFIGS: Record<UserRole, PortalConfig> = {
  super_admin: {
    role: "super_admin",
    label: "Super Admin",
    color: "purple",
    bgColor: "bg-purple-600",
    textColor: "text-purple-600",
    description: "Manage all schools, plans, and platform settings",
    icon: "🏛️",
  },
  admin: {
    role: "admin",
    label: "Admin",
    color: "blue",
    bgColor: "bg-blue-600",
    textColor: "text-blue-600",
    description: "Manage your school — students, teachers, classes & more",
    icon: "🏫",
  },
  teacher: {
    role: "teacher",
    label: "Teacher",
    color: "green",
    bgColor: "bg-green-600",
    textColor: "text-green-600",
    description: "Manage classes, attendance, grades and assignments",
    icon: "👩‍🏫",
  },
  staff: {
    role: "staff",
    label: "Staff",
    color: "orange",
    bgColor: "bg-orange-500",
    textColor: "text-orange-500",
    description: "Handle administrative and non-teaching responsibilities",
    icon: "🧑‍💼",
  },
  parent: {
    role: "parent",
    label: "Parent",
    color: "teal",
    bgColor: "bg-teal-600",
    textColor: "text-teal-600",
    description: "Track your child's progress, attendance and fees",
    icon: "👨‍👩‍👧",
  },
  student: {
    role: "student",
    label: "Student",
    color: "sky",
    bgColor: "bg-sky-500",
    textColor: "text-sky-500",
    description: "View your classes, results, notices and schedule",
    icon: "🎒",
  },
};

export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/super-admin",
  admin: "/admin",
  teacher: "/teacher",
  staff: "/staff",
  parent: "/parent",
  student: "/student",
};
