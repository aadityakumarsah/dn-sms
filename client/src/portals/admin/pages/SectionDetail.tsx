import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const PERF_CFG: Record<string, { label: string; color: string }> = {
  EXCELLENT:     { label: "Excellent",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  GOOD:          { label: "Good",       color: "bg-blue-50 text-blue-700 border-blue-200" },
  AVERAGE:       { label: "Average",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  BELOW_AVERAGE: { label: "Below Avg",  color: "bg-rose-50 text-rose-700 border-rose-200" },
};
const FEE_BADGE: Record<string, string> = { paid: "bg-emerald-50 text-emerald-700", pending: "bg-amber-50 text-amber-700", overdue: "bg-rose-50 text-rose-600" };

export default function SectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sec, setSec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.admin.sectionDetail(id).then(setSec).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><div className="h-40 bg-gray-50 rounded-2xl animate-pulse" /></div>;
  if (error || !sec) return (
    <div className="p-6">
      <button onClick={() => navigate("/admin/sections")} className="text-sm text-blue-600 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error || "Section not found"}</div>
    </div>
  );

  const perf = (PERF_CFG[sec.performance] ?? PERF_CFG.AVERAGE)!;
  const pct = sec.totalSeats ? Math.round((sec.occupiedSeats / sec.totalSeats) * 100) : 0;

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <button onClick={() => navigate("/admin/sections")} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Sections</button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400">{sec.gradeName}{sec.academicYear ? ` · ${sec.academicYear}` : ""}</p>
            <h1 className="text-xl font-bold text-gray-900">Section {sec.name}</h1>
          </div>
          <span className={cn("text-xs px-2.5 py-1 rounded-lg border font-medium", perf.color)}>{perf.label}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div className="bg-gray-50 rounded-xl py-3"><p className="text-lg font-bold text-gray-900">{sec.occupiedSeats}</p><p className="text-xs text-gray-400">Students</p></div>
          <div className="bg-gray-50 rounded-xl py-3"><p className="text-lg font-bold text-gray-900">{sec.totalSeats}</p><p className="text-xs text-gray-400">Capacity</p></div>
          <div className="bg-gray-50 rounded-xl py-3"><p className={cn("text-lg font-bold", sec.seatsRemaining <= 0 ? "text-rose-600" : "text-emerald-600")}>{sec.seatsRemaining}</p><p className="text-xs text-gray-400">Seats left</p></div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
          <div className={cn("h-full rounded-full", pct >= 90 ? "bg-rose-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        {sec.seatsRemaining <= 0 && <p className="text-xs text-rose-600 mt-2 font-medium">This section is full ({sec.occupiedSeats}/{sec.totalSeats}).</p>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Students in this section</h2>
        </div>
        {sec.students.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No students allocated yet. Allocate students from the Students page.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              {["Roll", "Admission", "Student", "Gender", "Fee", ""].map((h) => <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>)}
            </tr></thead>
            <tbody>
              {sec.students.map((st: any) => (
                <tr key={st.id} className="border-t border-gray-50 hover:bg-gray-50/60 cursor-pointer" onClick={() => navigate(`/admin/students/${st.id}`)}>
                  <td className="px-5 py-3 text-gray-500">{st.rollNo ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{st.admissionNo}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{st.name}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{st.gender?.toLowerCase() ?? "—"}</td>
                  <td className="px-5 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-md font-medium capitalize", FEE_BADGE[st.feeStatus] ?? "bg-gray-100 text-gray-500")}>{st.feeStatus}</span></td>
                  <td className="px-5 py-3 text-right"><ChevronRight className="w-4 h-4 text-gray-300 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
