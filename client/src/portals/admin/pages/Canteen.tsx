import { useState } from "react";
import { UtensilsCrossed, Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, useList } from "./_ui";

const CATEGORIES = ["Meal", "Snack", "Beverage", "Dessert", "Combo"];
const DAYS = ["Every day", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Canteen() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.canteen());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: "", category: "Meal", price: "", dayOfWeek: "", available: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openNew = () => { setEdit(null); setForm({ name: "", category: "Meal", price: "", dayOfWeek: "", available: true }); setError(null); setOpen(true); };
  const openEdit = (c: any) => { setEdit(c); setForm({ name: c.name, category: c.category, price: String(c.price), dayOfWeek: c.dayOfWeek ?? "", available: c.available }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.name || form.price === "") { setError("Name and price are required"); return; }
    setSaving(true); setError(null);
    const payload = { ...form, price: Number(form.price), dayOfWeek: form.dayOfWeek === "" ? null : Number(form.dayOfWeek) };
    try {
      if (edit) await api.admin.updateCanteenItem(edit.id, payload);
      else await api.admin.createCanteenItem(payload);
      setOpen(false); reload();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Lunch & Canteen" subtitle="Manage canteen menu and pricing"
        onRefresh={reload} loading={loading} action={{ label: "Add Item", onClick: openNew }} />

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<UtensilsCrossed className="w-8 h-8" />} text="No menu items yet" action={{ label: "Add one", onClick: openNew }} /></div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">{["Item", "Category", "Day", "Price (NPR)", "Status", ""].map((x) => <th key={x} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{x}</th>)}</tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-5 py-3 text-gray-600">{c.category}</td>
                    <td className="px-5 py-3 text-gray-500">{DAYS[c.dayOfWeek != null ? c.dayOfWeek + 1 : 0] ?? "Every day"}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{Number(c.price).toLocaleString()}</td>
                    <td className="px-5 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", c.available ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400")}>{c.available ? "Available" : "Off"}</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(c)} className="p-1 text-gray-300 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={async () => { if (confirm("Delete this item?")) { await api.admin.deleteCanteenItem(c.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Edit Item" : "Add Menu Item"}
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Item name" required><TextInput value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category"><Select value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Price (NPR)" required><TextInput type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></Field>
        </div>
        <Field label="Available on"><Select value={form.dayOfWeek} onChange={(e) => set("dayOfWeek", e.target.value)}>{DAYS.map((d, i) => <option key={d} value={i === 0 ? "" : i - 1}>{d}</option>)}</Select></Field>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} className="w-4 h-4 accent-blue-600" /> Currently available</label>
      </Modal>
    </div>
  );
}
