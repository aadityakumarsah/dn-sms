import { cn } from "@/lib/utils";
import { Plus, Download } from "lucide-react";

const ITEMS = [
  { name: "Wooden Bench (Double)", category: "Furniture", qty: 120, unit: "pcs", condition: "Good", updated: "Magh 15, 2081" },
  { name: "Teacher's Chair", category: "Furniture", qty: 32, unit: "pcs", condition: "Good", updated: "Magh 15, 2081" },
  { name: "Projector (Epson)", category: "Electronics", qty: 4, unit: "pcs", condition: "Good", updated: "Poush 20, 2081" },
  { name: "Desktop Computer", category: "Electronics", qty: 22, unit: "pcs", condition: "Fair", updated: "Mangsir 10, 2081" },
  { name: "A4 Paper Ream", category: "Stationery", qty: 85, unit: "reams", condition: "Good", updated: "Falgun 1, 2081" },
  { name: "Whiteboard Marker Set", category: "Stationery", qty: 40, unit: "sets", condition: "Good", updated: "Falgun 1, 2081" },
  { name: "Football", category: "Sports", qty: 8, unit: "pcs", condition: "Fair", updated: "Kartik 5, 2081" },
  { name: "Volleyball Net", category: "Sports", qty: 2, unit: "pcs", condition: "Poor", updated: "Ashadh 12, 2081" },
  { name: "Science Lab Kit", category: "Electronics", qty: 5, unit: "sets", condition: "Good", updated: "Shrawan 20, 2081" },
  { name: "Blackboard Duster", category: "Stationery", qty: 60, unit: "pcs", condition: "Fair", updated: "Falgun 1, 2081" },
];

const CATEGORIES = ["Furniture", "Electronics", "Stationery", "Sports"];

const catColor = (c: string) => {
  const map: Record<string, string> = {
    Furniture: "bg-amber-50 text-amber-700",
    Electronics: "bg-blue-50 text-blue-700",
    Stationery: "bg-purple-50 text-purple-700",
    Sports: "bg-emerald-50 text-emerald-700",
  };
  return map[c] ?? "bg-gray-100 text-gray-600";
};

const condColor = (c: string) =>
  c === "Good" ? "bg-emerald-50 text-emerald-700" :
  c === "Fair" ? "bg-amber-50 text-amber-700" :
  "bg-red-50 text-red-600";

export default function Inventory() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track school assets and supplies</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 text-gray-600 rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
            <Download size={14} />
            Export
          </button>
          <button className="bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-orange-600 flex items-center gap-2">
            <Plus size={15} />
            Add Item
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {CATEGORIES.map((cat) => {
          const count = ITEMS.filter((i) => i.category === cat).length;
          return (
            <div key={cat} className={cn("rounded-xl px-4 py-2.5 flex items-center gap-2", catColor(cat))}>
              <span className="text-sm font-semibold">{cat}</span>
              <span className="text-xs opacity-70">{count} items</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">All Items ({ITEMS.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Item Name", "Category", "Quantity", "Unit", "Condition", "Last Updated"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((item, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                <td className="px-5 py-3.5 font-medium text-gray-900">{item.name}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", catColor(item.category))}>{item.category}</span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-800">{item.qty}</td>
                <td className="px-5 py-3.5 text-gray-500">{item.unit}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", condColor(item.condition))}>{item.condition}</span>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{item.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
