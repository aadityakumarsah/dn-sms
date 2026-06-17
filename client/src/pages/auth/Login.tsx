import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PORTAL_CONFIGS, APP_NAME, ROLE_HOME } from "@/lib/constants";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { Loader2, Eye, EyeOff, School } from "lucide-react";

const DEMO_CREDENTIALS: Partial<Record<UserRole, { email: string; password: string; schoolSlug: string; hint: string }>> = {
  admin: { email: "admin@bagmati.edu.np", password: "admin123", schoolSlug: "bagmati-secondary", hint: "Bagmati Secondary School" },
  teacher: { email: "sita@bagmati.edu.np", password: "teacher123", schoolSlug: "bagmati-secondary", hint: "Bagmati Secondary School" },
  staff: { email: "staff@bagmati.edu.np", password: "staff123", schoolSlug: "bagmati-secondary", hint: "Bagmati Secondary School" },
  student: { email: "bibek@bagmati.edu.np", password: "student123", schoolSlug: "bagmati-secondary", hint: "Bagmati Secondary School" },
  parent: { email: "parent@bagmati.edu.np", password: "parent123", schoolSlug: "bagmati-secondary", hint: "Bagmati Secondary School" },
};

export default function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const selectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError("");
    const demo = DEMO_CREDENTIALS[role];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      setSchoolSlug(demo.schoolSlug);
    } else {
      setEmail("");
      setPassword("");
      setSchoolSlug("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setError("");
    try {
      await login(email, password, selectedRole, selectedRole !== "super_admin" ? schoolSlug : undefined);
      navigate(ROLE_HOME[selectedRole]);
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
          <p className="text-blue-200 text-sm leading-relaxed mb-8">Built for Nepali schools, colleges, and universities — from Grade 1 to University level.</p>
          <div className="space-y-3">
            {["Complete student lifecycle management", "Real-time attendance & fee tracking", "Exam management with automated results", "Multi-portal access: Admin, Teacher, Student, Parent"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 relative">
          {Object.values(PORTAL_CONFIGS).map((p) => (
            <div key={p.role} className="bg-white/8 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
              <div className="text-2xl mb-1.5">{p.icon}</div>
              <p className="text-white text-xs font-medium">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white lg:rounded-l-3xl">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{APP_NAME[0]}</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">{APP_NAME}</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm">Select your portal to sign in</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {Object.values(PORTAL_CONFIGS).map((p) => (
              <button key={p.role} type="button" onClick={() => selectRole(p.role)}
                className={cn("flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all",
                  selectedRole === p.role
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 text-gray-500 hover:border-gray-200 bg-gray-50")}>
                <span className="text-xl">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          {selectedRole && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedRole !== "super_admin" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">School Slug</label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" required value={schoolSlug} onChange={(e) => setSchoolSlug(e.target.value)}
                      placeholder="e.g. bagmati-secondary"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-mono" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">The unique identifier for your school</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu.np"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

              {/* Demo hint */}
              {DEMO_CREDENTIALS[selectedRole] && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium mb-0.5">Demo credentials pre-filled</p>
                  <p className="text-xs text-amber-600">School: {DEMO_CREDENTIALS[selectedRole]!.hint}</p>
                </div>
              )}
              {selectedRole === "super_admin" && (
                <p className="text-xs text-gray-400 p-3 bg-gray-50 rounded-xl">Super admin login uses platform-level credentials, not a school.</p>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign in as {PORTAL_CONFIGS[selectedRole].label}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link to="/" className="hover:text-gray-700 transition-colors">← Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
