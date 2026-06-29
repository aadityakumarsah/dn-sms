import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, BookOpen, Award, Briefcase, Key, Eye, EyeOff, Copy, CheckCheck, Wallet, Pencil, Check, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const dummyAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Teacher")}&background=random&size=128`;
const npr = (n: number) => `NPR ${Number(n || 0).toLocaleString()}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700", PROCESSING: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-gray-100 text-gray-400",
};

function CredentialCard({ teacherId, email: initialEmail }: { teacherId: string; email: string }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copy = (val: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.admin.updateTeacherCredentials(teacherId, { email: email !== initialEmail ? email : undefined, password: password || undefined });
      setSuccess("Credentials updated successfully."); setEditing(false); setPassword("");
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Key className="w-4 h-4 text-gray-300" /> Login Credentials</h2>
        {!editing && <button onClick={() => { setEditing(true); setError(""); setSuccess(""); }} className="text-xs text-blue-600 hover:underline">Edit</button>}
      </div>
      {!editing ? (
        <div className="space-y-2">
          {success && <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">{success}</div>}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
            <div><p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Login Email</p><code className="text-sm text-gray-800">{email}</code></div>
            <button onClick={() => copy(email, setCopiedEmail)} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200">
              {copiedEmail ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5"><p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Password</p><code className="text-sm text-gray-400">••••••••</code></div>
        </div>
      ) : (
        <div className="space-y-3">
          {error && <div className="p-2.5 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" /></div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">New Password <span className="text-gray-300">(blank = keep current)</span></label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setEmail(initialEmail); setPassword(""); setError(""); }} className="px-3 py-2 text-xs text-gray-400">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-xs bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SalaryCard({ teacher, onUpdated }: { teacher: any; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ salary: "", allowances: "0", deductions: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openEdit = () => {
    setForm({ salary: teacher.salary != null ? String(teacher.salary) : "", allowances: String(teacher.allowances ?? 0), deductions: String(teacher.deductions ?? 0) });
    setError(""); setEditing(true);
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      await api.admin.updateTeacher(teacher.id, { salary: form.salary, allowances: form.allowances, deductions: form.deductions });
      setEditing(false); onUpdated();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const netSalary = (teacher.salary ?? 0) + (teacher.allowances ?? 0) - (teacher.deductions ?? 0);
  const previewNet = Number(form.salary || 0) + Number(form.allowances || 0) - Number(form.deductions || 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-gray-300" /> Salary</h2>
        {!editing && <button onClick={openEdit} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Pencil className="w-3 h-3" />Edit</button>}
      </div>
      {!editing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Basic</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{teacher.salary ? npr(teacher.salary) : "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Allowances</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">{teacher.allowances ? `+${npr(teacher.allowances)}` : "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Deductions</p>
              <p className="text-sm font-bold text-rose-500 mt-0.5">{teacher.deductions ? `-${npr(teacher.deductions)}` : "—"}</p>
            </div>
          </div>
          {teacher.salary != null && (
            <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex justify-between items-center">
              <span className="text-xs text-blue-600 font-medium">Net Monthly Salary</span>
              <span className="text-base font-bold text-blue-700">{npr(netSalary)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {error && <div className="p-2.5 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Basic Salary (NPR)</label><input type="number" min={0} value={form.salary} onChange={(e) => setForm(f => ({ ...f, salary: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Allowances</label><input type="number" min={0} value={form.allowances} onChange={(e) => setForm(f => ({ ...f, allowances: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Deductions</label><input type="number" min={0} value={form.deductions} onChange={(e) => setForm(f => ({ ...f, deductions: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" /></div>
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex justify-between items-center text-sm">
            <span className="text-blue-600 font-medium">Net Salary</span>
            <span className="font-bold text-blue-700">{npr(previewNet)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-2 text-xs text-gray-400">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2 text-xs bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">{saving ? "Saving…" : "Save Salary"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PayrollHistory({ teacherId }: { teacherId: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), basicSalary: "", allowances: "0", deductions: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.admin.teacherPayroll({ teacherId }).then(setRecords).catch(() => setRecords([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [teacherId]);

  const save = async () => {
    setSaving(true); setError("");
    try { await api.admin.createTeacherPayroll({ teacherId, ...form }); setAddOpen(false); load(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const netPreview = Number(form.basicSalary || 0) + Number(form.allowances || 0) - Number(form.deductions || 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Salary Payment History</h2>
        <button onClick={() => { setAddOpen(v => !v); setError(""); }} className="text-xs text-blue-600 hover:underline">+ New Record</button>
      </div>

      {addOpen && (
        <div className="mb-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
          {error && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
              <select value={form.month} onChange={(e) => setForm(f => ({ ...f, month: Number(e.target.value) }))} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
              <input type="number" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Basic (NPR)</label>
              <input type="number" value={form.basicSalary} onChange={(e) => setForm(f => ({ ...f, basicSalary: e.target.value }))} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Allowances</label>
              <input type="number" value={form.allowances} onChange={(e) => setForm(f => ({ ...f, allowances: e.target.value }))} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Deductions</label>
              <input type="number" value={form.deductions} onChange={(e) => setForm(f => ({ ...f, deductions: e.target.value }))} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Net pay: <strong className="text-gray-900">{npr(netPreview)}</strong></span>
            <div className="flex gap-2">
              <button onClick={() => setAddOpen(false)} className="px-3 py-1.5 text-xs text-gray-400">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
        : records.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No payroll records yet.</p>
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50">{["Period", "Basic", "Allow.", "Deduct.", "Net Pay", "Status", ""].map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {records.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5 font-medium text-gray-700">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-4 py-2.5 text-gray-600">{Number(p.basicSalary).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-emerald-600">+{Number(p.allowances).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-rose-500">-{Number(p.deductions).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-bold text-gray-900">{Number(p.netPay).toLocaleString()}</td>
                    <td className="px-4 py-2.5"><span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_BADGE[p.status])}>{p.status}</span></td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1 justify-end">
                        {p.status !== "PAID" && (
                          <button onClick={async () => { try { await api.admin.updateTeacherPayroll(p.id, { status: "PAID" }); } finally { load(); } }} title="Mark paid" className="p-1 text-gray-300 hover:text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={async () => { if (!confirm("Delete this record?")) return; try { await api.admin.deleteTeacherPayroll(p.id); } finally { load(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

function SubjectSectionCard({ teacherId }: { teacherId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ sectionId: "", subjectId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      api.admin.teacherAssignments(teacherId),
      api.admin.gradesWithSections(),
      api.admin.subjects(),
    ]).then(([a, g, s]) => { setAssignments(a); setGrades(g); setSubjects(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [teacherId]);

  const save = async () => {
    if (!form.sectionId || !form.subjectId) { setError("Select both a section and a subject."); return; }
    setSaving(true); setError("");
    try {
      await api.admin.addTeacherAssignment(teacherId, { sectionId: form.sectionId, subjectId: form.subjectId });
      setAdding(false); setForm({ sectionId: "", subjectId: "" }); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    try { await api.admin.deleteTeacherAssignment(id); load(); } catch { }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-gray-300" /> Class &amp; Subject Assignments
        </h2>
        {!adding && (
          <button onClick={() => { setAdding(true); setError(""); }} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
          {error && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section (Class)</label>
              <select value={form.sectionId} onChange={(e) => setForm(f => ({ ...f, sectionId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Select section…</option>
                {grades.map((g) => (
                  <optgroup key={g.id} label={g.name}>
                    {g.sections.map((s: any) => (
                      <option key={s.id} value={s.id}>{g.name} — {s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <select value={form.subjectId} onChange={(e) => setForm(f => ({ ...f, subjectId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Select subject…</option>
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setError(""); setForm({ sectionId: "", subjectId: "" }); }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? "Saving…" : "Assign"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
      ) : assignments.length === 0 ? (
        <p className="text-sm text-gray-400 py-3 text-center">No assignments yet. Click Add to assign a class &amp; subject.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                  {a.section?.grade?.gradeNumber ?? "—"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {a.section ? `${a.section.grade.name} — ${a.section.name}` : "No section"}
                  </p>
                  <p className="text-xs text-gray-400">{a.subject.name}</p>
                </div>
              </div>
              <button onClick={() => remove(a.id)} className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg hover:bg-rose-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!id) return;
    api.admin.teacherDetail(id).then(setT).catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.admin.teacherDetail(id).then(setT).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><div className="h-40 bg-gray-50 rounded-2xl animate-pulse" /></div>;
  if (error || !t) return (
    <div className="p-6">
      <button onClick={() => navigate("/admin/teachers")} className="text-sm text-blue-600 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error || "Teacher not found"}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <button onClick={() => navigate("/admin/teachers")} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Teachers</button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <img src={t.avatar || dummyAvatar(t.name)} alt={t.name} className="w-16 h-16 rounded-2xl object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{t.name}</h1>
          {t.employeeId && <p className="text-sm text-gray-400 font-mono">{t.employeeId}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {t.specialization && <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">{t.specialization}</span>}
            <span className={cn("text-xs px-2.5 py-1 rounded-lg capitalize", t.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>{t.status?.toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Contact</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-300" />{t.email}</div>
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-300" />{t.phone ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600 capitalize"><span className="w-4 text-center text-gray-300">⚧</span>{t.gender?.toLowerCase() ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-300" />Joined {t.joinDate ? new Date(t.joinDate).toLocaleDateString() : "—"}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Professional</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Award className="w-4 h-4 text-gray-300" />{t.qualification ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Briefcase className="w-4 h-4 text-gray-300" />{t.experience ? `${t.experience} yrs experience` : "—"}</div>
            <div className="flex items-start gap-2 text-gray-600"><BookOpen className="w-4 h-4 text-gray-300 mt-0.5" /><span>{t.subjects?.length ? t.subjects.join(", ") : "No subjects assigned"}</span></div>
          </div>
        </div>

        <SalaryCard teacher={t} onUpdated={load} />

        {t.email && <CredentialCard teacherId={t.id} email={t.email} />}

        <SubjectSectionCard teacherId={t.id} />

        <PayrollHistory teacherId={t.id} />
      </div>
    </div>
  );
}
