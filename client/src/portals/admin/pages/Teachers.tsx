import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit3, Trash2, X, RefreshCw, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  SUSPENDED: "bg-rose-50 text-rose-600",
};
const dummyAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Teacher")}&background=random&size=128`;

function TeacherModal({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial?: any; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", gender: "MALE", qualification: "", specialization: "", experience: "", joinDate: "", employeeId: "", avatar: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      const parts = (initial.name ?? "").split(" ");
      setForm({ firstName: parts[0] ?? "", lastName: parts.slice(1).join(" "), email: initial.email ?? "", phone: initial.phone ?? "", gender: initial.gender ?? "MALE", qualification: initial.qualification ?? "", specialization: initial.specialization ?? "", experience: String(initial.experience ?? ""), joinDate: initial.joinDate ? initial.joinDate.slice(0, 10) : "", employeeId: initial.employeeId ?? "", avatar: initial.avatar ?? "" });
    } else {
      setForm({ firstName: "", lastName: "", email: "", phone: "", gender: "MALE", qualification: "", specialization: "", experience: "", joinDate: "", employeeId: "", avatar: "" });
    }
    setError("");
  }, [initial, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) { setError("First name, last name, and email are required"); return; }
    setSaving(true); setError("");
    try { await onSave({ ...form, experience: form.experience ? parseInt(form.experience) : null }); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const F = ({ label, k, type = "text", placeholder = "" }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">{initial ? "Edit Teacher" : "Add Teacher"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div className="flex items-center gap-4">
            <img src={form.avatar || dummyAvatar(`${form.firstName} ${form.lastName}`)} alt="avatar" className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Profile Photo URL <span className="text-gray-300">(demo URL, Cloudinary later)</span></label>
              <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="First Name *" k="firstName" />
            <F label="Last Name *" k="lastName" />
          </div>
          <F label="Email *" k="email" type="email" placeholder="teacher@school.edu.np" />
          <div className="grid grid-cols-2 gap-4">
            <F label="Phone" k="phone" placeholder="98XXXXXXXX" />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                {["MALE", "FEMALE", "OTHER"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Qualification" k="qualification" placeholder="M.Sc. Mathematics" />
            <F label="Specialization" k="specialization" placeholder="Mathematics" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Experience (years)" k="experience" type="number" placeholder="0" />
            <F label="Employee ID" k="employeeId" placeholder="EMP-001" />
          </div>
          <F label="Join Date" k="joinDate" type="date" />
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Saving..." : initial ? "Update Teacher" : "Add Teacher"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Teachers() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ teachers: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => {
    setLoading(true);
    api.admin.teachers({ search: debouncedSearch || undefined }).then(setData).finally(() => setLoading(false));
  }, [debouncedSearch]);

  const reload = () => { setLoading(true); api.admin.teachers({ search: debouncedSearch || undefined }).then(setData).finally(() => setLoading(false)); };

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Teachers</h1>
            <p className="text-sm text-gray-500 mt-0.5">{data.total ?? 0} teachers on staff</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reload} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button onClick={() => { setEditTeacher(null); setModal(true); }}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Add Teacher
            </button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or subject..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-44 animate-pulse">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-gray-100 rounded-full" /><div className="flex-1"><div className="h-4 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div></div>
              <div className="space-y-2"><div className="h-3 bg-gray-100 rounded w-full" /><div className="h-3 bg-gray-100 rounded w-3/4" /></div>
            </div>
          )) : data.teachers.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 text-center py-14">
              <p className="text-sm text-gray-400">No teachers found. <button onClick={() => setModal(true)} className="text-blue-600">Add the first one →</button></p>
            </div>
          ) : data.teachers.map((t: any) => (
            <div key={t.id} onClick={() => navigate(`/admin/teachers/${t.id}`)} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md cursor-pointer transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name || "Teacher")}&background=random&size=128`} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0 bg-teal-100" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.specialization ?? t.qualification ?? "General"}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setEditTeacher(t); setModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(t.id)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                {t.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3.5 h-3.5 shrink-0 text-gray-300" />{t.email}</div>}
                {t.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="w-3.5 h-3.5 shrink-0 text-gray-300" />{t.phone}</div>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {(t.subjects ?? []).slice(0, 2).map((s: string) => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">{s}</span>
                  ))}
                  {(t.subjects ?? []).length > 2 && <span className="text-xs text-gray-400">+{t.subjects.length - 2}</span>}
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-lg font-medium", STATUS_BADGE[t.status] ?? "bg-gray-100 text-gray-500")}>
                  {t.status ? t.status.charAt(0) + t.status.slice(1).toLowerCase() : "Active"}
                </span>
              </div>
              {t.experience != null && <p className="text-xs text-gray-400 mt-2">{t.experience} yrs experience{t.qualification ? ` · ${t.qualification}` : ""}</p>}
            </div>
          ))}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Remove Teacher?</h3>
            <p className="text-sm text-gray-500 mb-5">This will permanently remove the teacher and their account.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button onClick={async () => { await api.admin.deleteTeacher(deleteId!); setDeleteId(null); reload(); }}
                className="px-4 py-2 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium">Remove</button>
            </div>
          </div>
        </div>
      )}

      <TeacherModal open={modal} onClose={() => { setModal(false); setEditTeacher(null); }} initial={editTeacher}
        onSave={async (d) => {
          if (editTeacher) await api.admin.updateTeacher(editTeacher.id, d);
          else await api.admin.createTeacher(d);
          reload();
        }} />
    </>
  );
}
