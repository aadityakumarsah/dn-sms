import { cn } from "@/lib/utils";
import { useState } from "react";
import { CreditCard, X } from "lucide-react";

const OUTSTANDING = [
  { type: "Tuition Fee", amount: 4500, due: "Falgun 15, 2081", month: "Falgun 2081" },
  { type: "Exam Fee", amount: 800, due: "Falgun 20, 2081", month: "Second Terminal" },
  { type: "Sports Fee", amount: 500, due: "Falgun 28, 2081", month: "Annual" },
];

const HISTORY = [
  { date: "Magh 14, 2081", type: "Tuition Fee", amount: 4500, receipt: "RCP-2081-1042", status: "Paid" },
  { date: "Magh 14, 2081", type: "Lab Fee", amount: 1200, receipt: "RCP-2081-1041", status: "Paid" },
  { date: "Poush 16, 2081", type: "Tuition Fee", amount: 4500, receipt: "RCP-2081-0887", status: "Paid" },
  { date: "Mangsir 12, 2081", type: "Tuition Fee", amount: 4500, receipt: "RCP-2081-0710", status: "Paid" },
  { date: "Mangsir 12, 2081", type: "Exam Fee", amount: 800, receipt: "RCP-2081-0709", status: "Paid" },
];

const PAYMENT_METHODS = ["eSewa", "Khalti", "Bank Transfer"];

export default function Fees() {
  const [payItem, setPayItem] = useState<typeof OUTSTANDING[0] | null>(null);
  const [method, setMethod] = useState("eSewa");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Fees</h1>
        <p className="text-sm text-gray-500 mt-0.5">Outstanding fees and payment history for Aarav Sharma</p>
      </div>

      {payItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Pay {payItem.type}</h3>
              <button onClick={() => setPayItem(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="bg-teal-50 rounded-xl px-4 py-3">
              <p className="text-xs text-teal-700 font-medium">{payItem.month}</p>
              <p className="text-2xl font-bold text-teal-700 mt-1">NPR {payItem.amount.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Select Payment Method</p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m} className={cn("flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors", method === m ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:bg-gray-50")}>
                    <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-teal-600" />
                    <span className="text-sm font-medium text-gray-800">{m}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="w-full bg-teal-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-2">
              <CreditCard size={15} />
              Proceed to Pay
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Outstanding Fees</h2>
        {OUTSTANDING.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{item.type}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.month} · Due: {item.due}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-bold text-gray-800">NPR {item.amount.toLocaleString("en-IN")}</p>
              <button
                onClick={() => setPayItem(item)}
                className="bg-teal-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-teal-700"
              >
                Pay Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Payment History</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Fee Type", "Amount", "Receipt No.", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((r, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                <td className="px-5 py-3.5 text-gray-600">{r.date}</td>
                <td className="px-5 py-3.5 font-medium text-gray-900">{r.type}</td>
                <td className="px-5 py-3.5 font-semibold text-gray-800">NPR {r.amount.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{r.receipt}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2 py-1 rounded-lg font-medium bg-emerald-50 text-emerald-700">{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
