import { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Field, TextInput, Select, SaveBtn, CancelBtn, ErrorMsg } from "./_ui";

const ROLE_COLORS: Record<string, string> = {
  TEACHER: "bg-blue-50 text-blue-700",
  STAFF: "bg-purple-50 text-purple-700",
  STUDENT: "bg-green-50 text-green-700",
  PARENT: "bg-amber-50 text-amber-700",
};

// Shared user edit + password drawer. Keyed on USER id (not the role-row id).
// Reused by User Management, Staff Detail and Staff Management.
export default function EditDrawer({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [profile, setProfile] = useState<any>({});
  const [roleData, setRoleData] = useState<any>({});

  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.admin.schoolUser(userId)
      .then((u) => {
        setUser(u);
        setEmail(u.email ?? "");
        setStatus(u.status ?? "ACTIVE");
        setProfile(u.profile ?? { firstName: "", lastName: "", phone: "", gender: "", address: "", dateOfBirth: "" });
        setRoleData(u.teacher ?? u.staff ?? u.student ?? u.parent ?? {});
        if (u.role === "STAFF") api.admin.departments().then((d: any) => setDepartments(Array.isArray(d) ? d : (d.departments ?? []))).catch(() => {});
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const sp = (k: string, v: any) => setProfile((p: any) => ({ ...p, [k]: v }));
  const sr = (k: string, v: any) => setRoleData((d: any) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const roleKey = user.role === "TEACHER" ? "teacher"
        : user.role === "STAFF" ? "staff"
        : user.role === "STUDENT" ? "student"
        : user.role === "PARENT" ? "parent" : null;
      await api.admin.updateSchoolUser(userId, {
        email, status,
        profile: {
          firstName: profile.firstName || undefined,
          lastName: profile.lastName || undefined,
          phone: profile.phone || null,
          gender: profile.gender || null,
          address: profile.address || null,
          dateOfBirth: profile.dateOfBirth || null,
        },
        ...(roleKey ? { [roleKey]: roleData } : {}),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { setPwError("Minimum 6 characters"); return; }
    setSavingPw(true); setPwError(null); setPwSuccess(null);
    try {
      await api.admin.setUserPassword(userId, newPassword);
      setPwSuccess("Password changed successfully.");
      setNewPassword("");
    } catch (e: any) { setPwError(e.message); }
    finally { setSavingPw(false); }
  };

  const role = user?.role;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">Edit User</h2>
            {user && <p className="text-xs text-gray-400 mt-0.5">{user.email} · <span className={cn("px-1.5 py-0.5 rounded-full text-xs font-medium", ROLE_COLORS[role] ?? "bg-gray-100 text-gray-600")}>{role}</span></p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : !user ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Failed to load user</div>
        ) : (
          <div className="flex-1 p-6 space-y-6">
            <ErrorMsg msg={error} />

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Account</h3>
              <div className="space-y-3">
                <Field label="Email" required><TextInput value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="Status">
                  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </Field>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Info</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name"><TextInput value={profile.firstName ?? ""} onChange={(e) => sp("firstName", e.target.value)} /></Field>
                  <Field label="Last Name"><TextInput value={profile.lastName ?? ""} onChange={(e) => sp("lastName", e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone"><TextInput value={profile.phone ?? ""} onChange={(e) => sp("phone", e.target.value)} /></Field>
                  <Field label="Gender">
                    <Select value={profile.gender ?? ""} onChange={(e) => sp("gender", e.target.value)}>
                      <option value="">— Not set —</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Date of Birth">
                  <TextInput type="date" value={profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : ""} onChange={(e) => sp("dateOfBirth", e.target.value)} />
                </Field>
                <Field label="Address">
                  <TextInput value={profile.address ?? ""} onChange={(e) => sp("address", e.target.value)} />
                </Field>
              </div>
            </section>

            {role === "TEACHER" && (
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Teacher Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Employee ID"><TextInput value={roleData.employeeId ?? ""} onChange={(e) => sr("employeeId", e.target.value)} /></Field>
                    <Field label="Experience (years)"><TextInput type="number" min={0} value={roleData.experience ?? ""} onChange={(e) => sr("experience", e.target.value)} /></Field>
                  </div>
                  <Field label="Qualification"><TextInput value={roleData.qualification ?? ""} onChange={(e) => sr("qualification", e.target.value)} /></Field>
                  <Field label="Specialization"><TextInput value={roleData.specialization ?? ""} onChange={(e) => sr("specialization", e.target.value)} /></Field>
                  <Field label="Join Date"><TextInput type="date" value={roleData.joinDate ? String(roleData.joinDate).slice(0, 10) : ""} onChange={(e) => sr("joinDate", e.target.value)} /></Field>
                </div>
              </section>
            )}

            {role === "STAFF" && (
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Staff Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Employee ID"><TextInput value={roleData.employeeId ?? ""} onChange={(e) => sr("employeeId", e.target.value)} /></Field>
                    <Field label="Designation">
                      <Select value={roleData.designation ?? ""} onChange={(e) => sr("designation", e.target.value)}>
                        <option value="">— Select —</option>
                        {["Accountant","Librarian","Cleaner","Security Guard","Receptionist","Lab Assistant","Office Assistant","Driver","Helper","Cook","Gardener","IT Support","Nurse","Store Keeper","Schedule Manager","DI"].map((d) => <option key={d} value={d}>{d}</option>)}
                      </Select>
                    </Field>
                  </div>
                  <Field label="Department">
                    <Select value={roleData.departmentId ?? ""} onChange={(e) => sr("departmentId", e.target.value)}>
                      <option value="">— None —</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Salary"><TextInput type="number" min={0} value={roleData.salary ?? ""} onChange={(e) => sr("salary", e.target.value)} /></Field>
                    <Field label="Join Date"><TextInput type="date" value={roleData.joinDate ? String(roleData.joinDate).slice(0, 10) : ""} onChange={(e) => sr("joinDate", e.target.value)} /></Field>
                  </div>
                </div>
              </section>
            )}

            {role === "STUDENT" && (
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Student Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Admission No"><TextInput value={roleData.admissionNo ?? ""} disabled className="opacity-60 cursor-not-allowed" /></Field>
                    <Field label="Roll Number"><TextInput value={roleData.rollNumber ?? ""} onChange={(e) => sr("rollNumber", e.target.value)} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Stream"><TextInput value={roleData.stream ?? ""} onChange={(e) => sr("stream", e.target.value)} /></Field>
                    <Field label="Transport Mode">
                      <Select value={roleData.transportMode ?? "WALKING"} onChange={(e) => sr("transportMode", e.target.value)}>
                        <option value="WALKING">Walking</option>
                        <option value="BUS">School Bus</option>
                      </Select>
                    </Field>
                  </div>
                  {roleData.currentSection && (
                    <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                      Current Section: <strong>{roleData.currentSection.sectionName}</strong>
                    </div>
                  )}
                </div>
              </section>
            )}

            {role === "PARENT" && (
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Parent Details</h3>
                <div className="space-y-3">
                  <Field label="Occupation"><TextInput value={roleData.occupation ?? ""} onChange={(e) => sr("occupation", e.target.value)} /></Field>
                  {roleData.children?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Linked Children</p>
                      <div className="space-y-1.5">
                        {roleData.children.map((c: any) => (
                          <div key={c.studentId} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-700">{c.name}</span>
                            <span className="text-xs text-gray-400 capitalize">{c.relationship?.toLowerCase()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Change Password</h3>
              <div className="p-4 bg-amber-50 rounded-xl space-y-3 border border-amber-100">
                <p className="text-xs text-amber-700">Passwords are stored as secure hashes and cannot be viewed. Type a new password below to change it.</p>
                {pwError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded-lg">{pwError}</div>}
                {pwSuccess && <div className="p-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg">{pwSuccess}</div>}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TextInput
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={changePassword} disabled={savingPw}
                    className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
                    <KeyRound className="w-3.5 h-3.5" />
                    {savingPw ? "Saving…" : "Set Password"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {!loading && user && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 sticky bottom-0">
            <CancelBtn onClick={onClose} />
            <SaveBtn onClick={save} saving={saving} label="Save Changes" />
          </div>
        )}
      </div>
    </div>
  );
}
