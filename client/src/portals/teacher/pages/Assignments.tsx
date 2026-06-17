import { cn } from "@/lib/utils";
import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";

const ACTIVE = [
  { title: "Quadratic Equations – Practice Set", cls: "Class 10 A", due: "Falgun 5, 2081", submitted: 28, total: 36, status: "Active" },
  { title: "Trigonometry Worksheet", cls: "Class 9 B", due: "Falgun 6, 2081", submitted: 20, total: 33, status: "Active" },
  { title: "Algebra Chapter 4 Exercise", cls: "Class 8 A", due: "Falgun 3, 2081", submitted: 35, total: 35, status: "Grading" },
];

const PAST = [
  { title: "Linear Equations Test", cls: "Class 10 A", dueDate: "Magh 20, 2081", graded: 36, pending: 0 },
  { title: "Pythagoras – Assignment 2", cls: "Class 9 B", dueDate: "Magh 18, 2081", graded: 30, pending: 3 },
  { title: "Fractions Worksheet", cls: "Class 8 A", dueDate: "Magh 15, 2081", graded: 35, pending: 0 },
  { title: "Geometry Basics", cls: "Class 10 A", dueDate: "Magh 10, 2081", graded: 36, pending: 0 },
];

export default function Assignments() {
  const [tab, setTab] = useState<"active" | "past">("active");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [cls, setCls] = useState("Class 10 A");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track student assignments</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={15} />
          New Assignment
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Create Assignment</h2>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Class</label>
              <select value={cls} onChange={(e) => setCls(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                {["Class 10 A", "Class 9 B", "Class 8 A"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Subject</label>
              <input defaultValue="Mathematics" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Instructions</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Describe the assignment..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Due Date</label>
              <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="e.g. Falgun 10, 2081" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Max Marks</label>
              <input value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="col-span-2 flex justify-end">
              <button className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-green-700">
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(["active", "past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors", tab === t ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
            {t === "active" ? "Active" : "Past"}
          </button>
        ))}
      </div>

      {tab === "active" && (
        <div className="grid grid-cols-3 gap-4">
          {ACTIVE.map((a) => (
            <div key={a.title} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug">{a.title}</h3>
                <span className={cn("text-xs px-2 py-1 rounded-lg font-medium shrink-0", a.status === "Active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>{a.status}</span>
              </div>
              <p className="text-xs text-gray-500">{a.cls} · Due {a.due}</p>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Submitted</span>
                  <span className="font-semibold text-gray-700">{a.submitted}/{a.total}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(a.submitted / a.total) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "past" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Completed Assignments</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Title", "Class", "Due Date", "Graded", "Pending"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAST.map((a, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{a.title}</td>
                  <td className="px-5 py-3.5 text-gray-600">{a.cls}</td>
                  <td className="px-5 py-3.5 text-gray-500">{a.dueDate}</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-semibold">{a.graded}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("font-semibold", a.pending > 0 ? "text-amber-600" : "text-gray-400")}>{a.pending}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
