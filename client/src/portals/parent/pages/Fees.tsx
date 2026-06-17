import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { CreditCard } from "lucide-react";

const statusColor: Record<string, string> = {
  paid:     "bg-emerald-50 text-emerald-700",
  pending:  "bg-amber-50 text-amber-700",
  overdue:  "bg-rose-50 text-rose-700",
  partial:  "bg-blue-50 text-blue-700",
  waived:   "bg-gray-100 text-gray-500",
};

export default function Fees() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChild, setActiveChild] = useState<string>("");

  useEffect(() => {
    api.parent.fees()
      .then((d: any) => {
        const arr = Array.isArray(d) ? d : [];
        setChildren(arr);
        if (arr.length > 0) setActiveChild(arr[0].studentId);
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  const currentChild = children.find((c) => c.studentId === activeChild);
  const fees: any[] = currentChild?.fees ?? [];

  const outstanding = fees.filter((f) => ["PENDING", "OVERDUE"].includes(f.status));
  const paid = fees.filter((f) => f.status === "PAID");
  const totalDue = outstanding.reduce((s: number, f: any) => s + (f.amountDue - f.amountPaid), 0);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Fees</h1>
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center mt-6">
          <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No fee records available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Fees</h1>
        <p className="text-sm text-gray-500 mt-0.5">Outstanding fees and payment history</p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c) => (
            <button key={c.studentId} onClick={() => setActiveChild(c.studentId)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                activeChild === c.studentId ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {currentChild && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl px-5 py-3 text-sm text-teal-800 flex items-center justify-between">
          <span>
            <span className="font-semibold">{currentChild.name}</span>
            <span className="text-teal-600 ml-2">· {currentChild.admissionNo}</span>
          </span>
          {totalDue > 0 && (
            <span className="font-bold text-rose-600">NPR {totalDue.toLocaleString("en-IN")} due</span>
          )}
        </div>
      )}

      {outstanding.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Outstanding Fees</h2>
          {outstanding.map((f: any) => {
            const balance = f.amountDue - f.amountPaid;
            const dueStr = f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
            return (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{f.feeTypeName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Due: {dueStr}</p>
                  {f.amountPaid > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">Partial: NPR {Number(f.amountPaid).toLocaleString("en-IN")} paid</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-800">NPR {balance.toLocaleString("en-IN")}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-lg font-medium capitalize", statusColor[f.status?.toLowerCase()] ?? "bg-gray-100 text-gray-500")}>
                      {f.status?.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
          <p className="text-sm text-gray-400">No fee records for this student.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">All Fee Records</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Fee Type", "Amount Due", "Amount Paid", "Due Date", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fees.map((f: any) => {
                const dueStr = f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                return (
                  <tr key={f.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{f.feeTypeName}</td>
                    <td className="px-5 py-3.5 text-gray-700">NPR {Number(f.amountDue).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 text-gray-700">NPR {Number(f.amountPaid).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5 text-gray-500">{dueStr}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs px-2 py-1 rounded-lg font-medium capitalize", statusColor[f.status?.toLowerCase()] ?? "bg-gray-100 text-gray-500")}>
                        {f.status?.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
