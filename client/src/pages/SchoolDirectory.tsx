import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, ArrowRight, Loader2, School as SchoolIcon } from "lucide-react";
import { api } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";

function initialsOf(name: string) {
  return (name ?? "?").split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

export default function SchoolDirectory() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.public.schools(search)
        .then((r) => setSchools(r.schools ?? []))
        .catch((e) => setError(e.message ?? "Failed to load schools"))
        .finally(() => setLoading(false));
    }, search ? 300 : 0); // debounce typing
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">{APP_NAME[0]}</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">{APP_NAME}</span>
        </Link>
        <Link to="/login" className="text-sm text-blue-200 hover:text-white transition-colors">Sign in directly →</Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mt-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Find your school</h1>
          <p className="text-blue-200 text-sm">Select your school to continue to its sign-in page.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by school name, city or district…"
            autoFocus
            className="w-full bg-white/95 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
          />
        </div>

        {/* States */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-blue-300 animate-spin" /></div>
        ) : error ? (
          <div className="max-w-xl mx-auto p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-200 text-sm text-center">{error}</div>
        ) : schools.length === 0 ? (
          <div className="text-center py-16 text-blue-200/70">
            <SchoolIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{search ? `No schools match “${search}”.` : "No schools available yet."}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/school/${s.slug}/login`)}
                className="group text-left bg-white/8 hover:bg-white/12 border border-white/10 hover:border-blue-400/50 rounded-2xl p-4 transition-all backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  {s.logo
                    ? <img src={s.logo} alt={s.name} className="w-12 h-12 rounded-xl object-cover" />
                    : <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">{initialsOf(s.name)}</div>}
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{s.name}</h3>
                    {(s.city || s.district) && (
                      <p className="text-blue-200/70 text-xs flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />{[s.city, s.district].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {s.schoolType && <span className="text-[10px] uppercase tracking-wide text-blue-300/60">{String(s.schoolType).replace(/_/g, " ").toLowerCase()}</span>}
                  <span className="text-blue-300 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">Sign in <ArrowRight className="w-3 h-3" /></span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
