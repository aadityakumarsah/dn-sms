import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit3, Trash2, X, RefreshCw, Mail, Phone, Copy, CheckCheck, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import ImageUpload from "@/components/common/ImageUpload";

function CredField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <code className="text-sm font-mono text-gray-900 break-all select-all">{value}</code>
        <button onClick={copy} className="shrink-0 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-700">
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function CredentialsModal({ open, onClose, creds }: { open: boolean; onClose: () => void; creds: any | null }) {
  if (!open || !creds) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Key className="w-5 h-5" /></div>
            <div>
              <h2 className="font-bold text-base">Teacher Account Created!</h2>
              <p className="text-teal-100 text-xs mt-0.5">Share these login credentials with the teacher</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
            ⚠ The teacher should change their password after first login via Settings.
          </div>
          <CredField label="Email" value={creds.email ?? ""} />
          <CredField label="Password" value={creds.password ?? ""} />
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition-colors text-sm">
            Done — I've saved the credentials
          </button>
        </div>
      </div>
    </div>
  );
}

function TeacherCredEditModal({ open, onClose, teacher, onSaved }: {
  open: boolean; onClose: () => void; teacher: any | null; onSaved: (creds: any) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (teacher) { setEmail(teacher.email ?? ""); setPassword(""); setError(""); }
  }, [teacher, open]);

  if (!open || !teacher) return null;

  const handleSave = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    setSaving(true); setError("");
    try {
      const r = await api.admin.updateTeacherCredentials(teacher.id, {
        email: email !== teacher.email ? email : undefined,
        password: password || undefined,
      });
      onSaved(r.credentials);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoReset = async () => {
    if (!confirm(`Auto-generate new credentials for ${teacher.name}?`)) return;
    setSaving(true); setError("");
    try {
      const r = await api.auth.resetPassword(teacher.userId);
      if (r?.credentials) onSaved(r.credentials);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Edit Login Credentials</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-500">Editing credentials for <span className="font-medium text-gray-700">{teacher.name}</span></p>
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
            </label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter custom password"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={handleAutoReset} disabled={saving}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Auto-reset
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  SUSPENDED: "bg-rose-50 text-rose-600",
};
// Extracted outside TeacherModal so React doesn't remount inputs on every re-render (fixes focus loss bug)
function FormField({ label, k, type = "text", placeholder = "", form, setForm }: {
  label: string; k: string; type?: string; placeholder?: string;
  form: any; setForm: (f: any) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );
}

function TeacherModal({ open, onClose, initial, onSave, onReload }: { open: boolean; onClose: () => void; initial?: any; onSave: (d: any) => Promise<string | null | undefined>; onReload?: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", gender: "MALE", qualification: "", specialization: "", experience: "", joinDate: "", employeeId: "", avatar: "", password: "", salary: "", allowances: "0", deductions: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pendingUpload = useRef<Promise<string> | null>(null);

  useEffect(() => {
    if (initial) {
      const parts = (initial.name ?? "").split(" ");
      setForm({ firstName: parts[0] ?? "", lastName: parts.slice(1).join(" "), email: initial.email ?? "", phone: initial.phone ?? "", gender: initial.gender ?? "MALE", qualification: initial.qualification ?? "", specialization: initial.specialization ?? "", experience: String(initial.experience ?? ""), joinDate: initial.joinDate ? initial.joinDate.slice(0, 10) : "", employeeId: initial.employeeId ?? "", avatar: initial.avatar ?? "", password: "", salary: initial.salary != null ? String(initial.salary) : "", allowances: String(initial.allowances ?? 0), deductions: String(initial.deductions ?? 0) });
    } else {
      setForm({ firstName: "", lastName: "", email: "", phone: "", gender: "MALE", qualification: "", specialization: "", experience: "", joinDate: "", employeeId: "", avatar: "", password: "", salary: "", allowances: "0", deductions: "0" });
    }
    setError("");
    pendingUpload.current = null;
  }, [initial, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) { setError("First name, last name, and email are required"); return; }
    setSaving(true); setError("");
    try {
      let avatarUrl = form.avatar;
      if (pendingUpload.current) {
        try { const url = await pendingUpload.current; if (url) avatarUrl = url; } catch { /* upload failed, proceed without avatar */ }
      }
      await onSave({ ...form, avatar: avatarUrl, experience: form.experience ? parseInt(form.experience) : null });
      onClose();
      onReload?.();
    }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

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
          <ImageUpload value={form.avatar} onChange={(url) => setForm({ ...form, avatar: url })} name={`${form.firstName} ${form.lastName}`} onUploadStart={(p) => { pendingUpload.current = p; }} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name *" k="firstName" form={form} setForm={setForm} />
            <FormField label="Last Name *" k="lastName" form={form} setForm={setForm} />
          </div>
          <FormField label="Email *" k="email" type="email" placeholder="teacher@school.edu.np" form={form} setForm={setForm} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone" k="phone" placeholder="98XXXXXXXX" form={form} setForm={setForm} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                {["MALE", "FEMALE", "OTHER"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          {!initial && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Password <span className="text-gray-400 font-normal">(auto-generated if blank)</span>
              </label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={`e.g. ${form.firstName ? form.firstName.toLowerCase() + "2082@1234" : "auto-generated"}`}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Qualification" k="qualification" placeholder="M.Sc. Mathematics" form={form} setForm={setForm} />
            <FormField label="Specialization" k="specialization" placeholder="Mathematics" form={form} setForm={setForm} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Experience (years)" k="experience" type="number" placeholder="0" form={form} setForm={setForm} />
            <FormField label="Employee ID" k="employeeId" placeholder="EMP-001" form={form} setForm={setForm} />
          </div>
          <FormField label="Join Date" k="joinDate" type="date" form={form} setForm={setForm} />
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-3">Salary Configuration</p>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Monthly Salary (NPR)" k="salary" type="number" placeholder="0" form={form} setForm={setForm} />
              <FormField label="Allowances" k="allowances" type="number" placeholder="0" form={form} setForm={setForm} />
              <FormField label="Deductions" k="deductions" type="number" placeholder="0" form={form} setForm={setForm} />
            </div>
          </div>
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
  const [createdCreds, setCreatedCreds] = useState<any>(null);
  const [editCredsTeacher, setEditCredsTeacher] = useState<any>(null);

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
                  <button title="Edit" onClick={() => { setEditTeacher(t); setModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button title="Edit Login Credentials" onClick={() => setEditCredsTeacher(t)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Key className="w-3.5 h-3.5" /></button>
                  <button title="Delete" onClick={() => setDeleteId(t.id)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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
          if (editTeacher) {
            await api.admin.updateTeacher(editTeacher.id, d);
            return editTeacher.id;
          } else {
            const result = await api.admin.createTeacher(d);
            if (result?.credentials) setCreatedCreds(result.credentials);
            return result?.id ?? null;
          }
        }} onReload={reload} />

      <CredentialsModal open={!!createdCreds} onClose={() => setCreatedCreds(null)} creds={createdCreds} />

      <TeacherCredEditModal
        open={!!editCredsTeacher}
        onClose={() => setEditCredsTeacher(null)}
        teacher={editCredsTeacher}
        onSaved={(creds) => { setEditCredsTeacher(null); setCreatedCreds(creds); }}
      />
    </>
  );
}
