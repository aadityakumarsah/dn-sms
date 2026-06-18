import { useState } from "react";
import { CalendarOff, Check, X as XIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { fmtBS } from "@/lib/nepali-date";
import { NepaliDateInput } from "@/components/common/NepaliDateInput";
import { PageHeader, Modal, Field, TextInput, Textarea, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700", APPROVED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-rose-50 text-rose-600",
};
const TYPES = ["SICK", "CASUAL", "EMERGENCY", "MATERNITY", "OTHER"];

export default function Leaves() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.leaves());
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({ applicantName: "", type: "SICK", fromDate: today, toDate: today, reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openNew = () => { setForm({ applicantName: "", type: "SICK", fromDate: today, toDate: today, reason: "" }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.reason) { setError("Reason is required"); return; }
    setSaving(true); setError(null);
    try { await api.admin.createLeave(form); setOpen(false); reload(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const review = async (id: string, status: string) => { await api.admin.updateLeave(id, { status }); reload(); };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Leave Notes" subtitle="Manage leave applications & approvals"
        onRefresh={reload} loading={loading} action={{ label: "New Leave", onClick: openNew }} />

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<CalendarOff className="w-8 h-8" />} text="No leave applications yet" action={{ label: "Add one", onClick: openNew }} /></div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">{["Applicant", "Role", "Type", "From", "To", "Reason", "Status", ""].map((x) => <th key={x} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{x}</th>)}</tr></thead>
              <tbody>
                {list.map((l) => (
                  <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{l.applicantName}</td>
                    <td className="px-5 py-3 text-gray-500 capitalize">{String(l.applicantRole).toLowerCase()}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{l.type.toLowerCase()}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtBS(l.fromDate, true)}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtBS(l.toDate, true)}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">{l.reason}</td>
                    <td className="px-5 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", STATUS_BADGE[l.status])}>{l.status}</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {l.status === "PENDING" && <>
                          <button onClick={() => review(l.id, "APPROVED")} title="Approve" className="p-1 text-gray-300 hover:text-emerald-600"><Check className="w-4 h-4" /></button>
                          <button onClick={() => review(l.id, "REJECTED")} title="Reject" className="p-1 text-gray-300 hover:text-rose-500"><XIcon className="w-4 h-4" /></button>
                        </>}
                        <button onClick={async () => { if (confirm("Delete?")) { await api.admin.deleteLeave(l.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Leave Application"
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Applicant name" hint="Leave empty to file under your own account"><TextInput value={form.applicantName} onChange={(e) => set("applicantName", e.target.value)} /></Field>
        <Field label="Leave type"><Select value={form.type} onChange={(e) => set("type", e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}</Select></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="From"><NepaliDateInput value={form.fromDate} onChange={(v) => set("fromDate", v)} /></Field>
          <Field label="To"><NepaliDateInput value={form.toDate} onChange={(v) => set("toDate", v)} /></Field>
        </div>
        <Field label="Reason" required><Textarea rows={3} value={form.reason} onChange={(e) => set("reason", e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
