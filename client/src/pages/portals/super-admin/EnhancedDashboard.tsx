import { useEffect, useState } from "react";
import { useSuperAdminDashboard, useDashboardStats } from "@/hooks/useSuperAdminDashboard";
import { Loader2, RotateCw, TrendingUp, Building2, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Animated stat card that shows changes in real-time
 */
const AnimatedStatCard = ({
  label,
  value,
  change,
  icon,
  color = "blue",
}: {
  label: string;
  value: number;
  change?: number;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange";
}) => {
  const [animatedValue, setAnimatedValue] = useState(value);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (change !== undefined && change !== 0) {
      setHasChanged(true);
      const timeout = setTimeout(() => setHasChanged(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [change]);

  useEffect(() => {
    // Animate number change
    if (animatedValue !== value) {
      const start = animatedValue;
      const end = value;
      const diff = end - start;
      const steps = 20;
      let current = 0;

      const interval = setInterval(() => {
        current++;
        const progress = current / steps;
        setAnimatedValue(Math.floor(start + diff * progress));

        if (current === steps) {
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }
  }, [value, animatedValue]);

  const bgColors = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
  };

  const textColors = {
    blue: "text-blue-900",
    green: "text-green-900",
    purple: "text-purple-900",
    orange: "text-orange-900",
  };

  const changeColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-6 transition-all duration-300",
        hasChanged
          ? `${bgColors[color]} border-${color}-300 shadow-lg`
          : "bg-white border-gray-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn("text-sm font-medium", hasChanged ? textColors[color] : "text-gray-600")}>
            {label}
          </p>
          <p className={cn("text-3xl font-bold mt-2 transition-all", hasChanged ? textColors[color] : "text-gray-900")}>
            {animatedValue.toLocaleString()}
          </p>
          {change !== undefined && (
            <p
              className={cn(
                "text-xs font-semibold mt-2 flex items-center gap-1 transition-all",
                change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : changeColors[color]
              )}
            >
              {change > 0 ? "+" : ""}{change}{" "}
              {change > 0 ? <TrendingUp className="w-3 h-3" /> : null}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("text-2xl", hasChanged ? textColors[color] : "text-gray-400")}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default function EnhancedSuperAdminDashboard() {
  const { data, isLoading, error, lastUpdated, refresh } = useSuperAdminDashboard({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  const { changes } = useDashboardStats(data ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md">
          <p className="text-red-600 font-medium">Error loading dashboard</p>
          <p className="text-gray-600 text-sm mt-2">{error}</p>
          <Button onClick={handleRefresh} className="mt-4 w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Platform overview and real-time statistics
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RotateCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatedStatCard
            label="Total Schools"
            value={data?.stats.totalSchools ?? 0}
            change={changes.totalSchools}
            icon={<Building2 className="w-6 h-6" />}
            color="blue"
          />
          <AnimatedStatCard
            label="Active Schools"
            value={data?.stats.activeSchools ?? 0}
            change={changes.activeSchools}
            icon="✅"
            color="green"
          />
          <AnimatedStatCard
            label="Trial Schools"
            value={data?.stats.trialSchools ?? 0}
            change={changes.trialSchools}
            icon="🔔"
            color="orange"
          />
          <AnimatedStatCard
            label="Total Users"
            value={data?.stats.totalUsers ?? 0}
            change={changes.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatedStatCard
            label="Suspended Schools"
            value={data?.stats.suspendedSchools ?? 0}
            icon="⛔"
            color="orange"
          />
          <AnimatedStatCard
            label="Paused Schools"
            value={data?.stats.pausedSchools ?? 0}
            icon="⏸️"
            color="orange"
          />
          <AnimatedStatCard
            label="Total Revenue"
            value={data?.stats.totalRevenuePaid ?? 0}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
          />
        </div>

        {/* Recent Schools */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Schools</h2>
          </div>

          {data?.recentSchools && data.recentSchools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Plan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSchools.map((school) => (
                    <tr key={school.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{school.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{school.district}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            school.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : school.status === "TRIAL"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          )}
                        >
                          {school.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {school.userCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {school.studentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{school.plan}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              No schools yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
