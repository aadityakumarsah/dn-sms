import { useState, useEffect } from "react";
import { Search, RefreshCw, Mail, Shield, ShieldOff, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  ADMIN: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  TEACHER: "bg-green-50 text-green-700 ring-1 ring-green-100",
  STAFF: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
  PARENT: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",
  STUDENT: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  SUSPENDED: "bg-rose-50 text-rose-600",
};

const ROLES = ["All", "ADMIN", "TEACHER", "STAFF", "PARENT", "STUDENT"];

export default function Users() {
  const [data, setData] = useState<any>({ users: [], total: 0, roleCounts: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [searchDebounce, setSearchDebounce] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounce, roleFilter]);

  useEffect(() => {
    setLoading(true);
    api.superAdmin.users({
      page,
      search: searchDebounce || undefined,
      role: roleFilter !== "All" ? roleFilter : undefined,
    }).then(setData).finally(() => setLoading(false));
  }, [page, searchDebounce, roleFilter]);

  const totalPages = Math.ceil((data.total ?? 0) / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.total ?? 0} total users across all schools</p>
        </div>
        <button onClick={() => { setLoading(true); api.superAdmin.users({ page, search: searchDebounce || undefined, role: roleFilter !== "All" ? roleFilter : undefined }).then(setData).finally(() => setLoading(false)); }}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Role filter chips */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ROLES.slice(1).map((r) => {
          const count = data.roleCounts?.[r] ?? 0;
          return (
            <button key={r} onClick={() => setRoleFilter(roleFilter === r ? "All" : r)}
              className={cn("bg-white rounded-xl border px-3 py-3 text-center transition-all hover:border-purple-300",
                roleFilter === r ? "border-purple-400 ring-2 ring-purple-100" : "border-gray-100")}>
              <p className={cn("text-lg font-bold", roleFilter === r ? "text-purple-600" : "text-gray-800")}>{count}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{r.charAt(0) + r.slice(1).toLowerCase()}s</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or school..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          {roleFilter !== "All" && (
            <button onClick={() => setRoleFilter("All")}
              className="text-xs text-purple-600 border border-purple-200 bg-purple-50 px-3 rounded-xl hover:bg-purple-100">
              {roleFilter} ×
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">School</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden xl:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="px-5 py-3"><div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                      <div className="space-y-1.5"><div className="h-3 bg-gray-100 rounded w-24 animate-pulse" /><div className="h-2.5 bg-gray-100 rounded w-32 animate-pulse" /></div>
                    </div></td>
                    {[...Array(4)].map((_, j) => <td key={j} className="px-5 py-3"><div className="h-3 bg-gray-100 rounded w-16 animate-pulse" /></td>)}
                    <td />
                  </tr>
                ))
              ) : data.users?.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No users found.</td></tr>
              ) : data.users?.map((u: any) => (
                <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/60 group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(u.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs px-2 py-1 rounded-lg font-medium capitalize", ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-500")}>
                      {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 hidden lg:table-cell">{u.school?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 hidden xl:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs px-2 py-1 rounded-lg font-medium capitalize", STATUS_BADGE[u.status] ?? "bg-gray-100 text-gray-500")}>
                      {(u.status ?? "ACTIVE").charAt(0) + (u.status ?? "ACTIVE").slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`mailto:${u.email}`} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Send email"><Mail className="w-3.5 h-3.5" /></a>
                      <button className="p-1 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Grant access"><Shield className="w-3.5 h-3.5" /></button>
                      <button className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg" title="Suspend"><ShieldOff className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing {data.users?.length ?? 0} of {data.total ?? 0} users</p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
