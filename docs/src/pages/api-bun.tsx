export function ApiBun() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>Bun/Prisma API Reference</h1>
      <p>The primary SMS API runs on port 4000. All endpoints are under <code>/api</code>.</p>

      <h2>Authentication Endpoints</h2>

      <h3>Super Admin Login</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/auth/super-admin/login
Body: { "email": "admin@school.com", "password": "..." }
Response: { "token": "jwt...", "user": { ... } }`}</pre>

      <h3>School Admin Login</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/auth/school/login
Body: { "email": "...", "password": "...", "schoolSlug": "school-name" }
Response: { "token": "jwt...", "user": { ... } }`}</pre>

      <h3>Create School (Super Admin only)</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/auth/super-admin/create-school
Headers: Authorization: Bearer <token>
Body: { "name": "School Name", "city": "Kathmandu", "district": "Kathmandu" }
Response: { "school": {...}, "admin": {"email": "...", "password": "..."} }`}</pre>

      <h3>Create User by Role (School Admin)</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/auth/school/users/:role
Headers: Authorization: Bearer <token>
Body: { "firstName": "...", "lastName": "...", "phone": "..." }
Roles: teacher, staff, student, parent
Response: { "user": {...}, "credentials": {"email": "...", "password": "..."} }`}</pre>

      <h3>Bulk Create Users</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/auth/school/users/bulk
Headers: Authorization: Bearer <token>
Body: { "role": "student", "users": [{ "firstName": "...", ... }] }
Response: { "created": 50, "errors": [] }`}</pre>

      <h3>Get Current User</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { "id": "...", "email": "...", "role": "admin", ... }`}</pre>

      <h3>Update Password</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`PUT /api/auth/update-password
Headers: Authorization: Bearer <token>
Body: { "oldPassword": "...", "newPassword": "..." }
Response: { "message": "Password updated" }`}</pre>

      <h3>Reset User Password (Admin)</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/auth/reset-password
Headers: Authorization: Bearer <token>
Body: { "userId": "...", "schoolSlug": "..." }
Response: { "newPassword": "auto-generated" }`}</pre>

      <h2>School Management</h2>

      <h3>List Schools (Super Admin)</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/schools
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20&search=test
Response: { "schools": [...], "total": 50 }`}</pre>

      <h3>Get School Details</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/schools/:slug
Headers: Authorization: Bearer <token>
Response: { "id": "...", "name": "...", "slug": "...", ... }`}</pre>

      <h3>Update School</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`PATCH /api/schools/:slug
Headers: Authorization: Bearer <token>
Body: { "name": "...", "address": "...", "phone": "..." }`}</pre>

      <h3>Delete School (Cascade)</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`DELETE /api/schools/:slug
Headers: Authorization: Bearer <token>
Response: { "message": "School deleted", "deleted": { "users": 150, "students": 500, ... } }`}</pre>

      <h2>Student Endpoints</h2>

      <h3>List Students</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/students
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20&class=10&section=A&search=ram`}</pre>

      <h3>Create Student</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`POST /api/students
Headers: Authorization: Bearer <token>
Body: { "firstName": "...", "lastName": "...", "class": "10", "section": "A",
        "dateOfBirth": "2060-01-15", "guardianName": "...", "address": "..." }`}</pre>

      <h3>Get Student Detail</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/students/:id
Headers: Authorization: Bearer <token>`}</pre>

      <h3>Update Student</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`PATCH /api/students/:id
Headers: Authorization: Bearer <token>`}</pre>

      <h3>Delete Student</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`DELETE /api/students/:id
Headers: Authorization: Bearer <token>`}</pre>

      <h2>Academic Endpoints</h2>

      <h3>Exams</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/exams          — List exams
POST /api/exams          — Create exam
GET /api/exams/:id       — Get exam details
PATCH /api/exams/:id     — Update exam
DELETE /api/exams/:id    — Delete exam`}</pre>

      <h3>Results / Marks</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/exams/:id/results      — Get exam results
POST /api/exams/:id/results     — Add marks for a student
PATCH /api/exam-results/:id     — Update marks`}</pre>

      <h3>Assignments</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/assignments
POST /api/assignments
GET /api/assignments/:id
PATCH /api/assignments/:id
DELETE /api/assignments/:id
POST /api/assignments/:id/submit  — Student submission`}</pre>

      <h3>Attendance</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/attendance/students?date=2081-01-15&class=10
POST /api/attendance/students    — Mark attendance (bulk)
GET /api/attendance/staff?date=...
POST /api/attendance/staff`}</pre>

      <h3>Timetable</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/timetable?class=10&section=A
POST /api/timetable       — Create timetable
GET /api/timetable/:id
PATCH /api/timetable/:id
DELETE /api/timetable/:id`}</pre>

      <h2>Fee Management</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/fees/types           — Fee types (tuition, exam, etc.)
POST /api/fees/types          — Create fee type
GET /api/fees/structures      — Fee structures per class
POST /api/fees/structures     — Create fee structure
GET /api/fees/collections      — Fee collections
POST /api/fees/collections     — Record payment
GET /api/fees/dues            — Due list`}</pre>

      <h2>Library</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/library/books         — List books
POST /api/library/books        — Add book
GET /api/library/books/:id
PATCH /api/library/books/:id
DELETE /api/library/books/:id
GET /api/library/issues        — Issued books
POST /api/library/issues       — Issue book
POST /api/library/return       — Return book`}</pre>

      <h2>Transport</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/transport/routes
POST /api/transport/routes
GET /api/transport/buses
POST /api/transport/buses
POST /api/transport/assign     — Assign student to route`}</pre>

      <h2>Payroll</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/payroll               — List payroll records
POST /api/payroll               — Process payroll
GET /api/payroll/:id
PATCH /api/payroll/:id`}</pre>

      <h2>Communication</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`GET /api/notices               — List notices
POST /api/notices               — Create notice
GET /api/messages               — List messages
POST /api/messages              — Send message
GET /api/notifications          — User notifications`}</pre>

      <h2>Common Query Parameters</h2>
      <p>All list endpoints support:</p>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Param</th><th className="text-left p-2">Type</th><th className="text-left p-2">Default</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">page</td><td className="p-2">number</td><td className="p-2">1</td><td className="p-2">Page number</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">limit</td><td className="p-2">number</td><td className="p-2">20</td><td className="p-2">Items per page (max 100)</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">search</td><td className="p-2">string</td><td className="p-2">-</td><td className="p-2">Search keyword</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">sortBy</td><td className="p-2">string</td><td className="p-2">createdAt</td><td className="p-2">Field to sort by</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">sortOrder</td><td className="p-2">asc|desc</td><td className="p-2">desc</td><td className="p-2">Sort direction</td></tr>
        </tbody>
      </table>

      <h2>Error Response Format</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`{
  "error": "Error message describing what went wrong",
  "status": 400
}`}</pre>

      <h2>Headers</h2>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Header</th><th className="text-left p-2">Required</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">Authorization</td><td className="p-2">For protected routes</td><td className="p-2"><code>Bearer &lt;jwt-token&gt;</code></td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Content-Type</td><td className="p-2">For POST/PATCH</td><td className="p-2"><code>application/json</code></td></tr>
          <tr className="border-b"><td className="p-2 font-mono">X-Refresh-Token</td><td className="p-2">Response header</td><td className="p-2">New JWT when token is refreshed</td></tr>
        </tbody>
      </table>
    </div>
  );
}
