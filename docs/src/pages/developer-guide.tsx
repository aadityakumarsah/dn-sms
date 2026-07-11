export function DeveloperGuide() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>Developer Guide</h1>

      <h2>Coding Standards</h2>

      <h3>TypeScript (Bun Backend & Frontend)</h3>
      <ul>
        <li>Use TypeScript <strong>strict mode</strong></li>
        <li>Avoid <code>any</code> — use proper types or <code>unknown</code></li>
        <li>Use <code>const</code> over <code>let</code> where possible</li>
        <li>Async/await over raw promises</li>
        <li>Use <code>Bun.serve()</code> not Express</li>
        <li>Use <code>Bun.sql</code> for direct SQL, Prisma for ORM</li>
      </ul>

      <h3>Python (FastAPI)</h3>
      <ul>
        <li>Use type hints everywhere (Python 3.11+)</li>
        <li>Follow SOLID principles — one responsibility per class</li>
        <li>Use <code>async def</code> for all route handlers and DB calls</li>
        <li>Use Pydantic v2 for request/response validation</li>
        <li>Use SQLAlchemy 2.0 style (<code>Mapped</code>, <code>mapped_column</code>)</li>
        <li>Use <code>Annotated</code> + <code>Depends</code> for DI, avoid global state</li>
      </ul>

      <h2>Code Organization</h2>

      <h3>Bun Backend (server/)</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`server/
├── index.ts              # Main server — all routes & handlers
├── auth.handlers.ts      # Auth business logic
├── auth.utils.ts         # Auth utilities (hash, generate IDs)
├── prisma.config.ts      # Prisma client setup
└── prisma/
    ├── schema.prisma     # Database schema (35+ models)
    ├── migrations/       # Migration history
    └── seed.ts           # Database seed`}</pre>

      <h3>FastAPI Backend (app/)</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`app/
├── main.py               # FastAPI app factory
├── database.py           # Async SQLAlchemy engine
├── api/v1/               # Route handlers
│   ├── auth.py           # Login, refresh, logout
│   ├── users.py          # CRUD users
│   ├── roles.py          # CRUD roles
│   └── audit_logs.py     # Audit log queries
├── core/                 # Shared infrastructure
│   ├── config.py         # Pydantic settings
│   ├── security.py       # JWT, bcrypt
│   ├── dependencies.py   # FastAPI DI
│   ├── exceptions.py     # Custom errors
│   └── logging_config.py # Structured logging
├── models/               # SQLAlchemy models
├── schemas/              # Pydantic schemas
├── services/             # Business logic
├── repositories/         # Data access layer
└── storage/              # File uploads`}</pre>

      <h3>Frontend (client/)</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`client/
├── src/
│   ├── App.tsx           # Root router with portals
│   ├── lib/
│   │   ├── api.ts        # API client (all endpoints)
│   │   └── constants.ts  # Portal configs, role maps
│   ├── contexts/
│   │   └── AuthContext.tsx # Auth state management
│   ├── portales/
│   │   ├── super-admin/  # 8 pages
│   │   ├── admin/        # 43 pages
│   │   ├── teacher/      # 9 pages
│   │   ├── staff/        # 8 pages
│   │   ├── student/      # 8 pages
│   │   └── parent/       # 7 pages
│   └── components/
│       └── ui/           # shadcn components`}</pre>

      <h2>Adding a New Feature</h2>

      <h3>Example: Add a "Hostel" Module</h3>

      <h4>1. Add Prisma Model (server/prisma/schema.prisma)</h4>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`model Hostel {
  id        String   @id @default(cuid())
  name      String
  warden    String?
  capacity  Int
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`}</pre>

      <h4>2. Add API Endpoints (server/index.ts)</h4>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`// In the routes object of Bun.serve():
"/api/hostels": {
  GET: async (req) => { /* list hostels */ },
  POST: async (req) => { /* create hostel */ },
},
"/api/hostels/:id": {
  GET: async (req) => { /* get hostel */ },
  PATCH: async (req) => { /* update hostel */ },
  DELETE: async (req) => { /* delete hostel */ },
},`}</pre>

      <h4>3. Add API Client (client/src/lib/api.ts)</h4>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`export async function getHostels(params?: PaginationParams) {
  return apiRequest<PaginatedResponse<Hostel>>(\`/hostels\`, { params });
}`}</pre>

      <h4>4. Create Portal Pages</h4>
      <p>Add pages under the appropriate portal directory in <code>client/src/portals/admin/pages/</code>.</p>

      <h4>5. Update Nav (client/src/portals/admin/layout/nav.ts)</h4>
      <p>Add the hostel link to the appropriate navigation section.</p>

      <h3>FastAPI: Add a New Resource</h3>
      <p>Follow the layered pattern:</p>
      <ol>
        <li><strong>Model</strong> — <code>app/models/hostel.py</code> — SQLAlchemy model</li>
        <li><strong>Schema</strong> — <code>app/schemas/hostel.py</code> — Pydantic validation</li>
        <li><strong>Repository</strong> — <code>app/repositories/hostel.py</code> — Data access</li>
        <li><strong>Service</strong> — <code>app/services/hostel.py</code> — Business logic + audit</li>
        <li><strong>Router</strong> — <code>app/api/v1/hostels.py</code> — Endpoints</li>
        <li>Register the router in <code>app/api/v1/__init__.py</code></li>
      </ol>

      <h2>Authentication Helpers</h2>

      <h3>Bun Backend: Auth Middleware</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`import { jwtVerify } from "jose";

async function authMiddleware(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return new Response("Unauthorized", { status: 401 });

  try {
    const { payload } = await jwtVerify(token, secretKey);
    req.user = payload;
  } catch {
    return new Response("Invalid token", { status: 401 });
  }
}`}</pre>

      <h3>FastAPI: Require Permissions</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`from app.core.dependencies import require_permissions

@router.get("/")
async def list_hostels(
    current_user: Annotated[User, Depends(require_permissions("hostels:read"))],
    db: DbSession,
): ...`}</pre>

      <h2>Environment Variables Reference</h2>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Variable</th><th className="text-left p-2">Location</th><th className="text-left p-2">Required</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">DATABASE_URL</td><td className="p-2">server/.env</td><td className="p-2">Yes</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">JWT_SECRET</td><td className="p-2">server/.env</td><td className="p-2">Yes</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">CLOUDNARY_NAME</td><td className="p-2">server/.env</td><td className="p-2">Yes (uploads)</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">SECRET_KEY</td><td className="p-2">root .env</td><td className="p-2">Yes (FastAPI)</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">FRONTEND_URL</td><td className="p-2">server/.env</td><td className="p-2">Yes (CORS)</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">PUBLIC_API_URL</td><td className="p-2">client/.env</td><td className="p-2">Yes</td></tr>
        </tbody>
      </table>

      <h2>Useful Commands</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`# Bun
bun run dev              # Start dev server
bun run build            # Production build
bun test                 # Run tests
bun prisma studio        # DB browser
bun prisma migrate dev   # Create migration
bun prisma migrate deploy # Apply in production

# Python / FastAPI
uvicorn app.main:app --reload --port 8000
alembic revision --autogenerate -m "description"
alembic upgrade head
python scripts/seed.py

# Docker
docker compose up -d
docker compose logs -f app
docker compose run --rm alembic upgrade head`}</pre>
    </div>
  );
}
