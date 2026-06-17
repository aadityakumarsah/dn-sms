import { useState, useEffect } from "react";
import { Plus, Search, X, RefreshCw, UserPlus, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:      { label: "Pending",      color: "bg-gray-100 text-gray-600",       icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-50 text-blue-700",         icon: Clock },
  APPROVED:     { label: "Approved",     color: "bg-emerald-50 text-emerald-700",   icon: CheckCircle },
  ENROLLED:     { label: "Enrolled",     color: "bg-teal-50 text-teal-700",         icon: CheckCircle },
  REJECTED:     { label: "Rejected",     color: "bg-rose-50 text-rose-600",         icon: XCircle },
  WAITLISTED:   { label: "Waitlisted",   color: "bg-amber-50 text-amber-700",       icon: Clock },
};

function FormField({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );
}

function AdmissionModal({ open, onClose, initial, grades, departments, onSave }:
  { open: boolean; onClose: () => void; initial?: any; grades: any[]; departments: any[]; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", gender: "", dateOfBirth: "", address: "", gradeId: "", departmentId: "", previousSchool: "", guardianName: "", guardianPhone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) setForm({ firstName: initial.firstName ?? "", lastName: initial.lastName ?? "", email: initial.email ?? "", phone: initial.phone ?? "", gender: initial.gender ?? "", dateOfBirth: initial.dateOfBirth ? initial.dateOfBirth.slice(0, 10) : "", address: initial.address ?? "", gradeId: initial.gradeId ?? "", departmentId: initial.departmentId ?? "", previousSchool: initial.previousSchool ?? "", guardianName: initial.guardianName ?? "", guardianPhone: initial.guardianPhone ?? "", notes: initial.notes ?? "" });
    else setForm({ firstName: "", lastName: "", email: "", phone: "", gender: "", dateOfBirth: "", address: "", gradeId: "", departmentId: "", previousSchool: "", guardianName: "", guardianPhone: "", notes: "" });
    setError("");
  }, [initial, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) { setError("First name and last name are required"); return; }
    setSaving(true); setError("");
    try { await onSave({ ...form, gender: form.gender || null, dateOfBirth: form.dateOfBirth || null, gradeId: form.gradeId || null, departmentId: form.departmentId || null }); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = (k: string) => (v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">{initial ? "Edit Application" : "New Admission"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name *" value={form.firstName} onChange={set("firstName")} />
            <FormField label="Last Name *" value={form.lastName} onChange={set("lastName")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" value={form.email} onChange={set("email")} type="email" placeholder="student@example.com" />
            <FormField label="Phone" value={form.phone} onChange={set("phone")} placeholder="98XXXXXXXX" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">Select</option>
                {["MALE", "FEMALE", "OTHER"].map((g) => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <FormField label="Date of Birth" value={form.dateOfBirth} onChange={set("dateOfBirth")} type="date" />
          </div>
          <FormField label="Address" value={form.address} onChange={set("address")} placeholder="Current address" />
          <FormField label="Previous School" value={form.previousSchool} onChange={set("previousSchool")} placeholder="School name if applicable" />

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Enrollment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Applying for Grade</label>
              <select value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">Select grade</option>
                {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Department / Stream</label>
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">Select department</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Guardian Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Guardian Name" value={form.guardianName} onChange={set("guardianName")} placeholder="Father/Mother/Guardian" />
            <FormField label="Guardian Phone" value={form.guardianPhone} onChange={set("guardianPhone")} placeholder="98XXXXXXXX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any additional notes..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Saving..." : initial ? "Update" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admissions() {
  const [data, setData] = useState<any>({ admissions: [], total: 0, statusCounts: {} });
  const [grades, setGrades] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editAdm, setEditAdm] = useState<any>(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t); }, [search]);

  const load = () => {
    setLoading(true);
    api.admin.admissions({ status: statusFilter || undefined, search: debouncedSearch || undefined }).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, debouncedSearch]);
  useEffect(() => {
    api.admin.classes().then((d) => setGrades((d.grades ?? []).flatMap((g: any) => g)));
    api.admin.departments().then((d) => setDepartments(Array.isArray(d) ? d : d.departments ?? []));
  }, []);

  const [enrolling, setEnrolling] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    await api.admin.updateAdmission(id, { status });
    load();
  };

  const handleEnroll = async (a: any) => {
    if (!confirm(`Enroll ${a.name} into the student database? This creates a student account.`)) return;
    setEnrolling(a.id);
    try { await api.admin.enrollAdmission(a.id, {}); load(); }
    catch (e: any) { alert(e.message); }
    finally { setEnrolling(null); }
  };

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admissions</h1>
            <p className="text-sm text-gray-500 mt-0.5">{data.total ?? 0} applications</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button onClick={() => { setEditAdm(null); setModal(true); }}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> New Application
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, no..."
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 w-56" />
          </div>
          {["", "PENDING", "UNDER_REVIEW", "APPROVED", "ENROLLED", "REJECTED"].map((s) => {
            const count = s ? (data.statusCounts?.[s] ?? 0) : data.total;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors",
                  statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300")}>
                {s === "" ? "All" : STATUS_CONFIG[s]?.label ?? s} {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">{["App No.", "Name", "Grade", "Department", "Guardian", "Applied", "Status", ""].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i} className="border-t border-gray-50"><td colSpan={8} className="px-5 py-3"><div className="h-7 bg-gray-50 rounded animate-pulse" /></td></tr>)
              : data.admissions.length === 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center"><UserPlus className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No applications yet.</p></td></tr>
              : data.admissions.map((a: any) => {
                const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                return (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50/50 group">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{a.applicationNo}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 text-sm">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.email ?? a.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{a.gradeName ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{a.deptName ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{a.guardianName ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{new Date(a.appliedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <select value={a.status} onChange={(e) => handleStatusChange(a.id, e.target.value)}
                        className={cn("text-xs px-2.5 py-1 rounded-lg font-medium border outline-none cursor-pointer", cfg.color)}>
                        {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5 items-center justify-end">
                        {a.status !== "ENROLLED" && a.status !== "REJECTED" && (
                          <button onClick={() => handleEnroll(a)} disabled={enrolling === a.id}
                            className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
                            {enrolling === a.id ? "Enrolling…" : "Enroll →"}
                          </button>
                        )}
                        <button onClick={() => { setEditAdm(a); setModal(true); }}
                          className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AdmissionModal open={modal} onClose={() => { setModal(false); setEditAdm(null); }} initial={editAdm} grades={grades} departments={departments}
        onSave={async (d) => {
          if (editAdm) await api.admin.updateAdmission(editAdm.id, d);
          else await api.admin.createAdmission(d);
          load();
        }} />
    </>
  );
}
