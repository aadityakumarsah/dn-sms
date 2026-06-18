import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, X, RefreshCw, Users, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import EditDrawer from "./_EditDrawer";

// Non-teaching staff designations.
const DESIGNATIONS = ["Accountant", "Librarian", "Cleaner", "Security Guard", "Receptionist", "Lab Assistant", "Office Assistant", "Driver", "Helper", "Cook", "Gardener", "IT Support", "Nurse", "Store Keeper"];
const dummyAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Staff")}&background=random&size=128`;

function StaffModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const blank = { firstName: "", lastName: "", email: "", phone: "", designation: "Accountant", employeeId: "", salary: "", joinDate: "", gender: "MALE", avatar: "" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setForm(blank); setError(""); }, [open]);
  if (!open) return null;

  const field = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400";
  const handleSave = async () => {
    if (!form.firstName || !form.email) { setError("First name and email are required"); return; }
    if (!form.designation) { setError("Designation is required"); return; }
    setSaving(true); setError("");
    try { await onSave({ ...form, salary: form.salary || null, joinDate: form.joinDate || null }); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">Add Staff Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div className="flex items-center gap-4">
            <img src={form.avatar || dummyAvatar(`${form.firstName} ${form.lastName}`)} alt="avatar" className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Photo URL <span className="text-gray-300">(dummy if blank)</span></label>
              <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://… (Cloudinary later)" className={field} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">First Name *</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={field} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Last Name</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={field} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@school.edu.np" className={field} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" className={field} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Designation <span className="text-rose-400">*</span></label>
              <select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={cn(field, "bg-white")}>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Employee ID</label><input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="Auto" className={field} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={cn(field, "bg-white")}>
                {["MALE", "FEMALE", "OTHER"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Salary</label><input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className={field} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Join Date</label><input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} className={field} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">{saving ? "Adding..." : "Add Member"}</button>
        </div>
      </div>
    </div>
  );
}

export default function StaffMgmt() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ staff: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [designation, setDesignation] = useState("");
  const [modal, setModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t); }, [search]);

  const load = () => {
    setLoading(true);
    api.admin.staff({ search: debouncedSearch || undefined, designation: designation || undefined }).then(setData).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [debouncedSearch, designation]);

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">{data.total ?? 0} non-teaching staff (accountant, librarian, cleaner…)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50"><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></button>
            <button onClick={() => setModal(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700"><Plus className="w-3.5 h-3.5" /> Add Member</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative max-w-xs flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 w-full" />
          </div>
          <select value={designation} onChange={(e) => setDesignation(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">All designations</option>
            {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">{["Name", "Designation", "Email", "Phone", "Employee ID", ""].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-50"><td colSpan={6} className="px-5 py-3"><div className="h-7 bg-gray-50 rounded animate-pulse" /></td></tr>
              )) : (data.staff ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No staff members found.</p>
                </td></tr>
              ) : (data.staff ?? []).map((t: any) => (
                <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/50 group cursor-pointer" onClick={() => navigate(`/admin/staff-mgmt/${t.id}`)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={t.avatar || dummyAvatar(t.name)} alt={t.name} className="w-7 h-7 rounded-full object-cover bg-blue-100" />
                      <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs px-2.5 py-0.5 rounded-lg font-medium bg-amber-50 text-amber-700">{t.designation}</span></td>
                  <td className="px-5 py-3 text-sm text-gray-600">{t.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{t.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 font-mono">{t.employeeId ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditUserId(t.userId); }} title="Edit & password"
                        className="text-xs px-2.5 py-1 border border-blue-100 rounded-lg text-blue-600 hover:bg-blue-50"><Pencil className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} title="Remove"
                        className="text-xs px-2.5 py-1 border border-rose-100 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Remove Staff Member?</h3>
            <p className="text-sm text-gray-500 mb-5">This will remove the staff member from the school.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button onClick={async () => { try { await api.admin.deleteStaff(deleteId!); setDeleteId(null); } finally { load(); } }}
                className="px-4 py-2 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium">Remove</button>
            </div>
          </div>
        </div>
      )}

      <StaffModal open={modal} onClose={() => setModal(false)} onSave={async (d) => { try { await api.admin.createStaff(d); } finally { load(); } }} />

      {editUserId && (
        <EditDrawer userId={editUserId} onClose={() => setEditUserId(null)} onSaved={() => { setEditUserId(null); load(); }} />
      )}
    </>
  );
}
