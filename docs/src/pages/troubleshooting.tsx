export function Troubleshooting() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>Troubleshooting</h1>

      <div className="space-y-6">

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Bun: "Cannot find module 'auth.handlers.ts'"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`cd server && bun install
# Ensure imports use .ts extension`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Bun: "DATABASE_URL not set"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Check server/.env file exists
cat server/.env | grep DATABASE_URL

# Or set manually
export DATABASE_URL="postgresql://..."`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">FastAPI: "SECRET_KEY field required"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Root .env missing. Create it:
cp .env.example .env
# Edit SECRET_KEY to a 32+ char random string`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">FastAPI: "ModuleNotFoundError: No module named 'app'"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Run from project root directory
cd /path/to/dn-sms
# Or set PYTHONPATH:
export PYTHONPATH="\${PYTHONPATH}:/path/to/dn-sms"`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">FastAPI: "password cannot be longer than 72 bytes"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# bcrypt compatibility issue. Install:
pip install bcrypt==4.1.3`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">FastAPI: "relation 'roles' does not exist"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Migrations not applied. Run:
alembic upgrade head`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Auth: "JWT token is invalid"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`• Verify SECRET_KEY/JWT_SECRET in .env matches what created the token
• Bun and FastAPI use SEPARATE JWT secrets — tokens are not interchangeable
• Check token hasn't expired (access: 30min, refresh: 7 days)`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">School: "School not found"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`• Verify school slug in URL
• Check School table: bun prisma studio
• Confirm case sensitivity`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">CORS: "CORS errors in browser"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Bun server/server/.env
FRONTEND_URL="http://localhost:3000"

# FastAPI root .env
CORS_ORIGINS=["http://localhost:3000"]`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Docker: "port already allocated"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8000  # FastAPI

# Stop existing containers or change ports in docker-compose.yml`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Docker: "Cannot connect to Postgres"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Check Postgres is healthy
docker compose ps
docker compose logs postgres

# Verify env vars match in docker-compose.yml and .env
# The app container connects via Docker network (service name, not localhost)`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Docker: "Alembic can't connect to database"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Alembic runs inside Docker network — use service name as host
# In .env:
POSTGRES_HOST=postgres  # NOT localhost`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Prisma: "Migration failed"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Reset migrations (dev only!)
bun prisma migrate reset

# Apply specific migration
bun prisma migrate deploy

# Check migration status
bun prisma migrate status`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Frontend: "Blank page / white screen"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`• Check browser console for errors
• Verify PUBLIC_API_URL in client/.env
• Check if the Bun dev server is running on port 3000
• Try clearing localStorage and reloading`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">General: "Port already in use"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Find and kill process on port
lsof -i :<port>
kill -9 <PID>

# Or use different ports:
# server: PORT=4001
# client: start with --port 3001`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Uploads: "File too large"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# FastAPI: increase in .env
MAX_UPLOAD_SIZE_MB=20

# NGINX: increase client_max_body_size in nginx/nginx.conf
client_max_body_size 50M;

# Bun server: handled in index.ts`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Cloudinary: "Upload failed"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`• Verify CLOUDNARY_NAME, CLOUDNARY_API_KEY, CLOUDNARY_API_SECRET in server/.env
• Check Cloudinary dashboard for account limits
• Verify upload widget configuration in ImageUpload.tsx`}</pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mt-0 text-lg">Logs: "Where do I check logs?"</h3>
          <pre className="bg-muted p-3 rounded text-sm">{`# Bun server: stdout
# FastAPI: JSON logs to stdout
# Docker: docker compose logs -f <service>
# Prisma: bun prisma studio (database browser)
# FastAPI audit logs: GET /api/v1/audit-logs/`}</pre>
        </div>

      </div>
    </div>
  );
}
