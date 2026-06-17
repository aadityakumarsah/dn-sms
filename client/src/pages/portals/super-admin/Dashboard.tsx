import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Loader2, Trash2, RotateCw, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface School {
  id: string;
  name: string;
  district: string;
  status: string;
  plan: string;
  userCount: number;
  studentCount: number;
  createdAt: string;
}

interface DashboardStats {
  totalSchools: number;
  activeSchools: number;
  trialSchools: number;
  totalUsers: number;
}

const StatCard = ({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: number;
  change?: number;
  icon?: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {change !== undefined && (
          <p className={cn("text-xs font-medium mt-2", change >= 0 ? "text-green-600" : "text-red-600")}>
            {change >= 0 ? "+" : ""}{change} this month
          </p>
        )}
      </div>
      {icon && <div className="text-2xl">{icon}</div>}
    </div>
  </div>
);

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    activeSchools: 0,
    trialSchools: 0,
    totalUsers: 0,
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ schoolId: string; schoolName: string } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const dashboard = await api.superAdmin.dashboard();

      // Update stats with counts from recent schools
      setStats({
        totalSchools: dashboard.stats.totalSchools,
        activeSchools: dashboard.stats.activeSchools,
        trialSchools: dashboard.stats.trialSchools,
        totalUsers: dashboard.stats.totalUsers,
      });

      // Transform school data
      const transformedSchools = dashboard.recentSchools.map((s: any) => ({
        id: s.id,
        name: s.name,
        district: s.district,
        status: s.status,
        plan: s.plan,
        userCount: s.userCount,
        studentCount: s.studentCount,
        createdAt: s.createdAt,
      }));

      setSchools(transformedSchools);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboard]);

  const handleDeleteSchool = async () => {
    if (!deleteDialog) return;

    try {
      setIsDeleting(deleteDialog.schoolId);

      const response = await api.superAdmin.deleteSchool(deleteDialog.schoolId);

      // Remove from UI immediately (optimistic update)
      setSchools((prevSchools) =>
        prevSchools.filter((s) => s.id !== deleteDialog.schoolId)
      );

      // Update stats - decrement counts based on deletion response
      if (response.deletedCounts) {
        setStats((prev) => ({
          ...prev,
          totalSchools: Math.max(0, prev.totalSchools - 1),
          activeSchools: Math.max(0, prev.activeSchools - (deleteDialog.schoolId ? 1 : 0)),
          trialSchools: Math.max(0, prev.trialSchools - 1),
          totalUsers: Math.max(0, prev.totalUsers - (response.deletedCounts.users || 0)),
        }));
      }

      setDeleteDialog(null);

      // Refresh to ensure consistency
      setTimeout(() => {
        loadDashboard();
      }, 1000);
    } catch (error) {
      console.error("Failed to delete school:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || school.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage all schools and monitor platform statistics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboard()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs"
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Schools" value={stats.totalSchools} icon="🏫" />
          <StatCard label="Active Schools" value={stats.activeSchools} icon="✅" />
          <StatCard label="Trial Schools" value={stats.trialSchools} icon="🔔" />
          <StatCard label="Total Users" value={stats.totalUsers} icon="👥" />
        </div>

        {/* Schools Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Schools</h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<Search className="w-4 h-4" />}
                  className="w-full"
                />
              </div>
              <select
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PAUSED">Paused</option>
              </select>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New School
              </Button>
            </div>
          </div>

          {/* Schools Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No schools found
                    </td>
                  </tr>
                ) : (
                  filteredSchools.map((school) => (
                    <tr
                      key={school.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{school.name}</p>
                          <p className="text-xs text-gray-500">{school.id.substring(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{school.district}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            school.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : school.status === "TRIAL"
                                ? "bg-blue-100 text-blue-800"
                                : school.status === "SUSPENDED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          )}
                        >
                          {school.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{school.userCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{school.studentCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{school.plan}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ schoolId: school.id, schoolName: school.name })
                            }
                            disabled={isDeleting === school.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isDeleting === school.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete School?</h3>
              <p className="text-gray-600 mb-4">
                This will permanently delete <strong>{deleteDialog.schoolName}</strong> and all associated data:
              </p>
              <ul className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-800 space-y-1">
                <li>• All users (admin, teachers, staff, parents)</li>
                <li>• All students and their records</li>
                <li>• All academic data (exams, results, assignments)</li>
                <li>• All financial records</li>
                <li>• All other school data</li>
              </ul>
              <p className="text-xs text-gray-500 mb-6">⚠️ This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteDialog(null)}
                  disabled={isDeleting !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteSchool}
                  disabled={isDeleting !== null}
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
