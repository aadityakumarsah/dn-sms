import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Bus, Footprints, CheckCircle2, XCircle, Clock, GraduationCap, Wallet, Key, Eye, EyeOff, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

function CredentialCard({ studentId, userId, email: initialEmail }: { studentId: string; userId: string; email: string }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copy = (val: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.admin.updateStudentCredentials(studentId, {
        email: email !== initialEmail ? email : undefined,
        password: password || undefined,
      });
      setSuccess("Credentials updated successfully.");
      setEditing(false);
      setPassword("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoReset = async () => {
    if (!confirm("Auto-generate a new password for this student?")) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const r = await api.auth.resetPassword(userId);
      if (r?.credentials) {
        setSuccess(`New password: ${r.credentials.password}`);
        setEditing(false);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Key className="w-4 h-4 text-gray-300" /> Login Credentials</h2>
        {!editing && (
          <button onClick={() => { setEditing(true); setError(""); setSuccess(""); }} className="text-xs text-blue-600 hover:underline">Edit</button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          {success && <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-mono break-all">{success}</div>}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Login Email</p>
              <code className="text-sm text-gray-800">{email}</code>
            </div>
            <button onClick={() => copy(email, setCopiedEmail)} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200">
              {copiedEmail ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Password</p>
            <code className="text-sm text-gray-400">••••••••</code>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {error && <div className="p-2.5 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">New Password <span className="text-gray-300">(blank = keep current)</span></label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAutoReset} disabled={saving} className="flex-1 py-2 text-xs border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Auto-reset
            </button>
            <button onClick={() => { setEditing(false); setEmail(initialEmail); setPassword(""); setError(""); }} className="px-3 py-2 text-xs text-gray-400">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-xs bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const FEE_BADGE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700", PARTIAL: "bg-blue-50 text-blue-700",
  PENDING: "bg-amber-50 text-amber-700", OVERDUE: "bg-rose-50 text-rose-600", WAIVED: "bg-gray-100 text-gray-500",
};

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.admin.studentDetail(id).then(setS).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><div className="h-40 bg-gray-50 rounded-2xl animate-pulse" /></div>;
  if (error || !s) return (
    <div className="p-6">
      <button onClick={() => navigate("/admin/students")} className="text-sm text-blue-600 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error || "Student not found"}</div>
    </div>
  );

  const initials = (s.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <button onClick={() => navigate("/admin/students")} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Students</button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        {s.avatar
          ? <img src={s.avatar} alt={s.name} className="w-16 h-16 rounded-2xl object-cover" />
          : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">{initials}</div>}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{s.name}</h1>
          <p className="text-sm text-gray-400 font-mono">{s.admissionNo}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {s.className ? <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg flex items-center gap-1"><GraduationCap className="w-3 h-3" />{s.className}{s.rollNo ? ` · Roll ${s.rollNo}` : ""}</span>
              : <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">Not enrolled in a section</span>}
            {s.academicYear && <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">{s.academicYear}</span>}
            <span className={cn("text-xs px-2.5 py-1 rounded-lg capitalize", s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>{s.status?.toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-300" />{s.email}</div>
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-300" />{s.phone ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600 capitalize"><span className="w-4 text-center text-gray-300">⚧</span>{s.gender?.toLowerCase() ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-300" />{s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : "—"}</div>
            <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-gray-300" />{s.address ?? "—"}</div>
            {(s.stream || s.class10Marks || s.entranceMarks) && (
              <div className="pt-2 mt-1 border-t border-gray-50 space-y-1.5">
                {s.stream && <div className="flex justify-between"><span className="text-gray-400">Stream / Program</span><span className="text-gray-700 font-medium">{s.stream}</span></div>}
                {s.class10Marks && <div className="flex justify-between"><span className="text-gray-400">Class 10 marks</span><span className="text-gray-700">{s.class10Marks}</span></div>}
                {s.entranceMarks && <div className="flex justify-between"><span className="text-gray-400">Entrance marks</span><span className="text-gray-700">{s.entranceMarks}</span></div>}
              </div>
            )}
          </div>
        </div>

        {/* Transport */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Transport</h2>
          {s.transportMode === "BUS" && s.busRoute ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-blue-700"><Bus className="w-4 h-4" /> Bus student</div>
              <p className="text-gray-600">Route: <span className="font-medium">{s.busRoute.name}</span></p>
              {s.busRoute.bus && <p className="text-gray-500 text-xs">Bus: {s.busRoute.bus.name ?? ""} ({s.busRoute.bus.numberPlate})</p>}
              <p className="text-gray-500 text-xs">Monthly fee: Rs {s.busRoute.fee}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm"><Footprints className="w-4 h-4 text-gray-300" /> Walking / self-arranged</div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Attendance</h2>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-2xl font-bold text-gray-900">{s.attendance.pct}%</div>
            <div className="text-xs text-gray-400">{s.attendance.total} days recorded</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-50 rounded-xl py-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" /><p className="font-bold text-emerald-700">{s.attendance.present}</p><p className="text-emerald-600">Present</p></div>
            <div className="bg-rose-50 rounded-xl py-2"><XCircle className="w-4 h-4 text-rose-500 mx-auto mb-1" /><p className="font-bold text-rose-700">{s.attendance.absent}</p><p className="text-rose-600">Absent</p></div>
            <div className="bg-amber-50 rounded-xl py-2"><Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" /><p className="font-bold text-amber-700">{s.attendance.late}</p><p className="text-amber-600">Late</p></div>
          </div>
        </div>

        {/* Fees */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-gray-300" /> Fees</h2>
          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
            <div><p className="text-gray-400">Due</p><p className="font-bold text-gray-800">Rs {s.fees.totalDue}</p></div>
            <div><p className="text-gray-400">Paid</p><p className="font-bold text-emerald-600">Rs {s.fees.totalPaid}</p></div>
            <div><p className="text-gray-400">Balance</p><p className={cn("font-bold", s.fees.balance > 0 ? "text-rose-600" : "text-gray-800")}>Rs {s.fees.balance}</p></div>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {s.fees.items.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">No fee records</p> : s.fees.items.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{f.type}</span>
                <span className="text-gray-400">Rs {f.amountPaid}/{f.amountDue}</span>
                <span className={cn("px-2 py-0.5 rounded-md font-medium", FEE_BADGE[f.status] ?? "bg-gray-100 text-gray-500")}>{f.status}</span>
              </div>
            ))}
          </div>
        </div>

        {s.userId && s.email && (
          <CredentialCard studentId={s.id} userId={s.userId} email={s.email} />
        )}
      </div>
    </div>
  );
}
