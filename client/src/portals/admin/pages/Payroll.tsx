import { useState, useEffect } from "react";
import { Wallet, Trash2, Check, Users, GraduationCap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700", PROCESSING: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-gray-100 text-gray-400",
};
const npr = (n: number) => `NPR ${Number(n || 0).toLocaleString()}`;

type Tab = "staff" | "teacher";

export default function Payroll() {
  const [tab, setTab] = useState<Tab>("staff");
  const now = new Date();

  // Staff payroll
  const { data: staffPayrollData, loading: staffLoading, reload: reloadStaff } = useList<any[]>(() => api.admin.payroll());
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffForm, setStaffForm] = useState<any>({ staffId: "", month: now.getMonth() + 1, year: now.getFullYear(), basicSalary: "", allowances: "0", deductions: "0" });
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Teacher payroll
  const { data: teacherPayrollData, loading: teacherLoading, reload: reloadTeacher } = useList<any[]>(() => api.admin.teacherPayroll());
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [teacherForm, setTeacherForm] = useState<any>({ teacherId: "", month: now.getMonth() + 1, year: now.getFullYear(), basicSalary: "", allowances: "0", deductions: "0" });
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.staff().then((r) => setStaffList(Array.isArray(r) ? r : (r.staff ?? []))).catch(() => {});
    api.admin.teachers().then((r) => setTeacherList(Array.isArray(r) ? r : (r.teachers ?? []))).catch(() => {});
  }, []);

  const staffPayroll = staffPayrollData ?? [];
  const teacherPayroll = teacherPayrollData ?? [];

  const setS = (k: string, v: any) => setStaffForm((f: any) => ({ ...f, [k]: v }));
  const setT = (k: string, v: any) => setTeacherForm((f: any) => ({ ...f, [k]: v }));

  const saveStaff = async () => {
    if (!staffForm.staffId) { setStaffError("Select a staff member"); return; }
    setStaffSaving(true); setStaffError(null);
    try { await api.admin.createPayroll(staffForm); setStaffOpen(false); reloadStaff(); }
    catch (e: any) { setStaffError(e.message); } finally { setStaffSaving(false); }
  };
  const saveTeacher = async () => {
    if (!teacherForm.teacherId) { setTeacherError("Select a teacher"); return; }
    setTeacherSaving(true); setTeacherError(null);
    try { await api.admin.createTeacherPayroll(teacherForm); setTeacherOpen(false); reloadTeacher(); }
    catch (e: any) { setTeacherError(e.message); } finally { setTeacherSaving(false); }
  };

  const staffNetPreview = Number(staffForm.basicSalary || 0) + Number(staffForm.allowances || 0) - Number(staffForm.deductions || 0);
  const teacherNetPreview = Number(teacherForm.basicSalary || 0) + Number(teacherForm.allowances || 0) - Number(teacherForm.deductions || 0);

  const totalStaffPaid = staffPayroll.filter((p) => p.status === "PAID").reduce((s, p) => s + p.netPay, 0);
  const totalTeacherPaid = teacherPayroll.filter((p) => p.status === "PAID").reduce((s, p) => s + p.netPay, 0);
  const loading = tab === "staff" ? staffLoading : teacherLoading;
  const list = tab === "staff" ? staffPayroll : teacherPayroll;

  const openNew = () => {
    if (tab === "staff") {
      setStaffForm({ staffId: "", month: now.getMonth() + 1, year: now.getFullYear(), basicSalary: "", allowances: "0", deductions: "0" });
      setStaffError(null); setStaffOpen(true);
    } else {
      setTeacherForm({ teacherId: "", month: now.getMonth() + 1, year: now.getFullYear(), basicSalary: "", allowances: "0", deductions: "0" });
      setTeacherError(null); setTeacherOpen(true);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Payroll" subtitle="Process staff and teacher salaries"
        onRefresh={tab === "staff" ? reloadStaff : reloadTeacher} loading={loading}
        action={{ label: "New Record", onClick: openNew }} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Staff Paid</p>
          <p className="text-lg font-bold text-gray-900">{npr(totalStaffPaid)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{staffPayroll.filter((p) => p.status === "PENDING").length} pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Teacher Paid</p>
          <p className="text-lg font-bold text-gray-900">{npr(totalTeacherPaid)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{teacherPayroll.filter((p) => p.status === "PENDING").length} pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Total Paid (All)</p>
          <p className="text-lg font-bold text-emerald-600">{npr(totalStaffPaid + totalTeacherPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Pending Count</p>
          <p className="text-lg font-bold text-amber-600">{staffPayroll.filter((p) => p.status === "PENDING").length + teacherPayroll.filter((p) => p.status === "PENDING").length}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="inline-flex bg-gray-100 rounded-xl p-1">
        <button onClick={() => setTab("staff")} className={cn("flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors", tab === "staff" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <Users className="w-4 h-4" /> Staff
        </button>
        <button onClick={() => setTab("teacher")} className={cn("flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors", tab === "teacher" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <GraduationCap className="w-4 h-4" /> Teachers
        </button>
      </div>

      {/* Table */}
      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100">
            <Empty icon={<Wallet className="w-8 h-8" />} text={`No ${tab === "staff" ? "staff" : "teacher"} payroll records yet`}
              action={{ label: "Create one", onClick: openNew }} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {[tab === "staff" ? "Staff" : "Teacher", "Period", "Basic", "Allow.", "Deduct.", "Net Pay", "Status", ""].map((x) => (
                    <th key={x} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{p.staffName ?? p.teacherName}</p>
                      {p.designation && <p className="text-xs text-gray-400">{p.designation}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-5 py-3 text-gray-600">{Number(p.basicSalary).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-500">{Number(p.allowances).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-500">{Number(p.deductions).toLocaleString()}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{Number(p.netPay).toLocaleString()}</td>
                    <td className="px-5 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", STATUS_BADGE[p.status])}>{p.status}</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {p.status !== "PAID" && (
                          <button onClick={async () => {
                            try {
                              if (tab === "staff") await api.admin.updatePayroll(p.id, { status: "PAID" });
                              else await api.admin.updateTeacherPayroll(p.id, { status: "PAID" });
                            } finally { tab === "staff" ? reloadStaff() : reloadTeacher(); }
                          }} title="Mark paid" className="p-1 text-gray-300 hover:text-emerald-600"><Check className="w-4 h-4" /></button>
                        )}
                        <button onClick={async () => {
                          if (!confirm("Delete this record?")) return;
                          try {
                            if (tab === "staff") await api.admin.deletePayroll(p.id);
                            else await api.admin.deleteTeacherPayroll(p.id);
                          } finally { tab === "staff" ? reloadStaff() : reloadTeacher(); }
                        }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Staff Modal */}
      <Modal open={staffOpen} onClose={() => setStaffOpen(false)} title="New Staff Payroll Record"
        footer={<><CancelBtn onClick={() => setStaffOpen(false)} /><SaveBtn onClick={saveStaff} saving={staffSaving} /></>}>
        <ErrorMsg msg={staffError} />
        <Field label="Staff member" required>
          <Select value={staffForm.staffId} onChange={(e) => { const s = staffList.find((x) => x.id === e.target.value); setS("staffId", e.target.value); if (s?.salary) setS("basicSalary", String(s.salary)); }}>
            <option value="">— Select staff —</option>
            {staffList.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.fullName ?? s.email}{s.designation ? ` (${s.designation})` : ""}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Month"><Select value={staffForm.month} onChange={(e) => setS("month", Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</Select></Field>
          <Field label="Year"><TextInput type="number" value={staffForm.year} onChange={(e) => setS("year", Number(e.target.value))} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Basic (NPR)"><TextInput type="number" value={staffForm.basicSalary} onChange={(e) => setS("basicSalary", e.target.value)} /></Field>
          <Field label="Allowances"><TextInput type="number" value={staffForm.allowances} onChange={(e) => setS("allowances", e.target.value)} /></Field>
          <Field label="Deductions"><TextInput type="number" value={staffForm.deductions} onChange={(e) => setS("deductions", e.target.value)} /></Field>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl flex justify-between text-sm"><span className="text-gray-500">Net pay</span><span className="font-bold text-gray-900">NPR {staffNetPreview.toLocaleString()}</span></div>
      </Modal>

      {/* Teacher Modal */}
      <Modal open={teacherOpen} onClose={() => setTeacherOpen(false)} title="New Teacher Payroll Record"
        footer={<><CancelBtn onClick={() => setTeacherOpen(false)} /><SaveBtn onClick={saveTeacher} saving={teacherSaving} /></>}>
        <ErrorMsg msg={teacherError} />
        <Field label="Teacher" required>
          <Select value={teacherForm.teacherId} onChange={(e) => {
            const t = teacherList.find((x) => x.id === e.target.value);
            setT("teacherId", e.target.value);
            if (t?.salary) setT("basicSalary", String(t.salary));
            if (t?.allowances) setT("allowances", String(t.allowances));
            if (t?.deductions) setT("deductions", String(t.deductions));
          }}>
            <option value="">— Select teacher —</option>
            {teacherList.map((t) => <option key={t.id} value={t.id}>{t.name ?? t.email}{t.salary ? ` — NPR ${Number(t.salary).toLocaleString()}/mo` : ""}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Month"><Select value={teacherForm.month} onChange={(e) => setT("month", Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</Select></Field>
          <Field label="Year"><TextInput type="number" value={teacherForm.year} onChange={(e) => setT("year", Number(e.target.value))} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Basic (NPR)"><TextInput type="number" value={teacherForm.basicSalary} onChange={(e) => setT("basicSalary", e.target.value)} /></Field>
          <Field label="Allowances"><TextInput type="number" value={teacherForm.allowances} onChange={(e) => setT("allowances", e.target.value)} /></Field>
          <Field label="Deductions"><TextInput type="number" value={teacherForm.deductions} onChange={(e) => setT("deductions", e.target.value)} /></Field>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl flex justify-between text-sm"><span className="text-gray-500">Net pay</span><span className="font-bold text-gray-900">NPR {teacherNetPreview.toLocaleString()}</span></div>
      </Modal>
    </div>
  );
}
