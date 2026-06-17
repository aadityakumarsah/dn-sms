import { cn } from "@/lib/utils";
import { useState } from "react";

const CURRENT = [
  { name: "Ramesh Dhakal", basic: 35000, allowances: 8000, deductions: 3200, status: "Paid" },
  { name: "Sunita Oli", basic: 28000, allowances: 6000, deductions: 2500, status: "Paid" },
  { name: "Kalu Bahadur Thapa", basic: 18000, allowances: 3000, deductions: 1500, status: "Pending" },
  { name: "Bikram Bohara", basic: 20000, allowances: 4000, deductions: 1800, status: "Paid" },
  { name: "Mina Khatri", basic: 22000, allowances: 4500, deductions: 2000, status: "Pending" },
  { name: "Hari Prasad Koirala", basic: 18000, allowances: 3000, deductions: 1500, status: "Paid" },
  { name: "Saraswati Bhandari", basic: 32000, allowances: 7000, deductions: 2900, status: "Pending" },
  { name: "Prakash Sah", basic: 20000, allowances: 4000, deductions: 1800, status: "Paid" },
];

const HISTORY = [
  { month: "Magh 2081", processed: "Magh 30, 2081", total: "NPR 1,85,300", staff: 8, status: "Completed" },
  { month: "Poush 2081", processed: "Poush 29, 2081", total: "NPR 1,82,100", staff: 8, status: "Completed" },
  { month: "Mangsir 2081", processed: "Mangsir 30, 2081", total: "NPR 1,80,500", staff: 8, status: "Completed" },
  { month: "Kartik 2081", processed: "Kartik 30, 2081", total: "NPR 1,80,500", staff: 8, status: "Completed" },
];

const fmt = (n: number) => `NPR ${n.toLocaleString("en-IN")}`;

export default function Payroll() {
  const [tab, setTab] = useState<"current" | "history">("current");
  const [historyMonth, setHistoryMonth] = useState("Magh 2081");

  const totalPayroll = CURRENT.reduce((sum, s) => sum + s.basic + s.allowances - s.deductions, 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payroll</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage staff salaries and payment history</p>
      </div>

      <div className="flex gap-2">
        {(["current", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              tab === t ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {t === "current" ? "Current Month" : "History"}
          </button>
        ))}
      </div>

      {tab === "current" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
              <p className="text-xs text-gray-500 mb-1">Total Payroll — Falgun 2081</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(totalPayroll)}</p>
            </div>
            <button className="bg-orange-500 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-orange-600">
              Process Payroll
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Falgun 2081 — Salary Sheet</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Staff Name", "Basic", "Allowances", "Deductions", "Net Pay", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CURRENT.map((s, i) => {
                  const net = s.basic + s.allowances - s.deductions;
                  return (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{s.name}</td>
                      <td className="px-5 py-3.5 text-gray-600">{fmt(s.basic)}</td>
                      <td className="px-5 py-3.5 text-emerald-600">+{fmt(s.allowances)}</td>
                      <td className="px-5 py-3.5 text-red-500">-{fmt(s.deductions)}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{fmt(net)}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", s.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500">Select Month</label>
            <select
              value={historyMonth}
              onChange={(e) => setHistoryMonth(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {HISTORY.map((h) => <option key={h.month}>{h.month}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Payroll History</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Month", "Processed On", "Total Amount", "Staff Count", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HISTORY.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{r.month}</td>
                    <td className="px-5 py-3.5 text-gray-500">{r.processed}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{r.total}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.staff}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-1 rounded-lg font-medium bg-emerald-50 text-emerald-700">{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
