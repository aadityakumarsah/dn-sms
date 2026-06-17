import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, ChevronDown, Bell, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PORTAL_CONFIGS, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NavItem, NavSection } from "@/types";
import { api } from "@/lib/api";

interface PortalLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[] | NavSection[];
}

function isNavSections(items: NavItem[] | NavSection[]): items is NavSection[] {
  return items.length > 0 && "section" in items[0];
}

const BADGE_COLORS: Record<string, string> = {
  default: "bg-purple-100 text-purple-700",
  danger: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-700",
};

// Super admin gets a dark sidebar; others get white
const DARK_SIDEBAR_ROLES = ["super_admin"];

export function PortalLayout({ children, navItems }: PortalLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  if (!user) return null;
  const config = PORTAL_CONFIGS[user.role];
  const isDark = DARK_SIDEBAR_ROLES.includes(user.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleExpand = (label: string) =>
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/super-admin" && href !== "/admin" && location.pathname.startsWith(href + "/"));

  const [schoolsCount, setSchoolsCount] = useState<number | undefined>(undefined);
  const [announcementsCount, setAnnouncementsCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (user?.role === "super_admin") {
      api.superAdmin.schools({ limit: 1 })
        .then((res) => setSchoolsCount(res.total))
        .catch(console.error);

      api.superAdmin.announcements()
        .then((res) => setAnnouncementsCount(res.length))
        .catch(console.error);
    }
  }, [user?.role]);

  const sections: NavSection[] = isNavSections(navItems)
    ? navItems
    : [{ section: "", items: navItems as NavItem[] }];

  const dynamicSections = sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.label === "Schools" && schoolsCount !== undefined) {
        return { ...item, badge: schoolsCount };
      }
      if (item.label === "Announcements" && announcementsCount !== undefined) {
        return { ...item, badge: announcementsCount };
      }
      return item;
    }),
  }));

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const expanded = expandedItems.includes(item.label);
    const badgeVariant = item.badgeVariant ?? "default";

    if (item.children?.length) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5",
              isDark
                ? active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/8"
                : active ? cn("text-white", config.bgColor) : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
          {expanded && (
            <div className="ml-7 pl-3 border-l border-white/10 mb-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.href}
                    to={child.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-0.5",
                      isDark
                        ? isActive(child.href) ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
                        : isActive(child.href) ? cn("text-white", config.bgColor) : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5",
          isDark
            ? active
              ? "bg-white/12 text-white shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/8"
            : active
              ? cn("text-white shadow-sm", config.bgColor)
              : "text-gray-600 hover:bg-gray-100"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full font-medium",
            active
              ? "bg-white/20 text-white"
              : BADGE_COLORS[badgeVariant] ?? BADGE_COLORS.default
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const sidebarBg = isDark ? "bg-gray-950" : "bg-white";
  const borderColor = isDark ? "border-white/8" : "border-gray-200";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-60 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 border-r",
        sidebarBg, borderColor,
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 h-14 border-b shrink-0", borderColor)}>
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
            isDark ? "bg-purple-500 text-white" : cn("text-white", config.bgColor)
          )}>
            {APP_NAME[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{APP_NAME}</p>
            <p className={cn("text-xs truncate", isDark ? "text-purple-400" : config.textColor)}>{config.label} Portal</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className={cn("w-4 h-4", isDark ? "text-white/50" : "text-gray-500")} />
          </button>
        </div>

        {/* School name badge (non super-admin) */}
        {user.schoolName && (
          <div className={cn("px-4 py-2 border-b", borderColor, isDark ? "bg-white/4" : "bg-gray-50")}>
            <p className={cn("text-xs truncate", isDark ? "text-white/40" : "text-gray-400")}>{user.schoolName}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {dynamicSections.map((sec) => (
            <div key={sec.section}>
              {sec.section && (
                <p className={cn("text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5", isDark ? "text-white/25" : "text-gray-400")}>
                  {sec.section}
                </p>
              )}
              <div>{sec.items.map(renderNavItem)}</div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className={cn("border-t p-2 shrink-0", borderColor)}>
          <div className={cn("flex items-center gap-2.5 px-2 py-2 rounded-lg", isDark ? "hover:bg-white/6" : "hover:bg-gray-50")}>
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
              isDark ? "bg-purple-600" : config.bgColor
            )}>
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-semibold truncate", isDark ? "text-white" : "text-gray-900")}>{user.name}</p>
              <p className={cn("text-xs truncate", isDark ? "text-white/40" : "text-gray-400")}>{user.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className={cn("transition-colors shrink-0", isDark ? "text-white/30 hover:text-red-400" : "text-gray-400 hover:text-red-500")}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-5 h-14 flex items-center gap-4 shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-56"
            />
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold", isDark ? "bg-purple-600" : config.bgColor)}>
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-none">{user.name.split(" ")[0]}</p>
              <p className={cn("text-xs leading-none mt-0.5", isDark ? "text-purple-600" : config.textColor)}>{config.label}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
