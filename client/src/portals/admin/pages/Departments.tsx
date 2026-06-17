import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, X, RefreshCw, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const STREAMS = [
  { value: "SCIENCE",          label: "Science",          color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "COMMERCE",         label: "Commerce",         color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "HUMANITIES",       label: "Humanities",       color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "COMPUTER_SCIENCE", label: "Computer Science", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "MANAGEMENT",       label: "Management",       color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "OTHER",            label: "Other",            color: "bg-gray-50 text-gray-600 border-gray-200" },
];

function DeptModal({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial?: any; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", code: "", description: "", stream: "OTHER" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) setForm({ name: initial.name ?? "", code: initial.code ?? "", description: initial.description ?? "", stream: initial.stream ?? "OTHER" });
    else setForm({ name: "", code: "", description: "", stream: "OTHER" });
    setError("");
  }, [initial, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.name) { setError("Department name is required"); return; }
    setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{initial ? "Edit Department" : "Add Department"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Department Name <span className="text-rose-400">*</span></label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Science Department"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SCI"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stream / Type</label>
              <select value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                {STREAMS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Saving..." : initial ? "Update" : "Create Department"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Departments() {
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editDept, setEditDept] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => { setLoading(true); api.admin.departments().then((d) => setDepts(Array.isArray(d) ? d : d.departments ?? [])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const streamCfg = (s: string) => STREAMS.find((x) => x.value === s) ?? STREAMS[STREAMS.length - 1];

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Departments & Streams</h1>
            <p className="text-sm text-gray-500 mt-0.5">{depts.length} departments configured</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button onClick={() => { setEditDept(null); setModal(true); }}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Add Department
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-36 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          )) : depts.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 text-center py-14 bg-white rounded-2xl border border-gray-100">
              <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No departments yet. <button onClick={() => setModal(true)} className="text-blue-600">Create the first one →</button></p>
            </div>
          ) : depts.map((d) => {
            const cfg = streamCfg(d.stream);
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border", cfg.color)}>
                      {d.code ? d.code[0] : d.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{d.name}</p>
                      {d.code && <p className="text-xs text-gray-400">{d.code}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditDept(d); setModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(d.id)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {d.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{d.description}</p>}
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium border", cfg.color)}>{cfg.label}</span>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>{d._count?.grades ?? 0} classes</span>
                    <span>{d._count?.staff ?? 0} staff</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Delete Department?</h3>
            <p className="text-sm text-gray-500 mb-5">This will remove the department. Associated classes will be unlinked.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button onClick={async () => { await api.admin.deleteDepartment(deleteId!); setDeleteId(null); load(); }}
                className="px-4 py-2 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      <DeptModal open={modal} onClose={() => { setModal(false); setEditDept(null); }} initial={editDept}
        onSave={async (d) => {
          if (editDept) await api.admin.updateDepartment(editDept.id, d);
          else await api.admin.createDepartment(d);
          load();
        }} />
    </>
  );
}
