# DN-SMS Authentication - Setup & Deployment Guide

## 🚀 Getting Started

### Prerequisites
- Bun 1.0+ installed
- PostgreSQL 12+ running
- Node.js 18+ (optional)

### 1. Install Dependencies

```bash
# Backend
cd server
bun install

# Frontend
cd ../client
bun install
```

### 2. Environment Setup

Copy the example env files:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Or create manually:

`server/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dn_sms"
DIRECT_URL="postgresql://user:password@localhost:5432/dn_sms"
JWT_SECRET="your-secret-key-minimum-32-characters-long-please"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
SUPER_ADMIN_EMAIL=admin@school.com
SUPER_ADMIN_NAME="DN-SMS Super Admin"
SUPER_ADMIN_PASSWORD=your-super-admin-password
CLOUDNARY_NAME=your-cloudinary-cloud-name
CLOUDNARY_API_KEY=your-cloudinary-api-key
CLOUDNARY_API_SECRET=your-cloudinary-api-secret
```

`client/.env`:
```env
PUBLIC_API_URL="http://localhost:4000"
```

### 3. Database Setup

```bash
cd server

# Create migrations
bun prisma migrate dev --name init

# Seed database (if seed.ts exists)
bun prisma db seed
```

### 4. Create Super Admin (One-time)

```bash
cd server
bun prisma studio

# In Prisma Studio:
# 1. Go to SuperAdmin table
# 2. Click "Add record"
# 3. Create admin:
#    - email: admin@dn-sms.local
#    - password: Hash using: await Bun.password.hash("your_password")
#    - name: "DN-SMS Admin"
```

Alternatively, use the seed script or manual SQL:

```sql
INSERT INTO "SuperAdmin" (id, email, password, name, "createdAt", "updatedAt")
VALUES (
  'cuid-12345',
  'admin@dn-sms.local',
  '$2a$...',  -- Bun hashed password
  'Platform Admin',
  NOW(),
  NOW()
);
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
bun run dev
# Server running on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd client
bun run dev
# Frontend running on http://localhost:3000
```

---

## 🧪 Testing the Implementation

### Test 1: Super Admin Login
```bash
curl -X POST http://localhost:4000/api/auth/super-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dn-sms.local",
    "password": "your_password"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "admin@dn-sms.local", "name": "Platform Admin", "role": "super_admin" }
}
```

### Test 2: Create School
```bash
# Save token from Test 1
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:4000/api/auth/super-admin/create-school \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test School",
    "city": "Kathmandu",
    "district": "Kathmandu"
  }'

# Response includes:
# school { id, slug, name, ... }
# admin { userId, email, password }
```

### Test 3: Admin Login
```bash
# Use credentials from Test 2
ADMIN_EMAIL="admin_credentials_from_test2@..."
ADMIN_PASS="password_from_test2"
SCHOOL_SLUG="test-school"

curl -X POST http://localhost:4000/api/auth/school/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASS'",
    "schoolSlug": "'$SCHOOL_SLUG'"
  }'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "...", "role": "admin", "schoolId": "...", "schoolSlug": "..." }
}
```

### Test 4: Create Teacher
```bash
# Use token from Test 3
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:4000/api/auth/school/users/teacher \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sita",
    "lastName": "Poudel",
    "phone": "+977-1-4123456"
  }'

# Response includes:
# user { id, email, role: "TEACHER", ... }
# credentials { userId, email, password, temporaryPassword: true }
```

### Test 5: Teacher Login
```bash
# Use credentials from Test 4
TEACHER_EMAIL="credentials_from_test4@..."
TEACHER_PASS="password_from_test4"
SCHOOL_SLUG="test-school"

curl -X POST http://localhost:4000/api/auth/school/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEACHER_EMAIL'",
    "password": "'$TEACHER_PASS'",
    "schoolSlug": "'$SCHOOL_SLUG'"
  }'

# Response: JWT token + teacher user details
```

---

## 🔄 Complete Test Workflow

### Automated Test Script

Create `test-auth.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:4000"
SA_EMAIL="admin@dn-sms.local"
SA_PASS="your_password"

echo "=== Testing DN-SMS Authentication ==="

# Test 1: Super Admin Login
echo -e "\n1️⃣  Super Admin Login..."
SA_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/super-admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$SA_EMAIL\", \"password\": \"$SA_PASS\"}")

SA_TOKEN=$(echo $SA_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✓ Token: ${SA_TOKEN:0:20}..."

# Test 2: Create School
echo -e "\n2️⃣  Creating School..."
SCHOOL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/super-admin/create-school" \
  -H "Authorization: Bearer $SA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test School","city":"Kathmandu"}')

SCHOOL_SLUG=$(echo $SCHOOL_RESPONSE | grep -o '"slug":"[^"]*' | head -1 | cut -d'"' -f4)
ADMIN_EMAIL=$(echo $SCHOOL_RESPONSE | grep -o '"email":"[^"]*' | head -1 | cut -d'"' -f4)
ADMIN_PASS=$(echo $SCHOOL_RESPONSE | grep -o '"password":"[^"]*' | head -1 | cut -d'"' -f4)

echo "✓ School Slug: $SCHOOL_SLUG"
echo "✓ Admin Email: $ADMIN_EMAIL"
echo "✓ Admin Pass: ${ADMIN_PASS:0:10}..."

# Test 3: Admin Login
echo -e "\n3️⃣  Admin Login..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/school/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASS\", \"schoolSlug\": \"$SCHOOL_SLUG\"}")

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✓ Admin Token: ${ADMIN_TOKEN:0:20}..."

# Test 4: Create Teacher
echo -e "\n4️⃣  Creating Teacher..."
TEACHER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/school/users/teacher" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Sita","lastName":"Poudel"}')

TEACHER_EMAIL=$(echo $TEACHER_RESPONSE | grep -o '"email":"[^"]*' | head -2 | tail -1 | cut -d'"' -f4)
TEACHER_PASS=$(echo $TEACHER_RESPONSE | grep -o '"password":"[^"]*' | head -1 | cut -d'"' -f4)

echo "✓ Teacher Email: $TEACHER_EMAIL"
echo "✓ Teacher Pass: ${TEACHER_PASS:0:10}..."

# Test 5: Teacher Login
echo -e "\n5️⃣  Teacher Login..."
TEACHER_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/school/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEACHER_EMAIL\", \"password\": \"$TEACHER_PASS\", \"schoolSlug\": \"$SCHOOL_SLUG\"}")

TEACHER_TOKEN=$(echo $TEACHER_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✓ Teacher Token: ${TEACHER_TOKEN:0:20}..."

echo -e "\n✅ All tests passed!"
```

Run it:
```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

## 📦 Production Deployment

### 1. Environment Variables

Set these on your production server:

```bash
export DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/dn_sms_prod?pgbouncer=true"
export DIRECT_URL="postgresql://prod_user:prod_pass@prod_host:5432/dn_sms_prod"
export JWT_SECRET="generate-a-long-random-string-minimum-32-chars"
export PORT=4000
export FRONTEND_URL="https://app.dn-sms.edu.np"
export NODE_ENV="production"
export CLOUDNARY_NAME=your-cloudinary-cloud-name
export CLOUDNARY_API_KEY=your-cloudinary-api-key
export CLOUDNARY_API_SECRET=your-cloudinary-api-secret
```

### 2. Database Migrations

```bash
cd server

# Apply all pending migrations
bun prisma migrate deploy

# Verify migrations
bun prisma migrate status
```

### 3. Build Frontend

```bash
cd client

# Production build
bun run build

# Output in: client/dist/
```

### 4. Start Services

**Backend:**
```bash
cd server
NODE_ENV=production bun src/index.ts
```

**Frontend (served by backend or separate server):**
```bash
# If using separate server (nginx, etc)
# Copy client/dist/ to web root
# Configure nginx to proxy /api to backend
```

### 5. Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name app.dn-sms.edu.np;

    # Frontend
    location / {
        root /var/www/dn-sms-frontend;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 6. SSL/HTTPS (Recommended)

```bash
# Using Let's Encrypt & Certbot
certbot --nginx -d app.dn-sms.edu.np
```

---

## 🔍 Troubleshooting

### Issue: "Cannot find module 'auth.handlers.ts'"
**Solution:**
```bash
cd server
bun install
# Ensure imports use .ts extension
```

### Issue: "DATABASE_URL not set"
**Solution:**
```bash
# Check .env file exists and has DATABASE_URL
cat .env | grep DATABASE_URL

# Or set manually
export DATABASE_URL="postgresql://..."
```

### Issue: "JWT token is invalid"
**Solution:**
```bash
# Verify JWT_SECRET in .env
# Ensure token was created with same secret
# Check token hasn't expired (7 days)
```

### Issue: "School not found"
**Solution:**
```bash
# Verify school slug is correct
bun prisma studio
# Check School table for actual slug
```

### Issue: "CORS errors in browser"
**Solution:**
```env
# In server/.env
FRONTEND_URL="http://localhost:3000"  # or production URL
```

---

## 📊 Monitoring & Logs

### Check Database
```bash
cd server
bun prisma studio
# Browse all tables and data
```

### View Audit Logs
```bash
bun prisma db execute --stdin <<EOF
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;
EOF
```

### Check Auth Activity
```bash
bun prisma db execute --stdin <<EOF
SELECT u.email, u.role, u."lastLoginAt" 
FROM "User" u 
ORDER BY u."lastLoginAt" DESC 
LIMIT 10;
EOF
```

---

## ✅ Deployment Checklist

- [ ] Dependencies installed (bun install)
- [ ] .env file created with all required variables
- [ ] Database migrations applied (bun prisma migrate deploy)
- [ ] Super Admin created in database
- [ ] Backend server starts without errors
- [ ] Frontend builds successfully
- [ ] API endpoints respond to requests
- [ ] Auth flow tested end-to-end
- [ ] SSL/HTTPS configured
- [ ] Firewall rules configured
- [ ] Backups configured
- [ ] Monitoring configured
- [ ] Error logging configured

---

## 📞 Support

- **Documentation**: See AUTHENTICATION.md
- **Examples**: See IMPLEMENTATION_GUIDE.md
- **Quick Help**: See QUICK_REFERENCE.md
- **Issues**: Check IMPLEMENTATION_GUIDE.md troubleshooting section

---

**Last Updated**: June 2026  
**Version**: 1.0.0
