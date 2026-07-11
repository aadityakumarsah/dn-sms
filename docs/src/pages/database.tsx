export function Database() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>Database Schema</h1>

      <h2>Prisma Schema (Bun Backend)</h2>
      <p>
        The primary database uses PostgreSQL with Prisma ORM. The schema defines 35+ models
        covering all school management domains. Located at <code>server/prisma/schema.prisma</code>.
      </p>

      <h3>Core Models</h3>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Model</th><th className="text-left p-2">Table</th><th className="text-left p-2">Purpose</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">School</td><td className="p-2">School</td><td className="p-2">Multi-tenant school records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">SuperAdmin</td><td className="p-2">SuperAdmin</td><td className="p-2">Platform super admins</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">User</td><td className="p-2">User</td><td className="p-2">All users (6 roles)</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">UserProfile</td><td className="p-2">UserProfile</td><td className="p-2">Extended user details</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Student</td><td className="p-2">Student</td><td className="p-2">Student records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Teacher</td><td className="p-2">Teacher</td><td className="p-2">Teacher records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Staff</td><td className="p-2">Staff</td><td className="p-2">Non-teaching staff</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Parent</td><td className="p-2">Parent</td><td className="p-2">Parent/guardian records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">ParentStudent</td><td className="p-2">ParentStudent</td><td className="p-2">Parent-child relationship</td></tr>
        </tbody>
      </table>

      <h3>Academic Models</h3>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Model</th><th className="text-left p-2">Table</th><th className="text-left p-2">Purpose</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">AcademicYear</td><td className="p-2">AcademicYear</td><td className="p-2">School academic years</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Grade</td><td className="p-2">Grade</td><td className="p-2">Class/grade levels</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Section</td><td className="p-2">Section</td><td className="p-2">Class sections</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Subject</td><td className="p-2">Subject</td><td className="p-2">Subjects offered</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">SubjectAssignment</td><td className="p-2">SubjectAssignment</td><td className="p-2">Subject-teacher assignments</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">StudentEnrollment</td><td className="p-2">StudentEnrollment</td><td className="p-2">Student class enrollment</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Exam</td><td className="p-2">Exam</td><td className="p-2">Exam schedules</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">ExamSubject</td><td className="p-2">ExamSubject</td><td className="p-2">Exam-subject mapping</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">ExamResult</td><td className="p-2">ExamResult</td><td className="p-2">Student exam results</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Assignment</td><td className="p-2">Assignment</td><td className="p-2">Homework/assignments</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">AssignmentSubmission</td><td className="p-2">AssignmentSubmission</td><td className="p-2">Student submissions</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Timetable</td><td className="p-2">Timetable</td><td className="p-2">Class timetables</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">TimetableSlot</td><td className="p-2">TimetableSlot</td><td className="p-2">Individual time slots</td></tr>
        </tbody>
      </table>

      <h3>Attendance Models</h3>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Model</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">StudentAttendance</td><td className="p-2">Daily student attendance records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">StaffAttendance</td><td className="p-2">Daily staff attendance records</td></tr>
        </tbody>
      </table>

      <h3>Financial Models</h3>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Model</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">FeeType</td><td className="p-2">Types of fees (tuition, exam, admission, etc.)</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">FeeStructure</td><td className="p-2">Fee structures per grade/section</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">FeeInstallment</td><td className="p-2">Installment plans</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">FeeCollection</td><td className="p-2">Payment records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Payroll</td><td className="p-2">Staff payroll records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">TeacherPayroll</td><td className="p-2">Teacher payroll records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">BillingTransaction</td><td className="p-2">Platform billing transactions</td></tr>
        </tbody>
      </table>

      <h3>Resource Models</h3>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Model</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">LibraryBook</td><td className="p-2">Library book inventory</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">BookIssue</td><td className="p-2">Book issue/return records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Bus</td><td className="p-2">Transport buses</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">BusRoute</td><td className="p-2">Bus routes and stops</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">CanteenItem</td><td className="p-2">Canteen inventory</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Inventory</td><td className="p-2">General school inventory</td></tr>
        </tbody>
      </table>

      <h3>Communication Models</h3>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Model</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">Notice</td><td className="p-2">School notices</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Message</td><td className="p-2">User-to-user messages</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Notification</td><td className="p-2">System notifications</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">SchoolAnnouncement</td><td className="p-2">School-level announcements</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">PlatformAnnouncement</td><td className="p-2">Platform-wide announcements</td></tr>
        </tbody>
      </table>

      <h3>Other Models</h3>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Model</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">Department</td><td className="p-2">School departments</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">DisciplineRecord</td><td className="p-2">Student discipline records</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Document</td><td className="p-2">Uploaded documents</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">EcaActivity</td><td className="p-2">Extra-curricular activities</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">InfirmaryVisit</td><td className="p-2">Health center visits</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">LeaveApplication</td><td className="p-2">Leave requests</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">StudentAssessment</td><td className="p-2">Student assessments</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">SupportTicket</td><td className="p-2">Support tickets</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Survey</td><td className="p-2">Surveys</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">SurveyResponse</td><td className="p-2">Survey responses</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">TeacherEvaluation</td><td className="p-2">Teacher evaluations</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Plan</td><td className="p-2">Subscription plans</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Subscription</td><td className="p-2">School subscriptions</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">AuditLog</td><td className="p-2">Audit log entries</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Admission</td><td className="p-2">Student admissions</td></tr>
        </tbody>
      </table>

      <h3>Key Relationships</h3>
      <ul>
        <li><strong>School</strong> cascades to all child entities (users, students, teachers, fees, notices, etc.)</li>
        <li><strong>User</strong> relates to role-specific tables via one-to-one (Student, Teacher, Staff, Parent)</li>
        <li><strong>Student</strong> ←→ <strong>Parent</strong> via <code>ParentStudent</code> join table</li>
        <li><strong>School</strong> → <strong>Subscription</strong> → <strong>Plan</strong> (plan-based feature gating)</li>
      </ul>

      <h2>FastAPI/SQLAlchemy Schema</h2>
      <p>Three models focused on authentication and authorization:</p>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Model</th><th className="text-left p-2">Table</th><th className="text-left p-2">Fields</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">User</td><td className="p-2">users</td><td className="p-2">id, email, username, password_hash, first_name, last_name, phone, is_active, is_superuser, role_id (FK), timestamps</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Role</td><td className="p-2">roles</td><td className="p-2">id, name (unique), description, permissions (JSON), is_system, timestamps</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">AuditLog</td><td className="p-2">audit_logs</td><td className="p-2">id, user_id (FK), action, resource, resource_id, details (JSON), ip_address, user_agent, timestamp</td></tr>
        </tbody>
      </table>

      <h3>Seeded Roles & Permissions</h3>
      <p>The seed script creates 6 system roles with granular permissions:</p>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Role</th><th className="text-left p-2">Permission Count</th><th className="text-left p-2">Key Permissions</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">super_admin</td><td className="p-2">30</td><td className="p-2">All CRUD on all resources</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">admin</td><td className="p-2">18</td><td className="p-2">Create/Read/Update most resources</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">teacher</td><td className="p-2">9</td><td className="p-2">Attendance, exams, students:read</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">staff</td><td className="p-2">8</td><td className="p-2">Fees, library, students:read</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">student</td><td className="p-2">6</td><td className="p-2">Read-only self-service</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">parent</td><td className="p-2">5</td><td className="p-2">Read-only child data</td></tr>
        </tbody>
      </table>
    </div>
  );
}
