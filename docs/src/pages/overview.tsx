export function Overview() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>DN-SMS: School Management System</h1>
      <p className="lead text-xl text-muted-foreground">
        A comprehensive, multi-tenant school management platform with dual-backend architecture, serving educational institutions across Nepal.
      </p>

      <h2>Overview</h2>
      <p>
        DN-SMS is a full-featured school management system designed for the Nepali education system. It supports
        multiple schools (multi-tenant), multiple user roles, BS/AD calendar conversion, and modular feature management
        through subscription plans.
      </p>

      <h2>Tech Stack</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="text-lg font-semibold mt-0">Frontend</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>React 19</li>
            <li>Bun (runtime + bundler)</li>
            <li>Tailwind CSS v4</li>
            <li>shadcn/ui (Radix primitives)</li>
            <li>Lucide icons</li>
          </ul>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="text-lg font-semibold mt-0">Primary Backend</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>Bun (runtime)</li>
            <li>Prisma ORM</li>
            <li>PostgreSQL</li>
            <li>JWT (jose, HS256)</li>
            <li>Cloudinary (uploads)</li>
          </ul>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="text-lg font-semibold mt-0">Auth Backend</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>FastAPI (Python)</li>
            <li>SQLAlchemy (async)</li>
            <li>PostgreSQL + Redis</li>
            <li>JWT (python-jose)</li>
            <li>bcrypt</li>
          </ul>
        </div>
      </div>

      <h2>User Roles</h2>
      <p>The system supports six distinct roles, each with its own portal:</p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Role</th>
            <th className="text-left p-2">Portal</th>
            <th className="text-left p-2">Access Level</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">super_admin</td><td className="p-2">Super Admin</td><td className="p-2">Full platform access, manage all schools</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">admin</td><td className="p-2">Admin</td><td className="p-2">School-level management (students, teachers, fees, exams)</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">teacher</td><td className="p-2">Teacher</td><td className="p-2">Classes, attendance, assignments, marks</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">staff</td><td className="p-2">Staff</td><td className="p-2">Non-teaching admin (inventory, discipline, payroll)</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">student</td><td className="p-2">Student</td><td className="p-2">Own profile, attendance, exams, timetable</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">parent</td><td className="p-2">Parent</td><td className="p-2">Children's attendance, results, fees</td></tr>
        </tbody>
      </table>

      <h2>Key Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
        {[
          "Multi-tenant (unlimited schools)",
          "BS/AD calendar conversion",
          "Subscription & plan-based gating",
          "Cloudinary image uploads",
          "JWT auth with refresh tokens",
          "6 role-specific portals",
          "Exam & marks management",
          "Fee collection & tracking",
          "Library & book issuing",
          "Transport & bus route management",
          "Hostel management",
          "Payroll for teachers & staff",
          "Timetable & routine builder",
          "Attendance (student + staff)",
          "Notice & announcement system",
          "Real-time messaging",
          "Inventory management",
          "Audit logging",
          "Cascade delete with UI updates",
          "Docker Compose deployment",
        ].map(f => <div key={f} className="flex items-center gap-2 text-sm"><span className="text-green-500">✓</span>{f}</div>)}
      </div>

      <h2>Project Structure</h2>
      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`dn-sms/
├── server/           # Bun/Prisma backend (port 4000)
│   ├── index.ts      # 150+ routes, monolithic
│   ├── auth.handlers.ts
│   └── prisma/       # Schema, migrations, seed
├── app/              # FastAPI auth backend (port 8000)
│   ├── api/v1/       # Auth, users, roles, audit endpoints
│   ├── core/         # Config, security, exceptions
│   └── models/       # SQLAlchemy models
├── client/           # React SPA (port 3000)
│   └── src/          # 6 portals, 80+ pages
├── docs/             # Documentation site
├── nginx/            # Reverse proxy config
└── docker-compose.yml`}
      </pre>

      <h2>Data Flow</h2>
      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`Browser ──► React SPA (port 3000)
               │
               ├──► Bun API (port 4000) ──► PostgreSQL (Prisma)
               │       │
               │       └── Cloudinary (file uploads)
               │
               └──► FastAPI (port 8000) ──► PostgreSQL (SQLAlchemy)
                                            │
                                            └── Redis (caching)`}
      </pre>

      <h2>Quick Start</h2>
      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# 1. Backend (Bun)
cd server && bun install && bun prisma migrate dev && bun run dev

# 2. Frontend
cd client && bun install && bun run dev

# 3. Auth API (FastAPI)
pip install -r requirements.txt && alembic upgrade head && python scripts/seed.py
uvicorn app.main:app --reload --port 8000`}
      </pre>
    </div>
  );
}
