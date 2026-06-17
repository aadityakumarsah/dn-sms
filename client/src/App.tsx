import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PortalLayout } from "@/components/common/PortalLayout";
import { ROLE_HOME } from "@/lib/constants";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";

// Super Admin
import SuperAdminDashboard from "@/portals/super-admin/pages/Dashboard";
import SuperAdminSchools from "@/portals/super-admin/pages/Schools";
import SuperAdminUsers from "@/portals/super-admin/pages/Users";
import SuperAdminPlans from "@/portals/super-admin/pages/Plans";
import SuperAdminAnalytics from "@/portals/super-admin/pages/Analytics";
import SuperAdminAnnouncements from "@/portals/super-admin/pages/Announcements";
import SuperAdminActivity from "@/portals/super-admin/pages/Activity";
import SuperAdminSettings from "@/portals/super-admin/pages/Settings";
import { superAdminNav } from "@/portals/super-admin/layout/nav";

// Admin
import AdminDashboard from "@/portals/admin/pages/Dashboard";
import AdminStudents from "@/portals/admin/pages/Students";
import AdminStudentDetail from "@/portals/admin/pages/StudentDetail";
import AdminTeachers from "@/portals/admin/pages/Teachers";
import AdminTeacherDetail from "@/portals/admin/pages/TeacherDetail";
import AdminStaffDetail from "@/portals/admin/pages/StaffDetail";
import AdminClasses from "@/portals/admin/pages/Classes";
import AdminSections from "@/portals/admin/pages/Sections";
import AdminSectionDetail from "@/portals/admin/pages/SectionDetail";
import AdminTransport from "@/portals/admin/pages/Transport";
import AdminDepartments from "@/portals/admin/pages/Departments";
import AdminAttendance from "@/portals/admin/pages/Attendance";
import AdminFees from "@/portals/admin/pages/Fees";
import AdminExams from "@/portals/admin/pages/Exams";
import AdminNotices from "@/portals/admin/pages/Notices";
import AdminReports from "@/portals/admin/pages/Reports";
import AdminSettings from "@/portals/admin/pages/Settings";
import AdminLibrary from "@/portals/admin/pages/Library";
import AdminAdmissions from "@/portals/admin/pages/Admissions";
import AdminAcademic from "@/portals/admin/pages/Academic";
import AdminCalendar from "@/portals/admin/pages/Calendar";
import AdminStaffMgmt from "@/portals/admin/pages/StaffMgmt";
import { adminNav } from "@/portals/admin/layout/nav";

// Teacher
import TeacherDashboard from "@/portals/teacher/pages/Dashboard";
import TeacherClasses from "@/portals/teacher/pages/Classes";
import TeacherAttendance from "@/portals/teacher/pages/Attendance";
import TeacherAssignments from "@/portals/teacher/pages/Assignments";
import TeacherMarks from "@/portals/teacher/pages/Marks";
import TeacherMessages from "@/portals/teacher/pages/Messages";
import { teacherNav } from "@/portals/teacher/layout/nav";

// Staff
import StaffDashboard from "@/portals/staff/pages/Dashboard";
import StaffMembers from "@/portals/staff/pages/Members";
import StaffAttendance from "@/portals/staff/pages/Attendance";
import StaffPayroll from "@/portals/staff/pages/Payroll";
import StaffInventory from "@/portals/staff/pages/Inventory";
import { staffNav } from "@/portals/staff/layout/nav";

// Parent
import ParentDashboard from "@/portals/parent/pages/Dashboard";
import ParentAttendance from "@/portals/parent/pages/Attendance";
import ParentResults from "@/portals/parent/pages/Results";
import ParentFees from "@/portals/parent/pages/Fees";
import ParentNotices from "@/portals/parent/pages/Notices";
import ParentMessages from "@/portals/parent/pages/Messages";
import { parentNav } from "@/portals/parent/layout/nav";

// Student
import StudentDashboard from "@/portals/student/pages/Dashboard";
import StudentSubjects from "@/portals/student/pages/Subjects";
import StudentAttendance from "@/portals/student/pages/Attendance";
import StudentResults from "@/portals/student/pages/Results";
import StudentTimetable from "@/portals/student/pages/Timetable";
import StudentNotices from "@/portals/student/pages/Notices";
import { studentNav } from "@/portals/student/layout/nav";

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center p-8">
      <div className="text-4xl mb-4">🚧</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-sm text-gray-400">This page is coming soon.</p>
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
                  <Route path="activity" element={<SuperAdminActivity />} />
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
                  <Route path="transport" element={<AdminTransport />} />
                  <Route path="departments" element={<AdminDepartments />} />
                  <Route path="attendance" element={<AdminAttendance />} />
                  <Route path="fees" element={<AdminFees />} />
                  <Route path="exams" element={<AdminExams />} />
                  <Route path="notices" element={<AdminNotices />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="library" element={<AdminLibrary />} />
                  <Route path="admissions" element={<AdminAdmissions />} />
                  <Route path="academic" element={<AdminAcademic />} />
                  <Route path="calendar" element={<AdminCalendar />} />
                  <Route path="staff-mgmt" element={<AdminStaffMgmt />} />
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
                  <Route path="notices" element={<StudentNotices />} />
                  <Route path="settings" element={<ComingSoon title="Settings" />} />
                </Routes>
              </PortalLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
