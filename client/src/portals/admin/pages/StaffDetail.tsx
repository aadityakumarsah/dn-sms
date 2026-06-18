import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, Wallet, Briefcase, Building2, Pencil, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import EditDrawer from "./_EditDrawer";

const dummyAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Staff")}&background=random&size=128`;
const npr = (n: number) => `NPR ${Number(n || 0).toLocaleString()}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700", PROCESSING: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-gray-100 text-gray-400",
};

function PayrollHistory({ staffId }: { staffId: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), basicSalary: "", allowances: "0", deductions: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.admin.payroll({ staffId }).then(setRecords).catch(() => setRecords([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [staffId]);

  const save = async () => {
    setSaving(true); setError("");
    try { await api.admin.createPayroll({ staffId, ...form }); setAddOpen(false); load(); }
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
                          <button onClick={async () => { try { await api.admin.updatePayroll(p.id, { status: "PAID" }); } finally { load(); } }} title="Mark paid" className="p-1 text-gray-300 hover:text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={async () => { if (!confirm("Delete this record?")) return; try { await api.admin.deletePayroll(p.id); } finally { load(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
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

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const reload = () => { if (id) api.admin.staffDetail(id).then(setS).catch((e) => setError(e.message)); };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.admin.staffDetail(id).then(setS).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><div className="h-40 bg-gray-50 rounded-2xl animate-pulse" /></div>;
  if (error || !s) return (
    <div className="p-6">
      <button onClick={() => navigate("/admin/staff-mgmt")} className="text-sm text-blue-600 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error || "Staff not found"}</div>
    </div>
  );

  const netSalary = (s.salary ?? 0) + (s.allowances ?? 0) - (s.deductions ?? 0);

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <button onClick={() => navigate("/admin/staff-mgmt")} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Staff</button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <img src={s.avatar || dummyAvatar(s.name)} alt={s.name} className="w-16 h-16 rounded-2xl object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{s.name}</h1>
          {s.employeeId && <p className="text-sm text-gray-400 font-mono">{s.employeeId}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">{s.designation}</span>
            {s.department && <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg">{s.department}</span>}
            <span className={cn("text-xs px-2.5 py-1 rounded-lg capitalize", s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>{s.status?.toLowerCase()}</span>
          </div>
        </div>
        {s.userId && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 self-start">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Contact</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-300" />{s.email}</div>
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-300" />{s.phone ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600 capitalize"><span className="w-4 text-center text-gray-300">⚧</span>{s.gender?.toLowerCase() ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-300" />Joined {s.joinDate ? new Date(s.joinDate).toLocaleDateString() : "—"}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Employment</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Briefcase className="w-4 h-4 text-gray-300" />{s.designation}</div>
            <div className="flex items-center gap-2 text-gray-600"><Building2 className="w-4 h-4 text-gray-300" />{s.department ?? "No department"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Wallet className="w-4 h-4 text-gray-300" />{s.salary ? `Rs ${Number(s.salary).toLocaleString()}/month` : "Salary not set"}</div>
          </div>
        </div>

        {/* Salary breakdown */}
        {s.salary != null && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Salary Breakdown</h2>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Basic</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{npr(s.salary ?? 0)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Allowances</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">+{npr(s.allowances ?? 0)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Deductions</p>
                <p className="text-sm font-bold text-rose-500 mt-0.5">-{npr(s.deductions ?? 0)}</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex justify-between items-center">
              <span className="text-xs text-blue-600 font-medium">Net Monthly Salary</span>
              <span className="text-base font-bold text-blue-700">{npr(netSalary)}</span>
            </div>
          </div>
        )}

        <PayrollHistory staffId={s.id} />
      </div>

      {editing && s.userId && (
        <EditDrawer userId={s.userId} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); }} />
      )}
    </div>
  );
}
