export function Deployment() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>Deployment Guide</h1>

      <h2>Option 1: Docker Compose (Recommended)</h2>
      <p>The project includes a full Docker Compose setup for production deployment.</p>

      <h3>Prerequisites</h3>
      <ul>
        <li>Server with Docker & Docker Compose installed</li>
        <li>Domain name pointing to the server IP</li>
        <li>SSL certificates (Let's Encrypt)</li>
      </ul>

      <h3>Steps</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`# 1. Clone the repo on your server
git clone <repo-url> /opt/dn-sms
cd /opt/dn-sms

# 2. Configure environment
cp .env.example .env
nano .env   # Set SECRET_KEY, DB passwords, etc.

# 3. Get SSL certificates
apt install -y certbot
certbot certonly --standalone -d api.yourdomain.com
mkdir -p ssl
cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem ssl/key.pem

# 4. Launch all services
docker compose up -d

# 5. Run migrations & seed
docker compose run --rm alembic upgrade head
docker compose run --rm app python scripts/seed.py

# 6. Verify
curl https://api.yourdomain.com/health`}</pre>

      <h3>Service Architecture</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`NGINX (443) ──► FastAPI app (8000)
                    │
                    ├──► PostgreSQL (5432)
                    │
                    └──► Redis (6379)`}</pre>

      <h2>Option 2: Manual Deployment</h2>

      <h3>Bun/Prisma Backend</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`cd server
export DATABASE_URL="postgresql://user:pass@host:5432/dn_sms_prod"
export JWT_SECRET="long-random-string"
export PORT=4000
export FRONTEND_URL="https://app.yourdomain.com"
export NODE_ENV="production"
export CLOUDNARY_NAME=...
export CLOUDNARY_API_KEY=...
export CLOUDNARY_API_SECRET=...

# Apply migrations
bun prisma migrate deploy

# Start server
NODE_ENV=production bun src/index.ts`}</pre>

      <h3>FastAPI Backend</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`# Python setup
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Environment
export SECRET_KEY="long-random-string-min-32-chars"
export DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/sms_db"

# Migrations & seed
alembic upgrade head
python scripts/seed.py

# Start (4 workers)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`}</pre>

      <h3>Frontend</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`cd client
bun run build
# Output in client/dist/ — deploy to Vercel, Netlify, or NGINX`}</pre>

      <h2>NGINX Configuration</h2>
      <p>
        The NGINX config at <code>nginx/nginx.conf</code> handles SSL termination,
        reverse proxying to the FastAPI backend, static file serving, and rate limiting.
      </p>

      <h3>Key Settings</h3>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Setting</th><th className="text-left p-2">Value</th><th className="text-left p-2">Description</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">Rate limit</td><td className="p-2">100 req/s</td><td className="p-2">Per IP, burst 200</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Max body size</td><td className="p-2">20 MB</td><td className="p-2">File upload limit</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">SSL protocols</td><td className="p-2">TLSv1.2, TLSv1.3</td><td className="p-2">Secure only</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">Proxy read timeout</td><td className="p-2">60s</td><td className="p-2">Backend timeout</td></tr>
        </tbody>
      </table>

      <h2>Environment Variables (Production)</h2>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Variable</th><th className="text-left p-2">File</th><th className="text-left p-2">Production Value</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2 font-mono">SECRET_KEY</td><td className="p-2">root .env</td><td className="p-2">64-char random string via <code>secrets.token_urlsafe(48)</code></td></tr>
          <tr className="border-b"><td className="p-2 font-mono">JWT_SECRET</td><td className="p-2">server/.env</td><td className="p-2">Long random string, min 32 chars</td></tr>
          <tr className="border-b"><td className="p-2 font-mono">ENVIRONMENT</td><td className="p-2">root .env</td><td className="p-2"><code>production</code></td></tr>
          <tr className="border-b"><td className="p-2 font-mono">DEBUG</td><td className="p-2">root .env</td><td className="p-2"><code>false</code></td></tr>
          <tr className="border-b"><td className="p-2 font-mono">NODE_ENV</td><td className="p-2">server/.env</td><td className="p-2"><code>production</code></td></tr>
          <tr className="border-b"><td className="p-2 font-mono">LOG_LEVEL</td><td className="p-2">root .env</td><td className="p-2"><code>INFO</code></td></tr>
        </tbody>
      </table>

      <h2>SSL Auto-Renewal</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`# Add to crontab (runs weekly)
0 0 * * 0 certbot renew --quiet && \\
  cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /opt/dn-sms/ssl/cert.pem && \\
  cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /opt/dn-sms/ssl/key.pem && \\
  docker exec sms-nginx nginx -s reload`}</pre>

      <h2>Health Check</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`# FastAPI
GET /health
Response: { "status": "healthy", "service": "DN SMS API", "version": "1.0.0" }

# NGINX health check (Docker)
HEALTHCHECK --interval=30s --timeout=10s \\
  CMD curl -f http://localhost:8000/health || exit 1`}</pre>

      <h2>Deployment Checklist</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="mt-0">Bun/Prisma Backend</h4>
          <ul className="text-sm">
            <li>✓ Dependencies installed (bun install)</li>
            <li>✓ .env created with all variables</li>
            <li>✓ Migrations applied (bun prisma migrate deploy)</li>
            <li>✓ Server starts without errors</li>
          </ul>
        </div>
        <div>
          <h4 className="mt-0">FastAPI Backend</h4>
          <ul className="text-sm">
            <li>✓ Python deps installed (pip install)</li>
            <li>✓ Root .env created with SECRET_KEY</li>
            <li>✓ Migrations applied (alembic upgrade head)</li>
            <li>✓ Seed script run</li>
          </ul>
        </div>
        <div>
          <h4 className="mt-0">Frontend</h4>
          <ul className="text-sm">
            <li>✓ Builds successfully</li>
            <li>✓ API connectivity verified</li>
            <li>✓ Auth flow tested</li>
          </ul>
        </div>
        <div>
          <h4 className="mt-0">Infrastructure</h4>
          <ul className="text-sm">
            <li>✓ SSL/HTTPS configured</li>
            <li>✓ NGINX configured and tested</li>
            <li>✓ Firewall rules configured</li>
            <li>✓ Backups configured</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
