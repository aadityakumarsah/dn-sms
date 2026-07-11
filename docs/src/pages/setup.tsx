export function Setup() {
  return (
    <div className="prose prose-lg max-w-4xl">
      <h1>Setup Guide</h1>

      <h2>Prerequisites</h2>
      <ul>
        <li>Bun 1.0+</li>
        <li>PostgreSQL 12+</li>
        <li>Python 3.11+ (for FastAPI)</li>
        <li>Node.js 18+ (optional)</li>
        <li>Docker & Docker Compose (optional, for containerized setup)</li>
      </ul>

      <h2>Option 1: Manual Setup (Development)</h2>

      <h3>1. Clone & Install Dependencies</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`git clone <repo-url> dn-sms
cd dn-sms

# Bun/Prisma backend
cd server && bun install

# Frontend
cd client && bun install

# FastAPI backend
pip install -r requirements.txt`}</pre>

      <h3>2. Environment Variables</h3>
      <h4>server/.env</h4>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`DATABASE_URL="postgresql://user:pass@localhost:5432/dn_sms"
DIRECT_URL="postgresql://user:pass@localhost:5432/dn_sms"
JWT_SECRET="your-secret-key-minimum-32-characters"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
SUPER_ADMIN_EMAIL=admin@school.com
SUPER_ADMIN_PASSWORD=your-super-admin-password
CLOUDNARY_NAME=your-cloudinary-cloud-name
CLOUDNARY_API_KEY=your-cloudinary-api-key
CLOUDNARY_API_SECRET=your-cloudinary-api-secret`}</pre>

      <h4>client/.env</h4>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`PUBLIC_API_URL="http://localhost:4000"`}</pre>

      <h4>Root .env (for FastAPI)</h4>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`cp .env.example .env
# Edit SECRET_KEY to a long random string (min 32 chars)`}</pre>

      <h3>3. Database Setup</h3>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`# Bun/Prisma
cd server
bun prisma migrate dev --name init
bun prisma db seed

# FastAPI
cd ..
alembic upgrade head
python scripts/seed.py`}</pre>

      <h3>4. Start Servers</h3>
      <p className="font-semibold">Terminal 1 — Bun Backend:</p>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`cd server
bun run dev
# → http://localhost:4000`}</pre>

      <p className="font-semibold mt-4">Terminal 2 — FastAPI Backend:</p>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs`}</pre>

      <p className="font-semibold mt-4">Terminal 3 — Frontend:</p>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`cd client
bun run dev
# → http://localhost:3000`}</pre>

      <h2>Option 2: Docker Compose (Production)</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`# Start everything
docker compose up -d

# Run migrations & seed
docker compose run --rm alembic upgrade head
docker compose run --rm app python scripts/seed.py

# Check logs
docker compose logs -f app nginx`}</pre>

      <p>This launches:</p>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Service</th><th className="text-left p-2">Container</th><th className="text-left p-2">Port</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2">PostgreSQL</td><td className="p-2 font-mono">sms-postgres</td><td className="p-2">5432</td></tr>
          <tr className="border-b"><td className="p-2">Redis</td><td className="p-2 font-mono">sms-redis</td><td className="p-2">6379</td></tr>
          <tr className="border-b"><td className="p-2">FastAPI</td><td className="p-2 font-mono">sms-app</td><td className="p-2">8000</td></tr>
          <tr className="border-b"><td className="p-2">NGINX</td><td className="p-2 font-mono">sms-nginx</td><td className="p-2">443</td></tr>
        </tbody>
      </table>

      <h2>SSL Certificates (Production)</h2>
      <pre className="bg-muted p-3 rounded-lg text-sm">{`# Using Let's Encrypt
certbot certonly --standalone -d api.yourdomain.com
mkdir -p ssl
cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem ssl/key.pem`}</pre>

      <h2>Seeded Credentials</h2>
      <table className="w-full border-collapse">
        <thead><tr className="border-b"><th className="text-left p-2">Backend</th><th className="text-left p-2">Username</th><th className="text-left p-2">Password</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-2">Bun/Prisma</td><td className="p-2 font-mono">admin@school.com</td><td className="p-2 font-mono">(from seed)</td></tr>
          <tr className="border-b"><td className="p-2">FastAPI</td><td className="p-2 font-mono">admin</td><td className="p-2 font-mono">Admin@123</td></tr>
        </tbody>
      </table>
    </div>
  );
}
