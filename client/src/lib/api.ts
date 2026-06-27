// API base URL. Bun inlines process.env.PUBLIC_API_URL at build time via
// the define option in build.ts. Must be referenced directly (not via alias)
// so Bun's define substitution matches the literal token.
function resolveBase(): string {
  if (typeof process !== "undefined" && process.env?.PUBLIC_API_URL) {
    return String(process.env.PUBLIC_API_URL).replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.hostname && window.location.hostname !== "localhost") {
    return ""; // same-origin fallback
  }
  return "http://localhost:4000";
}

const BASE = resolveBase();

function getToken(): string | null {
  return localStorage.getItem("dn_sms_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as any ?? {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  // Sliding session: server sends a fresh 30d token when the current one is > 1 day old
  const refreshed = res.headers.get("X-Refresh-Token");
  if (refreshed) localStorage.setItem("dn_sms_token", refreshed);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Public, unauthenticated — school directory + branded login
  public: {
    schools: (search?: string) => {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      return request<{ schools: any[] }>(`/api/public/schools?${q}`);
    },
    school: (slug: string) => request<{ school: any }>(`/api/public/schools/${slug}`),
  },

  auth: {
    // Super Admin Auth
    loginSuperAdmin: (email: string, password: string) =>
      request<{ token: string; user: any }>("/api/auth/super-admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    meSuperAdmin: () => request<any>("/api/auth/super-admin/me"),

    // Create school with admin credentials (Super Admin only)
    createSchool: (data: Record<string, unknown>) =>
      request<any>("/api/auth/super-admin/create-school", { method: "POST", body: JSON.stringify(data) }),

    // School User Auth
    loginSchool: (email: string, password: string) =>
      request<{ token: string; user: any }>("/api/auth/school/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    meSchool: () => request<any>("/api/auth/school/me"),

    // Password Management
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ success: boolean; message: string }>("/api/auth/school/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    resetPassword: (userId: string) =>
      request<{ credentials: any; message: string }>(`/api/auth/school/reset-password/${userId}`, { method: "POST" }),

    // Create users by role (Admin only)
    createTeacher: (data: Record<string, unknown>) =>
      request<any>("/api/auth/school/users/teacher", { method: "POST", body: JSON.stringify(data) }),
    createStaff: (data: Record<string, unknown>) =>
      request<any>("/api/auth/school/users/staff", { method: "POST", body: JSON.stringify(data) }),
    createStudent: (data: Record<string, unknown>) =>
      request<any>("/api/auth/school/users/student", { method: "POST", body: JSON.stringify(data) }),
    createParent: (data: Record<string, unknown>) =>
      request<any>("/api/auth/school/users/parent", { method: "POST", body: JSON.stringify(data) }),

    // Bulk create users
    bulkCreateTeachers: (users: Array<Record<string, unknown>>) =>
      request<any>("/api/auth/school/users/bulk/teacher", { method: "POST", body: JSON.stringify({ users }) }),
    bulkCreateStaff: (users: Array<Record<string, unknown>>) =>
      request<any>("/api/auth/school/users/bulk/staff", { method: "POST", body: JSON.stringify({ users }) }),
    bulkCreateStudents: (users: Array<Record<string, unknown>>) =>
      request<any>("/api/auth/school/users/bulk/student", { method: "POST", body: JSON.stringify({ users }) }),
    bulkCreateParents: (users: Array<Record<string, unknown>>) =>
      request<any>("/api/auth/school/users/bulk/parent", { method: "POST", body: JSON.stringify({ users }) }),
  },

  superAdmin: {
    dashboard: () => request<any>("/api/super-admin/dashboard"),
    schools: (p?: { page?: number; limit?: number; search?: string; status?: string; planId?: string }) => {
      const q = new URLSearchParams();
      if (p?.page) q.set("page", String(p.page));
      if (p?.limit) q.set("limit", String(p.limit));
      if (p?.search) q.set("search", p.search);
      if (p?.status) q.set("status", p.status);
      if (p?.planId) q.set("planId", p.planId);
      return request<any>(`/api/super-admin/schools?${q}`);
    },
    createSchool: (data: Record<string, unknown>) => request<any>("/api/super-admin/schools", { method: "POST", body: JSON.stringify(data) }),
    getSchool: (id: string) => request<any>(`/api/super-admin/schools/${id}`),
    updateSchool: (id: string, data: Record<string, unknown>) => request<any>(`/api/super-admin/schools/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteSchool: (id: string) => request<any>(`/api/super-admin/schools/${id}`, { method: "DELETE" }),
    users: (p?: { page?: number; search?: string; role?: string; schoolId?: string }) => {
      const q = new URLSearchParams();
      if (p?.page) q.set("page", String(p.page));
      if (p?.search) q.set("search", p.search);
      if (p?.role) q.set("role", p.role);
      if (p?.schoolId) q.set("schoolId", p.schoolId);
      return request<any>(`/api/super-admin/users?${q}`);
    },
    plans: () => request<any[]>("/api/super-admin/plans"),
    createPlan: (data: Record<string, unknown>) => request<any>("/api/super-admin/plans", { method: "POST", body: JSON.stringify(data) }),
    updatePlan: (id: string, data: Record<string, unknown>) => request<any>(`/api/super-admin/plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deletePlan: (id: string) => request<any>(`/api/super-admin/plans/${id}`, { method: "DELETE" }),
    payments: (p?: { page?: number }) => {
      const q = new URLSearchParams();
      if (p?.page) q.set("page", String(p.page));
      return request<any>(`/api/super-admin/payments?${q}`);
    },
    recordPayment: (data: Record<string, unknown>) => request<any>("/api/super-admin/payments", { method: "POST", body: JSON.stringify(data) }),
    analytics: () => request<any>("/api/super-admin/analytics"),
    announcements: () => request<any[]>("/api/super-admin/announcements"),
    createAnnouncement: (data: Record<string, unknown>) => request<any>("/api/super-admin/announcements", { method: "POST", body: JSON.stringify(data) }),
    deleteAnnouncement: (id: string) => request<any>(`/api/super-admin/announcements/${id}`, { method: "DELETE" }),
    resetAdminPassword: (schoolId: string) => request<any>(`/api/super-admin/schools/${schoolId}/reset-admin-password`, { method: "POST" }),
    updateAdminCredentials: (schoolId: string, data: { email?: string; password?: string }) => request<any>(`/api/super-admin/schools/${schoolId}/admin`, { method: "PATCH", body: JSON.stringify(data) }),
    activity: (p?: { page?: number; action?: string }) => {
      const q = new URLSearchParams();
      if (p?.page) q.set("page", String(p.page));
      if (p?.action) q.set("action", p.action);
      return request<any>(`/api/super-admin/activity?${q}`);
    },
    updateSettings: (data: Record<string, unknown>) => request<any>("/api/super-admin/settings", { method: "PATCH", body: JSON.stringify(data) }),
  },

  admin: {
    dashboard: () => request<any>("/api/admin/dashboard"),
    settings: () => request<any>("/api/admin/settings"),
    updateSettings: (data: Record<string, unknown>) => request<any>("/api/admin/settings", { method: "PATCH", body: JSON.stringify(data) }),

    // Students
    students: (p?: { page?: number; search?: string; stream?: string; sectionId?: string; transport?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (p?.page) q.set("page", String(p.page));
      if (p?.search) q.set("search", p.search);
      if (p?.stream) q.set("stream", p.stream);
      if (p?.sectionId) q.set("sectionId", p.sectionId);
      if (p?.transport) q.set("transport", p.transport);
      if (p?.status) q.set("status", p.status);
      return request<any>(`/api/admin/students?${q}`);
    },
    createStudent: (data: Record<string, unknown>) => request<any>("/api/admin/students", { method: "POST", body: JSON.stringify(data) }),
    studentDetail: (id: string) => request<any>(`/api/admin/students/${id}`),
    updateStudent: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/students/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    updateStudentCredentials: (id: string, data: { email?: string; password?: string }) => request<any>(`/api/admin/students/${id}/credentials`, { method: "PATCH", body: JSON.stringify(data) }),
    allocateStudent: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/students/${id}/allocate`, { method: "POST", body: JSON.stringify(data) }),
    deleteStudent: (id: string) => request<any>(`/api/admin/students/${id}`, { method: "DELETE" }),

    // Teachers
    teachers: (p?: { page?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (p?.page) q.set("page", String(p.page));
      if (p?.search) q.set("search", p.search);
      return request<any>(`/api/admin/teachers?${q}`);
    },
    createTeacher: (data: Record<string, unknown>) => request<any>("/api/admin/teachers", { method: "POST", body: JSON.stringify(data) }),
    teacherDetail: (id: string) => request<any>(`/api/admin/teachers/${id}`),
    updateTeacher: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/teachers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    updateTeacherCredentials: (id: string, data: { email?: string; password?: string }) => request<any>(`/api/admin/teachers/${id}/credentials`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteTeacher: (id: string) => request<any>(`/api/admin/teachers/${id}`, { method: "DELETE" }),

    // Staff (non-teaching)
    staff: (p?: { search?: string; designation?: string }) => {
      const q = new URLSearchParams();
      if (p?.search) q.set("search", p.search);
      if (p?.designation) q.set("designation", p.designation);
      return request<any>(`/api/admin/staff?${q}`);
    },
    staffDetail: (id: string) => request<any>(`/api/admin/staff/${id}`),
    createStaff: (data: Record<string, unknown>) => request<any>("/api/admin/staff", { method: "POST", body: JSON.stringify(data) }),
    updateStaff: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/staff/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteStaff: (id: string) => request<any>(`/api/admin/staff/${id}`, { method: "DELETE" }),

    // Departments
    departments: () => request<any>("/api/admin/departments"),
    createDepartment: (data: Record<string, unknown>) => request<any>("/api/admin/departments", { method: "POST", body: JSON.stringify(data) }),
    updateDepartment: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/departments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteDepartment: (id: string) => request<any>(`/api/admin/departments/${id}`, { method: "DELETE" }),

    // Classes
    classes: () => request<any>("/api/admin/classes"),
    createGrade: (data: Record<string, unknown>) => request<any>("/api/admin/grades", { method: "POST", body: JSON.stringify(data) }),
    updateGrade: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/grades/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteGrade: (id: string) => request<any>(`/api/admin/grades/${id}`, { method: "DELETE" }),
    createSection: (gradeId: string, data: Record<string, unknown>) => request<any>(`/api/admin/grades/${gradeId}/sections`, { method: "POST", body: JSON.stringify(data) }),
    sectionDetail: (id: string) => request<any>(`/api/admin/sections/${id}`),
    updateSection: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/sections/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteSection: (id: string) => request<any>(`/api/admin/sections/${id}`, { method: "DELETE" }),

    // Transport / Buses
    buses: () => request<any>("/api/admin/buses"),
    busRoutes: () => request<any[]>("/api/admin/bus-routes"),
    createBus: (data: Record<string, unknown>) => request<any>("/api/admin/buses", { method: "POST", body: JSON.stringify(data) }),
    updateBus: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/buses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteBus: (id: string) => request<any>(`/api/admin/buses/${id}`, { method: "DELETE" }),
    createBusRoute: (busId: string, data: Record<string, unknown>) => request<any>(`/api/admin/buses/${busId}/routes`, { method: "POST", body: JSON.stringify(data) }),
    updateBusRoute: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/bus-routes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteBusRoute: (id: string) => request<any>(`/api/admin/bus-routes/${id}`, { method: "DELETE" }),
    academicYears: () => request<any[]>("/api/admin/academic-years"),
    createAcademicYear: (data: Record<string, unknown>) => request<any>("/api/admin/academic-years", { method: "POST", body: JSON.stringify(data) }),
    updateAcademicYear: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/academic-years/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteAcademicYear: (id: string) => request<any>(`/api/admin/academic-years/${id}`, { method: "DELETE" }),
    promotionPreview: (fromYearId: string) => request<any[]>(`/api/admin/promote/preview?fromYearId=${fromYearId}`),
    promoteStudents: (data: Record<string, unknown>) => request<any>("/api/admin/promote", { method: "POST", body: JSON.stringify(data) }),

    // Attendance
    attendance: (p?: { date?: string; sectionId?: string }) => {
      const q = new URLSearchParams();
      if (p?.date) q.set("date", p.date);
      if (p?.sectionId) q.set("sectionId", p.sectionId);
      return request<any>(`/api/admin/attendance?${q}`);
    },
    markAttendance: (data: Record<string, unknown>) => request<any>("/api/admin/attendance/mark", { method: "POST", body: JSON.stringify(data) }),
    attendanceSummary: (days?: number) => {
      const q = new URLSearchParams();
      if (days) q.set("days", String(days));
      return request<any>(`/api/admin/attendance/summary?${q}`);
    },
    attendanceRange: (p: { from: string; to: string; sectionId?: string; studentId?: string }) => {
      const q = new URLSearchParams({ from: p.from, to: p.to });
      if (p.sectionId) q.set("sectionId", p.sectionId);
      if (p.studentId) q.set("studentId", p.studentId);
      return request<any>(`/api/admin/attendance/range?${q}`);
    },

    // Fees
    fees: (p?: { page?: number; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (p?.page) q.set("page", String(p.page));
      if (p?.status) q.set("status", p.status);
      if (p?.search) q.set("search", p.search);
      return request<any>(`/api/admin/fees?${q}`);
    },
    createFee: (data: Record<string, unknown>) => request<any>("/api/admin/fees", { method: "POST", body: JSON.stringify(data) }),
    collectFee: (data: Record<string, unknown>) => request<any>("/api/admin/fees", { method: "POST", body: JSON.stringify(data) }),
    recordFeePayment: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/fees/${id}/pay`, { method: "POST", body: JSON.stringify(data) }),
    updateFeeStatus: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/fees/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
    feeTypes: () => request<any[]>("/api/admin/fee-types"),
    createFeeType: (data: Record<string, unknown>) => request<any>("/api/admin/fee-types", { method: "POST", body: JSON.stringify(data) }),

    // Fee Structures / Installment plans
    feeStructures: (p?: { level?: string | number; stream?: string; category?: string }) => {
      const q = new URLSearchParams();
      if (p?.level !== undefined && p.level !== "") q.set("level", String(p.level));
      if (p?.stream) q.set("stream", p.stream);
      if (p?.category) q.set("category", p.category);
      return request<any[]>(`/api/admin/fee-structures?${q}`);
    },
    createFeeStructure: (data: Record<string, unknown>) => request<any>("/api/admin/fee-structures", { method: "POST", body: JSON.stringify(data) }),
    updateFeeStructure: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/fee-structures/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteFeeStructure: (id: string) => request<any>(`/api/admin/fee-structures/${id}`, { method: "DELETE" }),

    // Notices
    notices: () => request<any[]>("/api/admin/notices"),
    createNotice: (data: Record<string, unknown>) => request<any>("/api/admin/notices", { method: "POST", body: JSON.stringify(data) }),
    deleteNotice: (id: string) => request<any>(`/api/admin/notices/${id}`, { method: "DELETE" }),

    // Exams
    exams: () => request<any[]>("/api/admin/exams"),
    getExam: (id: string) => request<any>(`/api/admin/exams/${id}`),
    createExam: (data: Record<string, unknown>) => request<any>("/api/admin/exams", { method: "POST", body: JSON.stringify(data) }),
    updateExam: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/exams/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    upsertExamSubject: (examId: string, data: Record<string, unknown>) => request<any>(`/api/admin/exams/${examId}/subjects`, { method: "POST", body: JSON.stringify(data) }),
    deleteExamSubject: (id: string) => request<any>(`/api/admin/exam-subjects/${id}`, { method: "DELETE" }),
    deleteExam: (id: string) => request<any>(`/api/admin/exams/${id}`, { method: "DELETE" }),
    markAdmissionFee: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/admissions/${id}/fee-payment`, { method: "PATCH", body: JSON.stringify(data) }),

    // Subjects
    subjects: () => request<any[]>("/api/admin/subjects"),
    createSubject: (data: Record<string, unknown>) => request<any>("/api/admin/subjects", { method: "POST", body: JSON.stringify(data) }),

    // Library
    libraryBooks: (p?: { search?: string; category?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (p?.search) q.set("search", p.search);
      if (p?.category) q.set("category", p.category);
      if (p?.page) q.set("page", String(p.page));
      return request<any>(`/api/admin/library/books?${q}`);
    },
    createBook: (data: Record<string, unknown>) => request<any>("/api/admin/library/books", { method: "POST", body: JSON.stringify(data) }),
    updateBook: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/library/books/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteBook: (id: string) => request<any>(`/api/admin/library/books/${id}`, { method: "DELETE" }),
    bookIssues: (p?: { status?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (p?.status) q.set("status", p.status);
      if (p?.page) q.set("page", String(p.page));
      return request<any>(`/api/admin/library/issues?${q}`);
    },
    issueBook: (data: Record<string, unknown>) => request<any>("/api/admin/library/issues", { method: "POST", body: JSON.stringify(data) }),
    returnBook: (id: string) => request<any>(`/api/admin/library/issues/${id}/return`, { method: "POST" }),

    // Admissions
    admissions: (p?: { status?: string; search?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (p?.status) q.set("status", p.status);
      if (p?.search) q.set("search", p.search);
      if (p?.page) q.set("page", String(p.page));
      return request<any>(`/api/admin/admissions?${q}`);
    },
    createAdmission: (data: Record<string, unknown>) => request<any>("/api/admin/admissions", { method: "POST", body: JSON.stringify(data) }),
    updateAdmission: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/admissions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    enrollAdmission: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/admissions/${id}/enroll`, { method: "POST", body: JSON.stringify(data) }),
    deleteAdmission: (id: string) => request<any>(`/api/admin/admissions/${id}`, { method: "DELETE" }),

    // Notifications
    notifications: () => request<any[]>("/api/admin/notifications"),
    createNotification: (data: Record<string, unknown>) => request<any>("/api/admin/notifications", { method: "POST", body: JSON.stringify(data) }),
    deleteNotification: (id: string) => request<any>(`/api/admin/notifications/${id}`, { method: "DELETE" }),

    // Routine (Timetable)
    routine: () => request<any[]>("/api/admin/routine"),
    createRoutineSlot: (data: Record<string, unknown>) => request<any>("/api/admin/routine", { method: "POST", body: JSON.stringify(data) }),
    deleteRoutineSlot: (id: string) => request<any>(`/api/admin/routine/${id}`, { method: "DELETE" }),

    // Homework
    homework: () => request<any[]>("/api/admin/homework"),
    createHomework: (data: Record<string, unknown>) => request<any>("/api/admin/homework", { method: "POST", body: JSON.stringify(data) }),
    deleteHomework: (id: string) => request<any>(`/api/admin/homework/${id}`, { method: "DELETE" }),

    // Chat
    chatUsers: () => request<any[]>("/api/admin/chat/users"),
    chatMessages: (withUser?: string) => request<any[]>(`/api/admin/chat/messages${withUser ? `?with=${withUser}` : ""}`),
    sendMessage: (data: { recipientId: string; content: string }) => request<any>("/api/admin/chat/messages", { method: "POST", body: JSON.stringify(data) }),

    // Inventory
    inventory: () => request<any[]>("/api/admin/inventory"),
    createInventory: (data: Record<string, unknown>) => request<any>("/api/admin/inventory", { method: "POST", body: JSON.stringify(data) }),
    updateInventory: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/inventory/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteInventory: (id: string) => request<any>(`/api/admin/inventory/${id}`, { method: "DELETE" }),

    // Payroll (staff)
    payroll: (params?: { staffId?: string }) => request<any[]>(`/api/admin/payroll${params?.staffId ? `?staffId=${params.staffId}` : ""}`),
    createPayroll: (data: Record<string, unknown>) => request<any>("/api/admin/payroll", { method: "POST", body: JSON.stringify(data) }),
    updatePayroll: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/payroll/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deletePayroll: (id: string) => request<any>(`/api/admin/payroll/${id}`, { method: "DELETE" }),
    // Payroll (teacher)
    teacherPayroll: (params?: { teacherId?: string }) => request<any[]>(`/api/admin/teacher-payroll${params?.teacherId ? `?teacherId=${params.teacherId}` : ""}`),
    createTeacherPayroll: (data: Record<string, unknown>) => request<any>("/api/admin/teacher-payroll", { method: "POST", body: JSON.stringify(data) }),
    updateTeacherPayroll: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/teacher-payroll/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteTeacherPayroll: (id: string) => request<any>(`/api/admin/teacher-payroll/${id}`, { method: "DELETE" }),

    // Leave Notes
    leaves: () => request<any[]>("/api/admin/leaves"),
    createLeave: (data: Record<string, unknown>) => request<any>("/api/admin/leaves", { method: "POST", body: JSON.stringify(data) }),
    updateLeave: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/leaves/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteLeave: (id: string) => request<any>(`/api/admin/leaves/${id}`, { method: "DELETE" }),

    // Teacher Evaluation
    teacherEvaluations: () => request<any[]>("/api/admin/teacher-evaluations"),
    createTeacherEvaluation: (data: Record<string, unknown>) => request<any>("/api/admin/teacher-evaluations", { method: "POST", body: JSON.stringify(data) }),
    deleteTeacherEvaluation: (id: string) => request<any>(`/api/admin/teacher-evaluations/${id}`, { method: "DELETE" }),

    // Student Assessment (CAS)
    assessments: (studentId?: string) => request<any[]>(`/api/admin/assessments${studentId ? `?studentId=${studentId}` : ""}`),
    createAssessment: (data: Record<string, unknown>) => request<any>("/api/admin/assessments", { method: "POST", body: JSON.stringify(data) }),
    deleteAssessment: (id: string) => request<any>(`/api/admin/assessments/${id}`, { method: "DELETE" }),

    // Documents
    documents: () => request<any[]>("/api/admin/documents"),
    createDocument: (data: Record<string, unknown>) => request<any>("/api/admin/documents", { method: "POST", body: JSON.stringify(data) }),
    deleteDocument: (id: string) => request<any>(`/api/admin/documents/${id}`, { method: "DELETE" }),

    // Canteen
    canteen: () => request<any[]>("/api/admin/canteen"),
    createCanteenItem: (data: Record<string, unknown>) => request<any>("/api/admin/canteen", { method: "POST", body: JSON.stringify(data) }),
    updateCanteenItem: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/canteen/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteCanteenItem: (id: string) => request<any>(`/api/admin/canteen/${id}`, { method: "DELETE" }),

    // Support Tickets
    support: () => request<any[]>("/api/admin/support"),
    createSupportTicket: (data: Record<string, unknown>) => request<any>("/api/admin/support", { method: "POST", body: JSON.stringify(data) }),
    updateSupportTicket: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/support/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteSupportTicket: (id: string) => request<any>(`/api/admin/support/${id}`, { method: "DELETE" }),

    // Surveys
    surveys: () => request<any[]>("/api/admin/surveys"),
    createSurvey: (data: Record<string, unknown>) => request<any>("/api/admin/surveys", { method: "POST", body: JSON.stringify(data) }),
    updateSurvey: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/surveys/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteSurvey: (id: string) => request<any>(`/api/admin/surveys/${id}`, { method: "DELETE" }),

    // Infirmary
    infirmary: () => request<any[]>("/api/admin/infirmary"),
    createInfirmaryVisit: (data: Record<string, unknown>) => request<any>("/api/admin/infirmary", { method: "POST", body: JSON.stringify(data) }),
    deleteInfirmaryVisit: (id: string) => request<any>(`/api/admin/infirmary/${id}`, { method: "DELETE" }),

    // User Management
    schoolUsers: (p?: { role?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (p?.role) q.set("role", p.role);
      if (p?.search) q.set("search", p.search);
      return request<any[]>(`/api/admin/users?${q}`);
    },
    schoolUser: (id: string) => request<any>(`/api/admin/users/${id}`),
    updateSchoolUser: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    setUserPassword: (userId: string, password: string) => request<any>(`/api/admin/users/${userId}/set-password`, { method: "POST", body: JSON.stringify({ password }) }),

    // ECA
    eca: () => request<any[]>("/api/admin/eca"),
    createEcaActivity: (data: Record<string, unknown>) => request<any>("/api/admin/eca", { method: "POST", body: JSON.stringify(data) }),
    updateEcaActivity: (id: string, data: Record<string, unknown>) => request<any>(`/api/admin/eca/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteEcaActivity: (id: string) => request<any>(`/api/admin/eca/${id}`, { method: "DELETE" }),
  },

  teacher: {
    dashboard: () => request<any>("/api/teacher/dashboard"),
    classes: () => request<any[]>("/api/teacher/classes"),
    assignments: () => request<any[]>("/api/teacher/assignments"),
    createAssignment: (data: Record<string, unknown>) => request<any>("/api/teacher/assignments", { method: "POST", body: JSON.stringify(data) }),
    attendance: (p?: { date?: string; sectionId?: string }) => {
      const q = new URLSearchParams();
      if (p?.date) q.set("date", p.date);
      if (p?.sectionId) q.set("sectionId", p.sectionId);
      return request<any>(`/api/teacher/attendance?${q}`);
    },
    markAttendance: (data: Record<string, unknown>) => request<any>("/api/teacher/attendance/mark", { method: "POST", body: JSON.stringify(data) }),
    notices: () => request<any[]>("/api/teacher/notices"),
    routine: () => request<any[]>("/api/teacher/routine"),
    exams: () => request<any[]>("/api/teacher/exams"),
  },

  student: {
    dashboard: () => request<any>("/api/student/dashboard"),
    attendance: () => request<any>("/api/student/attendance"),
    results: () => request<any[]>("/api/student/results"),
    fees: () => request<any[]>("/api/student/fees"),
    notices: () => request<any[]>("/api/student/notices"),
    subjects: () => request<any[]>("/api/student/subjects"),
    routine: () => request<any[]>("/api/student/routine"),
    exams: () => request<any[]>("/api/student/exams"),
  },

  parent: {
    dashboard: () => request<any>("/api/parent/dashboard"),
    notices: () => request<any[]>("/api/parent/notices"),
    results: () => request<any[]>("/api/parent/results"),
    fees: () => request<any[]>("/api/parent/fees"),
    attendance: () => request<any[]>("/api/parent/attendance"),
    routine: (childId: string) => request<any[]>(`/api/parent/routine?childId=${childId}`),
  },
};
