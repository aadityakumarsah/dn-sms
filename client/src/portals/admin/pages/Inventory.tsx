import { useState } from "react";
import { Boxes, Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PageHeader, Modal, Field, TextInput, Select, SaveBtn, CancelBtn, ErrorMsg, Empty, SearchBar, useList } from "./_ui";

const CATEGORIES = ["FURNITURE", "ELECTRONICS", "STATIONERY", "SPORTS", "LAB_EQUIPMENT", "BOOKS", "OTHER"];
const CONDITIONS = ["GOOD", "FAIR", "POOR", "DAMAGED", "NEW"];
const COND_BADGE: Record<string, string> = {
  NEW: "bg-emerald-50 text-emerald-700", GOOD: "bg-blue-50 text-blue-700", FAIR: "bg-amber-50 text-amber-700",
  POOR: "bg-orange-50 text-orange-700", DAMAGED: "bg-rose-50 text-rose-600",
};

export default function Inventory() {
  const { data, loading, reload } = useList<any[]>(() => api.admin.inventory());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<any>({ name: "", category: "STATIONERY", quantity: "0", unit: "pcs", condition: "GOOD", location: "", unitPrice: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = (data ?? []).filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openNew = () => { setEdit(null); setForm({ name: "", category: "STATIONERY", quantity: "0", unit: "pcs", condition: "GOOD", location: "", unitPrice: "" }); setError(null); setOpen(true); };
  const openEdit = (i: any) => { setEdit(i); setForm({ name: i.name, category: i.category, quantity: String(i.quantity), unit: i.unit, condition: i.condition, location: i.location ?? "", unitPrice: i.unitPrice != null ? String(i.unitPrice) : "" }); setError(null); setOpen(true); };

  const save = async () => {
    if (!form.name) { setError("Name is required"); return; }
    setSaving(true); setError(null);
    try {
      if (edit) await api.admin.updateInventory(edit.id, form);
      else await api.admin.createInventory(form);
      setOpen(false); reload();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Inventory" subtitle="Track school assets and supplies"
        onRefresh={reload} loading={loading} action={{ label: "Add Item", onClick: openNew }} />

      <div className="max-w-sm"><SearchBar value={q} onChange={setQ} placeholder="Search items…" /></div>

      {loading ? <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
        : list.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100"><Empty icon={<Boxes className="w-8 h-8" />} text="No inventory items yet" action={{ label: "Add one", onClick: openNew }} /></div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">{["Item", "Category", "Qty", "Condition", "Location", "Unit Price", ""].map((x) => <th key={x} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{x}</th>)}</tr></thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{i.name}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{i.category.replace("_", " ").toLowerCase()}</td>
                    <td className="px-5 py-3 text-gray-700">{i.quantity} {i.unit}</td>
                    <td className="px-5 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-md font-medium capitalize", COND_BADGE[i.condition] ?? "bg-gray-100 text-gray-500")}>{i.condition.toLowerCase()}</span></td>
                    <td className="px-5 py-3 text-gray-500">{i.location ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-700">{i.unitPrice != null ? `NPR ${Number(i.unitPrice).toLocaleString()}` : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(i)} className="p-1 text-gray-300 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={async () => { if (confirm("Delete this item?")) { await api.admin.deleteInventory(i.id); reload(); } }} className="p-1 text-gray-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Edit Item" : "Add Inventory Item"}
        footer={<><CancelBtn onClick={() => setOpen(false)} /><SaveBtn onClick={save} saving={saving} /></>}>
        <ErrorMsg msg={error} />
        <Field label="Item name" required><TextInput value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category"><Select value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}</Select></Field>
          <Field label="Condition"><Select value={form.condition} onChange={(e) => set("condition", e.target.value)}>{CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Quantity"><TextInput type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field>
          <Field label="Unit"><TextInput value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="pcs" /></Field>
          <Field label="Unit price"><TextInput type="number" value={form.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} /></Field>
        </div>
        <Field label="Location"><TextInput value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Store room A" /></Field>
      </Modal>
    </div>
  );
}
