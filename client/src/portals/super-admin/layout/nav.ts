import {
  LayoutDashboard, School, Users, CreditCard, BarChart2,
  Megaphone, Settings, Activity, Globe, ShieldCheck
} from "lucide-react";
import type { NavSection } from "@/types";

export const superAdminNav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/super-admin/analytics", icon: BarChart2 },
      { label: "Activity", href: "/super-admin/activity", icon: Activity },
    ],
  },
  {
    section: "Management",
    items: [
      { label: "Schools", href: "/super-admin/schools", icon: School, badge: 24 },
      { label: "Users", href: "/super-admin/users", icon: Users },
    ],
  },
  {
    section: "Revenue",
    items: [
      { label: "Plans & Billing", href: "/super-admin/plans", icon: CreditCard },
      { label: "Subscriptions", href: "/super-admin/subscriptions", icon: Globe },
    ],
  },
  {
    section: "Platform",
    items: [
      { label: "Announcements", href: "/super-admin/announcements", icon: Megaphone, badge: 1, badgeVariant: "warning" },
      { label: "Permissions", href: "/super-admin/permissions", icon: ShieldCheck },
      { label: "Settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];
