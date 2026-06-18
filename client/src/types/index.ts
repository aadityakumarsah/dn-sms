export type UserRole =
  | "super_admin"
  | "admin"
  | "teacher"
  | "staff"
  | "parent"
  | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  schoolId?: string; // null for super_admin
  schoolName?: string;
  features?: string[]; // plan feature keys enabled for this school
  planSlug?: string | null; // e.g. free | basic | pro | enterprise
  planName?: string | null; // human label of the school's plan
  schoolStatus?: string; // ACTIVE | TRIAL | SUSPENDED | PAUSED | INACTIVE
}

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  plan: "free" | "basic" | "pro" | "enterprise";
  isActive: boolean;
  createdAt: string;
  studentsCount: number;
  teachersCount: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: "default" | "danger" | "warning";
  children?: Omit<NavItem, "children">[];
  feature?: string; // plan feature key gating this item (undefined = always visible)
  locked?: boolean; // computed at render: feature not in the school's plan
  lockLabel?: string; // computed at render: upgrade hint shown on locked items
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface PortalConfig {
  role: UserRole;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  icon: string;
}
