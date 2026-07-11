import { useState, useEffect, useCallback } from "react";
import {
  Book,
  Code,
  Map,
  Terminal,
  Shield,
  Settings,
  Search,
  GraduationCap,
  Hexagon,
  ChevronRight,
  Database,
  ExternalLink,
  Monitor,
  Menu,
  X,
  BookOpen,
  Braces,
  Users,
  Wrench,
  Bug,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import "./index.css";

import { Overview } from "./pages/overview";
import { Architecture } from "./pages/architecture";
import { Setup } from "./pages/setup";
import { ApiBun } from "./pages/api-bun";
import { ApiFastapi } from "./pages/api-fastapi";
import { DeveloperGuide } from "./pages/developer-guide";
import { Portals } from "./pages/portals";
import { Database as DatabasePage } from "./pages/database";
import { Deployment } from "./pages/deployment";
import { Troubleshooting } from "./pages/troubleshooting";
import { TeacherGuide } from "./pages/teacher-guide";
import { AdminGuide } from "./pages/admin-guide";

interface PageInfo {
  component: () => JSX.Element;
  label: string;
  icon: typeof Book;
}

const pages: Record<string, PageInfo> = {
  overview: { component: Overview, label: "Welcome to DN-SMS", icon: Book },
  architecture: { component: Architecture, label: "Architecture", icon: Map },
  setup: { component: Setup, label: "Setup Guide", icon: Terminal },
  "api-bun": { component: ApiBun, label: "Bun Backend (API)", icon: Braces },
  "api-fastapi": { component: ApiFastapi, label: "FastAPI (Auth & RBAC)", icon: Shield },
  "developer-guide": { component: DeveloperGuide, label: "Developer Guide", icon: Code },
  portals: { component: Portals, label: "Portal Guide", icon: Users },
  database: { component: DatabasePage, label: "Database Schema", icon: Database },
  "teacher-guide": { component: TeacherGuide, label: "Teacher Guide", icon: GraduationCap },
  "admin-guide": { component: AdminGuide, label: "Admin Guide", icon: Settings },
  deployment: { component: Deployment, label: "Deployment", icon: Wrench },
  troubleshooting: { component: Troubleshooting, label: "Troubleshooting", icon: Bug },
};

type SectionId = "getting-started" | "api-reference" | "guides" | "operations";

interface SidebarSection {
  id: SectionId;
  label: string;
  icon: typeof ChevronRight;
  items: string[];
}

const sidebarSections: SidebarSection[] = [
  {
    id: "getting-started",
    label: "Get Started",
    icon: ChevronRight,
    items: ["overview", "architecture", "setup"],
  },
  {
    id: "api-reference",
    label: "API Reference",
    icon: Braces,
    items: ["api-bun", "api-fastapi"],
  },
  {
    id: "guides",
    label: "Guides",
    icon: BookOpen,
    items: ["developer-guide", "portals", "database", "teacher-guide", "admin-guide"],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Wrench,
    items: ["deployment", "troubleshooting"],
  },
];

function getPage(): string {
  if (typeof window === "undefined") return "overview";
  const hash = window.location.hash.replace("#", "");
  return pages[hash] ? hash : "overview";
}

export function App() {
  const [currentPage, setCurrentPage] = useState(getPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "getting-started": true,
    "api-reference": true,
    guides: true,
    operations: true,
  });

  const navigate = useCallback((page: string) => {
    window.location.hash = page;
    setCurrentPage(page);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const onHashChange = () => setCurrentPage(getPage());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const toggleSection = (id: SectionId) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const PageComponent = pages[currentPage]?.component || pages.overview.component;

  return (
    <div className="flex flex-col h-screen">
      {/* ── Top Navigation Bar ── */}
      <header className="h-14 border-b border-[#27272a] bg-[#0a0a0b] flex items-center px-4 shrink-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-6">
          <Hexagon className="h-5 w-5 text-[#c9455e]" strokeWidth={2.5} />
          <span className="font-bold text-sm text-[#fafafa] tracking-tight">DN-SMS</span>
        </div>

        {/* Main Tabs */}
        <nav className="hidden md:flex items-center gap-1 mr-6">
          {(["Docs", "API", "Guides"] as const).map((tab) => (
            <button
              key={tab}
              className={`nav-tab ${tab === "Docs" ? "active underline underline-offset-8 decoration-2 decoration-[#c9455e]" : ""}`}
            >
              {tab === "Docs" && <BookOpen className="h-3.5 w-3.5" />}
              {tab === "API" && <Braces className="h-3.5 w-3.5" />}
              {tab === "Guides" && <Book className="h-3.5 w-3.5" />}
              {tab}
            </button>
          ))}
        </nav>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-[#52525b]">
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1">Search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#27272a] text-[10px] font-medium text-[#71717a]">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Links */}
        <div className="hidden md:flex items-center gap-1 ml-auto mr-3">
          <a href="https://github.com/aadityakumarsah/dn-sms" target="_blank" rel="noopener noreferrer" className="nav-tab">
            <Braces className="h-3.5 w-3.5" />
            Source
          </a>
        </div>

        {/* Theme Toggle Placeholder */}
        <button className="nav-tab p-2">
          <Monitor className="h-4 w-4" />
        </button>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden ml-2 p-2 text-[#a1a1aa]" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Body: Sidebar + Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            fixed md:static inset-y-0 left-0 z-50 w-64
            bg-[#0a0a0b] border-r border-[#27272a]
            transition-transform duration-200 ease-in-out
            flex flex-col pt-2
          `}
          style={{ top: "3.5rem" }}
        >
          {/* Mobile close */}
          <div className="md:hidden flex justify-end px-3 pb-2">
            <button onClick={() => setSidebarOpen(false)} className="text-[#a1a1aa] p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-4">
            {sidebarSections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-2 px-1 py-1.5 w-full text-left"
                >
                  <section.icon
                    className={`h-3.5 w-3.5 text-[#52525b] transition-transform ${
                      expandedSections[section.id] ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-xs font-semibold text-[#52525b] uppercase tracking-widest">
                    {section.label}
                  </span>
                </button>

                {expandedSections[section.id] && (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((key) => {
                      const p = pages[key];
                      if (!p) return null;
                      const Icon = p.icon;
                      const isActive = currentPage === key;
                      return (
                        <button
                          key={key}
                          onClick={() => navigate(key)}
                          className={`sidebar-item ${isActive ? "active" : ""}`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* External link */}
            <div className="border-t border-[#27272a] pt-3">
              <a
                href="https://github.com/aadityakumarsah/dn-sms"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-item"
              >
                <ExternalLink className="h-4 w-4" />
                GitHub Repository
              </a>
            </div>
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0b]">
          <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
            <div className="Prose">
              <PageComponent />
            </div>

            <footer className="mt-16 pt-8 border-t border-[#27272a] text-center">
              <p className="text-xs text-[#52525b]">
                DN-SMS Documentation — Built with React &middot; Version 2.0.0
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
