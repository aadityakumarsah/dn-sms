import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface DashboardData {
  stats: {
    totalSchools: number;
    activeSchools: number;
    trialSchools: number;
    suspendedSchools: number;
    pausedSchools: number;
    totalRevenuePaid: number;
    totalUsers: number;
  };
  recentSchools: Array<{
    id: string;
    name: string;
    district: string;
    status: string;
    plan: string;
    userCount: number;
    studentCount: number;
    createdAt: string;
  }>;
}

interface UseSuperAdminDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

/**
 * Hook for managing super admin dashboard data with auto-refresh
 * Handles real-time stats updates when schools are added/deleted
 */
export function useSuperAdminDashboard(
  options: UseSuperAdminDashboardOptions = {}
) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dashboard = await api.superAdmin.dashboard();
      setData(dashboard);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboard();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadDashboard]);

  // Optimistic update when school is deleted
  const onSchoolDeleted = useCallback((schoolId: string, deletedCounts?: any) => {
    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalSchools: Math.max(0, prev.stats.totalSchools - 1),
          totalUsers: Math.max(
            0,
            prev.stats.totalUsers - (deletedCounts?.users || 0)
          ),
        },
        recentSchools: prev.recentSchools.filter((s) => s.id !== schoolId),
      };
    });
    setLastUpdated(new Date());
  }, []);

  // Optimistic update when school is added
  const onSchoolAdded = useCallback((newSchool: any) => {
    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalSchools: prev.stats.totalSchools + 1,
          trialSchools: prev.stats.trialSchools + (newSchool.status === "TRIAL" ? 1 : 0),
          activeSchools: prev.stats.activeSchools + (newSchool.status === "ACTIVE" ? 1 : 0),
        },
        recentSchools: [newSchool, ...prev.recentSchools.slice(0, 7)],
      };
    });
    setLastUpdated(new Date());
  }, []);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh: loadDashboard,
    onSchoolDeleted,
    onSchoolAdded,
  };
}

/**
 * Hook for tracking real-time stat changes
 * Useful for animations and UI updates when numbers change
 */
export function useDashboardStats(dashboardData: DashboardData | null) {
  const [prevStats, setPrevStats] = useState(dashboardData?.stats ?? null);
  const [changes, setChanges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!dashboardData?.stats || !prevStats) {
      setPrevStats(dashboardData?.stats ?? null);
      return;
    }

    const newChanges: Record<string, number> = {};

    Object.entries(dashboardData.stats).forEach(([key, newValue]) => {
      const oldValue = (prevStats as any)[key] ?? 0;
      if (newValue !== oldValue) {
        newChanges[key] = (newValue as number) - (oldValue as number);
      }
    });

    if (Object.keys(newChanges).length > 0) {
      setChanges(newChanges);
      setPrevStats(dashboardData.stats);

      // Clear changes after animation
      const timeout = setTimeout(() => {
        setChanges({});
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [dashboardData?.stats, prevStats]);

  return { changes, prevStats };
}
