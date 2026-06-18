import { useState } from "react";
import { Users, Search, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useList } from "./_ui";
import EditDrawer from "./_EditDrawer";

const ROLE_COLORS: Record<string, string> = {
  TEACHER: "bg-blue-50 text-blue-700",
  STAFF: "bg-purple-50 text-purple-700",
  STUDENT: "bg-green-50 text-green-700",
  PARENT: "bg-amber-50 text-amber-700",
};

const ROLES = ["", "TEACHER", "STAFF", "STUDENT", "PARENT"];

export default function UserManagement() {
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const { data, loading, reload } = useList<any[]>(
    () => api.admin.schoolUsers({ role: roleFilter, search }),
    [roleFilter, search]
  );
  const [editId, setEditId] = useState<string | null>(null);

  const list = data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and edit all staff, teachers, parents and students</p>
        </div>
        <button onClick={reload} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ROLES.map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={cn("text-sm px-3 py-1.5 rounded-lg border transition-colors",
                roleFilter === r ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")}>
              {r || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name / Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setEditId(u.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.name || "—"}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600")}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600")}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editId && (
        <EditDrawer
          userId={editId}
          onClose={() => setEditId(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
