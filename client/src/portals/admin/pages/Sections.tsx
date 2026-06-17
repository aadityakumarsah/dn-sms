import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Users, LayoutGrid, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const PERF_CFG: Record<string, { label: string; color: string; dot: string }> = {
  EXCELLENT:     { label: "Excellent",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  GOOD:          { label: "Good",       color: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  AVERAGE:       { label: "Average",    color: "bg-amber-50 text-amber-700 border-amber-200",        dot: "bg-amber-400" },
  BELOW_AVERAGE: { label: "Below Avg",  color: "bg-rose-50 text-rose-700 border-rose-200",           dot: "bg-rose-500" },
};

export default function Sections() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.admin.classes().then((d: any) => {
      const flat: any[] = [];
      (d.grades ?? []).forEach((g: any) => (g.sections ?? []).forEach((s: any) => {
        const occupied = s.occupiedSeats ?? s._count?.enrollments ?? 0;
        const total = s.totalSeats ?? 40;
        flat.push({ id: s.id, name: s.name, gradeName: g.name, performance: s.performance ?? "AVERAGE", occupied, total, seatsRemaining: Math.max(0, total - occupied) });
      }));
      setSections(flat);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Section Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sections.length} sections across all grades · click a section to see its students</p>
        </div>
        <button onClick={load} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : sections.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <LayoutGrid className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No sections yet. Add grades & sections under <button onClick={() => navigate("/admin/classes")} className="text-blue-600">Classes & Sections →</button></p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => {
            const perf = (PERF_CFG[s.performance] ?? PERF_CFG.AVERAGE)!;
            const pct = s.total ? Math.round((s.occupied / s.total) * 100) : 0;
            const full = s.seatsRemaining <= 0;
            return (
              <button key={s.id} onClick={() => navigate(`/admin/sections/${s.id}`)}
                className="text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">{s.gradeName}</p>
                    <p className="font-bold text-gray-900">Section {s.name}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-md border font-medium flex items-center gap-1", perf.color)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", perf.dot)} />{perf.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {s.occupied} students</span>
                  <span className={cn("font-medium", full ? "text-rose-600" : "text-gray-600")}>{s.occupied}/{s.total}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", pct >= 90 ? "bg-rose-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                {full
                  ? <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Section full — admit elsewhere</p>
                  : <p className="text-xs text-gray-400 mt-2">{s.seatsRemaining} seats remaining</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
