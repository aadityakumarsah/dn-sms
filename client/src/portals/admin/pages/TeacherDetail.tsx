import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Calendar, BookOpen, Award, Briefcase, Key, Eye, EyeOff, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const dummyAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Teacher")}&background=random&size=128`;

function CredentialCard({ teacherId, email: initialEmail }: { teacherId: string; email: string }) {
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
      await api.admin.updateTeacherCredentials(teacherId, {
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
          {success && <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">{success}</div>}
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

export default function TeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.admin.teacherDetail(id).then(setT).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><div className="h-40 bg-gray-50 rounded-2xl animate-pulse" /></div>;
  if (error || !t) return (
    <div className="p-6">
      <button onClick={() => navigate("/admin/teachers")} className="text-sm text-blue-600 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm">{error || "Teacher not found"}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <button onClick={() => navigate("/admin/teachers")} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Teachers</button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <img src={t.avatar || dummyAvatar(t.name)} alt={t.name} className="w-16 h-16 rounded-2xl object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{t.name}</h1>
          {t.employeeId && <p className="text-sm text-gray-400 font-mono">{t.employeeId}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {t.specialization && <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">{t.specialization}</span>}
            <span className={cn("text-xs px-2.5 py-1 rounded-lg capitalize", t.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>{t.status?.toLowerCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Contact</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-300" />{t.email}</div>
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-300" />{t.phone ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600 capitalize"><span className="w-4 text-center text-gray-300">⚧</span>{t.gender?.toLowerCase() ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-300" />Joined {t.joinDate ? new Date(t.joinDate).toLocaleDateString() : "—"}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Professional</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Award className="w-4 h-4 text-gray-300" />{t.qualification ?? "—"}</div>
            <div className="flex items-center gap-2 text-gray-600"><Briefcase className="w-4 h-4 text-gray-300" />{t.experience ? `${t.experience} yrs experience` : "—"}</div>
            <div className="flex items-start gap-2 text-gray-600"><BookOpen className="w-4 h-4 text-gray-300 mt-0.5" />
              <span>{t.subjects?.length ? t.subjects.join(", ") : "No subjects assigned"}</span>
            </div>
          </div>
        </div>

        {t.email && (
          <CredentialCard teacherId={t.id} email={t.email} />
        )}
      </div>
    </div>
  );
}
