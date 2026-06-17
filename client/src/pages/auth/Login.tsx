import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME, ROLE_HOME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Loader2, Eye, EyeOff, X } from "lucide-react";

function SuperAdminModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, true);
      navigate("/super-admin");
    } catch (err: any) {
      setError(err.message ?? "Invalid super admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-purple-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base">Super Admin Access</h2>
              <p className="text-purple-200 text-xs mt-0.5">Platform-level credentials only</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white/70"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-purple-700 text-white font-semibold py-2.5 rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-base">{APP_NAME[0]}</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">{APP_NAME}</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Nepal's Smartest School Management Platform</h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">Built for Nepali schools — Nursery to Class 12. Secure, simple, and made for the Nepali classroom.</p>
          <div className="space-y-3">
            {[
              "Complete student lifecycle management",
              "Real-time attendance & fee tracking",
              "Exam management with automated results",
              "Multi-portal: Admin, Teacher, Student, Parent",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 relative">
          {[
            { icon: "🏫", label: "Admin" },
            { icon: "👩‍🏫", label: "Teacher" },
            { icon: "🎒", label: "Student" },
            { icon: "👨‍👩‍👧", label: "Parent" },
            { icon: "🧑‍💼", label: "Staff" },
          ].map((p) => (
            <div key={p.label} className="bg-white/8 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
              <div className="text-2xl mb-1.5">{p.icon}</div>
              <p className="text-white text-xs font-medium">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 bg-white lg:rounded-l-3xl">
        <div className="w-full max-w-md flex-1 flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{APP_NAME[0]}</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">{APP_NAME}</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm">Enter your credentials to sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu.np" autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className={cn(
                "w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors",
                "disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
              )}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link to="/" className="hover:text-gray-700 transition-colors">← Back to homepage</Link>
          </p>
        </div>

        {/* Hidden super admin access via "." */}
        <div className="w-full max-w-md text-right pb-1">
          <button
            type="button"
            onClick={() => setShowSuperAdmin(true)}
            className="text-black text-xs transition-colors select-none"
            title=""
          >
            .
          </button>
        </div>
      </div>

      {showSuperAdmin && <SuperAdminModal onClose={() => setShowSuperAdmin(false)} />}
    </div>
  );
}
