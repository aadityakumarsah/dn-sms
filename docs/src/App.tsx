import { useState } from "react";
import { Book, Code, Database, Settings, Map, Shield, Terminal, Search, Menu, X, ExternalLink } from "lucide-react";
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

const pages: Record<string, { component: () => JSX.Element; label: string; icon: typeof Book }> = {
  overview: { component: Overview, label: "Overview", icon: Book },
  architecture: { component: Architecture, label: "Architecture", icon: Map },
  setup: { component: Setup, label: "Setup Guide", icon: Terminal },
  "api-bun": { component: ApiBun, label: "API: Bun Backend", icon: Code },
  "api-fastapi": { component: ApiFastapi, label: "API: FastAPI", icon: Shield },
  "developer-guide": { component: DeveloperGuide, label: "Developer Guide", icon: Code },
  portals: { component: Portals, label: "Portal Guide", icon: Map },
  database: { component: DatabasePage, label: "Database Schema", icon: Database },
  deployment: { component: Deployment, label: "Deployment", icon: Settings },
  troubleshooting: { component: Troubleshooting, label: "Troubleshooting", icon: Search },
};

function getPage(): string {
  if (typeof window === "undefined") return "overview";
  const hash = window.location.hash.replace("#", "");
  return pages[hash] ? hash : "overview";
}

export function App() {
  const [currentPage, setCurrentPage] = useState(getPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (page: string) => {
    window.location.hash = page;
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const PageComponent = pages[currentPage].component;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 bg-card border-r transition-transform duration-200 ease-in-out overflow-y-auto`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">DN-SMS Docs</h1>
            <p className="text-xs text-muted-foreground">School Management System</p>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Getting Started</div>
          {(["overview", "architecture", "setup"] as const).map(key => {
            const p = pages[key];
            const Icon = p.icon;
            return (
              <button key={key} onClick={() => navigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Icon className="h-4 w-4" />
                {p.label}
              </button>
            );
          })}

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">API Reference</div>
          {(["api-bun", "api-fastapi"] as const).map(key => {
            const p = pages[key];
            const Icon = p.icon;
            return (
              <button key={key} onClick={() => navigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Icon className="h-4 w-4" />
                {p.label}
              </button>
            );
          })}

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guides</div>
          {(["developer-guide", "portals", "database"] as const).map(key => {
            const p = pages[key];
            const Icon = p.icon;
            return (
              <button key={key} onClick={() => navigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Icon className="h-4 w-4" />
                {p.label}
              </button>
            );
          })}

          <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operations</div>
          {(["deployment", "troubleshooting"] as const).map(key => {
            const p = pages[key];
            const Icon = p.icon;
            return (
              <button key={key} onClick={() => navigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Icon className="h-4 w-4" />
                {p.label}
              </button>
            );
          })}

          <div className="border-t my-4 pt-4 px-3 space-y-1">
            <a href="https://github.com/aadityakumarsah/dn-sms" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
              <ExternalLink className="h-4 w-4" />
              GitHub Repository
            </a>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-30 px-4 py-2 md:hidden flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">DN-SMS Docs</span>
        </div>

        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <PageComponent />
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
            <p>DN-SMS Documentation — Built with Bun + React</p>
            <p className="text-xs mt-1">Version 2.0.0 | Last updated July 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
