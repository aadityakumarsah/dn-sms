import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_HOME, APP_NAME } from "@/lib/constants";
import { api } from "@/lib/api";
import { Loader2, Eye, EyeOff, ArrowLeft, MapPin } from "lucide-react";

function initialsOf(name: string) {
  return (name ?? "?").split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

export default function SchoolLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [school, setSchool] = useState<any>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoadingSchool(true);
    api.public.school(slug)
      .then((r) => setSchool(r.school))
      .catch(() => setNotFound(true))
      .finally(() => setLoadingSchool(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const u = await login(email, password);
      navigate(ROLE_HOME[u.role] ?? "/");
    } catch (err: any) {
      setError(err.message ?? "Invalid credentials. Please try again.");
    }
  };

  if (loadingSchool) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-6 h-6 text-blue-300 animate-spin" /></div>;
  }

  if (notFound || !school) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 text-center">
        <p className="text-white text-lg font-semibold mb-2">School not found</p>
        <p className="text-blue-200/70 text-sm mb-5">We couldn't find a school at “{slug}”.</p>
        <Link to="/schools" className="text-blue-300 hover:text-white text-sm flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to school directory</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/schools" className="text-blue-200/70 hover:text-white text-xs flex items-center gap-1 mb-4"><ArrowLeft className="w-3.5 h-3.5" /> All schools</Link>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Branded header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white flex items-center gap-4">
            {school.logo
              ? <img src={school.logo} alt={school.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30" />
              : <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">{initialsOf(school.name)}</div>}
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">{school.name}</h1>
              {(school.city || school.district) && (
                <p className="text-blue-100 text-xs flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{[school.city, school.district].filter(Boolean).join(", ")}</p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-gray-500 text-sm">Sign in to your {school.name} account.</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu.np" autoComplete="email" autoFocus
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">{error}</div>}

            <button type="submit" disabled={isLoading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-blue-200/50 mt-5">Powered by {APP_NAME}</p>
      </div>
    </div>
  );
}
