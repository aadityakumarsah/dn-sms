import "./index.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PortalLayout } from "@/components/common/PortalLayout";
import { ROLE_HOME } from "@/lib/constants";

// Entry pages — kept eager so first paint is instant.
import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";

// Nav configs are tiny data modules — keep eager.
import { superAdminNav } from "@/portals/super-admin/layout/nav";
import { adminNav } from "@/portals/admin/layout/nav";
import { teacherNav } from "@/portals/teacher/layout/nav";
import { staffNav } from "@/portals/staff/layout/nav";
import { parentNav } from "@/portals/parent/layout/nav";
import { studentNav } from "@/portals/student/layout/nav";

// Portal pages — lazily loaded so each portal is its own chunk and the
// initial bundle stays small (was ~2.3MB shipping every page eagerly).
const SuperAdminDashboard = lazy(() => import("@/portals/super-admin/pages/Dashboard"));
const SuperAdminSchools = lazy(() => import("@/portals/super-admin/pages/Schools"));
const SuperAdminUsers = lazy(() => import("@/portals/super-admin/pages/Users"));
const SuperAdminPlans = lazy(() => import("@/portals/super-admin/pages/Plans"));
const SuperAdminAnalytics = lazy(() => import("@/portals/super-admin/pages/Analytics"));
const SuperAdminAnnouncements = lazy(() => import("@/portals/super-admin/pages/Announcements"));
const SuperAdminSettings = lazy(() => import("@/portals/super-admin/pages/Settings"));

const AdminDashboard = lazy(() => import("@/portals/admin/pages/Dashboard"));
const AdminStudents = lazy(() => import("@/portals/admin/pages/Students"));
const AdminStudentDetail = lazy(() => import("@/portals/admin/pages/StudentDetail"));
const AdminTeachers = lazy(() => import("@/portals/admin/pages/Teachers"));
const AdminTeacherDetail = lazy(() => import("@/portals/admin/pages/TeacherDetail"));
const AdminStaffDetail = lazy(() => import("@/portals/admin/pages/StaffDetail"));
const AdminClasses = lazy(() => import("@/portals/admin/pages/Classes"));
const AdminSections = lazy(() => import("@/portals/admin/pages/Sections"));
const AdminSectionDetail = lazy(() => import("@/portals/admin/pages/SectionDetail"));
const AdminSubjects = lazy(() => import("@/portals/admin/pages/Subjects"));
const AdminTransport = lazy(() => import("@/portals/admin/pages/Transport"));
const AdminDepartments = lazy(() => import("@/portals/admin/pages/Departments"));
const AdminAttendance = lazy(() => import("@/portals/admin/pages/Attendance"));
const AdminFees = lazy(() => import("@/portals/admin/pages/Fees"));
const AdminExams = lazy(() => import("@/portals/admin/pages/Exams"));
const AdminNotices = lazy(() => import("@/portals/admin/pages/Notices"));
const AdminReports = lazy(() => import("@/portals/admin/pages/Reports"));
const AdminSettings = lazy(() => import("@/portals/admin/pages/Settings"));
const AdminLibrary = lazy(() => import("@/portals/admin/pages/Library"));
const AdminAdmissions = lazy(() => import("@/portals/admin/pages/Admissions"));
const AdminAcademic = lazy(() => import("@/portals/admin/pages/Academic"));
const AdminCalendar = lazy(() => import("@/portals/admin/pages/Calendar"));
const AdminStaffMgmt = lazy(() => import("@/portals/admin/pages/StaffMgmt"));
const AdminNotifications = lazy(() => import("@/portals/admin/pages/Notifications"));
const AdminRoutine = lazy(() => import("@/portals/admin/pages/Routine"));
const AdminHomework = lazy(() => import("@/portals/admin/pages/Homework"));
const AdminChat = lazy(() => import("@/portals/admin/pages/Chat"));
const AdminInventory = lazy(() => import("@/portals/admin/pages/Inventory"));
const AdminPayroll = lazy(() => import("@/portals/admin/pages/Payroll"));
const AdminLeaves = lazy(() => import("@/portals/admin/pages/Leaves"));
const AdminTeacherEval = lazy(() => import("@/portals/admin/pages/TeacherEvaluation"));
const AdminAssessments = lazy(() => import("@/portals/admin/pages/Assessments"));
const AdminDocuments = lazy(() => import("@/portals/admin/pages/Documents"));
const AdminCanteen = lazy(() => import("@/portals/admin/pages/Canteen"));
const AdminSupport = lazy(() => import("@/portals/admin/pages/Support"));
const AdminSurveys = lazy(() => import("@/portals/admin/pages/Surveys"));
const AdminInfirmary = lazy(() => import("@/portals/admin/pages/Infirmary"));
const AdminEca = lazy(() => import("@/portals/admin/pages/Eca"));
const AdminUserManagement = lazy(() => import("@/portals/admin/pages/UserManagement"));
const AdminFeeStructures = lazy(() => import("@/portals/admin/pages/FeeStructures"));

const TeacherDashboard = lazy(() => import("@/portals/teacher/pages/Dashboard"));
const TeacherClasses = lazy(() => import("@/portals/teacher/pages/Classes"));
const TeacherRoutine = lazy(() => import("@/portals/teacher/pages/Routine"));
const TeacherExams = lazy(() => import("@/portals/teacher/pages/Exams"));
const TeacherAttendance = lazy(() => import("@/portals/teacher/pages/Attendance"));
const TeacherAssignments = lazy(() => import("@/portals/teacher/pages/Assignments"));
const TeacherMarks = lazy(() => import("@/portals/teacher/pages/Marks"));
const TeacherMessages = lazy(() => import("@/portals/teacher/pages/Messages"));

const StaffDashboard = lazy(() => import("@/portals/staff/pages/Dashboard"));
const StaffMembers = lazy(() => import("@/portals/staff/pages/Members"));
const StaffAttendance = lazy(() => import("@/portals/staff/pages/Attendance"));
const StaffPayroll = lazy(() => import("@/portals/staff/pages/Payroll"));
const StaffInventory = lazy(() => import("@/portals/staff/pages/Inventory"));

const ParentDashboard = lazy(() => import("@/portals/parent/pages/Dashboard"));
const ParentRoutine = lazy(() => import("@/portals/parent/pages/Routine"));
const ParentAttendance = lazy(() => import("@/portals/parent/pages/Attendance"));
const ParentResults = lazy(() => import("@/portals/parent/pages/Results"));
const ParentFees = lazy(() => import("@/portals/parent/pages/Fees"));
const ParentNotices = lazy(() => import("@/portals/parent/pages/Notices"));
const ParentMessages = lazy(() => import("@/portals/parent/pages/Messages"));

const StudentDashboard = lazy(() => import("@/portals/student/pages/Dashboard"));
const StudentSubjects = lazy(() => import("@/portals/student/pages/Subjects"));
const StudentAttendance = lazy(() => import("@/portals/student/pages/Attendance"));
const StudentResults = lazy(() => import("@/portals/student/pages/Results"));
const StudentTimetable = lazy(() => import("@/portals/student/pages/Timetable"));
const StudentExams = lazy(() => import("@/portals/student/pages/Exams"));
const StudentNotices = lazy(() => import("@/portals/student/pages/Notices"));

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center p-8">
      <div className="text-4xl mb-4">🚧</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-sm text-gray-400">This page is coming soon.</p>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />

            {/* Super Admin Portal */}
            <Route path="/super-admin/*" element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <PortalLayout navItems={superAdminNav}>
                  <Routes>
                    <Route index element={<SuperAdminDashboard />} />
                    <Route path="schools" element={<SuperAdminSchools />} />
                    <Route path="users" element={<SuperAdminUsers />} />
                    <Route path="plans" element={<SuperAdminPlans />} />
                    <Route path="analytics" element={<SuperAdminAnalytics />} />
                    <Route path="announcements" element={<SuperAdminAnnouncements />} />
                    <Route path="settings" element={<SuperAdminSettings />} />
                    <Route path="subscriptions" element={<ComingSoon title="Subscriptions" />} />
                    <Route path="permissions" element={<ComingSoon title="Permissions" />} />
                  </Routes>
                </PortalLayout>
              </ProtectedRoute>
            } />

            {/* Admin Portal */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PortalLayout navItems={adminNav}>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="students/:id" element={<AdminStudentDetail />} />
                    <Route path="teachers" element={<AdminTeachers />} />
                    <Route path="teachers/:id" element={<AdminTeacherDetail />} />
                    <Route path="staff-mgmt/:id" element={<AdminStaffDetail />} />
                    <Route path="classes" element={<AdminClasses />} />
                    <Route path="sections" element={<AdminSections />} />
                    <Route path="sections/:id" element={<AdminSectionDetail />} />
                    <Route path="subjects" element={<AdminSubjects />} />
                    <Route path="transport" element={<AdminTransport />} />
                    <Route path="departments" element={<AdminDepartments />} />
                    <Route path="attendance" element={<AdminAttendance />} />
                    <Route path="fees" element={<AdminFees />} />
                    <Route path="fee-structures" element={<AdminFeeStructures />} />
                    <Route path="exams" element={<AdminExams />} />
                    <Route path="notices" element={<AdminNotices />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="library" element={<AdminLibrary />} />
                    <Route path="admissions" element={<AdminAdmissions />} />
                    <Route path="academic" element={<AdminAcademic />} />
                    <Route path="calendar" element={<AdminCalendar />} />
                    <Route path="staff-mgmt" element={<AdminStaffMgmt />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="routine" element={<AdminRoutine />} />
                    <Route path="homework" element={<AdminHomework />} />
                    <Route path="chat" element={<AdminChat />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="payroll" element={<AdminPayroll />} />
                    <Route path="leaves" element={<AdminLeaves />} />
                    <Route path="teacher-evaluation" element={<AdminTeacherEval />} />
                    <Route path="assessments" element={<AdminAssessments />} />
                    <Route path="documents" element={<AdminDocuments />} />
                    <Route path="canteen" element={<AdminCanteen />} />
                    <Route path="support" element={<AdminSupport />} />
                    <Route path="surveys" element={<AdminSurveys />} />
                    <Route path="infirmary" element={<AdminInfirmary />} />
                    <Route path="eca" element={<AdminEca />} />
                    <Route path="user-management" element={<AdminUserManagement />} />
                  </Routes>
                </PortalLayout>
              </ProtectedRoute>
            } />

            {/* Teacher Portal */}
            <Route path="/teacher/*" element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <PortalLayout navItems={teacherNav}>
                  <Routes>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="classes" element={<TeacherClasses />} />
                    <Route path="routine" element={<TeacherRoutine />} />
                    <Route path="exams" element={<TeacherExams />} />
                    <Route path="attendance" element={<TeacherAttendance />} />
                    <Route path="assignments" element={<TeacherAssignments />} />
                    <Route path="marks" element={<TeacherMarks />} />
                    <Route path="messages" element={<TeacherMessages />} />
                    <Route path="settings" element={<ComingSoon title="Settings" />} />
                  </Routes>
                </PortalLayout>
              </ProtectedRoute>
            } />

            {/* Staff Portal */}
            <Route path="/staff/*" element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <PortalLayout navItems={staffNav}>
                  <Routes>
                    <Route index element={<StaffDashboard />} />
                    <Route path="members" element={<StaffMembers />} />
                    <Route path="attendance" element={<StaffAttendance />} />
                    <Route path="payroll" element={<StaffPayroll />} />
                    <Route path="inventory" element={<StaffInventory />} />
                    <Route path="settings" element={<ComingSoon title="Settings" />} />
                  </Routes>
                </PortalLayout>
              </ProtectedRoute>
            } />

            {/* Parent Portal */}
            <Route path="/parent/*" element={
              <ProtectedRoute allowedRoles={["parent"]}>
                <PortalLayout navItems={parentNav}>
                  <Routes>
                    <Route index element={<ParentDashboard />} />
                    <Route path="routine" element={<ParentRoutine />} />
                    <Route path="attendance" element={<ParentAttendance />} />
                    <Route path="results" element={<ParentResults />} />
                    <Route path="fees" element={<ParentFees />} />
                    <Route path="notices" element={<ParentNotices />} />
                    <Route path="messages" element={<ParentMessages />} />
                    <Route path="settings" element={<ComingSoon title="Settings" />} />
                  </Routes>
                </PortalLayout>
              </ProtectedRoute>
            } />

            {/* Student Portal */}
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={["student"]}>
                <PortalLayout navItems={studentNav}>
                  <Routes>
                    <Route index element={<StudentDashboard />} />
                    <Route path="subjects" element={<StudentSubjects />} />
                    <Route path="attendance" element={<StudentAttendance />} />
                    <Route path="results" element={<StudentResults />} />
                    <Route path="timetable" element={<StudentTimetable />} />
                    <Route path="exams" element={<StudentExams />} />
                    <Route path="notices" element={<StudentNotices />} />
                    <Route path="settings" element={<ComingSoon title="Settings" />} />
                  </Routes>
                </PortalLayout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
