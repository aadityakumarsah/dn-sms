import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Search, X } from "lucide-react";
import { api } from "@/lib/api";

function SubjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (s: any) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [hours, setHours] = useState("5");
  const [isElective, setIsElective] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const autoCode = (n: string) =>
    n.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 6) || n.slice(0, 4).toUpperCase();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const subject = await api.admin.createSubject({
        name: name.trim(),
        code: code.trim() || autoCode(name),
        creditHours: parseInt(hours) || 5,
        isElective,
      });
      onCreated(subject);
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Create Subject</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); if (!code) setCode(autoCode(e.target.value)); }}
              placeholder="e.g. Mathematics"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MATH"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Credit Hours</label>
              <input
                type="number" min="1" max="20"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={isElective} onChange={(e) => setIsElective(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">Elective subject (optional/not compulsory)</span>
          </label>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? "Creating…" : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.admin.subjects()
      .then(setSubjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will remove it from all sections.`)) return;
    setDeleting(id);
    try { await api.admin.deleteSubject(id); setSubjects((prev) => prev.filter((s) => s.id !== id)); }
    catch (e: any) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const filtered = query.trim()
    ? subjects.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.code.toLowerCase().includes(query.toLowerCase())
      )
    : subjects;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {showModal && (
        <SubjectModal
          onClose={() => setShowModal(false)}
          onCreated={(s) => { setSubjects((prev) => [...prev, s]); setShowModal(false); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subjects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all subjects across your school</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Subject
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or code…"
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading subjects…</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-rose-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{query ? "No subjects match your search." : "No subjects yet."}</p>
            {!query && (
              <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-blue-600 hover:underline">
                Create the first subject
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="px-5 py-2.5 border-b border-gray-50 bg-gray-50/60 grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4">
              {["Name", "Code", "Credit Hours", "Type", ""].map((h) => (
                <div key={h} className="text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</div>
              ))}
            </div>
            {filtered.map((s) => (
              <div key={s.id} className="px-5 py-3.5 border-t border-gray-50 hover:bg-gray-50/50 grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                <div className="font-medium text-gray-900 text-sm">{s.name}</div>
                <div className="font-mono text-xs text-gray-500">{s.code}</div>
                <div className="text-sm text-gray-600">{s.creditHours}</div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${s.isElective ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                    {s.isElective ? "Elective" : "Core"}
                  </span>
                </div>
                <button
                  onClick={() => remove(s.id, s.name)}
                  disabled={deleting === s.id}
                  className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-400">
              {filtered.length} subject{filtered.length !== 1 ? "s" : ""}
              {query && subjects.length !== filtered.length && ` of ${subjects.length}`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
