import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Loader2,
  Trash2,
  RotateCw,
  Plus,
  Search,
  Edit2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface School {
  id: string;
  name: string;
  slug: string;
  district: string;
  status: string;
  userCount: number;
  studentCount: number;
  createdAt: string;
}

export default function SchoolsManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{
    schoolId: string;
    schoolName: string;
    userCount: number;
    studentCount: number;
  } | null>(null);

  // Fetch schools
  const loadSchools = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.superAdmin.schools({
        page,
        search: searchTerm,
        status: statusFilter || undefined,
        limit: 10,
      });

      setSchools(
        response.schools.map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          district: s.district,
          status: s.status,
          userCount: s.userCount,
          studentCount: s.studentCount,
          createdAt: s.createdAt,
        }))
      );
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load schools:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  // Load schools on mount and when filters change
  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const handleDeleteSchool = async () => {
    if (!deleteDialog) return;

    try {
      setIsDeleting(deleteDialog.schoolId);

      await api.superAdmin.deleteSchool(deleteDialog.schoolId);

      // Remove from UI immediately
      setSchools((prevSchools) =>
        prevSchools.filter((s) => s.id !== deleteDialog.schoolId)
      );

      setDeleteDialog(null);
    } catch (error) {
      console.error("Failed to delete school:", error);
      alert("Failed to delete school. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredSchools = schools;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schools Management</h1>
            <p className="text-gray-600 mt-2">View and manage all schools in the system</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSchools()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New School
            </Button>
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">All Schools</h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or district..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  prefix={<Search className="w-4 h-4" />}
                  className="w-full"
                />
              </div>
              <select
                value={statusFilter || ""}
                onChange={(e) => {
                  setStatusFilter(e.target.value || null);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Schools Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        School Name
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchools.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                              <p className="text-xs text-gray-500">{school.slug}</p>
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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDeleteDialog({
                                    schoolId: school.id,
                                    schoolName: school.name,
                                    userCount: school.userCount,
                                    studentCount: school.studentCount,
                                  })
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete School?</h3>
              <p className="text-gray-600 mb-4">
                You are about to permanently delete <strong>{deleteDialog.schoolName}</strong>.
              </p>

              {/* Deletion Details */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm">
                <p className="font-medium text-red-900 mb-3">
                  ⚠️ The following data will be permanently deleted:
                </p>
                <ul className="text-red-800 space-y-1">
                  <li>
                    • <strong>{deleteDialog.userCount} users</strong> (admin, teachers, staff, parents)
                  </li>
                  <li>
                    • <strong>{deleteDialog.studentCount} students</strong> and all their records
                  </li>
                  <li>• All academic data (exams, results, assignments, attendance)</li>
                  <li>• All financial records (fees, payments, billing)</li>
                  <li>• All library, inventory, and other school data</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 mb-6 font-medium">
                🔒 This action cannot be undone and will be logged in the audit trail.
              </p>

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
