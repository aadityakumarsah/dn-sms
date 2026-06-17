import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, X, RefreshCw, GraduationCap, Bus, Footprints, Copy, CheckCheck, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

function CredField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <code className="text-sm font-mono text-gray-900 break-all select-all">{value}</code>
        <button onClick={copy} className="shrink-0 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-gray-700">
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function CredSection({ title, creds, color }: { title: string; creds: any; color: string }) {
  return (
    <div className={cn("rounded-xl overflow-hidden border", color === "blue" ? "border-blue-100" : "border-emerald-100")}>
      <div className={cn("px-4 py-2 text-xs font-semibold capitalize", color === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700")}>{title}</div>
      <div className="p-3 space-y-2">
        <CredField label="Email" value={creds.email ?? ""} />
        <CredField label="Password" value={creds.password ?? ""} />
        {creds.admissionNo && <CredField label="Admission No." value={creds.admissionNo} />}
      </div>
    </div>
  );
}

function CredentialsModal({ open, onClose, creds, role = "student" }: { open: boolean; onClose: () => void; creds: any | null; role?: string }) {
  if (!open || !creds) return null;
  const hasParent = !!creds.parentCredentials;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Key className="w-5 h-5" /></div>
            <div>
              <h2 className="font-bold text-base capitalize">{role} Account Created!</h2>
              <p className="text-blue-200 text-xs mt-0.5">{hasParent ? "Student + parent accounts ready" : "Share these login credentials securely"}</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
            ⚠ Users can change their password after first login. Save and share these securely.
          </div>
          <CredSection title={`${role} credentials`} creds={creds} color="blue" />
          {hasParent && <CredSection title="parent credentials" creds={creds.parentCredentials} color="green" />}
        </div>
        <div className="px-5 pb-5 shrink-0">
          <button onClick={onClose} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm">
            Done — I've saved the credentials
          </button>
        </div>
      </div>
    </div>
  );
}

const FEE_BADGE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  overdue: "bg-rose-50 text-rose-600",
};
const dummyAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Student")}&background=random&size=128`;

function StudentModal({ open, onClose, initial, sections, busRoutes, onSave }: {
  open: boolean; onClose: () => void; initial?: any;
  sections: any[]; busRoutes: any[]; onSave: (d: any) => Promise<void>;
}) {
  const blank = { firstName: "", lastName: "", email: "", phone: "", gender: "MALE", dateOfBirth: "", address: "", admissionNo: "", sectionId: "", rollNo: "", transportMode: "WALKING", busRouteId: "", avatar: "", class10Marks: "", entranceMarks: "", stream: "", password: "", parentEmail: "", parentFirstName: "", parentLastName: "", parentPhone: "", parentOccupation: "", parentRelationship: "FATHER", parentPassword: "" };
  const [form, setForm] = useState<any>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      const parts = (initial.name ?? "").split(" ");
      setForm({
        firstName: initial.firstName ?? parts[0] ?? "", lastName: initial.lastName ?? parts.slice(1).join(" "),
        email: initial.email ?? "", phone: initial.phone ?? "", gender: initial.gender ?? "MALE",
        dateOfBirth: initial.dateOfBirth ? initial.dateOfBirth.slice(0, 10) : "", address: initial.address ?? "",
        admissionNo: initial.admissionNo ?? "", sectionId: initial.sectionId ?? "", rollNo: initial.rollNo ?? "",
        transportMode: initial.transportMode ?? "WALKING", busRouteId: initial.busRouteId ?? "",
        avatar: initial.avatar ?? "", class10Marks: initial.class10Marks ?? "", entranceMarks: initial.entranceMarks ?? "", stream: initial.stream ?? "",
      });
    } else {
      setForm(blank);
    }
    setError("");
  }, [initial, open]);

  if (!open) return null;

  const selectedSection = sections.find((s) => s.id === form.sectionId);
  const sectionFull = selectedSection && selectedSection.seatsRemaining <= 0 && form.sectionId !== initial?.sectionId;
  const selectedRoute = busRoutes.find((r) => r.id === form.busRouteId);

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) { setError("First name, last name, and email are required"); return; }
    if (form.transportMode === "BUS" && !form.busRouteId) { setError("Select a bus route for bus students"); return; }
    setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const field = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">{initial ? "Edit Student" : "Admit New Student"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
          <div className="flex items-center gap-4">
            <img src={form.avatar || dummyAvatar(`${form.firstName} ${form.lastName}`)} alt="avatar" className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Profile Photo URL <span className="text-gray-300">(dummy if blank)</span></label>
              <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://… (Cloudinary later)" className={field} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([["First Name", "firstName"], ["Last Name", "lastName"]] as const).map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label} <span className="text-rose-400">*</span></label>
                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={field} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email <span className="text-rose-400">*</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!initial}
              className={cn(field, "disabled:bg-gray-50 disabled:text-gray-400")} />
          </div>
          {!initial && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Password <span className="text-gray-400 font-normal">(auto-generated if blank)</span>
              </label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={`e.g. ${form.firstName ? form.firstName.toLowerCase() + "2025@1234" : "auto-generated"}`} className={field} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={cn(field, "bg-white")}>
                {["MALE", "FEMALE", "OTHER"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={field} />
            </div>
            {!initial && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Admission No.</label>
                <input value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} placeholder="Auto-generated" className={field} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={field} />
          </div>

          {/* Academic background */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2.5">Academic Background</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Class 10 Marks / GPA</label>
                <input value={form.class10Marks} onChange={(e) => setForm({ ...form, class10Marks: e.target.value })} placeholder="e.g. 3.65 GPA / 82%" className={field} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Entrance Marks</label>
                <input value={form.entranceMarks} onChange={(e) => setForm({ ...form, entranceMarks: e.target.value })} placeholder="e.g. 78/100" className={field} />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stream / Program <span className="text-gray-300">(for +2 / High School)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {["Science", "Management", "Humanities", "Education", "Computer Science", "Engineering", "BCH", "Biophysical"].map((s) => (
                  <button key={s} type="button" onClick={() => setForm({ ...form, stream: form.stream === s ? "" : s })}
                    className={cn("text-xs px-2.5 py-1 rounded-lg border", form.stream === s ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>{s}</button>
                ))}
              </div>
              <input value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} placeholder="Or type a stream / program" className={cn(field, "mt-2")} />
            </div>
          </div>

          {/* Section allocation */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2.5">Section Allocation</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Section</label>
                <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} className={cn(field, "bg-white")}>
                  <option value="">No section yet</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.seatsRemaining <= 0 && s.id !== initial?.sectionId}>
                      {s.label} — {s.seatsRemaining <= 0 ? "FULL" : `${s.seatsRemaining} left`} ({s.performanceLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Roll No.</label>
                <input value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} placeholder="e.g. 12" className={field} />
              </div>
            </div>
            {sectionFull && (
              <p className="text-xs text-rose-600 mt-2 font-medium">
                This section is full ({selectedSection.occupiedSeats}/{selectedSection.totalSeats}). Pick another section to admit the student.
              </p>
            )}
          </div>

          {/* Transport */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2.5">Transport</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button type="button" onClick={() => setForm({ ...form, transportMode: "WALKING", busRouteId: "" })}
                className={cn("flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-xl border font-medium", form.transportMode === "WALKING" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
                <Footprints className="w-4 h-4" /> Walking
              </button>
              <button type="button" onClick={() => setForm({ ...form, transportMode: "BUS" })}
                className={cn("flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-xl border font-medium", form.transportMode === "BUS" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:bg-gray-50")}>
                <Bus className="w-4 h-4" /> Bus
              </button>
            </div>
            {form.transportMode === "BUS" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Bus Route <span className="text-rose-400">*</span></label>
                <select value={form.busRouteId} onChange={(e) => setForm({ ...form, busRouteId: e.target.value })} className={cn(field, "bg-white")}>
                  <option value="">Select a route…</option>
                  {busRoutes.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.seatsRemaining <= 0 && r.id !== initial?.busRouteId}>
                      {r.name} · {r.busPlate} — Rs {r.fee} {r.seatsRemaining <= 0 ? "(FULL)" : ""}
                    </option>
                  ))}
                </select>
                {busRoutes.length === 0 && <p className="text-xs text-amber-600 mt-1.5">No bus routes yet. Add buses & routes under Transport first.</p>}
                {selectedRoute && <p className="text-[11px] text-gray-400 mt-1.5">A bus fee of Rs {selectedRoute.fee} will be added to this student's fees.</p>}
              </div>
            )}
          </div>

          {/* Parent / Guardian */}
          {!initial && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-1">Parent / Guardian</p>
              <p className="text-[11px] text-gray-400 mb-3">If email is provided, a parent account will be auto-created for portal access.</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Parent First Name</label>
                    <input value={form.parentFirstName} onChange={(e) => setForm({ ...form, parentFirstName: e.target.value })} className={field} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Parent Last Name</label>
                    <input value={form.parentLastName} onChange={(e) => setForm({ ...form, parentLastName: e.target.value })} className={field} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Parent Email <span className="text-gray-400 font-normal">(creates login account)</span></label>
                  <input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} placeholder="parent@email.com" className={field} />
                </div>
                {form.parentEmail && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Parent Password <span className="text-gray-400 font-normal">(defaults to student password if blank)</span>
                    </label>
                    <input type="text" value={form.parentPassword} onChange={(e) => setForm({ ...form, parentPassword: e.target.value })}
                      placeholder={form.password || "same as student password"}
                      className={field} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Parent Phone</label>
                    <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className={field} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Relationship</label>
                    <select value={form.parentRelationship} onChange={(e) => setForm({ ...form, parentRelationship: e.target.value })} className={cn(field, "bg-white")}>
                      {["FATHER", "MOTHER", "GUARDIAN", "SIBLING", "OTHER"].map((r) => (
                        <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleSave} disabled={saving || sectionFull}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? "Saving..." : initial ? "Update" : "Admit Student"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PERF_LABEL: Record<string, string> = { EXCELLENT: "Excellent", GOOD: "Good", AVERAGE: "Average", BELOW_AVERAGE: "Below Avg" };

export default function Students() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ students: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [busRoutes, setBusRoutes] = useState<any[]>([]);
  const [fSection, setFSection] = useState("");
  const [fStream, setFStream] = useState("");
  const [fTransport, setFTransport] = useState("");
  const [createdCreds, setCreatedCreds] = useState<any>(null);

  const filterArgs = () => ({
    page, search: debouncedSearch || undefined,
    sectionId: fSection || undefined, stream: fStream || undefined, transport: fTransport || undefined,
  });

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, fSection, fStream, fTransport]);
  useEffect(() => {
    setLoading(true);
    api.admin.students(filterArgs()).then(setData).finally(() => setLoading(false));
  }, [page, debouncedSearch, fSection, fStream, fTransport]);

  // Build a flat list of sections (with seat info) for the allocation dropdown.
  const loadLookups = () => {
    api.admin.classes().then((d: any) => {
      const flat: any[] = [];
      (d.grades ?? []).forEach((g: any) => (g.sections ?? []).forEach((s: any) => {
        const occupied = s.occupiedSeats ?? s._count?.enrollments ?? 0;
        flat.push({ id: s.id, label: `${g.name} ${s.name}`, occupiedSeats: occupied, totalSeats: s.totalSeats ?? 40, seatsRemaining: Math.max(0, (s.totalSeats ?? 40) - occupied), performanceLabel: PERF_LABEL[s.performance] ?? "Average" });
      }));
      setSections(flat);
    });
    api.admin.busRoutes().then((r) => setBusRoutes(Array.isArray(r) ? r : [])).catch(() => setBusRoutes([]));
  };
  useEffect(() => { loadLookups(); }, []);

  const reload = () => {
    setLoading(true);
    api.admin.students(filterArgs()).then(setData).finally(() => setLoading(false));
    loadLookups();
  };
  const totalPages = Math.ceil((data.total ?? 0) / 20);

  return (
    <>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Students</h1>
            <p className="text-sm text-gray-500 mt-0.5">{data.total ?? 0} students enrolled</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reload} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button onClick={() => { setEditStudent(null); setModal(true); }}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Admit Student
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or admission no..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={fSection} onChange={(e) => setFSection(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All sections</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={fStream} onChange={(e) => setFStream(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All streams</option>
              {["Science", "Management", "Humanities", "Education", "Computer Science", "Engineering", "BCH", "Biophysical"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={fTransport} onChange={(e) => setFTransport(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All transport</option>
              <option value="BUS">Bus</option>
              <option value="WALKING">Walking</option>
            </select>
            {(fSection || fStream || fTransport) && (
              <button onClick={() => { setFSection(""); setFStream(""); setFTransport(""); }} className="text-xs text-gray-400 hover:text-rose-500 px-2">Clear</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Admission No.", "Student", "Class", "Gender", "Phone", "Fee Status", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td colSpan={7} className="px-5 py-3"><div className="h-8 bg-gray-50 rounded animate-pulse" /></td>
                  </tr>
                )) : data.students.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-14 text-center">
                    <GraduationCap className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-1">No students found</p>
                    <button onClick={() => setModal(true)} className="text-xs text-blue-600 hover:underline">Admit the first student →</button>
                  </td></tr>
                ) : data.students.map((s: any) => (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/60 group cursor-pointer" onClick={() => navigate(`/admin/students/${s.id}`)}>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{s.admissionNo}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={s.avatar || dummyAvatar(s.name)} alt={s.name} className="w-7 h-7 rounded-full object-cover shrink-0 bg-blue-100" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{s.className ?? <span className="text-gray-300 text-xs">Not enrolled</span>}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 capitalize">{s.gender?.toLowerCase() ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{s.phone ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium capitalize", FEE_BADGE[s.feeStatus] ?? "bg-gray-100 text-gray-500")}>{s.feeStatus}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditStudent(s); setModal(true); }} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button title="Reset Login Credentials" onClick={async () => {
                          if (!confirm(`Reset login credentials for ${s.name}?`)) return;
                          const r = await api.auth.resetPassword(s.userId);
                          if (r?.credentials) setCreatedCreds({ ...r.credentials, admissionNo: s.admissionNo });
                        }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Key className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">Showing {data.students.length} of {data.total}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span className="text-xs text-gray-500 px-2 py-1.5">{page}/{totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Remove Student?</h3>
            <p className="text-sm text-gray-500 mb-5">This will permanently remove the student and all their records. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button onClick={async () => { await api.admin.deleteStudent(deleteId!); setDeleteId(null); reload(); }}
                className="px-4 py-2 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium">Remove</button>
            </div>
          </div>
        </div>
      )}

      <StudentModal open={modal} onClose={() => { setModal(false); setEditStudent(null); }} initial={editStudent}
        sections={sections} busRoutes={busRoutes}
        onSave={async (d) => {
          if (editStudent) {
            await api.admin.updateStudent(editStudent.id, d);
          } else {
            const result = await api.admin.createStudent(d);
            if (result?.credentials) {
              setCreatedCreds({
                ...result.credentials,
                admissionNo: result.admissionNo,
                parentCredentials: result.parentCredentials ?? null,
              });
            }
          }
          reload();
        }} />

      <CredentialsModal open={!!createdCreds} onClose={() => setCreatedCreds(null)} creds={createdCreds} role="student" />
    </>
  );
}
