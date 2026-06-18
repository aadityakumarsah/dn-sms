import { useState } from "react";
import { Wallet, Trash2, Pencil, Plus, ChevronRight, X, AlertTriangle, RefreshCw as Recurring } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "PRE_ADMISSION",  label: "Pre-Admission / Registration" },
  { value: "ADMISSION",      label: "Admission Fee" },
  { value: "POST_ADMISSION", label: "Post-Admission Fee" },
  { value: "REGISTRATION",   label: "Registration Fee" },
  { value: "ANNUAL",         label: "Annual Fee" },
  { value: "MONTHLY",        label: "Monthly Tuition" },
  { value: "TUITION",        label: "Tuition Fee" },
  { value: "TERMINAL_1",     label: "First Terminal Fee" },
  { value: "TERMINAL_2",     label: "Second Terminal Fee" },
  { value: "TERMINAL_3",     label: "Third Terminal Fee" },
  { value: "EXAM",           label: "Examination Fee" },
  { value: "TRANSPORT",      label: "Bus / Transport Fee" },
  { value: "LIBRARY",        label: "Library Fee" },
  { value: "COMPUTER_LAB",   label: "Computer / Lab Fee" },
  { value: "SPORTS",         label: "Sports Fee" },
  { value: "ECA",            label: "ECA / Extracurricular" },
  { value: "MATERIALS",      label: "Educational Materials" },
  { value: "HOSTEL",         label: "Hostel / Boarding" },
  { value: "MEAL",           label: "Meal / Canteen" },
  { value: "DEPOSIT",        label: "Deposit (Refundable)" },
  { value: "IDENTITY_CARD",  label: "ID Card" },
  { value: "BOARD_EXAM",     label: "Board / NEB Exam" },
  { value: "OTHER",          label: "Other" },
];

const catLabel = (v?: string | null) => CATEGORIES.find((c) => c.value === v)?.label ?? v ?? "Other";
const npr = (n: number | string) => `Rs ${Number(n || 0).toLocaleString()}`;

const CAT_COLOR: Record<string, string> = {
  PRE_ADMISSION: "bg-purple-50 text-purple-700", ADMISSION: "bg-blue-50 text-blue-700",
  POST_ADMISSION: "bg-indigo-50 text-indigo-700", REGISTRATION: "bg-violet-50 text-violet-700",
  MONTHLY: "bg-emerald-50 text-emerald-700", TUITION: "bg-teal-50 text-teal-700",
  ANNUAL: "bg-cyan-50 text-cyan-700", EXAM: "bg-orange-50 text-orange-700",
  TERMINAL_1: "bg-amber-50 text-amber-700", TERMINAL_2: "bg-yellow-50 text-yellow-700",
  TERMINAL_3: "bg-lime-50 text-lime-700", TRANSPORT: "bg-sky-50 text-sky-700",
  LIBRARY: "bg-rose-50 text-rose-700", COMPUTER_LAB: "bg-pink-50 text-pink-700",
  SPORTS: "bg-green-50 text-green-700", OTHER: "bg-gray-100 text-gray-600",
};

type Installment = { id?: string; installmentNo?: number; label?: string; dueStage?: string; amount?: number | string; dueDay?: number | string };
type FormState = {
  name: string; category: string; level: string; stream: string; gradeId: string;
  amount: string; dueDay: string; isRecurring: boolean; installments: Installment[];
};
const blankForm = (): FormState => ({ name: "", category: "MONTHLY", level: "", stream: "", gradeId: "", amount: "", dueDay: "", isRecurring: false, installments: [] });
const STREAMS = ["", "Science", "Management", "Computer Science", "Humanities", "Biology", "Law", "Education"];

export default function FeeStructures() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.feeStructures());
  const { data: classData } = useList<any>(() => api.admin.classes());
  const grades: any[] = classData?.grades ?? [];
  const list = data ?? [];

  const [selectedGrade, setSelectedGrade] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = (grade?: any) => {
    setEditId(null);
    setForm({ ...blankForm(), gradeId: grade?.id ?? "", level: grade?.gradeNumber != null ? String(grade.gradeNumber) : "" });
    setError(null); setOpen(true);
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      name: s.name ?? "", category: s.category ?? "OTHER",
      level: s.level == null ? "" : String(s.level), stream: s.stream ?? "",
      gradeId: s.gradeId ?? "", amount: s.amount == null ? "" : String(s.amount),
      dueDay: s.dueDay == null ? "" : String(s.dueDay), isRecurring: !!s.isRecurring,
      installments: (s.installments ?? []).map((i: any) => ({
        id: i.id, installmentNo: i.installmentNo, label: i.label ?? "", dueStage: i.dueStage ?? "",
        amount: i.amount == null ? "" : String(i.amount), dueDay: i.dueDay == null ? "" : String(i.dueDay),
      })),
    });
    setError(null); setOpen(true);
  };

  const addRow = () => set("installments", [...form.installments, { dueStage: "", label: "", amount: "" }]);
  const removeRow = (idx: number) => set("installments", form.installments.filter((_, i) => i !== idx));
  const updRow = (idx: number, patch: Partial<Installment>) =>
    set("installments", form.installments.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const installmentSum = form.installments.reduce((s, r) => s + Number(r.amount || 0), 0);
  const baseAmount = Number(form.amount || 0);
  const sumMismatch = form.installments.length > 0 && baseAmount > 0 && installmentSum !== baseAmount;

  const save = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError(null);
    const payload: Record<string, unknown> = {
      name: form.name.trim(), category: form.category,
      level: form.level === "" ? undefined : Number(form.level),
      stream: form.stream || undefined, gradeId: form.gradeId || undefined,
      amount: Number(form.amount || 0),
      dueDay: form.dueDay === "" ? undefined : Number(form.dueDay),
      isRecurring: form.isRecurring,
      installments: form.installments.map((r, i) => ({
        installmentNo: r.installmentNo ?? i + 1, label: r.label || undefined,
        dueStage: r.dueStage || undefined, amount: Number(r.amount || 0),
        dueDay: r.dueDay === "" || r.dueDay === undefined ? undefined : Number(r.dueDay),
      })),
    };
    try {
      if (editId) await api.admin.updateFeeStructure(editId, payload);
      else await api.admin.createFeeStructure(payload);
      setOpen(false); reload();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const del = async (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete fee structure "${s.name}"?`)) return;
    try { await api.admin.deleteFeeStructure(s.id); } finally { reload(); }
  };

  const structuresForGrade = (grade: any): any[] =>
    list.filter((s) => (s.gradeId && s.gradeId === grade.id) || (!s.gradeId && s.level === grade.gradeNumber));
  const ungradedStructures = list.filter((s) => !s.gradeId && s.level == null);

  const gradeSummary = (grade: any) => {
    const items = structuresForGrade(grade);
    const total = items.reduce((t, s) => t + Number(s.amount || 0), 0);
    return { count: items.length, total };
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Fee Structures" subtitle="Click a grade card to manage its fee schedule"
        onRefresh={reload} loading={loading} action={{ label: "New Structure", onClick: () => openCreate() }} />

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-gray-50 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {grades.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Classes</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {grades.map((grade) => {
                  const { count, total } = gradeSummary(grade);
                  const isSelected = selectedGrade?.id === grade.id;
                  return (
                    <button key={grade.id} onClick={() => setSelectedGrade(isSelected ? null : grade)}
                      className={cn("text-left bg-white rounded-2xl border p-4 hover:shadow-md transition-all", isSelected ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-100")}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{grade.name}</p>
                          {grade.department && <p className="text-xs text-gray-400">{grade.department}</p>}
                        </div>
                        <ChevronRight className={cn("w-4 h-4 text-gray-300 mt-0.5 transition-transform", isSelected && "rotate-90")} />
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-400">{count} fee type{count !== 1 ? "s" : ""}</p>
                          {total > 0 && <p className="text-sm font-bold text-gray-900 mt-0.5">{npr(total)}/yr</p>}
                        </div>
                        {count === 0 && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg font-medium">Not set</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expanded grade panel */}
          {selectedGrade && (
            <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-blue-50/60 border-b border-blue-100">
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedGrade.name} — Fee Schedule</h2>
                  <p className="text-xs text-gray-500 mt-0.5">All fee types for this class</p>
                </div>
                <button onClick={() => openCreate(selectedGrade)}
                  className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-blue-700">
                  <Plus className="w-3.5 h-3.5" /> Add Fee
                </button>
              </div>

              {structuresForGrade(selectedGrade).length === 0 ? (
                <div className="py-10 text-center">
                  <Wallet className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No fees configured for this class yet.</p>
                  <button onClick={() => openCreate(selectedGrade)} className="mt-2 text-sm text-blue-600 hover:underline">Add the first fee →</button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {["Fee Type", "Category", "Amount", "Recurring", "Installments", ""].map((h) => (
                            <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {structuresForGrade(selectedGrade).map((s: any) => (
                          <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50 group">
                            <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                            <td className="px-5 py-3">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CAT_COLOR[s.category] ?? "bg-gray-100 text-gray-600")}>{catLabel(s.category)}</span>
                            </td>
                            <td className="px-5 py-3 font-semibold text-gray-900 tabular-nums">{npr(s.amount)}</td>
                            <td className="px-5 py-3 text-gray-500">{s.isRecurring ? "Monthly" : "One-time"}</td>
                            <td className="px-5 py-3 text-gray-500">{(s.installments ?? []).length > 0 ? `${s.installments.length} inst.` : "—"}</td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-300 hover:text-blue-600 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => del(s, e)} className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 bg-gray-50/50 flex items-center justify-between text-sm border-t border-gray-50">
                    <span className="text-gray-500 font-medium">Estimated annual total</span>
                    <span className="font-bold text-gray-900">{npr(structuresForGrade(selectedGrade).reduce((t, s) => t + Number(s.amount || 0), 0))}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* General structures */}
          {ungradedStructures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">General / All Classes</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ungradedStructures.map((s: any) => {
                  const insts: any[] = s.installments ?? [];
                  const instTotal = insts.reduce((t, i) => t + Number(i.amount || 0), 0);
                  return (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CAT_COLOR[s.category] ?? "bg-gray-100 text-gray-600")}>{catLabel(s.category)}</span>
                          {s.isRecurring && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Recurring className="w-3 h-3" /> Recurring</span>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openEdit(s)} className="p-1.5 text-gray-300 hover:text-blue-600 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={(e) => del(s, e)} className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-2">{npr(s.amount)}</p>
                      {insts.length > 0 && (
                        <div className="mt-3 border-t border-gray-100 pt-2.5 space-y-1">
                          {insts.map((i: any) => (
                            <div key={i.id ?? i.installmentNo} className="flex justify-between text-xs">
                              <span className="text-gray-500 truncate"><span className="text-gray-400">#{i.installmentNo}</span> {i.dueStage || i.label || "—"}</span>
                              <span className="text-gray-700 font-medium tabular-nums">{npr(i.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs pt-1.5 border-t border-gray-50">
                            <span className="text-gray-400">Total</span>
                            <span className={cn("font-semibold tabular-nums", instTotal === Number(s.amount) ? "text-emerald-600" : "text-amber-600")}>{npr(instTotal)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {list.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100">
              <Empty icon={<Wallet className="w-8 h-8" />} text="No fee structures configured yet"
                action={{ label: "Create one", onClick: () => openCreate() }} />
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit Fee Structure" : "New Fee Structure"} wide
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} label={editId ? "Save Changes" : "Create"} /></>}>
        <ErrorMsg msg={error} />

        <Field label="Name" required>
          <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Grade 9 Annual Fee" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" required>
            <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="Stream" hint="Optional — pin to one stream">
            <Select value={form.stream} onChange={(e) => set("stream", e.target.value)}>
              {STREAMS.map((s) => <option key={s} value={s}>{s === "" ? "— Any stream —" : s}</option>)}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Class / Grade">
            <Select value={form.gradeId} onChange={(e) => {
              const g = grades.find((x) => x.id === e.target.value);
              set("gradeId", e.target.value);
              if (g) set("level", String(g.gradeNumber ?? ""));
            }}>
              <option value="">— All classes —</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </Field>
          <Field label="Amount (NPR)" required>
            <TextInput type="number" min={0} value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Due day" hint="Day of month (1–31), optional">
            <TextInput type="number" min={1} max={31} value={form.dueDay} onChange={(e) => set("dueDay", e.target.value)} placeholder="e.g. 10" />
          </Field>
          <div className="flex items-center gap-2.5 pt-5">
            <input type="checkbox" id="isRecurring" checked={form.isRecurring} onChange={(e) => set("isRecurring", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400" />
            <label htmlFor="isRecurring" className="text-sm text-gray-700 cursor-pointer">Recurring (monthly)</label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">Installment plan</p>
              <p className="text-xs text-gray-400">Break into stages (pre-admission, term-1, etc.)</p>
            </div>
            <button onClick={addRow} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {form.installments.length === 0 ? (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-4 text-center">No installments — full amount collected at once.</div>
          ) : (
            <div className="space-y-2">
              {form.installments.map((r, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 text-xs text-gray-400 text-center font-medium">#{idx + 1}</div>
                  <TextInput className="col-span-3" value={r.dueStage ?? ""} onChange={(e) => updRow(idx, { dueStage: e.target.value })} placeholder="stage" />
                  <TextInput className="col-span-4" value={r.label ?? ""} onChange={(e) => updRow(idx, { label: e.target.value })} placeholder="label" />
                  <TextInput className="col-span-3" type="number" min={0} value={r.amount ?? ""} onChange={(e) => updRow(idx, { amount: e.target.value })} placeholder="amount" />
                  <button onClick={() => removeRow(idx)} className="col-span-1 p-1.5 text-gray-300 hover:text-rose-500 rounded-lg flex justify-center"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 text-sm border-t border-gray-100">
                <span className="text-gray-500">Installments total</span>
                <span className={cn("font-semibold tabular-nums", sumMismatch ? "text-amber-600" : "text-gray-900")}>{npr(installmentSum)}</span>
              </div>
              {sumMismatch && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Total ({npr(installmentSum)}) ≠ base ({npr(baseAmount)}) — you can still save.
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
