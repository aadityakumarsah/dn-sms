import { useState, useEffect } from "react";
import { X, RefreshCw, DollarSign, AlertTriangle, CheckCircle, Clock, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const FEE_STATUS: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  PAID:    { label: "Paid",    bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  PENDING: { label: "Pending", bg: "bg-amber-50",   text: "text-amber-700",   icon: Clock },
  PARTIAL: { label: "Partial", bg: "bg-blue-50",    text: "text-blue-700",    icon: Clock },
  OVERDUE: { label: "Overdue", bg: "bg-rose-50",    text: "text-rose-600",    icon: AlertTriangle },
  WAIVED:  { label: "Waived",  bg: "bg-gray-100",   text: "text-gray-500",    icon: Ban },
};

function PayModal({ open, onClose, fee, onPaid }: { open: boolean; onClose: () => void; fee: any; onPaid: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (fee) setAmount(String(Number(fee.amountDue) - Number(fee.amountPaid))); }, [fee]);
  if (!open || !fee) return null;

  const handlePay = async () => {
    setSaving(true);
    try { await api.admin.recordFeePayment(fee.id, { amountPaid: parseFloat(amount), paymentMethod: method }); onPaid(); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="font-bold text-gray-900 mb-1">Record Payment</h2>
        <p className="text-xs text-gray-400 mb-4">{fee.studentName} · {fee.feeType}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (NPR)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              {["Cash", "eSewa", "Khalti", "Bank Transfer", "Cheque"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handlePay} disabled={saving || !amount}
            className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-medium">
            {saving ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Fees() {
  const [data, setData] = useState<any>({ collections: [], total: 0, summary: [] });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [payModal, setPayModal] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.admin.fees({ status: statusFilter || undefined, search: search || undefined, page }).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, page]);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [search]);

  const quickStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try { await api.admin.updateFeeStatus(id, { status }); load(); }
    finally { setUpdatingId(null); }
  };

  const totalDue = (data.summary ?? []).reduce((s: number, x: any) => s + Number(x._sum?.amountDue ?? 0), 0);
  const totalCollected = (data.summary ?? []).reduce((s: number, x: any) => s + Number(x._sum?.amountPaid ?? 0), 0);

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fees</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fee collection management</p>
          </div>
          <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Due", value: `NPR ${(totalDue / 1000).toFixed(1)}K`, icon: DollarSign, color: "text-gray-600 bg-gray-50" },
            { label: "Collected", value: `NPR ${(totalCollected / 1000).toFixed(1)}K`, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
            { label: "Outstanding", value: `NPR ${((totalDue - totalCollected) / 1000).toFixed(1)}K`, icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.color)}><Icon className="w-4 h-4" /></div>
                <div><p className="text-xs text-gray-400">{s.label}</p><p className="font-bold text-gray-900 text-sm">{s.value}</p></div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student name..."
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 w-48" />
          {["", "PENDING", "OVERDUE", "PARTIAL", "PAID", "WAIVED"].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn("text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors",
                statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300")}>
              {s === "" ? "All" : FEE_STATUS[s]?.label ?? s}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Receipt", "Student", "Fee Type", "Due", "Paid", "Due Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50"><td colSpan={8} className="px-5 py-3"><div className="h-7 bg-gray-50 rounded animate-pulse" /></td></tr>
                )) : data.collections.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">No fee records found.</td></tr>
                ) : data.collections.map((f: any) => {
                  const cfg = FEE_STATUS[f.status] ?? FEE_STATUS.PENDING;
                  const Icon = cfg.icon;
                  const isPending = f.status === "PENDING" || f.status === "OVERDUE" || f.status === "PARTIAL";
                  const isUpdating = updatingId === f.id;
                  return (
                    <tr key={f.id} className="border-t border-gray-50 hover:bg-gray-50/50 group">
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{f.receiptNo ?? "—"}</td>
                      <td className="px-5 py-3 font-medium text-gray-900 text-sm">{f.studentName}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{f.feeType}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">NPR {Number(f.amountDue).toLocaleString()}</td>
                      <td className="px-5 py-3 text-gray-600">NPR {Number(f.amountPaid).toLocaleString()}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{new Date(f.dueDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 w-fit", cfg.bg, cfg.text)}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isPending && (
                            <>
                              <button onClick={() => setPayModal(f)} disabled={isUpdating}
                                className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-medium hover:bg-blue-100 disabled:opacity-50">
                                Collect
                              </button>
                              <button onClick={() => quickStatus(f.id, "PAID")} disabled={isUpdating}
                                className="text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 disabled:opacity-50">
                                {isUpdating ? "..." : "Mark Paid"}
                              </button>
                              <button onClick={() => quickStatus(f.id, "WAIVED")} disabled={isUpdating}
                                className="text-xs px-2.5 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50">
                                Waive
                              </button>
                            </>
                          )}
                          {f.status === "PAID" && (
                            <button onClick={() => quickStatus(f.id, "PENDING")} disabled={isUpdating}
                              className="text-xs px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-medium hover:bg-amber-100 disabled:opacity-50">
                              {isUpdating ? "..." : "Revert"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.total > 20 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">{data.collections.length} of {data.total}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={data.collections.length < 20} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PayModal open={!!payModal} onClose={() => setPayModal(null)} fee={payModal} onPaid={load} />
    </>
  );
}
