import { useState, useEffect } from "react";
import { Plus, X, Search, RefreshCw, Book, ArrowLeftRight, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const ISSUE_STATUS: Record<string, { label: string; color: string }> = {
  ISSUED:   { label: "Issued",   color: "bg-blue-50 text-blue-700" },
  RETURNED: { label: "Returned", color: "bg-emerald-50 text-emerald-700" },
  OVERDUE:  { label: "Overdue",  color: "bg-rose-50 text-rose-600" },
  LOST:     { label: "Lost",     color: "bg-gray-100 text-gray-500" },
};

function BookModal({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial?: any; onSave: (d: any) => Promise<void> }) {
  const [form, setForm] = useState({ title: "", author: "", isbn: "", publisher: "", category: "", totalCopies: "1", shelfNo: "", publishYear: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) setForm({ title: initial.title ?? "", author: initial.author ?? "", isbn: initial.isbn ?? "", publisher: initial.publisher ?? "", category: initial.category ?? "", totalCopies: String(initial.totalCopies ?? 1), shelfNo: initial.shelfNo ?? "", publishYear: String(initial.publishYear ?? "") });
    else setForm({ title: "", author: "", isbn: "", publisher: "", category: "", totalCopies: "1", shelfNo: "", publishYear: "" });
    setError("");
  }, [initial, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.title) { setError("Book title is required"); return; }
    setSaving(true); setError("");
    try { await onSave({ ...form, totalCopies: parseInt(form.totalCopies) || 1, publishYear: form.publishYear ? parseInt(form.publishYear) : null }); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const F = ({ label, k, type = "text", placeholder = "" }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{initial ? "Edit Book" : "Add Book"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <F label="Book Title *" k="title" placeholder="e.g. Physics Part I" />
          <F label="Author" k="author" placeholder="Author name" />
          <div className="grid grid-cols-2 gap-4">
            <F label="ISBN" k="isbn" placeholder="978-XXXXXXXXX" />
            <F label="Publisher" k="publisher" placeholder="Publisher name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Category" k="category" placeholder="Science / Fiction / etc." />
            <F label="Publish Year" k="publishYear" type="number" placeholder="2024" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Total Copies" k="totalCopies" type="number" placeholder="1" />
            <F label="Shelf No." k="shelfNo" placeholder="A-12" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Saving..." : initial ? "Update Book" : "Add Book"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Library() {
  const [data, setData] = useState<any>({ books: [], total: 0, categories: [] });
  const [issues, setIssues] = useState<any>({ issues: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [tab, setTab] = useState<"catalog" | "issues">("catalog");
  const [modal, setModal] = useState(false);
  const [editBook, setEditBook] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t); }, [search]);

  const loadBooks = () => {
    setLoading(true);
    api.admin.libraryBooks({ search: debouncedSearch || undefined, category: catFilter || undefined }).then(setData).finally(() => setLoading(false));
  };
  const loadIssues = () => { api.admin.bookIssues().then(setIssues); };

  useEffect(() => { loadBooks(); }, [debouncedSearch, catFilter]);
  useEffect(() => { loadIssues(); }, []);

  const stats = [
    { label: "Total Books", value: data.total ?? 0, icon: Book, color: "text-blue-600 bg-blue-50" },
    { label: "Currently Issued", value: issues.issues?.filter((i: any) => i.status === "ISSUED").length ?? 0, icon: ArrowLeftRight, color: "text-amber-600 bg-amber-50" },
    { label: "Overdue", value: issues.issues?.filter((i: any) => i.status === "OVERDUE").length ?? 0, icon: Clock, color: "text-rose-600 bg-rose-50" },
    { label: "Returned Today", value: issues.issues?.filter((i: any) => i.status === "RETURNED" && i.returnedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length ?? 0, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">Book catalog and issue management</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { loadBooks(); loadIssues(); }} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            {tab === "catalog" && (
              <button onClick={() => { setEditBook(null); setModal(true); }}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> Add Book
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => { const Icon = s.icon; return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.color)}><Icon className="w-4 h-4" /></div>
              <div><p className="text-xs text-gray-400">{s.label}</p><p className="font-bold text-gray-900">{s.value}</p></div>
            </div>
          ); })}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-xs">
          {(["catalog", "issues"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors capitalize",
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              {t === "catalog" ? "Book Catalog" : "Issue/Return"}
            </button>
          ))}
        </div>

        {tab === "catalog" && (
          <>
            <div className="flex gap-3 flex-wrap items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, author, ISBN..."
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 w-56" />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="">All categories</option>
                {(data.categories ?? []).map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50">{["Title", "Author", "ISBN", "Category", "Available", "Shelf", ""].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => <tr key={i} className="border-t border-gray-50"><td colSpan={7} className="px-5 py-3"><div className="h-7 bg-gray-50 rounded animate-pulse" /></td></tr>)
                  : data.books.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">No books found.</td></tr>
                  : data.books.map((b: any) => (
                    <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50/50 group">
                      <td className="px-5 py-3 font-medium text-gray-900">{b.title}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{b.author ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{b.isbn ?? "—"}</td>
                      <td className="px-5 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{b.category ?? "—"}</span></td>
                      <td className="px-5 py-3">
                        <span className={cn("text-xs font-semibold", b.availableCopies === 0 ? "text-rose-500" : "text-emerald-600")}>
                          {b.availableCopies}/{b.totalCopies}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{b.shelfNo ?? "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditBook(b); setModal(true); }} className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100">Edit</button>
                          <button onClick={() => setDeleteId(b.id)} className="text-xs px-2.5 py-1 border border-rose-100 rounded-lg text-rose-500 hover:bg-rose-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "issues" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">{["Book", "Student/Staff", "Issued", "Due Date", "Returned", "Status", "Fine", ""].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {issues.issues.length === 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">No book issues yet.</td></tr>
                : issues.issues.map((i: any) => {
                  const cfg = ISSUE_STATUS[i.status] ?? ISSUE_STATUS.ISSUED;
                  return (
                    <tr key={i.id} className="border-t border-gray-50 hover:bg-gray-50/50 group">
                      <td className="px-5 py-3 font-medium text-gray-900 text-sm">{i.book?.title}</td>
                      <td className="px-5 py-3 text-gray-600 text-sm">{i.studentName ?? i.staffId ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{new Date(i.issuedAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{new Date(i.dueDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{i.returnedAt ? new Date(i.returnedAt).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-3"><span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium", cfg.color)}>{cfg.label}</span></td>
                      <td className="px-5 py-3 text-xs text-gray-500">{i.fine ? `NPR ${i.fine}` : "—"}</td>
                      <td className="px-5 py-3">
                        {i.status === "ISSUED" && (
                          <button onClick={async () => { await api.admin.returnBook(i.id); loadIssues(); loadBooks(); }}
                            className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-100">
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Delete Book?</h3>
            <p className="text-sm text-gray-500 mb-5">This will permanently remove the book from the catalog.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button onClick={async () => { await api.admin.deleteBook(deleteId!); setDeleteId(null); loadBooks(); }}
                className="px-4 py-2 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      <BookModal open={modal} onClose={() => { setModal(false); setEditBook(null); }} initial={editBook}
        onSave={async (d) => { if (editBook) await api.admin.updateBook(editBook.id, d); else await api.admin.createBook(d); loadBooks(); }} />
    </>
  );
}
