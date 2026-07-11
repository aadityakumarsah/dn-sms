export function Architecture() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>System Architecture</h1>

      <h2>High-Level Architecture</h2>
      <p>
        DN-SMS uses a dual-backend architecture where the primary school management API (Bun/Prisma)
        handles all academic and administrative features, while the FastAPI backend handles user
        authentication, role management, and audit logging for a separate concern.
      </p>

      <h2>Component Diagram</h2>
      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────┐
│                       Client (React SPA)                     │
│                     (Bun dev server :3000)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
     ┌────────▼────────┐  ┌────▼────────────┐
     │  Bun API Server  │  │  FastAPI Server  │
     │  (port 4000)     │  │  (port 8000)     │
     │  - School Mgmt   │  │  - Auth (JWT)    │
     │  - Students       │  │  - Roles/RBAC    │
     │  - Exams          │  │  - Audit Logs    │
     │  - Fees           │  │  - User Mgmt     │
     │  - Attendance     │  │                  │
     │  - Library        │  └────────┬─────────┘
     └────────┬─────────┘           │
              │                     │
     ┌────────▼─────────┐  ┌───────▼──────────┐
     │   PostgreSQL      │  │  PostgreSQL      │
     │   (Prisma ORM)    │  │  (SQLAlchemy)    │
     │   - 35+ tables    │  │  - Users, Roles  │
     │   - Multi-tenant  │  │  - AuditLogs     │
     └───────────────────┘  └──────────────────┘`}
      </pre>

      <h2>Frontend Architecture</h2>
      <p>
        The React SPA uses a portal-based architecture. Each user role has its own portal
        with a dedicated navigation layout and page set. The app selects the correct portal
        based on the user's role after login.
      </p>

      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`┌─────────────────────────────────────────────┐
│              AuthContext                      │
│  - Stores user, token, school                │
│  - Provides login/logout/refresh             │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │         App.tsx         │
    │  Route by user.role     │
    └───┬───┬───┬───┬───┬────┘
        │   │   │   │   │
  ┌─────┘   │   │   │   └──────┐
  ▼         ▼   ▼   ▼          ▼
Super    Admin Teacher Student  Parent
Admin    43     9     8        7
8        pages  pages pages    pages
pages`}
      </pre>

      <h2>Bun Backend (server/)</h2>
      <p>
        The Bun server uses a monolithic architecture with <code>Bun.serve()</code> handling
        all routing manually. All ~150+ endpoints are defined in <code>server/index.ts</code>.
        Auth logic is extracted into <code>auth.handlers.ts</code> and <code>auth.utils.ts</code>.
      </p>

      <h3>Middleware Flow</h3>
      <pre className="bg-muted p-4 rounded-lg text-sm">
{`Request ──► CORS check ──► Rate limiter ──► Auth middleware
                 │                              │
            Allow/Deny                    Token valid?
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                                  Public             Protected
                                  route              route
                                    │                   │
                                    ▼                   ▼
                                Handler           Handler
                                    │                   │
                                    ▼                   ▼
                                Response           Response`}
      </pre>

      <h3>Authentication Flow</h3>
      <ol className="space-y-2">
        <li><strong>Super Admin</strong> logs in via <code>/api/auth/super-admin/login</code></li>
        <li>JWT token stored in <code>localStorage</code></li>
        <li><strong>School Admin</strong> logs in via <code>/api/auth/school/login?schoolSlug=...</code></li>
        <li>All subsequent requests include <code>Authorization: Bearer &lt;token&gt;</code></li>
        <li>Token refresh is handled via <code>X-Refresh-Token</code> response header</li>
        <li>Tokens expire after 30 days</li>
      </ol>

      <h2>FastAPI Backend (app/)</h2>
      <p>
        The FastAPI backend follows a clean layered architecture:
      </p>
      <pre className="bg-muted p-4 rounded-lg text-sm">
{`Routes (api/v1/)
    │
    ▼
Services (business logic)
    │
    ▼
Repositories (data access)
    │
    ▼
Models (SQLAlchemy ORM)
    │
    ▼
PostgreSQL (async via asyncpg)`}
      </pre>

      <h3>Key Design Decisions</h3>
      <ul>
        <li><strong>Async everywhere</strong> — SQLAlchemy async sessions, asyncpg driver</li>
        <li><strong>RBAC via permissions</strong> — Each role has a JSON list of permission strings (<code>users:create</code>, <code>roles:read</code>, etc.)</li>
        <li><strong>Dependency injection</strong> — FastAPI's <code>Depends</code> with <code>Annotated</code> type aliases</li>
        <li><strong>Versioned API</strong> — All routes under <code>/api/v1/</code></li>
        <li><strong>Structured logging</strong> — JSON-formatted logs for production</li>
      </ul>

      <h2>Database Design</h2>
      <h3>Bun/Prisma (35+ models)</h3>
      <p>
        The Prisma schema covers: Schools, Users (6 roles), Academic Years, Grades, Sections,
        Subjects, Exams, Exam Results, Assignments, Attendance (students + staff), Fees,
        Library, Transport, Hostel, Payroll, Notices, Messages, Timetables, Audit Logs,
        Subscriptions, Plans, Billing, and more.
      </p>

      <h3>FastAPI/SQLAlchemy (3 models)</h3>
      <p>
        A smaller schema focused on auth: <code>User</code>, <code>Role</code>, <code>AuditLog</code>.
        Designed as a separate auth service with granular permission-based RBAC.
      </p>
    </div>
  );
}
