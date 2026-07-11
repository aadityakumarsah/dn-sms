import { useState, useEffect } from "react";
import { User, Mail, Phone, Cake, MapPin, BookOpen, Bus, Footprints, GraduationCap, Users, CalendarDays, Hash, Sun, Sunrise, BadgeInfo } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const GENDER_LABEL: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
const RELATION_LABEL: Record<string, string> = { FATHER: "Father", MOTHER: "Mother", GUARDIAN: "Guardian", SIBLING: "Sibling", OTHER: "Other" };

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return d; }
}

function fmtDateTime(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return d; }
}

function InfoRow({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | null | undefined; color?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", color ?? "bg-blue-50")}>
        <Icon className={cn("w-4 h-4", color ? "text-white" : "text-blue-600")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5 break-words">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children, icon: Icon, color }: { title: string; children: React.ReactNode; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className={cn("px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5", color)}>
        <Icon className="w-4 h-4" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

export default function MyProfile() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.student.profile()
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-rose-600">{error || "Failed to load profile"}</p>
        </div>
      </div>
    );
  }

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "—";
  const initials = [data.firstName?.[0], data.lastName?.[0]].filter(Boolean).join("") || "?";
  const shiftLabel = (s: string) => s === "MORNING" ? "Morning" : "Day";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          {data.avatar ? (
            <img src={data.avatar} alt={fullName} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{fullName}</h1>
            <p className="text-blue-200 text-sm mt-0.5 truncate">{data.className || "Not enrolled"}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-blue-200">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {data.admissionNo || "—"}</span>
              {data.rollNumber && <span className="flex items-center gap-1"><BadgeInfo className="w-3 h-3" /> Roll {data.rollNumber}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <SectionCard title="Personal Information" icon={User} color="bg-sky-50 text-sky-700">
        <InfoRow icon={Mail} label="Email" value={data.email} />
        <InfoRow icon={Phone} label="Phone" value={data.phone} />
        <InfoRow icon={User} label="Gender" value={GENDER_LABEL[data.gender] ?? data.gender} />
        <InfoRow icon={Cake} label="Date of Birth" value={fmtDate(data.dateOfBirth)} />
        <InfoRow icon={MapPin} label="Address" value={data.address} />
      </SectionCard>

      {/* Academic Information */}
      <SectionCard title="Academic Information" icon={GraduationCap} color="bg-indigo-50 text-indigo-700">
        <InfoRow icon={GraduationCap} label="Class" value={data.className} />
        <InfoRow icon={Hash} label="Roll Number" value={data.rollNumber} />
        <InfoRow icon={BookOpen} label="Stream / Program" value={data.stream} />
        <InfoRow icon={CalendarDays} label="Academic Year" value={data.academicYear} />
        <InfoRow icon={data.shifts?.includes?.("MORNING") ? Sunrise : Sun} label="Shift" value={data.shifts?.map?.(shiftLabel).join(" & ") || "—"} color="bg-amber-50" />
      </SectionCard>

      {/* Parent / Guardian */}
      {data.parents?.length > 0 && (
        <SectionCard title="Parent / Guardian" icon={Users} color="bg-emerald-50 text-emerald-700">
          {data.parents.map((p: any, i: number) => (
            <div key={i} className={i > 0 ? "border-t border-gray-100 mt-3 pt-3" : ""}>
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-2">{RELATION_LABEL[p.relationship] || p.relationship}</p>
              <InfoRow icon={User} label="Name" value={p.name} />
              <InfoRow icon={Mail} label="Email" value={p.email} />
              <InfoRow icon={Phone} label="Phone" value={p.phone} />
              {p.occupation && <InfoRow icon={User} label="Occupation" value={p.occupation} />}
            </div>
          ))}
        </SectionCard>
      )}

      {/* Transport */}
      <SectionCard title="Transport" icon={Bus} color="bg-amber-50 text-amber-700">
        <InfoRow icon={data.transportMode === "BUS" ? Bus : Footprints} label="Mode" value={data.transportMode === "BUS" ? "Bus" : "Walking"} />
        {data.transportMode === "BUS" && <InfoRow icon={Bus} label="Bus Route" value={data.busRoute} />}
      </SectionCard>

      {/* Account Info */}
      <SectionCard title="Account" icon={BadgeInfo} color="bg-gray-50 text-gray-700">
        <InfoRow icon={Hash} label="Admission No." value={data.admissionNo} />
        <InfoRow icon={CalendarDays} label="Enrolled Since" value={fmtDateTime(data.createdAt)} />
      </SectionCard>
    </div>
  );
}