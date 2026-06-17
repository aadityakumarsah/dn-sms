import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, Wallet, Briefcase, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const dummyAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Staff")}&background=random&size=128`;

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.admin.staffDetail(id).then(setS).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><div className="h-40 bg-gray-50 rounded-2xl animate-pulse" /></div>;
  if (error || !s) return (
    <div className="p-6">
      <button onClick={() => navigate("/admin/staff-mgmt")} className="text-sm text-blue-600 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error || "Staff not found"}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <button onClick={() => navigate("/admin/staff-mgmt")} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Staff</button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <img src={s.avatar || dummyAvatar(s.name)} alt={s.name} className="w-16 h-16 rounded-2xl object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{s.name}</h1>
          {s.employeeId && <p className="text-sm text-gray-400 font-mono">{s.employeeId}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">{s.designation}</span>
            {s.department && <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg">{s.department}</span>}
            <span className={cn("text-xs px-2.5 py-1 rounded-lg capitalize", s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>{s.status?.toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Contact</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-300" />{s.email}</div>
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-300" />{s.phone ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600 capitalize"><span className="w-4 text-center text-gray-300">⚧</span>{s.gender?.toLowerCase() ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-300" />Joined {s.joinDate ? new Date(s.joinDate).toLocaleDateString() : "—"}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Employment</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Briefcase className="w-4 h-4 text-gray-300" />{s.designation}</div>
            <div className="flex items-center gap-2 text-gray-600"><Building2 className="w-4 h-4 text-gray-300" />{s.department ?? "No department"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Wallet className="w-4 h-4 text-gray-300" />{s.salary ? `Rs ${s.salary}/month` : "Salary not set"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
