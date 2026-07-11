import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { SignJWT, jwtVerify } from "jose";
import {
  createSchoolWithAdmin,
  createUserByRole,
  createBulkUsers,
  loginSchoolUser,
  updateUserPassword,
  resetUserPassword,
  getCurrentUser,
} from "./auth.handlers.ts";
import { hashPassword } from "./auth.utils.ts";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  idleTimeoutMillis: 10_000,   // discard idle connections after 10 s (before Supabase PgBouncer drops them at ~30 s)
  connectionTimeoutMillis: 8_000, // fail fast if a new connection can't be established in 8 s
});
const prisma = new PrismaClient({ adapter });

// ─── Rate limiter (in-memory, per IP) ────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(req: Request, limit: number, windowMs: number): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > limit;
}
// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production — refusing to start with the insecure dev fallback.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cors(_req: Request): Headers {
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", FRONTEND_URL);
  h.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  h.set("Access-Control-Allow-Credentials", "true");
  return h;
}

function json(data: unknown, status = 200, extra?: Headers): Response {
  const h = new Headers(extra);
  h.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { status, headers: h });
}

function err(msg: string, status = 400, extra?: Headers): Response {
  return json({ error: msg }, status, extra);
}

async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as Record<string, unknown>;
  } catch { return null; }
}

function getToken(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

// If token was issued > 1 day ago, attach a refreshed 30d token so the client
// stays logged in as long as they use the app at least once every 30 days.
async function maybeRefreshToken(payload: Record<string, unknown>, h: Headers): Promise<void> {
  const iat = typeof payload.iat === "number" ? payload.iat : 0;
  const ageSecs = Math.floor(Date.now() / 1000) - iat;
  if (ageSecs > 86400) { // older than 1 day → issue fresh token
    const { iat: _iat, exp: _exp, ...rest } = payload;
    const fresh = await signToken(rest);
    h.set("X-Refresh-Token", fresh);
  }
}

async function authSA(req: Request, h?: Headers): Promise<{ id: string; email: string } | null> {
  const token = getToken(req);
  if (!token) return null;
  const p = await verifyToken(token);
  if (!p || p.role !== "super_admin") return null;
  if (h) await maybeRefreshToken(p, h);
  return { id: p.id as string, email: p.email as string };
}

async function authSchoolUser(req: Request, h?: Headers): Promise<{ id: string; role: string; schoolId: string; schoolSlug: string } | null> {
  const token = getToken(req);
  if (!token) return null;
  const p = await verifyToken(token);
  if (!p || p.role === "super_admin") return null;
  if (h) await maybeRefreshToken(p, h);
  return {
    id: p.id as string,
    role: (p.role as string).toLowerCase(),
    schoolId: p.schoolId as string,
    schoolSlug: p.schoolSlug as string,
  };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── New Multi-Role Auth Endpoints ───────────────────────────────────────────

/**
 * Create a school with initial admin credentials (Super Admin only)
 * POST /api/auth/super-admin/create-school
 */
async function createSchoolEndpoint(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.name) return err("School name is required", 400, h);

  try {
    const result = await createSchoolWithAdmin(prisma, sa.id, body);
    return json(
      {
        school: result.school,
        admin: result.adminCredentials,
        message: "School and admin credentials created successfully",
      },
      201,
      h
    );
  } catch (error) {
    return err(`Failed to create school: ${error instanceof Error ? error.message : "Unknown error"}`, 500, h);
  }
}

/**
 * Create a user (teacher, staff, student, parent)
 * POST /api/auth/school/users/:role
 */
async function createSchoolUserEndpoint(
  req: Request,
  h: Headers,
  role: "teacher" | "staff" | "student" | "parent"
): Promise<Response> {
  const auth = await authSchoolUser(req, h);
  if (!auth) return err("Unauthorized", 401, h);

  // Only admin can create users
  if (auth.role !== "admin") return err("Only admin can create users", 403, h);

  const body = await req.json().catch(() => null);
  if (!body) return err("Request body required", 400, h);

  try {
    const roleUpper = role.toUpperCase() as "TEACHER" | "STAFF" | "STUDENT" | "PARENT";
    const result = await createUserByRole(prisma, auth.schoolId, roleUpper, body);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        school: { connect: { id: auth.schoolId } },
        action: `user.${role}.created`,
        entityType: "User",
        entityId: result.user.id,
        metadata: {
          email: result.user.email,
          createdBy: auth.id,
        },
      },
    });

    return json(
      {
        user: result.user,
        credentials: result.credentials,
        message: `${role} user created successfully`,
      },
      201,
      h
    );
  } catch (error) {
    return err(`Failed to create ${role}: ${error instanceof Error ? error.message : "Unknown error"}`, 500, h);
  }
}

/**
 * Bulk create users
 * POST /api/auth/school/users/bulk/:role
 */
async function bulkCreateUsersEndpoint(
  req: Request,
  h: Headers,
  role: "teacher" | "staff" | "student" | "parent"
): Promise<Response> {
  const auth = await authSchoolUser(req, h);
  if (!auth) return err("Unauthorized", 401, h);

  // Only admin can create users
  if (auth.role !== "admin") return err("Only admin can create users", 403, h);

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.users)) return err("users array is required", 400, h);

  try {
    const roleUpper = role.toUpperCase() as "TEACHER" | "STAFF" | "STUDENT" | "PARENT";
    const results = await createBulkUsers(prisma, auth.schoolId, roleUpper, body.users);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        school: { connect: { id: auth.schoolId } },
        action: `users.${role}.bulk_created`,
        entityType: "User",
        entityId: "bulk",
        metadata: {
          count: results.length,
          createdBy: auth.id,
        },
      },
    });

    return json(
      {
        created: results.length,
        users: results,
        message: `${results.length} ${role} users created successfully`,
      },
      201,
      h
    );
  } catch (error) {
    return err(`Failed to bulk create ${role}s: ${error instanceof Error ? error.message : "Unknown error"}`, 500, h);
  }
}

/**
 * Login for school users (teacher, staff, student, parent)
 * POST /api/auth/school/login
 * Body: { email, password }  — no slug required, finds user globally by email
 */
async function loginSchoolUserEndpoint(req: Request, h: Headers): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return err("Email and password are required", 400, h);
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: body.email },
      include: { profile: true, school: true },
    });

    if (!user) return err("Invalid credentials", 401, h);
    if (user.status !== "ACTIVE") return err("Your account is suspended. Contact your school admin.", 403, h);
    if (user.school.status === "SUSPENDED" || user.school.status === "INACTIVE") {
      return err("School access is suspended. Please contact DN-SMS support.", 403, h);
    }

    const ok = await Bun.password.verify(body.password, user.password);
    if (!ok) return err("Invalid credentials", 401, h);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      schoolSlug: user.school.slug,
    });

    const name = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : user.email.split("@")[0];

    const userData = {
      id: user.id,
      name,
      email: user.email,
      role: user.role.toLowerCase(),
      schoolId: user.schoolId,
      schoolName: user.school.name,
      schoolSlug: user.school.slug,
    };

    await prisma.auditLog.create({
      data: {
        school: { connect: { id: user.schoolId } },
        action: `auth.${user.role.toLowerCase()}.login`,
        entityType: "User",
        entityId: user.id,
      },
    }).catch(() => {});

    return json({ token, user: userData }, 200, h);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Invalid credentials";
    return err(msg, 401, h);
  }
}

/**
 * Get current user details
 * GET /api/auth/school/me
 */
async function getSchoolUserEndpoint(req: Request, h: Headers): Promise<Response> {
  const auth = await authSchoolUser(req, h);
  if (!auth) return err("Unauthorized", 401, h);

  try {
    const user = await getCurrentUser(prisma, auth.id);
    return json(user, 200, h);
  } catch (error) {
    return err(`Failed to get user: ${error instanceof Error ? error.message : "Unknown error"}`, 500, h);
  }
}

/**
 * Change password
 * POST /api/auth/school/change-password
 */
async function changePasswordEndpoint(req: Request, h: Headers): Promise<Response> {
  const auth = await authSchoolUser(req, h);
  if (!auth) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.currentPassword || !body?.newPassword) {
    return err("currentPassword and newPassword are required", 400, h);
  }

  try {
    await updateUserPassword(prisma, auth.id, body.currentPassword, body.newPassword);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        school: { connect: { id: auth.schoolId } },
        action: "auth.password_changed",
        entityType: "User",
        entityId: auth.id,
      },
    });

    return json({ success: true, message: "Password updated successfully" }, 200, h);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update password";
    return err(msg, 400, h);
  }
}

/**
 * Reset user password (Admin only)
 * POST /api/auth/school/reset-password/:userId
 */
async function resetPasswordEndpoint(req: Request, h: Headers, userId: string): Promise<Response> {
  const auth = await authSchoolUser(req, h);
  if (!auth) return err("Unauthorized", 401, h);

  // Only admin can reset passwords
  if (auth.role !== "admin") return err("Only admin can reset passwords", 403, h);

  try {
    // Verify the target user belongs to the admin's school BEFORE mutating
    // anything — otherwise an admin from school A could reset a user in
    // school B (the reset would run before the 404). IDOR fix.
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { schoolId: true } });
    if (!targetUser || targetUser.schoolId !== auth.schoolId) {
      return err("User not found", 404, h);
    }

    const credentials = await resetUserPassword(prisma, userId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        school: { connect: { id: auth.schoolId } },
        action: "auth.password_reset",
        entityType: "User",
        entityId: userId,
        metadata: { resetBy: auth.id },
      },
    });

    return json(
      {
        credentials: { ...credentials, schoolSlug: auth.schoolSlug },
        message: "Password reset successfully. New temporary password sent.",
      },
      200,
      h
    );
  } catch (error) {
    return err(`Failed to reset password: ${error instanceof Error ? error.message : "Unknown error"}`, 500, h);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function loginSuperAdmin(req: Request, h: Headers): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) return err("Email and password required", 400, h);
  const admin = await prisma.superAdmin.findUnique({ where: { email: body.email } });
  if (!admin) return err("Invalid credentials", 401, h);
  const ok = await Bun.password.verify(body.password, admin.password);
  if (!ok) return err("Invalid credentials", 401, h);
  const token = await signToken({ id: admin.id, email: admin.email, role: "super_admin" });
  return json({ token, user: { id: admin.id, email: admin.email, name: admin.name, role: "super_admin" } }, 200, h);
}

async function meSuperAdmin(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const data = await prisma.superAdmin.findUnique({ where: { id: sa.id }, select: { id: true, email: true, name: true, createdAt: true } });
  if (!data) return err("Not found", 404, h);
  return json({ ...data, role: "super_admin" }, 200, h);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function dashboard(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const [totalSchools, activeSchools, trialSchools, suspendedSchools, pausedSchools,
    totalRevenue, totalUsers, plans] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { status: "ACTIVE" } }),
    prisma.school.count({ where: { status: "TRIAL" } }),
    prisma.school.count({ where: { status: "SUSPENDED" } }),
    prisma.school.count({ where: { status: "PAUSED" } }),
    prisma.billingTransaction.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.user.count(),
    prisma.plan.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true, price: true } }),
  ]);

  const recentSchools = await prisma.school.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { include: { plan: { select: { name: true, slug: true } } } },
      _count: { select: { users: true, students: true } },
    },
  });

  const planDistribution = await prisma.subscription.groupBy({
    by: ["planId"],
    _count: { planId: true },
  });

  // monthly signups last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  const monthlySchools = await prisma.school.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const monthlyGrowth: Record<string, number> = {};
  for (const s of monthlySchools) {
    const key = s.createdAt.toISOString().slice(0, 7);
    monthlyGrowth[key] = (monthlyGrowth[key] ?? 0) + 1;
  }

  return json({
    stats: {
      totalSchools, activeSchools, trialSchools, suspendedSchools, pausedSchools,
      totalRevenuePaid: Number(totalRevenue._sum.amount ?? 0),
      totalUsers,
    },
    recentSchools: recentSchools.map((s) => ({
      id: s.id, name: s.name, district: s.district, status: s.status,
      plan: s.subscription?.plan?.name ?? "None",
      planSlug: s.subscription?.plan?.slug ?? null,
      userCount: s._count.users, studentCount: s._count.students,
      createdAt: s.createdAt,
    })),
    planDistribution,
    plans,
    monthlyGrowth: Object.entries(monthlyGrowth).map(([month, count]) => ({ month, count })),
  }, 200, h);
}

// ─── Schools ──────────────────────────────────────────────────────────────────

async function getSchools(req: Request, h: Headers, url: URL): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20"));
  const search = url.searchParams.get("search") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const planId = url.searchParams.get("planId") ?? "";
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) where.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { district: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
    { principalName: { contains: search, mode: "insensitive" } },
  ];
  if (status) where.status = status;
  if (planId) where.subscription = { planId };

  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: { include: { plan: { select: { id: true, name: true, slug: true, price: true } } } },
        _count: { select: { users: true, students: true } },
      },
    }),
    prisma.school.count({ where }),
  ]);

  return json({
    schools: schools.map((s) => ({
      ...s,
      plan: s.subscription?.plan?.name ?? "None",
      planSlug: s.subscription?.plan?.slug ?? null,
      planId: s.subscription?.planId ?? null,
      subscriptionStatus: s.subscription?.status ?? null,
      userCount: s._count.users,
      studentCount: s._count.students,
    })),
    total, page, limit,
    totalPages: Math.ceil(total / limit),
  }, 200, h);
}

async function createSchool(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.name) return err("School name is required", 400, h);

  const baseSlug = slugify(body.name);
  const slug = `${baseSlug}-${Date.now()}`;

  const school = await prisma.school.create({
    data: {
      name: body.name,
      slug,
      address: body.address || null,
      city: body.city || null,
      district: body.district || null,
      province: body.province || null,
      phone: body.phone || null,
      altPhone: body.altPhone || null,
      email: body.email || null,
      website: body.website || null,
      principalName: body.principalName || null,
      principalPhone: body.principalPhone || null,
      principalEmail: body.principalEmail || null,
      establishedYear: body.establishedYear ? parseInt(body.establishedYear) : null,
      registrationNo: body.registrationNo || null,
      panNo: body.panNo || null,
      affiliatedTo: body.affiliatedTo || null,
      totalCapacity: body.totalCapacity ? parseInt(body.totalCapacity) : null,
      schoolType: body.schoolType ?? "SECONDARY",
      status: body.status ?? "TRIAL",
      notes: body.notes || null,
    },
  });

  // Create subscription if planId provided
  if (body.planId) {
    const now = new Date();
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);
    await prisma.subscription.create({
      data: {
        schoolId: school.id,
        planId: body.planId,
        status: school.status === "TRIAL" ? "TRIALING" : "ACTIVE",
        billingCycle: body.billingCycle ?? "MONTHLY",
        currentPeriodStart: now,
        currentPeriodEnd: end,
      },
    });
  }

  // Log
  await prisma.auditLog.create({
    data: { school: { connect: { id: school.id } }, action: "school.created", entityType: "School", entityId: school.id },
  });

  const result = await prisma.school.findUnique({
    where: { id: school.id },
    include: { subscription: { include: { plan: true } } },
  });
  return json(result, 201, h);
}

async function getSchool(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { users: true, students: true, staff: true } },
      billingTransactions: { take: 5, orderBy: { createdAt: "desc" } },
      users: { where: { role: "ADMIN" }, select: { id: true, email: true }, take: 1 },
    },
  });
  if (!school) return err("Not found", 404, h);
  return json({ ...school, adminUser: school.users?.[0] ?? null }, 200, h);
}

async function resetSchoolAdminPassword(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const school = await prisma.school.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!school) return err("School not found", 404, h);

  const adminUser = await prisma.user.findFirst({ where: { schoolId: id, role: "ADMIN" }, select: { id: true } });
  if (!adminUser) return err("No admin user found for this school", 404, h);

  const credentials = await resetUserPassword(prisma, adminUser.id);

  return json({ credentials: { ...credentials, schoolSlug: school.slug } }, 200, h);
}

async function updateSchoolAdmin(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const school = await prisma.school.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!school) return err("School not found", 404, h);

  const body = await req.json().catch(() => null);
  if (!body) return err("Body required", 400, h);

  const adminUser = await prisma.user.findFirst({ where: { schoolId: id, role: "ADMIN" }, select: { id: true, email: true } });
  if (!adminUser) return err("No admin user found for this school", 404, h);

  const updateData: any = {};

  // Update email if provided and different
  if (body.email && body.email !== adminUser.email) {
    const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: id, email: body.email } } });
    if (existing) return err("Email already in use", 400, h);
    updateData.email = body.email;
  }

  // Update password if provided
  if (body.password) {
    updateData.password = await hashPassword(body.password);
  }

  if (Object.keys(updateData).length === 0) return err("No changes provided", 400, h);

  const updated = await prisma.user.update({
    where: { id: adminUser.id },
    data: updateData,
  });

  return json({
    credentials: {
      userId: updated.id,
      email: updated.email,
      password: body.password || undefined,
      schoolSlug: school.slug,
    },
  }, 200, h);
}

async function updateSchool(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body) return err("Body required", 400, h);

  const prevSchool = await prisma.school.findUnique({ where: { id }, select: { status: true } });

  const school = await prisma.school.update({
    where: { id },
    data: {
      name: body.name,
      address: body.address,
      city: body.city,
      district: body.district,
      province: body.province,
      phone: body.phone,
      altPhone: body.altPhone,
      email: body.email,
      website: body.website,
      principalName: body.principalName,
      principalPhone: body.principalPhone,
      principalEmail: body.principalEmail,
      establishedYear: body.establishedYear ? parseInt(body.establishedYear) : undefined,
      registrationNo: body.registrationNo,
      panNo: body.panNo,
      affiliatedTo: body.affiliatedTo,
      totalCapacity: body.totalCapacity ? parseInt(body.totalCapacity) : undefined,
      schoolType: body.schoolType,
      status: body.status,
      notes: body.notes,
    },
  });

  // If planId provided, upsert subscription
  if (body.planId) {
    const existing = await prisma.subscription.findUnique({ where: { schoolId: id } });
    const now = new Date();
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);
    if (existing) {
      await prisma.subscription.update({
        where: { schoolId: id },
        data: {
          planId: body.planId,
          status: school.status === "TRIAL" ? "TRIALING" :
                  school.status === "PAUSED" ? "PAUSED" :
                  school.status === "SUSPENDED" ? "CANCELLED" : "ACTIVE",
          billingCycle: body.billingCycle ?? existing.billingCycle,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          schoolId: id, planId: body.planId,
          status: school.status === "TRIAL" ? "TRIALING" : "ACTIVE",
          billingCycle: body.billingCycle ?? "MONTHLY",
          currentPeriodStart: now, currentPeriodEnd: end,
        },
      });
    }
  }

  // status change → sync subscription + log
  if (body.status && body.status !== prevSchool?.status) {
    const subStatusMap: Record<string, string> = {
      ACTIVE: "ACTIVE", TRIAL: "TRIALING", PAUSED: "PAUSED",
      SUSPENDED: "CANCELLED", INACTIVE: "CANCELLED",
    };
    const newSubStatus = subStatusMap[body.status];
    if (newSubStatus) {
      await prisma.subscription.updateMany({ where: { schoolId: id }, data: { status: newSubStatus as any } });
    }
    await prisma.auditLog.create({
      data: {
        school: { connect: { id } },
        action: `school.status_changed`,
        entityType: "School", entityId: id,
        metadata: { from: prevSchool?.status, to: body.status },
      },
    });
  }

  const result = await prisma.school.findUnique({
    where: { id },
    include: { subscription: { include: { plan: true } }, _count: { select: { users: true, students: true } } },
  });
  return json(result, 200, h);
}

/**
 * Delete school with cascade deletion of all related data
 * Automatically deletes: users, students, teachers, staff, parents, and all associated data
 */
async function deleteSchool(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const school = await prisma.school.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          users: true,
          students: true,
          staff: true,
          academicYears: true,
          exams: true,
          notices: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!school) return err("School not found", 404, h);

  // Count related items before deletion
  const deletionCounts = {
    school: 1,
    users: school._count.users,
    students: school._count.students,
    staff: school._count.staff,
    academicYears: school._count.academicYears,
    exams: school._count.exams,
    notices: school._count.notices,
    auditLogs: school._count.auditLogs,
  };

  // Delete school (cascade delete handles all relations)
  await prisma.school.delete({ where: { id } });

  // Create audit log for super admin
  await prisma.auditLog.create({
    data: {
      action: "school.deleted",
      entityType: "School",
      entityId: id,
      metadata: {
        schoolId: id,
        schoolName: school.name,
        deletedBy: sa.id,
        deletionCounts,
        timestamp: new Date().toISOString(),
      },
    },
  }).catch(() => {
    // Ignore if audit log fails
  });

  return json(
    {
      success: true,
      message: `School "${school.name}" and all associated data have been permanently deleted`,
      deletedCounts: deletionCounts,
    },
    200,
    h
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function getUsers(req: Request, h: Headers, url: URL): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20"));
  const search = url.searchParams.get("search") ?? "";
  const role = url.searchParams.get("role") ?? "";
  const schoolId = url.searchParams.get("schoolId") ?? "";
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) where.OR = [
    { email: { contains: search, mode: "insensitive" } },
    { profile: { firstName: { contains: search, mode: "insensitive" } } },
    { profile: { lastName: { contains: search, mode: "insensitive" } } },
  ];
  if (role) where.role = role;
  if (schoolId) where.schoolId = schoolId;

  const [users, total, roleGrouped] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      include: { profile: true, school: { select: { id: true, name: true } } },
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
  ]);

  const roleCounts: Record<string, number> = {};
  for (const r of roleGrouped) roleCounts[r.role] = r._count.role;

  return json({
    users: users.map((u) => ({
      ...u,
      password: undefined,
      name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : u.email,
    })),
    total, page, limit,
    totalPages: Math.ceil(total / limit),
    roleCounts,
  }, 200, h);
}

// ─── Plans ────────────────────────────────────────────────────────────────────

async function getPlans(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });
  return json(plans, 200, h);
}

async function createPlan(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.slug || body?.price === undefined) return err("name, slug, price required", 400, h);
  const plan = await prisma.plan.create({
    data: {
      name: body.name, slug: body.slug, price: body.price,
      annualPrice: body.annualPrice ?? null,
      maxStudents: body.maxStudents ?? -1, maxTeachers: body.maxTeachers ?? -1,
      maxStorageMB: body.maxStorageMB ?? -1, features: body.features ?? [],
    },
  });
  return json(plan, 201, h);
}

async function updatePlan(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: body.name, price: body.price, annualPrice: body.annualPrice,
      maxStudents: body.maxStudents, maxTeachers: body.maxTeachers,
      maxStorageMB: body.maxStorageMB, features: body.features, isActive: body.isActive,
    },
  });
  return json(plan, 200, h);
}

async function deletePlan(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const subs = await prisma.subscription.count({ where: { planId: id } });
  if (subs > 0) return err(`Cannot delete plan with ${subs} active subscriptions`, 400, h);
  await prisma.plan.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Payments ─────────────────────────────────────────────────────────────────

async function getPayments(req: Request, h: Headers, url: URL): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const [transactions, total, revenue, mrr] = await Promise.all([
    prisma.billingTransaction.findMany({
      skip, take: limit, orderBy: { createdAt: "desc" },
      include: { school: { select: { name: true } } },
    }),
    prisma.billingTransaction.count(),
    prisma.billingTransaction.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.billingTransaction.aggregate({
      where: { status: "PAID", createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { amount: true },
    }),
  ]);

  return json({
    transactions, total, page, limit,
    totalPages: Math.ceil(total / limit),
    totalRevenue: Number(revenue._sum.amount ?? 0),
    mrr: Number(mrr._sum.amount ?? 0),
  }, 200, h);
}

async function recordPayment(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.schoolId || !body?.amount) return err("schoolId and amount required", 400, h);

  const invoiceNo = `INV-${Date.now()}`;
  const tx = await prisma.billingTransaction.create({
    data: {
      schoolId: body.schoolId, amount: body.amount,
      currency: body.currency ?? "NPR",
      status: body.status ?? "PAID",
      paymentMethod: body.paymentMethod ?? "Manual",
      description: body.description ?? "Subscription payment",
      invoiceNo,
      paidAt: body.status === "PAID" ? new Date() : null,
    },
    include: { school: { select: { name: true } } },
  });

  if (body.status === "PAID") {
    await prisma.school.update({ where: { id: body.schoolId }, data: { status: "ACTIVE" } });
    await prisma.subscription.updateMany({ where: { schoolId: body.schoolId }, data: { status: "ACTIVE" } });
  }

  await prisma.auditLog.create({
    data: { school: { connect: { id: body.schoolId } }, action: "payment.recorded", entityType: "BillingTransaction", entityId: tx.id, metadata: { amount: body.amount, status: body.status } },
  });

  return json(tx, 201, h);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

async function getAnalytics(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const [allSchools, subscriptions, revenue, thisMonthRevenue, districtData, userCounts] = await Promise.all([
    prisma.school.findMany({
      select: { id: true, district: true, province: true, status: true, schoolType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subscription.findMany({ include: { plan: { select: { id: true, name: true, price: true } } } }),
    prisma.billingTransaction.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.billingTransaction.aggregate({
      where: { status: "PAID", createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { amount: true },
    }),
    prisma.school.groupBy({ by: ["district"], _count: { district: true }, orderBy: { _count: { district: "desc" } }, take: 15 }),
    prisma.user.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const s of allSchools) statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;

  const typeMap: Record<string, number> = {};
  for (const s of allSchools) typeMap[s.schoolType] = (typeMap[s.schoolType] ?? 0) + 1;

  const monthlyMap: Record<string, number> = {};
  for (const s of allSchools) {
    const key = s.createdAt.toISOString().slice(0, 7);
    monthlyMap[key] = (monthlyMap[key] ?? 0) + 1;
  }

  const planMRR: Record<string, { plan: string; count: number; mrr: number }> = {};
  for (const sub of subscriptions) {
    if (!sub.plan) continue;
    const name = sub.plan.name;
    if (!planMRR[name]) planMRR[name] = { plan: name, count: 0, mrr: 0 };
    planMRR[name].count++;
    planMRR[name].mrr += Number(sub.plan.price);
  }

  const totalUsers = userCounts.reduce((s, u) => s + u._count.status, 0);
  const activeUsers = userCounts.find((u) => u.status === "ACTIVE")?._count.status ?? 0;

  const monthlyRevMap: Record<string, number> = {};
  const paidTxs = await prisma.billingTransaction.findMany({ where: { status: "PAID" }, select: { amount: true, createdAt: true } });
  for (const tx of paidTxs) {
    const key = tx.createdAt.toISOString().slice(0, 7);
    monthlyRevMap[key] = (monthlyRevMap[key] ?? 0) + Number(tx.amount);
  }

  const allMonths = Array.from(new Set([...Object.keys(monthlyMap), ...Object.keys(monthlyRevMap)])).sort();

  return json({
    schools: {
      total: allSchools.length,
      active: statusCounts["ACTIVE"] ?? 0,
      trial: statusCounts["TRIAL"] ?? 0,
      paused: statusCounts["PAUSED"] ?? 0,
      suspended: statusCounts["SUSPENDED"] ?? 0,
      inactive: statusCounts["INACTIVE"] ?? 0,
    },
    users: { total: totalUsers, active: activeUsers },
    revenue: {
      total: Number(revenue._sum.amount ?? 0),
      thisMonth: Number(thisMonthRevenue._sum.amount ?? 0),
    },
    byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    byType: Object.entries(typeMap).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    byDistrict: districtData.map((d) => ({ district: d.district ?? "Unknown", count: d._count.district })),
    byPlan: Object.values(planMRR).sort((a, b) => b.count - a.count),
    monthlyGrowth: allMonths.map((m) => ({ label: m, schools: monthlyMap[m] ?? 0, revenue: monthlyRevMap[m] ?? 0 })),
  }, 200, h);
}

// ─── Announcements ────────────────────────────────────────────────────────────

async function getAnnouncements(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const items = await prisma.platformAnnouncement.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return json(items, 200, h);
}

async function createAnnouncement(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.body) return err("title and body required", 400, h);
  const item = await prisma.platformAnnouncement.create({
    data: { title: body.title, body: body.body, targetPlan: body.targetPlan ?? null, type: body.type ?? "info" },
  });
  await prisma.auditLog.create({ data: { action: "announcement.created", entityType: "PlatformAnnouncement", entityId: item.id } });
  return json(item, 201, h);
}

async function deleteAnnouncement(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  await prisma.platformAnnouncement.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Activity ─────────────────────────────────────────────────────────────────

async function getActivity(req: Request, h: Headers, url: URL): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));
  const action = url.searchParams.get("action") ?? "";
  const skip = (page - 1) * limit;

  const where: any = {};
  if (action) where.action = { contains: action };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take: limit, orderBy: { createdAt: "desc" },
      include: { school: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) }, 200, h);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function updateSettings(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req, h);
  if (!sa) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);

  if (body?.name) {
    const updated = await prisma.superAdmin.update({ where: { id: sa.id }, data: { name: body.name } });
    return json({ id: updated.id, name: updated.name, email: updated.email }, 200, h);
  }

  if (body?.currentPassword && body?.newPassword) {
    const admin = await prisma.superAdmin.findUnique({ where: { id: sa.id } });
    if (!admin) return err("Not found", 404, h);
    const valid = await Bun.password.verify(body.currentPassword, admin.password);
    if (!valid) return err("Current password is incorrect", 400, h);
    const hashed = await Bun.password.hash(body.newPassword);
    await prisma.superAdmin.update({ where: { id: sa.id }, data: { password: hashed } });
    return json({ ok: true }, 200, h);
  }

  return err("Nothing to update", 400, h);
}

// ─── School Portal Auth ───────────────────────────────────────────────────────

async function authSchool(req: Request): Promise<{ id: string; schoolId: string; role: string; email: string } | null> {
  const token = getToken(req);
  if (!token) return null;
  const p = await verifyToken(token);
  if (!p || !p.schoolId || p.role === "super_admin") return null;
  return { id: p.id as string, schoolId: p.schoolId as string, role: (p.role as string).toLowerCase(), email: p.email as string };
}

async function authRole(req: Request, role: string): Promise<{ id: string; schoolId: string; role: string } | null> {
  const u = await authSchool(req);
  if (!u || u.role !== role) return null;
  return u;
}

async function loginSchool(req: Request, h: Headers): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.schoolSlug) return err("email, password, schoolSlug required", 400, h);

  const school = await prisma.school.findUnique({ where: { slug: body.schoolSlug } });
  if (!school) return err("School not found", 404, h);
  if (school.status === "SUSPENDED" || school.status === "INACTIVE") return err("School access is suspended. Please contact DN-SMS support.", 403, h);

  const user = await prisma.user.findUnique({
    where: { schoolId_email: { schoolId: school.id, email: body.email } },
    include: { profile: true },
  });
  if (!user) return err("Invalid credentials", 401, h);
  if (user.status !== "ACTIVE") return err("Your account is suspended. Contact your school admin.", 403, h);

  const ok = await Bun.password.verify(body.password, user.password);
  if (!ok) return err("Invalid credentials", 401, h);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = await signToken({ id: user.id, schoolId: school.id, role: user.role, email: user.email });
  const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : user.email;

  return json({
    token,
    user: { id: user.id, name, email: user.email, role: user.role.toLowerCase(), schoolId: school.id, schoolName: school.name, schoolSlug: school.slug },
  }, 200, h);
}

async function meSchool(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const user = await prisma.user.findUnique({ where: { id: u.id }, include: { profile: true, school: { select: { id: true, name: true, slug: true } } } });
  if (!user) return err("Not found", 404, h);
  const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : user.email;
  return json({ id: user.id, name, email: user.email, role: user.role.toLowerCase(), schoolId: u.schoolId, schoolName: user.school.name, schoolSlug: user.school.slug }, 200, h);
}

// ─── Admin Portal ─────────────────────────────────────────────────────────────

async function adminDashboard(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const sid = u.schoolId;

  const [studentCount, teacherCount, staffCount, todayAttendance, totalAttendanceToday,
    pendingFees, recentNotices, recentActivity] = await Promise.all([
    prisma.student.count({ where: { schoolId: sid } }),
    prisma.teacher.count({ where: { user: { schoolId: sid } } }),
    prisma.staff.count({ where: { schoolId: sid } }),
    prisma.studentAttendance.count({ where: { student: { schoolId: sid }, date: new Date(new Date().toDateString()), status: "PRESENT" } }),
    prisma.studentAttendance.count({ where: { student: { schoolId: sid }, date: new Date(new Date().toDateString()) } }),
    prisma.feeCollection.count({ where: { student: { schoolId: sid }, status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.notice.findMany({ where: { schoolId: sid }, orderBy: { publishedAt: "desc" }, take: 5, include: { publishedBy: { include: { profile: true } } } }),
    prisma.auditLog.findMany({ where: { schoolId: sid }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const feeCollected = await prisma.feeCollection.aggregate({ where: { student: { schoolId: sid }, status: "PAID" }, _sum: { amountPaid: true } });
  const feeTotal = await prisma.feeCollection.aggregate({ where: { student: { schoolId: sid } }, _sum: { amountDue: true } });

  return json({
    stats: {
      totalStudents: studentCount, totalTeachers: teacherCount, totalStaff: staffCount,
      todayAttendancePct: totalAttendanceToday > 0 ? Math.round((todayAttendance / totalAttendanceToday) * 100) : 0,
      todayPresent: todayAttendance, todayTotal: totalAttendanceToday,
      pendingFees, feesCollected: Number(feeCollected._sum.amountPaid ?? 0),
      feesTotal: Number(feeTotal._sum.amountDue ?? 0),
    },
    recentNotices: recentNotices.map((n) => ({ ...n, authorName: n.publishedBy.profile ? `${n.publishedBy.profile.firstName} ${n.publishedBy.profile.lastName}` : n.publishedBy.email })),
    recentActivity,
  }, 200, h);
}

async function getStudents(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20"));
  const search = url.searchParams.get("search") ?? "";
  const skip = (page - 1) * limit;

  const where: any = { schoolId: u.schoolId };
  if (search) where.OR = [
    { user: { email: { contains: search, mode: "insensitive" } } },
    { user: { profile: { firstName: { contains: search, mode: "insensitive" } } } },
    { user: { profile: { lastName: { contains: search, mode: "insensitive" } } } },
    { admissionNo: { contains: search, mode: "insensitive" } },
  ];
  // Filters
  const stream = url.searchParams.get("stream");
  const sectionId = url.searchParams.get("sectionId");
  const transport = url.searchParams.get("transport");
  const status = url.searchParams.get("status");
  if (stream) where.stream = stream;
  if (transport) where.transportMode = transport;
  if (status) where.user = { ...(where.user ?? {}), status };
  if (sectionId) where.enrollments = { some: { sectionId, status: "ACTIVE" } };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where, skip, take: limit, orderBy: { createdAt: "desc" },
      include: {
        user: { include: { profile: true } },
        busRoute: { select: { name: true } },
        enrollments: { include: { section: { include: { grade: true } }, academicYear: true }, where: { status: "ACTIVE" }, take: 1 },
        feeCollections: { select: { status: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return json({
    students: students.map((s) => {
      const enroll = s.enrollments[0];
      const feeStatus = s.feeCollections.some((f) => f.status === "OVERDUE") ? "overdue"
        : s.feeCollections.some((f) => f.status === "PENDING") ? "pending" : "paid";
      return {
        id: s.id, admissionNo: s.admissionNo, userId: s.userId,
        name: s.user.profile ? `${s.user.profile.firstName} ${s.user.profile.lastName}`.trim() : s.user.email,
        email: s.user.email,
        phone: s.user.profile?.phone ?? null,
        gender: s.user.profile?.gender ?? null,
        dateOfBirth: s.user.profile?.dateOfBirth ?? null,
        avatar: s.user.profile?.avatar ?? null,
        sectionId: enroll?.sectionId ?? null,
        className: enroll ? `${enroll.section.grade.name} ${enroll.section.name}` : null,
        rollNo: enroll?.rollNo ?? s.rollNumber ?? null,
        stream: s.stream ?? null,
        transportMode: s.transportMode,
        busRouteName: s.busRoute?.name ?? null,
        academicYear: enroll?.academicYear?.name ?? null,
        feeStatus, status: s.user.status,
        tuitionFee: s.tuitionFee ? Number(s.tuitionFee) : null,
        busFee: s.busFee ? Number(s.busFee) : null,
        otherFee: s.otherFee ? Number(s.otherFee) : null,
        totalFee: [s.tuitionFee, s.busFee, s.otherFee].reduce((t, f) => t + (f ? Number(f) : 0), 0) || null,
      };
    }),
    total, page, limit, totalPages: Math.ceil(total / limit),
  }, 200, h);
}

function generatePassword(firstName: string): string {
  const name = firstName.toLowerCase().replace(/[^a-z]/g, "") || "user";
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${name}${year}@${rand}`;
}

async function createStudent(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || (u.role !== "admin")) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.lastName || !body?.email) return err("firstName, lastName, email required", 400, h);

  const sid = u.schoolId;
  const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: sid, email: body.email } } });
  if (existing) return err("A user with this email already exists in this school", 400, h);

  const plainStudentPassword = body.password ?? generatePassword(body.firstName);
  const password = await Bun.password.hash(plainStudentPassword);
  const admissionNo = body.admissionNo ?? `ADM-${Date.now().toString().slice(-6)}`;
  const transportMode = body.transportMode === "BUS" ? "BUS" : "WALKING";

  // Validate the bus route up front (so we don't create an orphan student).
  let busRoute: { id: string; fee: any } | null = null;
  if (transportMode === "BUS") {
    if (!body.busRouteId) return err("Select a bus route for bus students", 400, h);
    const r = await prisma.busRoute.findFirst({ where: { id: body.busRouteId, bus: { schoolId: sid } } });
    if (!r) return err("Bus route not found", 404, h);
    busRoute = { id: r.id, fee: r.fee };
  }

  const student = await prisma.student.create({
    data: {
      school: { connect: { id: sid } },
      admissionNo,
      transportMode,
      rollNumber: body.rollNumber ?? body.rollNo ?? null,
      class10Marks: body.class10Marks ?? null,
      entranceMarks: body.entranceMarks ?? null,
      stream: body.stream ?? null,
      tuitionFee: body.tuitionFee ? Number(body.tuitionFee) : null,
      busFee: body.busFee ? Number(body.busFee) : null,
      otherFee: body.otherFee ? Number(body.otherFee) : null,
      ...(busRoute ? { busRoute: { connect: { id: busRoute.id } } } : {}),
      user: {
        create: {
          schoolId: sid, email: body.email, password, role: "STUDENT",
          profile: { create: { firstName: body.firstName, lastName: body.lastName, phone: body.phone ?? null, gender: body.gender ?? null, dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null, address: body.address ?? null, avatar: body.avatar ?? null } },
        },
      },
    },
    include: { user: { include: { profile: true } } },
  });

  // Allocate to a section (enforces capacity). Roll back the student on failure.
  if (body.sectionId) {
    const error = await allocateSection(student.id, body.sectionId, body.rollNo ?? null, sid);
    if (error) { await prisma.user.delete({ where: { id: student.userId } }); return err(error, 400, h); }
  }

  // Auto-add the bus fee to fee collections for bus students.
  if (busRoute && Number(busRoute.fee) > 0) {
    const ft = await transportFeeType(sid);
    await prisma.feeCollection.create({ data: { studentId: student.id, feeTypeId: ft.id, academicYearId: await activeYearId(sid), amountDue: busRoute.fee, dueDate: new Date(), status: "PENDING", remarks: "Auto-generated bus fee" } });
  }

  // Admission / tuition fee charged at creation (NPR).
  if (Number(body.feeAmount) > 0) {
    const ft = await tuitionFeeType(sid);
    await prisma.feeCollection.create({ data: { studentId: student.id, feeTypeId: ft.id, academicYearId: await activeYearId(sid), amountDue: Number(body.feeAmount), dueDate: body.feeDueDate ? new Date(body.feeDueDate) : new Date(), status: "PENDING", remarks: body.feeRemarks?.trim() || "Admission fee" } });
  }

  await prisma.auditLog.create({ data: { school: { connect: { id: sid } }, action: "student.created", entityType: "Student", entityId: student.id, metadata: { name: `${body.firstName} ${body.lastName}` } } });
  const studentSchool = await prisma.school.findUnique({ where: { id: sid }, select: { slug: true } });
  const schoolSlug = studentSchool?.slug ?? "";

  // Auto-create/link parent if parentEmail is provided
  let parentCredentials: any = null;
  if (body.parentEmail?.trim()) {
    const parentEmail = body.parentEmail.trim();
    let parentUser = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: sid, email: parentEmail } } });
    if (!parentUser) {
      const plainParentPassword = body.parentPassword?.trim() || body.password || generatePassword(body.parentFirstName ?? "parent");
      const parentPassHash = await Bun.password.hash(plainParentPassword);
      parentUser = await prisma.user.create({
        data: {
          schoolId: sid, email: parentEmail, password: parentPassHash, role: "PARENT",
          ...(body.parentFirstName ? { profile: { create: { firstName: body.parentFirstName, lastName: body.parentLastName ?? "", phone: body.parentPhone ?? null } } } : {}),
        },
      });
      parentCredentials = { email: parentEmail, password: plainParentPassword, schoolSlug, role: "parent" };
    }
    let parentRecord = await prisma.parent.findUnique({ where: { userId: parentUser.id } });
    if (!parentRecord) {
      parentRecord = await prisma.parent.create({ data: { userId: parentUser.id, occupation: body.parentOccupation ?? null } });
    }
    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: parentRecord.id, studentId: student.id } },
      update: {},
      create: { parentId: parentRecord.id, studentId: student.id, relationship: body.parentRelationship ?? "FATHER", isPrimary: true },
    });
  }

  return json({
    id: student.id,
    admissionNo: student.admissionNo,
    credentials: { email: body.email, password: plainStudentPassword, schoolSlug, role: "student" },
    parentCredentials,
  }, 201, h);
}

async function updateStudent(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);

  const student = await prisma.student.findFirst({ where: { id, schoolId: u.schoolId }, include: { user: { include: { profile: true } } } });
  if (!student) return err("Student not found", 404, h);

  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);

  // Student academic + fee fields (only update keys that were sent).
  const studentData: any = {};
  if (body.rollNumber !== undefined) studentData.rollNumber = body.rollNumber;
  if (body.class10Marks !== undefined) studentData.class10Marks = body.class10Marks;
  if (body.entranceMarks !== undefined) studentData.entranceMarks = body.entranceMarks;
  if (body.stream !== undefined) studentData.stream = body.stream;
  if (body.tuitionFee !== undefined) studentData.tuitionFee = body.tuitionFee === "" || body.tuitionFee === null ? null : Number(body.tuitionFee);
  if (body.busFee !== undefined) studentData.busFee = body.busFee === "" || body.busFee === null ? null : Number(body.busFee);
  if (body.otherFee !== undefined) studentData.otherFee = body.otherFee === "" || body.otherFee === null ? null : Number(body.otherFee);
  if (Object.keys(studentData).length) await prisma.student.update({ where: { id }, data: studentData });

  await prisma.userProfile.update({
    where: { userId: student.userId },
    data: {
      firstName: body.firstName ?? student.user.profile?.firstName,
      lastName: body.lastName ?? student.user.profile?.lastName,
      phone: body.phone ?? student.user.profile?.phone,
      gender: body.gender ?? student.user.profile?.gender,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : student.user.profile?.dateOfBirth,
      address: body.address ?? student.user.profile?.address,
      avatar: body.avatar !== undefined ? body.avatar : student.user.profile?.avatar,
    },
  });

  // Transport changes (mode + route + auto fee).
  if (body.transportMode !== undefined) {
    const mode = body.transportMode === "BUS" ? "BUS" : "WALKING";
    let routeId: string | null = null;
    if (mode === "BUS") {
      if (!body.busRouteId) return err("Select a bus route for bus students", 400, h);
      const r = await prisma.busRoute.findFirst({ where: { id: body.busRouteId, bus: { schoolId: u.schoolId } } });
      if (!r) return err("Bus route not found", 404, h);
      routeId = r.id;
      // Add a bus fee only if the route changed and one isn't already pending.
      if (student.busRouteId !== r.id && Number(r.fee) > 0) {
        const ft = await transportFeeType(u.schoolId);
        await prisma.feeCollection.create({ data: { studentId: id, feeTypeId: ft.id, academicYearId: await activeYearId(u.schoolId), amountDue: r.fee, dueDate: new Date(), status: "PENDING", remarks: "Auto-generated bus fee" } });
      }
    }
    await prisma.student.update({ where: { id }, data: { transportMode: mode, busRoute: routeId ? { connect: { id: routeId } } : { disconnect: true } } });
  }

  // Section (re)allocation with capacity enforcement.
  if (body.sectionId) {
    const error = await allocateSection(id, body.sectionId, body.rollNo ?? null, u.schoolId);
    if (error) return err(error, 400, h);
  }

  if (body.status) await prisma.user.update({ where: { id: student.userId }, data: { status: body.status } });
  return json({ ok: true }, 200, h);
}

async function deleteStudent(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!student) return err("Not found", 404, h);
  await prisma.user.delete({ where: { id: student.userId } });
  return json({ ok: true }, 200, h);
}

async function updateStudentCredentials(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { id, schoolId: u.schoolId }, select: { userId: true, user: { select: { id: true, email: true } } } });
  if (!student) return err("Student not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("Body required", 400, h);
  const updateData: any = {};
  if (body.email && body.email !== student.user.email) {
    const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: u.schoolId, email: body.email } } });
    if (existing && existing.id !== student.userId) return err("Email already in use", 400, h);
    updateData.email = body.email;
  }
  if (body.password) updateData.password = await hashPassword(body.password);
  if (Object.keys(updateData).length === 0) return err("No changes provided", 400, h);
  const updated = await prisma.user.update({ where: { id: student.userId }, data: updateData });
  return json({ credentials: { userId: updated.id, email: updated.email, password: body.password || undefined } }, 200, h);
}

async function getTeachers(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);

  const search = url.searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const where: any = { user: { schoolId: u.schoolId } };
  if (search) where.OR = [
    { user: { profile: { firstName: { contains: search, mode: "insensitive" } } } },
    { user: { profile: { lastName: { contains: search, mode: "insensitive" } } } },
    { specialization: { contains: search, mode: "insensitive" } },
  ];

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where, skip, take: limit, orderBy: { createdAt: "desc" },
      include: { user: { include: { profile: true } }, subjectAssignments: { include: { subject: true } } },
    }),
    prisma.teacher.count({ where }),
  ]);

  return json({
    teachers: teachers.map((t) => ({
      id: t.id, employeeId: t.employeeId, qualification: t.qualification,
      experience: t.experience, specialization: t.specialization, joinDate: t.joinDate,
      name: t.user.profile ? `${t.user.profile.firstName} ${t.user.profile.lastName}`.trim() : t.user.email,
      email: t.user.email, phone: t.user.profile?.phone ?? null, gender: t.user.profile?.gender ?? null,
      avatar: t.user.profile?.avatar ?? null,
      status: t.user.status, userId: t.userId,
      subjects: t.subjectAssignments.map((a) => a.subject.name),
    })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  }, 200, h);
}

async function createTeacher(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.lastName || !body?.email) return err("firstName, lastName, email required", 400, h);

  const sid = u.schoolId;
  const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: sid, email: body.email } } });
  if (existing) return err("User with this email already exists", 400, h);

  const plainTeacherPassword = body.password ?? generatePassword(body.firstName);
  const password = await Bun.password.hash(plainTeacherPassword);
  const teacher = await prisma.teacher.create({
    data: {
      employeeId: body.employeeId ?? `EMP-${Date.now().toString().slice(-5)}`,
      qualification: body.qualification ?? null, experience: body.experience ?? null,
      specialization: body.specialization ?? null, joinDate: body.joinDate ? new Date(body.joinDate) : null,
      user: {
        create: {
          schoolId: sid, email: body.email, password, role: "TEACHER",
          profile: { create: { firstName: body.firstName, lastName: body.lastName, phone: body.phone ?? null, gender: body.gender ?? null, avatar: body.avatar ?? null } },
        },
      },
    },
  });
  await prisma.auditLog.create({ data: { school: { connect: { id: sid } }, action: "teacher.created", entityType: "Teacher", entityId: teacher.id, metadata: { name: `${body.firstName} ${body.lastName}` } } });
  const teacherSchool = await prisma.school.findUnique({ where: { id: sid }, select: { slug: true } });
  return json({
    id: teacher.id,
    credentials: { email: body.email, password: plainTeacherPassword, schoolSlug: teacherSchool?.slug ?? "", role: "teacher" },
  }, 201, h);
}

async function updateTeacherCredentials(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { id, user: { schoolId: u.schoolId } }, select: { userId: true, user: { select: { id: true, email: true } } } });
  if (!teacher) return err("Teacher not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("Body required", 400, h);
  const updateData: any = {};
  if (body.email && body.email !== teacher.user.email) {
    const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: u.schoolId, email: body.email } } });
    if (existing && existing.id !== teacher.userId) return err("Email already in use", 400, h);
    updateData.email = body.email;
  }
  if (body.password) updateData.password = await hashPassword(body.password);
  if (Object.keys(updateData).length === 0) return err("No changes provided", 400, h);
  const updated = await prisma.user.update({ where: { id: teacher.userId }, data: updateData });
  return json({ credentials: { userId: updated.id, email: updated.email, password: body.password || undefined } }, 200, h);
}

async function updateTeacher(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { id, user: { schoolId: u.schoolId } }, include: { user: { include: { profile: true } } } });
  if (!teacher) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);
  await Promise.all([
    prisma.userProfile.update({ where: { userId: teacher.userId }, data: { firstName: body.firstName, lastName: body.lastName, phone: body.phone, gender: body.gender } }),
    prisma.teacher.update({ where: { id }, data: {
      qualification: body.qualification, experience: body.experience, specialization: body.specialization,
      ...(body.salary !== undefined ? { salary: body.salary === "" || body.salary === null ? null : Number(body.salary) } : {}),
      ...(body.allowances !== undefined ? { allowances: Number(body.allowances ?? 0) } : {}),
      ...(body.deductions !== undefined ? { deductions: Number(body.deductions ?? 0) } : {}),
    } }),
  ]);
  if (body.status) await prisma.user.update({ where: { id: teacher.userId }, data: { status: body.status } });
  return json({ ok: true }, 200, h);
}

async function deleteTeacher(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { id, user: { schoolId: u.schoolId } } });
  if (!teacher) return err("Not found", 404, h);
  await prisma.user.delete({ where: { id: teacher.userId } });
  return json({ ok: true }, 200, h);
}

async function getTeacherDetail(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const t = await prisma.teacher.findFirst({
    where: { id, user: { schoolId: u.schoolId } },
    include: { user: { include: { profile: true } }, subjectAssignments: { include: { subject: true } } },
  });
  if (!t) return err("Teacher not found", 404, h);
  const p = t.user.profile;
  return json({
    id: t.id, employeeId: t.employeeId, userId: t.userId, status: t.user.status,
    name: p ? `${p.firstName} ${p.lastName}`.trim() : t.user.email,
    firstName: p?.firstName ?? "", lastName: p?.lastName ?? "",
    email: t.user.email, phone: p?.phone ?? null, gender: p?.gender ?? null,
    dateOfBirth: p?.dateOfBirth ?? null, address: p?.address ?? null, avatar: p?.avatar ?? null,
    qualification: t.qualification, experience: t.experience, specialization: t.specialization, joinDate: t.joinDate,
    salary: t.salary ? Number(t.salary) : null, allowances: t.allowances ? Number(t.allowances) : 0, deductions: t.deductions ? Number(t.deductions) : 0,
    subjects: t.subjectAssignments.map((a) => a.subject.name),
  }, 200, h);
}

// ─── STAFF (non-teaching: accountant, librarian, cleaner, etc.) ──────────────────

async function getStaff(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const search = url.searchParams.get("search") ?? "";
  const designation = url.searchParams.get("designation");
  const where: any = { schoolId: u.schoolId };
  if (designation) where.designation = designation;
  if (search) where.OR = [
    { user: { profile: { firstName: { contains: search, mode: "insensitive" } } } },
    { user: { profile: { lastName: { contains: search, mode: "insensitive" } } } },
    { designation: { contains: search, mode: "insensitive" } },
    { employeeId: { contains: search, mode: "insensitive" } },
  ];
  const staff = await prisma.staff.findMany({
    where, orderBy: { createdAt: "desc" },
    include: { user: { include: { profile: true } }, department: { select: { name: true } } },
  });
  return json({
    staff: staff.map((s) => {
      const p = s.user.profile;
      return {
        id: s.id, userId: s.userId, employeeId: s.employeeId, designation: s.designation,
        department: s.department?.name ?? null, joinDate: s.joinDate, salary: s.salary ? Number(s.salary) : null,
        name: p ? `${p.firstName} ${p.lastName}`.trim() : s.user.email,
        email: s.user.email, phone: p?.phone ?? null, gender: p?.gender ?? null, avatar: p?.avatar ?? null,
        status: s.user.status,
      };
    }),
    total: staff.length,
  }, 200, h);
}

async function createStaff(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.email) return err("firstName and email required", 400, h);
  if (!body?.designation) return err("designation required (e.g. Accountant, Librarian)", 400, h);

  const sid = u.schoolId;
  const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: sid, email: body.email } } });
  if (existing) return err("A user with this email already exists in this school", 400, h);

  const password = await Bun.password.hash(body.password ?? "staff123");
  const staff = await prisma.staff.create({
    data: {
      school: { connect: { id: sid } },
      employeeId: body.employeeId ?? `STF-${Date.now().toString().slice(-5)}`,
      designation: body.designation,
      joinDate: body.joinDate ? new Date(body.joinDate) : null,
      salary: body.salary ? body.salary : null,
      ...(body.departmentId ? { department: { connect: { id: body.departmentId } } } : {}),
      user: {
        create: {
          schoolId: sid, email: body.email, password, role: "STAFF",
          profile: { create: { firstName: body.firstName, lastName: body.lastName ?? "", phone: body.phone ?? null, gender: body.gender ?? null, avatar: body.avatar ?? null } },
        },
      },
    },
  });
  return json({ id: staff.id }, 201, h);
}

async function updateStaff(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const staff = await prisma.staff.findFirst({ where: { id, schoolId: u.schoolId }, include: { user: { include: { profile: true } } } });
  if (!staff) return err("Staff not found", 404, h);
  const body = await req.json().catch(() => null);
  await prisma.userProfile.update({ where: { userId: staff.userId }, data: {
    firstName: body?.firstName ?? staff.user.profile?.firstName,
    lastName: body?.lastName ?? staff.user.profile?.lastName,
    phone: body?.phone ?? staff.user.profile?.phone,
    gender: body?.gender ?? staff.user.profile?.gender,
    avatar: body?.avatar !== undefined ? body.avatar : staff.user.profile?.avatar,
  } });
  await prisma.staff.update({ where: { id }, data: {
    designation: body?.designation ?? staff.designation,
    employeeId: body?.employeeId ?? staff.employeeId,
    salary: body?.salary !== undefined ? body.salary : staff.salary,
    joinDate: body?.joinDate ? new Date(body.joinDate) : staff.joinDate,
  } });
  if (body?.status) await prisma.user.update({ where: { id: staff.userId }, data: { status: body.status } });
  return json({ ok: true }, 200, h);
}

async function deleteStaff(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const staff = await prisma.staff.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!staff) return err("Not found", 404, h);
  await prisma.user.delete({ where: { id: staff.userId } });
  return json({ ok: true }, 200, h);
}

async function getStaffDetail(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const s = await prisma.staff.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { user: { include: { profile: true } }, department: { select: { name: true } } },
  });
  if (!s) return err("Staff not found", 404, h);
  const p = s.user.profile;
  return json({
    id: s.id, userId: s.userId, employeeId: s.employeeId, designation: s.designation, status: s.user.status,
    department: s.department?.name ?? null, joinDate: s.joinDate, salary: s.salary ? Number(s.salary) : null,
    name: p ? `${p.firstName} ${p.lastName}`.trim() : s.user.email,
    firstName: p?.firstName ?? "", lastName: p?.lastName ?? "",
    email: s.user.email, phone: p?.phone ?? null, gender: p?.gender ?? null,
    dateOfBirth: p?.dateOfBirth ?? null, address: p?.address ?? null, avatar: p?.avatar ?? null,
  }, 200, h);
}

async function getClasses(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);

  const activeYear = await prisma.academicYear.findFirst({ where: { schoolId: u.schoolId, isActive: true } });

  const grades = await prisma.grade.findMany({
    where: { schoolId: u.schoolId, ...(activeYear ? { academicYearId: activeYear.id } : {}) },
    include: { sections: { include: { _count: { select: { enrollments: true } }, enrollments: { where: { status: "ACTIVE" }, select: { id: true } } } }, academicYear: true },
    orderBy: { gradeNumber: "asc" },
  });

  return json({ grades: grades.map((g) => ({ ...g, totalStudents: g.sections.reduce((s, sec) => s + sec.enrollments.length, 0) })), activeYear }, 200, h);
}

async function createGrade(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  // Grade name is a free-text label — accepts both numbers ("11", "12") and
  // strings ("Nursery", "LKG", "Class X"). gradeNumber/level is an optional
  // ordering hint; non-numeric grades default to 0 so they sort first.
  if (!body?.name || String(body.name).trim() === "") return err("Grade name is required", 400, h);
  const rawLevel = body.gradeNumber ?? body.level;
  const gradeNumber = rawLevel === undefined || rawLevel === null || rawLevel === "" ? 0 : parseInt(String(rawLevel), 10) || 0;

  let academicYearId = body.academicYearId;
  if (!academicYearId) {
    const ay = await prisma.academicYear.findFirst({ where: { schoolId: u.schoolId, isActive: true } });
    if (!ay) return err("No active academic year. Please create one in Academic Settings first.", 400, h);
    academicYearId = ay.id;
  }

  const existing = await prisma.grade.findFirst({ where: { schoolId: u.schoolId, academicYearId, name: String(body.name).trim() } });
  if (existing) return err(`A grade named "${body.name}" already exists for this academic year.`, 400, h);

  const VALID_CAT = ["PRE_PRIMARY", "PRIMARY", "SECONDARY", "HIGH_SCHOOL", "BACHELOR", "MASTER"];
  const category = VALID_CAT.includes(body.category) ? body.category : "SECONDARY";

  const grade = await prisma.grade.create({
    data: {
      schoolId: u.schoolId,
      academicYearId,
      name: String(body.name).trim(),
      gradeNumber,
      category,
      stream: body.stream || null,
      durationYears: body.durationYears ? parseInt(String(body.durationYears), 10) || null : null,
      departmentId: body.departmentId || null,
    },
  });
  return json(grade, 201, h);
}

async function createSection(req: Request, h: Headers, gradeId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const grade = await prisma.grade.findFirst({ where: { id: gradeId, schoolId: u.schoolId } });
  if (!grade) return err("Grade not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || String(body.name).trim() === "") return err("Section name is required", 400, h);

  const dup = await prisma.section.findFirst({ where: { gradeId, name: String(body.name).trim() } });
  if (dup) return err(`Section "${body.name}" already exists in this grade.`, 400, h);

  const seats = parseInt(String(body.totalSeats ?? body.capacity ?? 40), 10) || 40;
  const section = await prisma.section.create({
    data: {
      gradeId,
      name: String(body.name).trim(),
      capacity: seats,
      totalSeats: seats,
      performance: body.performance ?? "AVERAGE",
      roomNo: body.roomNo ?? null,
    },
  });
  return json(section, 201, h);
}

async function getAcademicYears(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const years = await prisma.academicYear.findMany({
    where: { schoolId: u.schoolId },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { grades: true, enrollments: true } } },
  });
  return json(years, 200, h);
}

async function createAcademicYear(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.startDate || !body?.endDate) return err("name, startDate, endDate required", 400, h);
  if (body.isActive) await prisma.academicYear.updateMany({ where: { schoolId: u.schoolId }, data: { isActive: false } });
  const ay = await prisma.academicYear.create({ data: { schoolId: u.schoolId, name: body.name, startDate: new Date(body.startDate), endDate: new Date(body.endDate), isActive: body.isActive ?? false } });
  return json(ay, 201, h);
}

async function updateAcademicYear(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const ay = await prisma.academicYear.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!ay) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);
  if (body.isActive) await prisma.academicYear.updateMany({ where: { schoolId: u.schoolId, id: { not: id } }, data: { isActive: false } });
  const updated = await prisma.academicYear.update({
    where: { id },
    data: {
      name: body.name ?? ay.name,
      startDate: body.startDate ? new Date(body.startDate) : ay.startDate,
      endDate: body.endDate ? new Date(body.endDate) : ay.endDate,
      isActive: body.isActive !== undefined ? body.isActive : ay.isActive,
    },
  });
  return json(updated, 200, h);
}

async function deleteAcademicYear(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const ay = await prisma.academicYear.findFirst({ where: { id, schoolId: u.schoolId }, include: { _count: { select: { enrollments: true } } } });
  if (!ay) return err("Not found", 404, h);
  if ((ay as any)._count.enrollments > 0) return err("Cannot delete: this year has student enrollments. Archive it instead.", 400, h);
  await prisma.academicYear.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function getPromotionPreview(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const fromYearId = url.searchParams.get("fromYearId");
  if (!fromYearId) return err("fromYearId required", 400, h);

  const sections = await prisma.section.findMany({
    where: { grade: { schoolId: u.schoolId, academicYearId: fromYearId } },
    include: {
      grade: true,
      _count: { select: { enrollments: { where: { academicYearId: fromYearId, status: "ACTIVE" } } } },
    },
    orderBy: [{ grade: { gradeNumber: "asc" } }, { name: "asc" }],
  });

  return json(sections.map((s) => ({
    id: s.id,
    label: `${s.grade.name} — ${s.name}`,
    gradeName: s.grade.name,
    sectionName: s.name,
    studentCount: (s._count as any).enrollments,
  })), 200, h);
}

async function getAttendance(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);

  const dateStr = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const sectionId = url.searchParams.get("sectionId");

  if (sectionId) {
    const section = await prisma.section.findFirst({ where: { id: sectionId, grade: { schoolId: u.schoolId } } });
    if (!section) return err("Section not found", 404, h);

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { sectionId, status: "ACTIVE" },
      include: { student: { include: { user: { include: { profile: true } }, attendances: { where: { date: new Date(dateStr), sectionId } } } } },
    });

    return json({
      date: dateStr, sectionId,
      students: enrollments.map((e) => {
        const att = e.student.attendances[0];
        return {
          studentId: e.student.id, rollNo: e.rollNo ?? e.student.rollNumber ?? null,
          name: e.student.user.profile ? `${e.student.user.profile.firstName} ${e.student.user.profile.lastName}`.trim() : e.student.user.email,
          avatar: e.student.user.profile?.avatar ?? null,
          stream: e.student.stream ?? null,
          status: att?.status ?? null, attendanceId: att?.id ?? null,
        };
      }),
    }, 200, h);
  }

  const sections = await prisma.section.findMany({
    where: { grade: { schoolId: u.schoolId } },
    include: { grade: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
    orderBy: [{ grade: { gradeNumber: "asc" } }, { name: "asc" }],
  });

  return json({ sections: sections.map((s) => ({ id: s.id, name: `${s.grade.name} ${s.name}`, gradeId: s.gradeId, gradeName: s.grade.name, capacity: s.capacity, studentCount: s._count.enrollments })) }, 200, h);
}

async function markAttendance(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || (u.role !== "admin" && u.role !== "teacher")) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.sectionId || !body?.date || !body?.records) return err("sectionId, date, records required", 400, h);

  const date = new Date(body.date);
  const records: { studentId: string; status: string }[] = body.records;

  const ops = records.map((r) =>
    prisma.studentAttendance.upsert({
      where: { studentId_date: { studentId: r.studentId, date } },
      update: { status: r.status as any },
      create: { studentId: r.studentId, sectionId: body.sectionId, date, status: r.status as any },
    })
  );

  await Promise.all(ops);
  return json({ ok: true, count: records.length }, 200, h);
}

async function getAttendanceSummary(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);

  const days = parseInt(url.searchParams.get("days") ?? "7");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const records = await prisma.studentAttendance.findMany({
    where: { student: { schoolId: u.schoolId }, date: { gte: startDate } },
    select: { date: true, status: true },
  });

  const byDate: Record<string, { present: number; absent: number; late: number; total: number }> = {};
  for (const r of records) {
    const key = r.date.toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = { present: 0, absent: 0, late: 0, total: 0 };
    byDate[key].total++;
    if (r.status === "PRESENT") byDate[key].present++;
    else if (r.status === "ABSENT") byDate[key].absent++;
    else if (r.status === "LATE") byDate[key].late++;
  }

  return json({ summary: Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, s]) => ({ date, ...s, pct: s.total ? Math.round((s.present / s.total) * 100) : 0 })) }, 200, h);
}

async function getFees(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search") ?? "";

  const where: any = { student: { schoolId: u.schoolId } };
  if (status) where.status = status;
  if (search) where.student = { ...where.student, user: { profile: { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }] } } };

  const [collections, total, feeTypes] = await Promise.all([
    prisma.feeCollection.findMany({
      where, skip, take: limit, orderBy: { dueDate: "asc" },
      include: { student: { include: { user: { include: { profile: true } } } }, feeType: true },
    }),
    prisma.feeCollection.count({ where }),
    prisma.feeType.findMany({ where: { schoolId: u.schoolId } }),
  ]);

  const summary = await prisma.feeCollection.groupBy({ by: ["status"], where: { student: { schoolId: u.schoolId } }, _count: { status: true }, _sum: { amountDue: true, amountPaid: true } });

  return json({
    collections: collections.map((c) => ({
      id: c.id, receiptNo: c.receiptNo, amountDue: Number(c.amountDue), amountPaid: Number(c.amountPaid),
      status: c.status, dueDate: c.dueDate, paidDate: c.paidDate, paymentMethod: c.paymentMethod,
      feeType: c.feeType.name, studentName: c.student.user.profile ? `${c.student.user.profile.firstName} ${c.student.user.profile.lastName}`.trim() : c.student.user.email,
      studentId: c.studentId,
    })),
    total, page, feeTypes, summary,
  }, 200, h);
}

async function collectFee(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.studentId || !body?.feeTypeId || !body?.amountDue || !body?.dueDate) return err("studentId, feeTypeId, amountDue, dueDate required", 400, h);

  const student = await prisma.student.findFirst({ where: { id: body.studentId, schoolId: u.schoolId } });
  if (!student) return err("Student not found", 404, h);

  const receiptNo = `RCP-${Date.now().toString().slice(-8)}`;
  const amountPaid = body.amountPaid ?? 0;
  const status = amountPaid >= body.amountDue ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING";

  const fee = await prisma.feeCollection.create({
    data: { studentId: body.studentId, feeTypeId: body.feeTypeId, amountDue: body.amountDue, amountPaid, status, dueDate: new Date(body.dueDate), paidDate: amountPaid > 0 ? new Date() : null, paymentMethod: body.paymentMethod ?? null, receiptNo },
  });
  return json(fee, 201, h);
}

async function recordFeePayment(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);

  const fee = await prisma.feeCollection.findFirst({ where: { id, student: { schoolId: u.schoolId } } });
  if (!fee) return err("Not found", 404, h);

  const body = await req.json().catch(() => null);
  const amountPaid = Number(body?.amountPaid ?? fee.amountDue);
  const status = amountPaid >= Number(fee.amountDue) ? "PAID" : "PARTIAL";

  const updated = await prisma.feeCollection.update({ where: { id }, data: { amountPaid, status, paidDate: new Date(), paymentMethod: body?.paymentMethod ?? null } });
  return json(updated, 200, h);
}

async function getNotices(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);

  const notices = await prisma.notice.findMany({
    where: { schoolId: u.schoolId },
    include: { publishedBy: { include: { profile: true } } },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  return json(notices.map((n) => ({
    ...n, authorName: n.publishedBy.profile ? `${n.publishedBy.profile.firstName} ${n.publishedBy.profile.lastName}`.trim() : n.publishedBy.email,
  })), 200, h);
}

async function createNotice(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || (u.role !== "admin" && u.role !== "teacher")) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.content) return err("title and content required", 400, h);

  const notice = await prisma.notice.create({
    data: { schoolId: u.schoolId, title: body.title, content: body.content, targetRole: body.targetRole ?? null, isUrgent: body.isUrgent ?? false, publishedById: u.id },
  });
  return json(notice, 201, h);
}

async function deleteNotice(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const notice = await prisma.notice.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!notice) return err("Not found", 404, h);
  await prisma.notice.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function getExams(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);

  const exams = await prisma.exam.findMany({
    where: { schoolId: u.schoolId }, orderBy: { startDate: "desc" }, take: 30,
    include: { academicYear: true, examSubjects: { include: { subject: true, results: { select: { id: true } } } } },
  });
  return json(exams, 200, h);
}

async function createExam(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.startDate || !body?.endDate) return err("name, startDate, endDate required", 400, h);

  let academicYearId = body.academicYearId;
  if (!academicYearId) {
    const ay = await prisma.academicYear.findFirst({ where: { schoolId: u.schoolId, isActive: true } });
    if (!ay) return err("No active academic year", 400, h);
    academicYearId = ay.id;
  }

  // Coerce to a valid ExamType; friendly term names fall back to TERMINAL.
  const VALID_TYPES = ["UNIT_TEST", "TERMINAL", "FINAL", "PRACTICAL", "BOARD"];
  const type = VALID_TYPES.includes(body.type) ? body.type : "TERMINAL";

  const exam = await prisma.exam.create({ data: { schoolId: u.schoolId, academicYearId, name: body.name, type, startDate: new Date(body.startDate), endDate: new Date(body.endDate), status: body.status ?? "SCHEDULED" } });
  return json(exam, 201, h);
}

async function updateExam(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const exam = await prisma.exam.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!exam) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.exam.update({ where: { id }, data: { name: body?.name, status: body?.status, startDate: body?.startDate ? new Date(body.startDate) : undefined, endDate: body?.endDate ? new Date(body.endDate) : undefined } });
  return json(updated, 200, h);
}

async function deleteExam(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const exam = await prisma.exam.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!exam) return err("Not found", 404, h);
  await prisma.exam.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function getStudentExams(req: Request, h: Headers): Promise<Response> {
  const u = await authSchoolUser(req);
  if (!u || u.role !== "student") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { userId: u.id },
    include: { enrollments: { where: { status: "ACTIVE" }, include: { section: { include: { grade: true } } }, take: 1 } } });
  if (!student) return err("Student not found", 404, h);
  const exams = await prisma.exam.findMany({
    where: { schoolId: u.schoolId, status: { not: "CANCELLED" } },
    include: { examSubjects: { include: { subject: true }, orderBy: { examDate: "asc" } } },
    orderBy: { startDate: "asc" }, take: 20,
  });
  return json(exams, 200, h);
}

async function getTeacherExams(req: Request, h: Headers): Promise<Response> {
  const u = await authSchoolUser(req);
  if (!u || u.role !== "teacher") return err("Unauthorized", 401, h);
  const exams = await prisma.exam.findMany({
    where: { schoolId: u.schoolId, status: { not: "CANCELLED" } },
    include: { examSubjects: { include: { subject: true }, orderBy: { examDate: "asc" } } },
    orderBy: { startDate: "asc" }, take: 20,
  });
  return json(exams, 200, h);
}

async function markAdmissionFee(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const adm = await prisma.admission.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!adm) return err("Not found", 404, h);
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.preAdmissionPaid !== undefined) data.preAdmissionPaid = !!body.preAdmissionPaid;
  if (body.admissionFeePaid !== undefined) data.admissionFeePaid = !!body.admissionFeePaid;
  if (body.feeStructureId !== undefined) {
    if (body.feeStructureId) {
      const fs = await prisma.feeStructure.findFirst({ where: { id: body.feeStructureId, schoolId: u.schoolId } });
      if (!fs) return err("Fee structure not found", 404, h);
    }
    data.feeStructureId = body.feeStructureId || null;
  }
  const updated = await prisma.admission.update({ where: { id }, data });
  return json(updated, 200, h);
}

async function getSubjects(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const subjects = await prisma.subject.findMany({ where: { schoolId: u.schoolId }, include: { department: true }, orderBy: { name: "asc" } });
  return json(subjects, 200, h);
}

async function createSubject(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.code) return err("name and code required", 400, h);
  const subject = await prisma.subject.create({ data: { schoolId: u.schoolId, name: body.name, code: body.code, creditHours: body.creditHours ?? 5, isElective: body.isElective ?? false, departmentId: body.departmentId ?? null } });
  return json(subject, 201, h);
}

async function deleteSubject(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const subject = await prisma.subject.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!subject) return err("Subject not found", 404, h);
  await prisma.subject.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// GET /api/admin/subjects/:id — subject detail with schedule + teacher assignments
async function getSubjectDetail(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const subject = await prisma.subject.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!subject) return err("Not found", 404, h);

  const [slots, teacherAssignments, sectionAssignments] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: { subjectId: id, section: { grade: { schoolId: u.schoolId } } },
      include: {
        section: { include: { grade: true } },
        teacher: { include: { user: { include: { profile: true } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    }),
    prisma.teacherSubjectAssignment.findMany({
      where: { subjectId: id, teacher: { school: { id: u.schoolId } } },
      include: {
        teacher: { include: { user: { include: { profile: true } } } },
        section: { include: { grade: true } },
      },
    }),
    prisma.subjectAssignment.findMany({
      where: { subjectId: id, section: { grade: { schoolId: u.schoolId } } },
      include: { section: { include: { grade: true } } },
    }),
  ]);

  const teacherName = (t: any) => t.user.profile
    ? `${t.user.profile.firstName} ${t.user.profile.lastName}`.trim()
    : t.user.email;

  return json({
    ...subject,
    slots: slots.map((s) => ({
      id: s.id, dayOfWeek: s.dayOfWeek, periodNumber: s.periodNumber,
      startTime: s.startTime, endTime: s.endTime, shift: s.shift, roomNo: s.roomNo,
      sectionId: s.sectionId,
      sectionName: `${s.section.grade.name} ${s.section.name}`,
      gradeId: s.section.gradeId,
      teacherId: s.teacherId,
      teacherName: s.teacher ? teacherName(s.teacher) : null,
    })),
    teacherAssignments: teacherAssignments.map((a) => ({
      id: a.id, teacherId: a.teacherId,
      teacherName: teacherName(a.teacher),
      sectionId: a.sectionId,
      sectionName: a.section ? `${a.section.grade.name} ${a.section.name}` : null,
    })),
    sections: sectionAssignments.map((a) => ({
      assignmentId: a.id, sectionId: a.sectionId,
      sectionName: `${a.section.grade.name} ${a.section.name}`,
      gradeId: a.section.gradeId,
    })),
  }, 200, h);
}

// GET /api/admin/schedule/teachers-free?dayOfWeek=1&periodNumber=2&shift=DAY
// Returns all teachers + whether they have a conflict at that slot
async function getTeachersAvailability(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const day = Number(url.searchParams.get("dayOfWeek") ?? -1);
  const period = Number(url.searchParams.get("periodNumber") ?? -1);
  const shift = url.searchParams.get("shift") ?? "DAY";
  if (day < 0 || period < 0) return err("dayOfWeek and periodNumber required", 400, h);

  const [teachers, busySlots] = await Promise.all([
    prisma.teacher.findMany({
      where: { schoolId: u.schoolId, user: { status: "ACTIVE" } },
      include: { user: { include: { profile: true } } },
    }),
    prisma.timetableSlot.findMany({
      where: { dayOfWeek: day, periodNumber: period, shift: shift === "MORNING" ? "MORNING" : "DAY", section: { grade: { schoolId: u.schoolId } } },
      select: { teacherId: true },
    }),
  ]);

  const busyTeacherIds = new Set(busySlots.map((s) => s.teacherId).filter(Boolean));
  const teacherName = (t: any) => t.user.profile
    ? `${t.user.profile.firstName} ${t.user.profile.lastName}`.trim()
    : t.user.email;

  return json(teachers.map((t) => ({
    id: t.id,
    name: teacherName(t),
    isBusy: busyTeacherIds.has(t.id),
  })), 200, h);
}

// Assign a subject to every section of a grade (and optionally create the subject)
async function assignSubjectToGrade(req: Request, h: Headers, gradeId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const grade = await prisma.grade.findFirst({ where: { id: gradeId, schoolId: u.schoolId }, include: { sections: true } });
  if (!grade) return err("Grade not found", 404, h);
  const body = await req.json().catch(() => null);

  let subjectId: string = body?.subjectId;
  // If no subjectId provided, create a new subject from name+code
  if (!subjectId) {
    if (!body?.name || !body?.code) return err("subjectId or name+code required", 400, h);
    const existing = await prisma.subject.findFirst({ where: { schoolId: u.schoolId, code: body.code } });
    if (existing) {
      subjectId = existing.id;
    } else {
      const s = await prisma.subject.create({ data: { schoolId: u.schoolId, name: body.name, code: body.code, creditHours: body.creditHours ?? 5, isElective: body.isElective ?? false } });
      subjectId = s.id;
    }
  }

  // Assign to all sections (skip already assigned)
  const results = await Promise.allSettled(grade.sections.map((sec) =>
    prisma.subjectAssignment.upsert({
      where: { sectionId_subjectId: { sectionId: sec.id, subjectId } },
      create: { sectionId: sec.id, subjectId },
      update: {},
    })
  ));
  const assigned = results.filter((r) => r.status === "fulfilled").length;
  return json({ ok: true, assigned, total: grade.sections.length }, 200, h);
}

async function getSchoolSettings(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const school = await prisma.school.findUnique({ where: { id: u.schoolId }, include: { subscription: { include: { plan: true } }, academicYears: { where: { isActive: true } } } });
  if (!school) return err("Not found", 404, h);
  return json({ ...school, password: undefined }, 200, h);
}

async function updateSchoolSettings(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);
  const updated = await prisma.school.update({ where: { id: u.schoolId }, data: { phone: body.phone, altPhone: body.altPhone, email: body.email, website: body.website, principalName: body.principalName, principalPhone: body.principalPhone, address: body.address, city: body.city } });
  return json(updated, 200, h);
}

// ─── Teacher Portal ───────────────────────────────────────────────────────────

async function teacherDashboard(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "teacher") return err("Unauthorized", 401, h);

  const teacher = await prisma.teacher.findFirst({ where: { userId: u.id }, include: { user: { include: { profile: true } } } });
  if (!teacher) return err("Teacher record not found", 404, h);

  const [mySubjects, myClasses, pendingAssignments, recentNotices] = await Promise.all([
    prisma.teacherSubjectAssignment.findMany({ where: { teacherId: teacher.id }, include: { subject: true } }),
    prisma.section.findMany({ where: { timetableSlots: { some: { teacherId: teacher.id } } }, include: { grade: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } }, distinct: ["id"] }),
    prisma.assignment.count({ where: { teacherId: teacher.id, dueDate: { gte: new Date() } } }),
    prisma.notice.findMany({ where: { schoolId: u.schoolId, OR: [{ targetRole: null }, { targetRole: "TEACHER" }] }, orderBy: { publishedAt: "desc" }, take: 5 }),
  ]);

  const profile = teacher.user.profile;
  const totalStudents = myClasses.reduce((sum, c) => sum + c._count.enrollments, 0);
  return json({
    teacher,
    profile: {
      name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : teacher.user.email,
      avatar: profile?.avatar ?? null,
      specialization: teacher.specialization ?? null,
    },
    mySubjects: mySubjects.map((a) => a.subject),
    myClasses: myClasses.map((c) => ({ id: c.id, name: `${c.grade.name} ${c.name}`, students: c._count.enrollments })),
    totalStudents,
    pendingAssignments, recentNotices,
  }, 200, h);
}

async function getTeacherClasses(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "teacher") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { userId: u.id } });
  if (!teacher) return err("Teacher record not found", 404, h);

  const assignments = await prisma.teacherSubjectAssignment.findMany({
    where: { teacherId: teacher.id, sectionId: { not: null } },
    include: {
      subject: true,
      section: {
        include: {
          grade: true,
          enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: { include: { profile: true } } } } } },
        },
      },
    },
  });

  const sectionMap = new Map<string, any>();
  for (const a of assignments) {
    if (!a.section) continue;
    const sec = a.section;
    if (!sectionMap.has(sec.id)) {
      sectionMap.set(sec.id, {
        id: sec.id,
        name: `${sec.grade.name} ${sec.name}`,
        gradeNumber: sec.grade.gradeNumber,
        subjects: [],
        students: sec.enrollments.map((e) => ({
          id: e.student.id,
          rollNo: e.rollNo ?? e.student.rollNumber ?? null,
          name: e.student.user.profile ? `${e.student.user.profile.firstName} ${e.student.user.profile.lastName}`.trim() : e.student.user.email,
          avatar: e.student.user.profile?.avatar ?? null,
          stream: e.student.stream ?? null,
        })),
      });
    }
    sectionMap.get(sec.id).subjects.push(a.subject.name);
  }

  return json(Array.from(sectionMap.values()), 200, h);
}

// ─── Section Subject Management (admin) ──────────────────────────────────────

async function getSectionSubjects(req: Request, h: Headers, sectionId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const section = await prisma.section.findFirst({ where: { id: sectionId, grade: { schoolId: u.schoolId } } });
  if (!section) return err("Section not found", 404, h);
  const assignments = await prisma.subjectAssignment.findMany({
    where: { sectionId },
    include: { subject: true },
    orderBy: { subject: { name: "asc" } },
  });
  // For each subject, find assigned teacher
  const teacherMap = await prisma.teacherSubjectAssignment.findMany({
    where: { sectionId, subjectId: { in: assignments.map((a) => a.subjectId) } },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
  });
  const teacherBySubject = new Map(teacherMap.map((t) => [
    t.subjectId,
    { id: t.teacher.id, name: t.teacher.user.profile ? `${t.teacher.user.profile.firstName} ${t.teacher.user.profile.lastName}`.trim() : t.teacher.user.email },
  ]));
  return json(assignments.map((a) => ({
    id: a.id, subjectId: a.subject.id, name: a.subject.name, code: a.subject.code,
    isElective: a.subject.isElective, creditHours: a.subject.creditHours,
    teacher: teacherBySubject.get(a.subjectId) ?? null,
  })), 200, h);
}

async function addSectionSubject(req: Request, h: Headers, sectionId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const section = await prisma.section.findFirst({ where: { id: sectionId, grade: { schoolId: u.schoolId } } });
  if (!section) return err("Section not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body?.subjectId) return err("subjectId required", 400, h);
  const subject = await prisma.subject.findFirst({ where: { id: body.subjectId, schoolId: u.schoolId } });
  if (!subject) return err("Subject not found", 404, h);
  const existing = await prisma.subjectAssignment.findFirst({ where: { sectionId, subjectId: body.subjectId } });
  if (existing) return err("Subject already assigned to this section", 400, h);
  const a = await prisma.subjectAssignment.create({ data: { sectionId, subjectId: body.subjectId } });
  return json({ id: a.id, subjectId: subject.id, name: subject.name, code: subject.code, isElective: subject.isElective, creditHours: subject.creditHours, teacher: null }, 201, h);
}

async function removeSectionSubject(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const a = await prisma.subjectAssignment.findFirst({ where: { id, section: { grade: { schoolId: u.schoolId } } } });
  if (!a) return err("Assignment not found", 404, h);
  await prisma.subjectAssignment.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function updateSectionMeta(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const section = await prisma.section.findFirst({ where: { id, grade: { schoolId: u.schoolId } } });
  if (!section) return err("Section not found", 404, h);
  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (body?.stream !== undefined) data.stream = body.stream || null;
  if (body?.classTeacherId !== undefined) data.classTeacherId = body.classTeacherId || null;
  if (body?.roomNo !== undefined) data.roomNo = body.roomNo || null;
  const updated = await prisma.section.update({ where: { id }, data });
  return json({ id: updated.id, stream: updated.stream, classTeacherId: updated.classTeacherId, roomNo: updated.roomNo }, 200, h);
}

// ─── Teacher Assignment Management (admin) ────────────────────────────────────

async function getTeacherAssignments(req: Request, h: Headers, teacherId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, user: { schoolId: u.schoolId } } });
  if (!teacher) return err("Teacher not found", 404, h);
  const assignments = await prisma.teacherSubjectAssignment.findMany({
    where: { teacherId },
    include: { subject: true, section: { include: { grade: true } } },
    orderBy: { id: "asc" },
  });
  return json(assignments.map((a) => ({
    id: a.id,
    subject: { id: a.subject.id, name: a.subject.name },
    section: a.section ? { id: a.section.id, name: a.section.name, grade: { id: a.section.grade.id, name: a.section.grade.name, gradeNumber: a.section.grade.gradeNumber } } : null,
  })), 200, h);
}

async function addTeacherAssignment(req: Request, h: Headers, teacherId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, user: { schoolId: u.schoolId } } });
  if (!teacher) return err("Teacher not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body?.subjectId || !body?.sectionId) return err("subjectId and sectionId required", 400, h);
  const subject = await prisma.subject.findFirst({ where: { id: body.subjectId, schoolId: u.schoolId } });
  if (!subject) return err("Subject not found", 404, h);
  const section = await prisma.section.findFirst({ where: { id: body.sectionId, grade: { schoolId: u.schoolId } } });
  if (!section) return err("Section not found", 404, h);
  const existing = await prisma.teacherSubjectAssignment.findFirst({ where: { teacherId, subjectId: body.subjectId, sectionId: body.sectionId } });
  if (existing) return err("This assignment already exists", 400, h);
  const a = await prisma.teacherSubjectAssignment.create({
    data: { teacherId, subjectId: body.subjectId, sectionId: body.sectionId },
    include: { subject: true, section: { include: { grade: true } } },
  });
  return json({
    id: a.id,
    subject: { id: a.subject.id, name: a.subject.name },
    section: a.section ? { id: a.section.id, name: a.section.name, grade: { id: a.section.grade.id, name: a.section.grade.name, gradeNumber: a.section.grade.gradeNumber } } : null,
  }, 201, h);
}

async function deleteTeacherAssignment(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const a = await prisma.teacherSubjectAssignment.findFirst({ where: { id, teacher: { user: { schoolId: u.schoolId } } } });
  if (!a) return err("Assignment not found", 404, h);
  await prisma.teacherSubjectAssignment.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Grades list (for dropdowns) ─────────────────────────────────────────────

async function getGradesWithSections(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || (u.role !== "admin" && u.role !== "teacher")) return err("Unauthorized", 401, h);
  const grades = await prisma.grade.findMany({
    where: { schoolId: u.schoolId },
    include: { sections: { orderBy: { name: "asc" } } },
    orderBy: { gradeNumber: "asc" },
  });
  return json(grades.map((g) => ({
    id: g.id, name: g.name, gradeNumber: g.gradeNumber,
    sections: g.sections.map((s) => ({ id: s.id, name: s.name })),
  })), 200, h);
}

async function getAssignments(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "teacher") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { userId: u.id } });
  if (!teacher) return err("Teacher record not found", 404, h);

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: teacher.id }, orderBy: { createdAt: "desc" }, take: 20,
    include: { subject: true, submissions: { select: { id: true, status: true } } },
  });
  return json(assignments.map((a) => ({ ...a, submissionCount: a.submissions.length, gradedCount: a.submissions.filter((s) => s.status === "GRADED").length })), 200, h);
}

async function createAssignment(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "teacher") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { userId: u.id } });
  if (!teacher) return err("Teacher record not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.dueDate) return err("title and dueDate required", 400, h);
  const assignment = await prisma.assignment.create({ data: { teacherId: teacher.id, title: body.title, description: body.description ?? null, dueDate: new Date(body.dueDate), maxMarks: body.maxMarks ?? null, subjectId: body.subjectId ?? null, sectionId: body.sectionId ?? null } });
  return json(assignment, 201, h);
}

// ─── Student Portal ───────────────────────────────────────────────────────────

async function studentProfile(req: Request, h: Headers): Promise<Response> {
  try {
    const u = await authSchool(req);
    if (!u || u.role !== "student") return err("Unauthorized", 401, h);
    const student = await prisma.student.findFirst({
      where: { userId: u.id },
      include: {
        user: { include: { profile: true } },
        busRoute: { select: { name: true } },
        parentLinks: { include: { parent: { include: { user: { include: { profile: true } } } } } },
      },
    });
    if (!student) return err("Student record not found", 404, h);
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId: student.id, status: "ACTIVE" },
      include: { section: { include: { grade: true } }, academicYear: true },
      orderBy: { enrolledAt: "desc" },
    });
    const shifts = enrollment ? await prisma.timetableSlot.findMany({
      where: { sectionId: enrollment.sectionId },
      select: { shift: true },
      distinct: ["shift"],
    }) : [];
    const profile = student.user.profile;
    const parentInfo = student.parentLinks.map((pl) => ({
      name: pl.parent.user.profile ? `${pl.parent.user.profile.firstName} ${pl.parent.user.profile.lastName}`.trim() : pl.parent.user.email,
      email: pl.parent.user.email,
      phone: pl.parent.user.profile?.phone ?? null,
      relationship: pl.relationship,
      occupation: pl.parent.occupation,
    }));
    return json({
      id: student.id,
      admissionNo: student.admissionNo,
      rollNumber: enrollment?.rollNo ?? student.rollNumber ?? null,
      stream: student.stream ?? null,
      transportMode: student.transportMode,
      busRoute: student.busRoute?.name ?? null,
      createdAt: student.createdAt,
      email: student.user.email,
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      phone: profile?.phone ?? null,
      gender: profile?.gender ?? null,
      dateOfBirth: profile?.dateOfBirth ?? null,
      address: profile?.address ?? null,
      avatar: profile?.avatar ?? null,
      className: enrollment ? `${enrollment.section.grade.name} ${enrollment.section.name}` : null,
      gradeName: enrollment?.section?.grade?.name ?? null,
      sectionName: enrollment?.section?.name ?? null,
      academicYear: enrollment?.academicYear?.name ?? null,
      shifts: shifts.map((s) => s.shift),
      parents: parentInfo,
    }, 200, h);
  } catch (e) {
    console.error("studentProfile error:", e);
    return err("Failed to load profile", 500, h);
  }
}

async function studentDashboard(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "student") return err("Unauthorized", 401, h);

  const student = await prisma.student.findFirst({ where: { userId: u.id }, include: { user: { include: { profile: true } } } });
  if (!student) return err("Student record not found", 404, h);

  const [enrollment, attendance, pendingFees, notices, recentResults] = await Promise.all([
    prisma.studentEnrollment.findFirst({ where: { studentId: student.id, status: "ACTIVE" }, include: { section: { include: { grade: true, _count: { select: { subjectAssignments: true } } } }, academicYear: true } }),
    prisma.studentAttendance.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" }, take: 30 }),
    prisma.feeCollection.findMany({ where: { studentId: student.id, status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.notice.findMany({ where: { schoolId: u.schoolId, OR: [{ targetRole: null }, { targetRole: "STUDENT" }] }, orderBy: { publishedAt: "desc" }, take: 5 }),
    prisma.examResult.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 5, include: { examSubject: { include: { subject: true, exam: true } } } }),
  ]);

  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const attPct = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
  const profile = student.user.profile;
  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : student.user.email;
  const pendingFeeTotal = pendingFees.reduce((sum, f) => sum + Number(f.amountDue) - Number(f.amountPaid), 0);

  return json({
    student,
    profile: {
      name,
      avatar: profile?.avatar ?? null,
      stream: student.stream ?? null,
      rollNumber: enrollment?.rollNo ?? student.rollNumber ?? null,
      admissionNo: student.admissionNo,
      className: enrollment ? `${enrollment.section.grade.name} ${enrollment.section.name}` : null,
      academicYear: enrollment?.academicYear?.name ?? null,
    },
    enrollment,
    attendancePct: attPct, totalDays: attendance.length, presentDays: present,
    subjectsCount: enrollment?.section?._count?.subjectAssignments ?? 0,
    pendingFees, pendingFeeTotal,
    recentResults: recentResults.map((r) => ({
      id: r.id,
      subject: r.examSubject.subject.name,
      exam: r.examSubject.exam.name,
      marksObtained: Number(r.marksObtained),
      fullMarks: r.examSubject.fullMarks,
      grade: r.grade,
      isPassed: r.isPassed,
    })),
    notices,
  }, 200, h);
}

async function getStudentAttendance(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "student") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!student) return err("Not found", 404, h);

  const records = await prisma.studentAttendance.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" }, take: 90 });
  const present = records.filter((r) => r.status === "PRESENT").length;
  return json({ records, total: records.length, present, absent: records.filter((r) => r.status === "ABSENT").length, late: records.filter((r) => r.status === "LATE").length, pct: records.length ? Math.round((present / records.length) * 100) : 0 }, 200, h);
}

async function getStudentResults(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "student") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!student) return err("Not found", 404, h);

  const results = await prisma.examResult.findMany({
    where: { studentId: student.id },
    include: { examSubject: { include: { exam: true, subject: true } } },
    orderBy: { createdAt: "desc" },
  });

  const grouped: Record<string, any> = {};
  for (const r of results) {
    const examName = r.examSubject.exam.name;
    if (!grouped[examName]) grouped[examName] = { exam: r.examSubject.exam, results: [] };
    grouped[examName].results.push({ ...r, subject: r.examSubject.subject, fullMarks: r.examSubject.fullMarks, passMarks: r.examSubject.passMarks });
  }

  return json(Object.values(grouped), 200, h);
}

async function getStudentFees(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "student") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!student) return err("Not found", 404, h);
  const fees = await prisma.feeCollection.findMany({ where: { studentId: student.id }, include: { feeType: true }, orderBy: { dueDate: "desc" } });
  return json(fees.map((f) => ({ ...f, amountDue: Number(f.amountDue), amountPaid: Number(f.amountPaid), feeTypeName: f.feeType.name })), 200, h);
}

// ─── Parent Portal ────────────────────────────────────────────────────────────

async function getParentStudentIds(userId: string): Promise<string[]> {
  const parent = await prisma.parent.findFirst({ where: { userId }, include: { children: { select: { studentId: true } } } });
  return parent?.children.map((c) => c.studentId) ?? [];
}

async function getParentResults(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "parent") return err("Unauthorized", 401, h);
  const studentIds = await getParentStudentIds(u.id);
  if (studentIds.length === 0) return json([], 200, h);

  const children = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      user: { include: { profile: true } },
      examResults: { include: { examSubject: { include: { exam: true, subject: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  return json(children.map((s) => {
    const grouped: Record<string, any> = {};
    for (const r of s.examResults) {
      const name = r.examSubject.exam.name;
      if (!grouped[name]) grouped[name] = { exam: r.examSubject.exam, results: [] };
      grouped[name].results.push({ ...r, subject: r.examSubject.subject, fullMarks: r.examSubject.fullMarks, passMarks: r.examSubject.passMarks });
    }
    const profile = s.user.profile;
    return {
      studentId: s.id,
      name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : s.user.email,
      admissionNo: s.admissionNo,
      exams: Object.values(grouped),
    };
  }), 200, h);
}

async function getParentAttendance(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "parent") return err("Unauthorized", 401, h);
  const studentIds = await getParentStudentIds(u.id);
  if (studentIds.length === 0) return json([], 200, h);

  const children = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      user: { include: { profile: true } },
      attendances: { orderBy: { date: "desc" }, take: 90 },
    },
  });

  return json(children.map((s) => {
    const records = s.attendances;
    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent  = records.filter((r) => r.status === "ABSENT").length;
    const late    = records.filter((r) => r.status === "LATE").length;
    const profile = s.user.profile;
    return {
      studentId: s.id,
      name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : s.user.email,
      admissionNo: s.admissionNo,
      records,
      total: records.length,
      present,
      absent,
      late,
      pct: records.length ? Math.round((present / records.length) * 100) : 0,
    };
  }), 200, h);
}

async function getParentFees(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "parent") return err("Unauthorized", 401, h);
  const studentIds = await getParentStudentIds(u.id);
  if (studentIds.length === 0) return json([], 200, h);

  const children = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      user: { include: { profile: true } },
      feeCollections: { include: { feeType: true }, orderBy: { dueDate: "desc" } },
    },
  });

  return json(children.map((s) => {
    const profile = s.user.profile;
    return {
      studentId: s.id,
      name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : s.user.email,
      admissionNo: s.admissionNo,
      fees: s.feeCollections.map((f) => ({ ...f, amountDue: Number(f.amountDue), amountPaid: Number(f.amountPaid), feeTypeName: f.feeType.name })),
    };
  }), 200, h);
}

async function parentDashboard(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "parent") return err("Unauthorized", 401, h);

  const parent = await prisma.parent.findFirst({ where: { userId: u.id }, include: { children: { include: { student: { include: { user: { include: { profile: true } }, enrollments: { where: { status: "ACTIVE" }, include: { section: { include: { grade: true } }, academicYear: true } }, attendances: { orderBy: { date: "desc" }, take: 30 }, feeCollections: { where: { status: { in: ["PENDING", "OVERDUE"] } } }, examResults: { orderBy: { createdAt: "desc" }, take: 5, include: { examSubject: { include: { subject: true } } } } } } } } } });
  if (!parent) return err("Parent record not found", 404, h);

  const notices = await prisma.notice.findMany({ where: { schoolId: u.schoolId, OR: [{ targetRole: null }, { targetRole: "PARENT" }] }, orderBy: { publishedAt: "desc" }, take: 5 });

  return json({
    parent,
    children: parent.children.map((link) => {
      const s = link.student;
      const att = s.attendances;
      const present = att.filter((a) => a.status === "PRESENT").length;
      const enr = s.enrollments[0];
      const pendingFeeTotal = s.feeCollections.reduce((sum, f) => sum + Number(f.amountDue) - Number(f.amountPaid), 0);
      return {
        id: s.id, name: s.user.profile ? `${s.user.profile.firstName} ${s.user.profile.lastName}`.trim() : s.user.email,
        avatar: s.user.profile?.avatar ?? null,
        admissionNo: s.admissionNo, relationship: link.relationship,
        stream: s.stream ?? null,
        rollNo: enr?.rollNo ?? s.rollNumber ?? null,
        className: enr ? `${enr.section.grade.name} ${enr.section.name}` : null,
        academicYear: enr?.academicYear?.name ?? null,
        attendancePct: att.length ? Math.round((present / att.length) * 100) : 0,
        pendingFees: s.feeCollections.length,
        pendingFeeTotal,
        recentResults: s.examResults.map((r) => ({
          subject: r.examSubject.subject.name,
          marksObtained: Number(r.marksObtained),
          fullMarks: r.examSubject.fullMarks,
          grade: r.grade,
        })),
      };
    }),
    notices,
  }, 200, h);
}

// ─── Departments ──────────────────────────────────────────────────────────────

async function getDepartments(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const depts = await prisma.department.findMany({
    where: { schoolId: u.schoolId },
    include: { _count: { select: { staff: true, subjects: true, grades: true } } },
    orderBy: { name: "asc" },
  });
  return json(depts, 200, h);
}

async function createDepartment(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name required", 400, h);
  const dept = await prisma.department.create({ data: { schoolId: u.schoolId, name: body.name, code: body.code ?? null, description: body.description ?? null, stream: body.stream ?? "OTHER" } });
  return json(dept, 201, h);
}

async function updateDepartment(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const dept = await prisma.department.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!dept) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.department.update({ where: { id }, data: { name: body?.name ?? dept.name, code: body?.code ?? dept.code, description: body?.description ?? dept.description, stream: body?.stream ?? dept.stream } });
  return json(updated, 200, h);
}

async function deleteDepartment(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const dept = await prisma.department.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!dept) return err("Not found", 404, h);
  await prisma.department.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Library ──────────────────────────────────────────────────────────────────

async function getLibraryBooks(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const search = url.searchParams.get("search") ?? "";
  const category = url.searchParams.get("category") ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const where: any = { schoolId: u.schoolId };
  if (search) where.OR = [{ title: { contains: search, mode: "insensitive" } }, { author: { contains: search, mode: "insensitive" } }, { isbn: { contains: search, mode: "insensitive" } }];
  if (category) where.category = { equals: category, mode: "insensitive" };
  const [books, total] = await Promise.all([
    prisma.libraryBook.findMany({ where, orderBy: { title: "asc" }, skip: (page - 1) * 20, take: 20 }),
    prisma.libraryBook.count({ where }),
  ]);
  const categories = await prisma.libraryBook.findMany({ where: { schoolId: u.schoolId }, select: { category: true }, distinct: ["category"] });
  return json({ books, total, categories: categories.map((c) => c.category).filter(Boolean) }, 200, h);
}

async function createLibraryBook(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.title) return err("title required", 400, h);
  const copies = body.totalCopies ?? 1;
  const book = await prisma.libraryBook.create({ data: { schoolId: u.schoolId, title: body.title, author: body.author ?? null, isbn: body.isbn ?? null, publisher: body.publisher ?? null, category: body.category ?? null, totalCopies: copies, availableCopies: copies, shelfNo: body.shelfNo ?? null, publishYear: body.publishYear ? parseInt(body.publishYear) : null } });
  return json(book, 201, h);
}

async function updateLibraryBook(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const book = await prisma.libraryBook.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!book) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.libraryBook.update({ where: { id }, data: { title: body?.title ?? book.title, author: body?.author ?? book.author, isbn: body?.isbn ?? book.isbn, publisher: body?.publisher ?? book.publisher, category: body?.category ?? book.category, totalCopies: body?.totalCopies ?? book.totalCopies, shelfNo: body?.shelfNo ?? book.shelfNo, publishYear: body?.publishYear ?? book.publishYear } });
  return json(updated, 200, h);
}

async function deleteLibraryBook(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const book = await prisma.libraryBook.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!book) return err("Not found", 404, h);
  await prisma.libraryBook.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function getBookIssues(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const status = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const issues = await prisma.bookIssue.findMany({
    where: { book: { schoolId: u.schoolId }, ...(status ? { status: status as any } : {}) },
    include: { book: { select: { title: true, isbn: true } }, student: { include: { user: { include: { profile: true } } } } },
    orderBy: { issuedAt: "desc" }, skip: (page - 1) * 20, take: 20,
  });
  const total = await prisma.bookIssue.count({ where: { book: { schoolId: u.schoolId }, ...(status ? { status: status as any } : {}) } });
  return json({ issues: issues.map((i) => ({ ...i, studentName: i.student ? `${i.student.user.profile?.firstName ?? ""} ${i.student.user.profile?.lastName ?? ""}`.trim() : null })), total }, 200, h);
}

async function issueBook(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.bookId || !body?.dueDate) return err("bookId and dueDate required", 400, h);
  const book = await prisma.libraryBook.findFirst({ where: { id: body.bookId, schoolId: u.schoolId } });
  if (!book) return err("Book not found", 404, h);
  if (book.availableCopies < 1) return err("No copies available", 400, h);
  const [issue] = await prisma.$transaction([
    prisma.bookIssue.create({ data: { bookId: body.bookId, studentId: body.studentId ?? null, staffId: body.staffId ?? null, dueDate: new Date(body.dueDate) } }),
    prisma.libraryBook.update({ where: { id: body.bookId }, data: { availableCopies: { decrement: 1 } } }),
  ]);
  return json(issue, 201, h);
}

async function returnBook(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const issue = await prisma.bookIssue.findUnique({ where: { id } });
  if (!issue) return err("Issue not found", 404, h);
  if (issue.status === "RETURNED") return err("Already returned", 400, h);
  const now = new Date();
  const isLate = now > issue.dueDate;
  const fine = isLate ? Math.floor((now.getTime() - issue.dueDate.getTime()) / 86400000) * 5 : 0;
  await prisma.$transaction([
    prisma.bookIssue.update({ where: { id }, data: { status: "RETURNED", returnedAt: now, fine: fine > 0 ? fine : null } }),
    prisma.libraryBook.update({ where: { id: issue.bookId }, data: { availableCopies: { increment: 1 } } }),
  ]);
  return json({ ok: true, fine }, 200, h);
}

// ─── Admissions ───────────────────────────────────────────────────────────────

async function getAdmissions(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search") ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const where: any = { schoolId: u.schoolId };
  if (status) where.status = status;
  if (search) where.OR = [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }, { phone: { contains: search, mode: "insensitive" } }, { applicationNo: { contains: search, mode: "insensitive" } }];
  const [admissions, total] = await Promise.all([
    prisma.admission.findMany({ where, include: { grade: { select: { name: true } }, department: { select: { name: true } }, feeStructure: { select: { id: true, name: true, amount: true, installments: { select: { id: true, installmentNo: true, dueStage: true, label: true, amount: true } } } } }, orderBy: { appliedAt: "desc" }, skip: (page - 1) * 20, take: 20 }),
    prisma.admission.count({ where }),
  ]);
  const statusCounts = await prisma.admission.groupBy({ by: ["status"], where: { schoolId: u.schoolId }, _count: { status: true } });
  return json({ admissions: admissions.map((a) => ({ ...a, name: `${a.firstName} ${a.lastName}`, gradeName: a.grade?.name ?? null, deptName: a.department?.name ?? null, feeStructureName: a.feeStructure?.name ?? null })), total, statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])) }, 200, h);
}

async function createAdmission(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.lastName) return err("firstName and lastName required", 400, h);
  const count = await prisma.admission.count({ where: { schoolId: u.schoolId } });
  const applicationNo = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  const admission = await prisma.admission.create({ data: { schoolId: u.schoolId, applicationNo, firstName: body.firstName, lastName: body.lastName, email: body.email ?? null, phone: body.phone ?? null, gender: body.gender ?? null, dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null, address: body.address ?? null, gradeId: body.gradeId ?? null, departmentId: body.departmentId ?? null, previousSchool: body.previousSchool ?? null, guardianName: body.guardianName ?? null, guardianPhone: body.guardianPhone ?? null, notes: body.notes ?? null, transportRequired: !!body.transportRequired, busFee: body.busFee ? Number(body.busFee) : null, otherCharges: body.otherCharges ? Number(body.otherCharges) : null } });
  return json(admission, 201, h);
}

async function updateAdmission(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const adm = await prisma.admission.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!adm) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.admission.update({ where: { id }, data: { firstName: body?.firstName ?? adm.firstName, lastName: body?.lastName ?? adm.lastName, email: body?.email ?? adm.email, phone: body?.phone ?? adm.phone, gender: body?.gender ?? adm.gender, gradeId: body?.gradeId !== undefined ? (body.gradeId || null) : adm.gradeId, departmentId: body?.departmentId !== undefined ? (body.departmentId || null) : adm.departmentId, feeStructureId: body?.feeStructureId !== undefined ? (body.feeStructureId || null) : adm.feeStructureId, previousSchool: body?.previousSchool ?? adm.previousSchool, guardianName: body?.guardianName ?? adm.guardianName, guardianPhone: body?.guardianPhone ?? adm.guardianPhone, status: body?.status ?? adm.status, notes: body?.notes ?? adm.notes, transportRequired: body?.transportRequired !== undefined ? !!body.transportRequired : adm.transportRequired, busFee: body?.busFee !== undefined ? (body.busFee === "" || body.busFee === null ? null : Number(body.busFee)) : adm.busFee, otherCharges: body?.otherCharges !== undefined ? (body.otherCharges === "" || body.otherCharges === null ? null : Number(body.otherCharges)) : adm.otherCharges } });
  return json(updated, 200, h);
}

async function deleteAdmission(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const adm = await prisma.admission.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!adm) return err("Not found", 404, h);
  await prisma.admission.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Student Promotion ────────────────────────────────────────────────────────

async function promoteStudents(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.fromYearId || !body?.toYearId || !body?.sectionMappings) return err("fromYearId, toYearId, and sectionMappings required", 400, h);

  const fromYear = await prisma.academicYear.findFirst({ where: { id: body.fromYearId, schoolId: u.schoolId } });
  const toYear = await prisma.academicYear.findFirst({ where: { id: body.toYearId, schoolId: u.schoolId } });
  if (!fromYear || !toYear) return err("Academic year not found", 404, h);

  let promoted = 0, skipped = 0;
  for (const mapping of body.sectionMappings as { fromSectionId: string; toSectionId: string }[]) {
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { sectionId: mapping.fromSectionId, academicYearId: body.fromYearId, status: "ACTIVE" },
    });
    for (const enr of enrollments) {
      const existing = await prisma.studentEnrollment.findFirst({ where: { studentId: enr.studentId, academicYearId: body.toYearId } });
      if (existing) { skipped++; continue; }
      await prisma.studentEnrollment.create({ data: { studentId: enr.studentId, sectionId: mapping.toSectionId, academicYearId: body.toYearId } });
      await prisma.studentEnrollment.update({ where: { id: enr.id }, data: { status: "GRADUATED" } });
      promoted++;
    }
  }
  return json({ ok: true, promoted, skipped }, 200, h);
}

// ─── Fee Status Update ────────────────────────────────────────────────────────

async function updateFeeStatus(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.status) return err("status required", 400, h);
  const fee = await prisma.feeCollection.findFirst({ where: { id, student: { schoolId: u.schoolId } } });
  if (!fee) return err("Not found", 404, h);
  const data: any = { status: body.status };
  if (body.status === "PAID") { data.amountPaid = fee.amountDue; data.paidDate = new Date(); if (body.paymentMethod) data.paymentMethod = body.paymentMethod; }
  if (body.status === "WAIVED") { data.amountPaid = fee.amountDue; data.paidDate = new Date(); }
  const updated = await prisma.feeCollection.update({ where: { id }, data });
  return json(updated, 200, h);
}

// ─── Exam Schedule (Routine) ──────────────────────────────────────────────────

async function getExamSchedule(req: Request, h: Headers, examId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId: u.schoolId }, include: { examSubjects: { include: { subject: { select: { name: true, code: true } } }, orderBy: { examDate: "asc" } } } });
  if (!exam) return err("Exam not found", 404, h);
  return json(exam, 200, h);
}

async function upsertExamSubject(req: Request, h: Headers, examId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId: u.schoolId } });
  if (!exam) return err("Exam not found", 404, h);
  const body = await req.json().catch(() => null);
  const shift = body?.shift === "MORNING" ? "MORNING" : "DAY";

  // Accept either an existing subjectId, or a free-text subjectName which we
  // find-or-create as a Subject for this school.
  let subjectId = body?.subjectId as string | undefined;
  if (!subjectId && body?.subjectName) {
    const name = String(body.subjectName).trim();
    let subject = await prisma.subject.findFirst({ where: { schoolId: u.schoolId, name: { equals: name, mode: "insensitive" } } });
    if (!subject) {
      const code = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || `SUB${Date.now().toString().slice(-4)}`;
      const exists = await prisma.subject.findFirst({ where: { schoolId: u.schoolId, code } });
      subject = await prisma.subject.create({ data: { schoolId: u.schoolId, name, code: exists ? `${code}${Date.now().toString().slice(-3)}` : code } });
    }
    subjectId = subject.id;
  }
  if (!subjectId) return err("subjectId or subjectName required", 400, h);

  // Routine slots must stay within the exam's own start/end window.
  if (body.examDate) {
    const d = new Date(body.examDate);
    const start = new Date(exam.startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(exam.endDate); end.setHours(23, 59, 59, 999);
    if (d < start || d > end) {
      return err(`Exam date must be between ${start.toISOString().slice(0, 10)} and ${exam.endDate.toISOString().slice(0, 10)}.`, 400, h);
    }
  }

  // examTime is stored as a single string; build it from start/end if given.
  const examTime = body.examTime ?? (body.startTime ? `${body.startTime}${body.endTime ? ` - ${body.endTime}` : ""}` : null);

  const es = await prisma.examSubject.upsert({
    where: { examId_subjectId_shift: { examId, subjectId, shift } },
    create: { examId, subjectId, shift, fullMarks: body.fullMarks ?? 100, passMarks: body.passMarks ?? 40, examDate: body.examDate ? new Date(body.examDate) : null, examTime },
    update: { fullMarks: body.fullMarks ?? 100, passMarks: body.passMarks ?? 40, examDate: body.examDate ? new Date(body.examDate) : null, examTime },
  });
  return json(es, 200, h);
}

async function deleteExamSubject(req: Request, h: Headers, examSubjectId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const es = await prisma.examSubject.findUnique({ where: { id: examSubjectId }, include: { exam: { select: { schoolId: true } } } });
  if (!es || es.exam.schoolId !== u.schoolId) return err("Not found", 404, h);
  await prisma.examSubject.delete({ where: { id: examSubjectId } });
  return json({ ok: true }, 200, h);
}

// ─── Section allocation, capacity & student detail ─────────────────────────────

async function activeYearId(schoolId: string): Promise<string | null> {
  const ay = await prisma.academicYear.findFirst({ where: { schoolId, isActive: true } });
  return ay?.id ?? null;
}

// Allocates (or moves) a student into a section for the active year, enforcing
// the section's seat capacity. Returns an error string, or null on success.
async function allocateSection(studentId: string, sectionId: string, rollNo: string | null, schoolId: string): Promise<string | null> {
  const section = await prisma.section.findFirst({ where: { id: sectionId, grade: { schoolId } } });
  if (!section) return "Section not found";
  const yearId = await activeYearId(schoolId);
  if (!yearId) return "No active academic year. Create one in Academic Settings first.";

  // Existing enrollment for this student/year (re-allocation moves them).
  const existing = await prisma.studentEnrollment.findFirst({ where: { studentId, academicYearId: yearId } });

  if (existing?.sectionId !== sectionId) {
    const occupied = await prisma.studentEnrollment.count({ where: { sectionId, status: "ACTIVE" } });
    if (occupied >= section.totalSeats) {
      return `Section "${section.name}" is full — ${occupied}/${section.totalSeats} seats used. Please admit the student to another section.`;
    }
  }

  if (existing) {
    await prisma.studentEnrollment.update({ where: { id: existing.id }, data: { sectionId, rollNo: rollNo ?? existing.rollNo, status: "ACTIVE" } });
  } else {
    await prisma.studentEnrollment.create({ data: { studentId, sectionId, academicYearId: yearId, rollNo, status: "ACTIVE" } });
  }
  // Keep the denormalised counter in sync with reality.
  await syncOccupied(sectionId);
  if (existing && existing.sectionId !== sectionId) await syncOccupied(existing.sectionId);
  return null;
}

async function syncOccupied(sectionId: string): Promise<void> {
  const count = await prisma.studentEnrollment.count({ where: { sectionId, status: "ACTIVE" } });
  await prisma.section.update({ where: { id: sectionId }, data: { occupiedSeats: count } });
}

// Find-or-create a recurring "Transport" fee type for the school.
async function transportFeeType(schoolId: string) {
  let ft = await prisma.feeType.findFirst({ where: { schoolId, name: "Transport" } });
  if (!ft) ft = await prisma.feeType.create({ data: { schoolId, name: "Transport", description: "Bus / transport fee", isRecurring: true } });
  return ft;
}

async function tuitionFeeType(schoolId: string) {
  let ft = await prisma.feeType.findFirst({ where: { schoolId, name: "Admission / Tuition" } });
  if (!ft) ft = await prisma.feeType.create({ data: { schoolId, name: "Admission / Tuition", description: "Admission / tuition fee charged at enrollment", isRecurring: false } });
  return ft;
}

async function getSectionDetail(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const section = await prisma.section.findFirst({
    where: { id, grade: { schoolId: u.schoolId } },
    include: {
      grade: { include: { academicYear: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: { include: { user: { include: { profile: true } }, feeCollections: { select: { status: true } } } } },
        orderBy: { rollNo: "asc" },
      },
    },
  });
  if (!section) return err("Section not found", 404, h);

  const students = section.enrollments.map((e) => {
    const p = e.student.user.profile;
    const feeStatus = e.student.feeCollections.some((f) => f.status === "OVERDUE") ? "overdue"
      : e.student.feeCollections.some((f) => f.status === "PENDING") ? "pending" : "paid";
    return {
      id: e.student.id, admissionNo: e.student.admissionNo, rollNo: e.rollNo,
      name: p ? `${p.firstName} ${p.lastName}`.trim() : e.student.user.email,
      gender: p?.gender ?? null, feeStatus,
    };
  });

  // Subjects with assigned teachers
  const subjectRows = await prisma.subjectAssignment.findMany({
    where: { sectionId: section.id },
    include: { subject: true },
    orderBy: { subject: { name: "asc" } },
  });
  const teacherRows = await prisma.teacherSubjectAssignment.findMany({
    where: { sectionId: section.id, subjectId: { in: subjectRows.map((r) => r.subjectId) } },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
  });
  const teacherBySubject = new Map(teacherRows.map((t) => [
    t.subjectId,
    { id: t.teacher.id, name: t.teacher.user.profile ? `${t.teacher.user.profile.firstName} ${t.teacher.user.profile.lastName}`.trim() : t.teacher.user.email },
  ]));

  // Class teacher
  let classTeacher: { id: string; name: string } | null = null;
  if ((section as any).classTeacherId) {
    const ct = await prisma.teacher.findFirst({
      where: { id: (section as any).classTeacherId },
      include: { user: { include: { profile: true } } },
    });
    if (ct) classTeacher = { id: ct.id, name: ct.user.profile ? `${ct.user.profile.firstName} ${ct.user.profile.lastName}`.trim() : ct.user.email };
  }

  return json({
    id: section.id, name: section.name, performance: section.performance,
    totalSeats: section.totalSeats, occupiedSeats: students.length,
    seatsRemaining: Math.max(0, section.totalSeats - students.length),
    roomNo: (section as any).roomNo ?? null,
    stream: (section as any).stream ?? null,
    classTeacherId: (section as any).classTeacherId ?? null,
    classTeacher,
    gradeName: section.grade.name, gradeId: section.gradeId,
    gradeNumber: section.grade.gradeNumber,
    academicYear: section.grade.academicYear?.name ?? null,
    subjects: subjectRows.map((r) => ({
      id: r.id, subjectId: r.subject.id, name: r.subject.name, code: r.subject.code,
      isElective: r.subject.isElective, creditHours: r.subject.creditHours,
      teacher: teacherBySubject.get(r.subjectId) ?? null,
    })),
    students,
  }, 200, h);
}

async function getStudentDetail(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const s = await prisma.student.findFirst({
    where: { id, schoolId: u.schoolId },
    include: {
      user: { include: { profile: true } },
      busRoute: { include: { bus: true } },
      enrollments: { where: { status: "ACTIVE" }, include: { section: { include: { grade: true } }, academicYear: true }, take: 1 },
      feeCollections: { include: { feeType: { select: { name: true } } }, orderBy: { dueDate: "desc" } },
    },
  });
  if (!s) return err("Student not found", 404, h);

  const enroll = s.enrollments[0];
  const p = s.user.profile;

  const [present, absent, late, totalAtt] = await Promise.all([
    prisma.studentAttendance.count({ where: { studentId: id, status: "PRESENT" } }),
    prisma.studentAttendance.count({ where: { studentId: id, status: "ABSENT" } }),
    prisma.studentAttendance.count({ where: { studentId: id, status: "LATE" } }),
    prisma.studentAttendance.count({ where: { studentId: id } }),
  ]);

  const totalDue = s.feeCollections.reduce((a, f) => a + Number(f.amountDue), 0);
  const totalPaid = s.feeCollections.reduce((a, f) => a + Number(f.amountPaid), 0);

  return json({
    id: s.id, admissionNo: s.admissionNo, userId: s.userId, status: s.user.status,
    name: p ? `${p.firstName} ${p.lastName}`.trim() : s.user.email,
    firstName: p?.firstName ?? "", lastName: p?.lastName ?? "",
    email: s.user.email, phone: p?.phone ?? null, gender: p?.gender ?? null,
    dateOfBirth: p?.dateOfBirth ?? null, address: p?.address ?? null, avatar: p?.avatar ?? null,
    className: enroll ? `${enroll.section.grade.name} ${enroll.section.name}` : null,
    sectionId: enroll?.sectionId ?? null, rollNo: enroll?.rollNo ?? s.rollNumber ?? null,
    rollNumber: s.rollNumber ?? null, class10Marks: s.class10Marks ?? null, entranceMarks: s.entranceMarks ?? null, stream: s.stream ?? null,
    academicYear: enroll?.academicYear?.name ?? null,
    transportMode: s.transportMode, busRouteId: s.busRouteId,
    busRoute: s.busRoute ? { id: s.busRoute.id, name: s.busRoute.name, fee: Number(s.busRoute.fee), bus: s.busRoute.bus ? { numberPlate: s.busRoute.bus.numberPlate, name: s.busRoute.bus.name } : null } : null,
    attendance: { present, absent, late, total: totalAtt, pct: totalAtt ? Math.round((present / totalAtt) * 100) : 0 },
    fees: {
      totalDue, totalPaid, balance: totalDue - totalPaid,
      items: s.feeCollections.map((f) => ({ id: f.id, type: f.feeType.name, amountDue: Number(f.amountDue), amountPaid: Number(f.amountPaid), status: f.status, dueDate: f.dueDate, paidDate: f.paidDate })),
    },
  }, 200, h);
}

async function allocateStudentSection(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!student) return err("Student not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body?.sectionId) return err("sectionId required", 400, h);
  const error = await allocateSection(id, body.sectionId, body.rollNo ?? null, u.schoolId);
  if (error) return err(error, 400, h);
  return json({ ok: true }, 200, h);
}

// ─── TRANSPORT (buses & routes) ─────────────────────────────────────────────────

async function getBuses(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const buses = await prisma.bus.findMany({
    where: { schoolId: u.schoolId },
    include: { routes: { include: { _count: { select: { students: true } } }, orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return json({
    buses: buses.map((b) => ({
      id: b.id, numberPlate: b.numberPlate, name: b.name, capacity: b.capacity,
      driverName: b.driverName, driverPhone: b.driverPhone,
      routes: b.routes.map((r) => ({
        id: r.id, name: r.name, startPoint: r.startPoint, endPoint: r.endPoint,
        stops: r.stops, fee: Number(r.fee), tripsPerDay: r.tripsPerDay,
        departureTimes: r.departureTimes, studentCount: r._count.students,
      })),
    })),
  }, 200, h);
}

async function getBusRoutes(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const routes = await prisma.busRoute.findMany({
    where: { bus: { schoolId: u.schoolId } },
    include: { bus: { select: { numberPlate: true, name: true, capacity: true } }, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
  return json(routes.map((r) => ({
    id: r.id, name: r.name, startPoint: r.startPoint, endPoint: r.endPoint,
    fee: Number(r.fee), tripsPerDay: r.tripsPerDay,
    busPlate: r.bus.numberPlate, busName: r.bus.name,
    studentCount: r._count.students, capacity: r.bus.capacity,
    seatsRemaining: Math.max(0, r.bus.capacity - r._count.students),
  })), 200, h);
}

async function createBus(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.numberPlate || String(body.numberPlate).trim() === "") return err("Number plate is required", 400, h);
  const bus = await prisma.bus.create({ data: {
    schoolId: u.schoolId, numberPlate: String(body.numberPlate).trim(), name: body.name ?? null,
    capacity: parseInt(String(body.capacity ?? 40), 10) || 40, driverName: body.driverName ?? null, driverPhone: body.driverPhone ?? null,
  } });
  return json(bus, 201, h);
}

async function updateBus(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const bus = await prisma.bus.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!bus) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.bus.update({ where: { id }, data: {
    numberPlate: body?.numberPlate ?? bus.numberPlate, name: body?.name ?? bus.name,
    capacity: body?.capacity !== undefined ? parseInt(String(body.capacity), 10) || bus.capacity : bus.capacity,
    driverName: body?.driverName ?? bus.driverName, driverPhone: body?.driverPhone ?? bus.driverPhone,
  } });
  return json(updated, 200, h);
}

async function deleteBus(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const bus = await prisma.bus.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!bus) return err("Not found", 404, h);
  await prisma.bus.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function createBusRoute(req: Request, h: Headers, busId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const bus = await prisma.bus.findFirst({ where: { id: busId, schoolId: u.schoolId } });
  if (!bus) return err("Bus not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || String(body.name).trim() === "") return err("Route name is required", 400, h);
  const route = await prisma.busRoute.create({ data: {
    busId, name: String(body.name).trim(), startPoint: body.startPoint ?? null, endPoint: body.endPoint ?? null,
    stops: Array.isArray(body.stops) ? body.stops : [], fee: body.fee ?? 0,
    tripsPerDay: parseInt(String(body.tripsPerDay ?? 2), 10) || 2,
    departureTimes: Array.isArray(body.departureTimes) ? body.departureTimes : [],
  } });
  return json(route, 201, h);
}

async function updateBusRoute(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const route = await prisma.busRoute.findFirst({ where: { id, bus: { schoolId: u.schoolId } } });
  if (!route) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.busRoute.update({ where: { id }, data: {
    name: body?.name ?? route.name, startPoint: body?.startPoint ?? route.startPoint, endPoint: body?.endPoint ?? route.endPoint,
    stops: Array.isArray(body?.stops) ? body.stops : route.stops, fee: body?.fee ?? route.fee,
    tripsPerDay: body?.tripsPerDay !== undefined ? parseInt(String(body.tripsPerDay), 10) || route.tripsPerDay : route.tripsPerDay,
    departureTimes: Array.isArray(body?.departureTimes) ? body.departureTimes : route.departureTimes,
  } });
  return json(updated, 200, h);
}

async function deleteBusRoute(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const route = await prisma.busRoute.findFirst({ where: { id, bus: { schoolId: u.schoolId } } });
  if (!route) return err("Not found", 404, h);
  await prisma.busRoute.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Admission → Student enrollment ─────────────────────────────────────────────

async function enrollAdmission(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const adm = await prisma.admission.findFirst({ where: { id, schoolId: u.schoolId }, include: { feeStructure: { include: { installments: true } } } });
  if (!adm) return err("Application not found", 404, h);
  if (adm.status === "ENROLLED") return err("This applicant is already enrolled", 400, h);

  // If a fee structure is assigned, require both pre-admission and admission fees to be marked paid before enrolling.
  if (adm.feeStructureId && (!adm.preAdmissionPaid || !adm.admissionFeePaid)) {
    return err("Pre-admission and admission fees must be marked as paid before enrollment", 400, h);
  }

  const body = await req.json().catch(() => ({}));
  const email = body.email ?? adm.email ?? `${adm.applicationNo.toLowerCase()}@student.local`;

  const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: u.schoolId, email } } });
  if (existing) return err("A user with this email already exists in this school", 400, h);

  const plainPassword = body.password?.trim() || generatePassword(adm.firstName);
  const password = await Bun.password.hash(plainPassword);
  const admissionNo = body.admissionNo ?? `ADM-${Date.now().toString().slice(-6)}`;

  const student = await prisma.student.create({
    data: {
      school: { connect: { id: u.schoolId } }, admissionNo,
      user: { create: { schoolId: u.schoolId, email, password, role: "STUDENT",
        profile: { create: { firstName: adm.firstName, lastName: adm.lastName, phone: adm.phone, gender: adm.gender, dateOfBirth: adm.dateOfBirth, address: adm.address } } } },
    },
  });

  if (body.sectionId) {
    const error = await allocateSection(student.id, body.sectionId, body.rollNo ?? null, u.schoolId);
    if (error) {
      // Roll back the just-created student so the applicant can be retried cleanly.
      await prisma.user.delete({ where: { id: student.userId } });
      return err(error, 400, h);
    }
  }

  // Admission / tuition fee charged at enrollment (NPR) — manual override.
  if (Number(body.feeAmount) > 0) {
    const ft = await tuitionFeeType(u.schoolId);
    await prisma.feeCollection.create({ data: { studentId: student.id, feeTypeId: ft.id, academicYearId: await activeYearId(u.schoolId), amountDue: Number(body.feeAmount), dueDate: body.feeDueDate ? new Date(body.feeDueDate) : new Date(), status: "PENDING", remarks: body.feeRemarks?.trim() || "Admission fee" } });
  }

  // Auto-apply fee structure installments (skip pre-admission and admission which are already paid).
  if (adm.feeStructure && adm.feeStructure.installments.length > 0) {
    const ft = await tuitionFeeType(u.schoolId);
    const ayId = await activeYearId(u.schoolId);
    const PRE_ADM_STAGES = ["pre-admission", "pre_admission", "preadmission", "registration"];
    const ADM_STAGES = ["admission"];
    for (const inst of adm.feeStructure.installments) {
      const stage = (inst.dueStage ?? "").toLowerCase();
      if (PRE_ADM_STAGES.includes(stage) || ADM_STAGES.includes(stage)) continue; // already paid
      const dueDate = inst.dueDay ? (() => { const d = new Date(); d.setDate(inst.dueDay!); return d; })() : new Date();
      await prisma.feeCollection.create({ data: { studentId: student.id, feeTypeId: ft.id, academicYearId: ayId, amountDue: Number(inst.amount), dueDate, status: "PENDING", remarks: inst.label ?? inst.dueStage ?? `Installment #${inst.installmentNo}` } });
    }
  } else if (adm.feeStructure && Number(adm.feeStructure.amount) > 0 && Number(body.feeAmount) === 0) {
    // No installments — charge the base amount if no manual override given.
    const ft = await tuitionFeeType(u.schoolId);
    await prisma.feeCollection.create({ data: { studentId: student.id, feeTypeId: ft.id, academicYearId: await activeYearId(u.schoolId), amountDue: Number(adm.feeStructure.amount), dueDate: new Date(), status: "PENDING", remarks: adm.feeStructure.name } });
  }

  await prisma.admission.update({ where: { id }, data: { status: "ENROLLED" } });
  await prisma.auditLog.create({ data: { school: { connect: { id: u.schoolId } }, action: "admission.enrolled", entityType: "Student", entityId: student.id, metadata: { applicationNo: adm.applicationNo } } });
  const enrollSchool = await prisma.school.findUnique({ where: { id: u.schoolId }, select: { slug: true } });
  return json({
    id: student.id,
    admissionNo: student.admissionNo,
    credentials: { email, password: plainPassword, schoolSlug: enrollSchool?.slug ?? "", role: "student" },
  }, 201, h);
}

// ─── Enhanced Grade/Section ────────────────────────────────────────────────────

async function updateGrade(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const grade = await prisma.grade.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!grade) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.grade.update({ where: { id }, data: {
    name: body?.name ?? grade.name,
    gradeNumber: body?.gradeNumber ?? grade.gradeNumber,
    category: body?.category ?? grade.category,
    stream: body?.stream !== undefined ? body.stream : grade.stream,
    durationYears: body?.durationYears !== undefined ? (body.durationYears ? parseInt(String(body.durationYears), 10) : null) : grade.durationYears,
    departmentId: body?.departmentId !== undefined ? body.departmentId : grade.departmentId,
  } });
  return json(updated, 200, h);
}

async function updateSection(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const sec = await prisma.section.findFirst({ where: { id, grade: { schoolId: u.schoolId } } });
  if (!sec) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.section.update({ where: { id }, data: { name: body?.name ?? sec.name, totalSeats: body?.totalSeats ?? sec.totalSeats, performance: body?.performance ?? sec.performance, roomNo: body?.roomNo ?? sec.roomNo } });
  return json(updated, 200, h);
}

async function updateSection(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const sec = await prisma.section.findFirst({ where: { id, grade: { schoolId: u.schoolId } } });
  if (!sec) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);
  const updated = await prisma.section.update({ where: { id }, data: {
    name: body.name ?? sec.name,
    totalSeats: body.totalSeats !== undefined ? body.totalSeats : sec.totalSeats,
    performance: body.performance ?? sec.performance,
  } });
  await syncOccupied(id);
  return json(updated, 200, h);
}

async function deleteSection(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const sec = await prisma.section.findFirst({ where: { id, grade: { schoolId: u.schoolId } } });
  if (!sec) return err("Not found", 404, h);
  await prisma.section.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function deleteGrade(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const grade = await prisma.grade.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!grade) return err("Not found", 404, h);
  await prisma.grade.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Attendance Range ─────────────────────────────────────────────────────────

async function getAttendanceRange(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");
  const sectionId = url.searchParams.get("sectionId");
  const studentId = url.searchParams.get("studentId");
  if (!fromDate || !toDate) return err("from and to dates required", 400, h);
  const where: any = { section: { grade: { schoolId: u.schoolId } }, date: { gte: new Date(fromDate), lte: new Date(toDate) } };
  if (sectionId) where.sectionId = sectionId;
  if (studentId) where.studentId = studentId;
  const records = await prisma.studentAttendance.findMany({ where, include: { student: { include: { user: { include: { profile: true } } } } }, orderBy: [{ date: "asc" }, { studentId: "asc" }] });
  return json({ records: records.map((r) => ({ ...r, studentName: `${r.student.user.profile?.firstName ?? ""} ${r.student.user.profile?.lastName ?? ""}`.trim() })) }, 200, h);
}

// ─── Fee Types ────────────────────────────────────────────────────────────────

async function getFeeTypes(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const types = await prisma.feeType.findMany({ where: { schoolId: u.schoolId }, orderBy: { name: "asc" } });
  return json(types, 200, h);
}

async function createFeeType(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name required", 400, h);
  const ft = await prisma.feeType.create({ data: { schoolId: u.schoolId, name: body.name, description: body.description ?? null, isRecurring: body.isRecurring ?? true } });
  return json(ft, 201, h);
}

async function createFeeCollection(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.studentId || !body?.feeTypeId || !body?.amountDue || !body?.dueDate) return err("studentId, feeTypeId, amountDue, dueDate required", 400, h);
  const count = await prisma.feeCollection.count({ where: { student: { schoolId: u.schoolId } } });
  const receiptNo = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  const fc = await prisma.feeCollection.create({ data: { studentId: body.studentId, feeTypeId: body.feeTypeId, amountDue: body.amountDue, amountPaid: body.amountPaid ?? 0, dueDate: new Date(body.dueDate), status: body.status ?? "PENDING", remarks: body.remarks ?? null, receiptNo, academicYearId: body.academicYearId ?? null } });
  return json(fc, 201, h);
}

// ─── Public school directory (no auth) ──────────────────────────────────────────
// Used by the "Find your school" page and branded school login. Returns ONLY
// non-sensitive, public-facing fields, and only for live (active/trial) schools.

const PUBLIC_SCHOOL_SELECT = {
  id: true, name: true, slug: true, logo: true,
  address: true, city: true, district: true, province: true,
  schoolType: true, establishedYear: true,
} as const;

const PUBLIC_SCHOOL_STATUSES = ["ACTIVE", "TRIAL"] as any[];

async function getPublicSchools(req: Request, h: Headers, url: URL): Promise<Response> {
  const search = (url.searchParams.get("search") ?? "").trim();
  const where: any = { status: { in: PUBLIC_SCHOOL_STATUSES } };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { district: { contains: search, mode: "insensitive" } },
    ];
  }
  const schools = await prisma.school.findMany({
    where,
    select: PUBLIC_SCHOOL_SELECT,
    orderBy: { name: "asc" },
    take: 60,
  });
  return json({ schools }, 200, h);
}

async function getPublicSchool(req: Request, h: Headers, slug: string): Promise<Response> {
  const school = await prisma.school.findFirst({
    where: { slug, status: { in: PUBLIC_SCHOOL_STATUSES } },
    select: PUBLIC_SCHOOL_SELECT,
  });
  if (!school) return err("School not found", 404, h);
  return json({ school }, 200, h);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ENTERPRISE FEATURE MODULES ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

async function adminOnly(req: Request): Promise<{ id: string; schoolId: string; role: string; email: string } | null> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return null;
  return u;
}

// ─── User Management (admin: list + set password) ────────────────────────────
async function listSchoolUsers(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const url = new URL(req.url);
  const role = url.searchParams.get("role") ?? "";
  const search = url.searchParams.get("search") ?? "";
  const users = await prisma.user.findMany({
    where: {
      schoolId: u.schoolId,
      role: role ? { equals: role.toUpperCase() as any } : { not: "ADMIN" as any },
      ...(search ? { OR: [
        { email: { contains: search, mode: "insensitive" } },
        { profile: { OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ] } },
      ] } : {}),
    },
    include: { profile: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });
  return json(users.map((u) => ({
    id: u.id, email: u.email, role: u.role, status: u.status,
    name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : null,
    createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
  })), 200, h);
}

async function getSchoolUser(req: Request, h: Headers, userId: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      teacher: true,
      staff: { include: { department: true } },
      student: {
        include: {
          enrollments: { include: { section: { include: { grade: true } }, academicYear: true }, orderBy: { enrolledAt: "desc" }, take: 1 },
        },
      },
      parent: { include: { children: { include: { student: { include: { user: { include: { profile: true } } } } } } } },
    },
  });
  if (!user || user.schoolId !== u.schoolId) return err("User not found", 404, h);
  return json({
    id: user.id, email: user.email, role: user.role, status: user.status,
    createdAt: user.createdAt, lastLoginAt: user.lastLoginAt,
    profile: user.profile ? {
      firstName: user.profile.firstName, lastName: user.profile.lastName,
      phone: user.profile.phone, gender: user.profile.gender,
      dateOfBirth: user.profile.dateOfBirth, address: user.profile.address,
    } : null,
    teacher: user.teacher ? {
      employeeId: user.teacher.employeeId, qualification: user.teacher.qualification,
      experience: user.teacher.experience, specialization: user.teacher.specialization,
      joinDate: user.teacher.joinDate,
    } : null,
    staff: user.staff ? {
      employeeId: user.staff.employeeId, designation: user.staff.designation,
      departmentId: user.staff.departmentId, departmentName: user.staff.department?.name ?? null,
      joinDate: user.staff.joinDate, salary: user.staff.salary,
    } : null,
    student: user.student ? {
      admissionNo: user.student.admissionNo, rollNumber: user.student.rollNumber,
      stream: user.student.stream, transportMode: user.student.transportMode,
      currentSection: user.student.enrollments[0]
        ? { sectionId: user.student.enrollments[0].sectionId, sectionName: `${user.student.enrollments[0].section.grade.name} ${user.student.enrollments[0].section.name}` }
        : null,
    } : null,
    parent: user.parent ? {
      occupation: user.parent.occupation,
      children: user.parent.children.map((c) => ({
        studentId: c.studentId, relationship: c.relationship,
        name: c.student.user.profile ? `${c.student.user.profile.firstName} ${c.student.user.profile.lastName}`.trim() : c.student.user.email,
      })),
    } : null,
  }, 200, h);
}

async function updateSchoolUser(req: Request, h: Headers, userId: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { schoolId: true, role: true } });
  if (!user || user.schoolId !== u.schoolId) return err("User not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid body", 400, h);

  await prisma.$transaction(async (tx) => {
    if (body.email) await tx.user.update({ where: { id: userId }, data: { email: body.email } });
    if (body.status) await tx.user.update({ where: { id: userId }, data: { status: body.status } });
    if (body.profile) {
      const existing = await tx.userProfile.findUnique({ where: { userId } });
      if (existing) {
        await tx.userProfile.update({ where: { userId }, data: body.profile });
      } else {
        await tx.userProfile.create({ data: { userId, firstName: "", lastName: "", ...body.profile } });
      }
    }
    if (body.teacher && user.role === "TEACHER") {
      await tx.teacher.update({ where: { userId }, data: {
        qualification: body.teacher.qualification ?? undefined,
        experience: body.teacher.experience !== undefined ? Number(body.teacher.experience) : undefined,
        specialization: body.teacher.specialization ?? undefined,
        employeeId: body.teacher.employeeId ?? undefined,
        joinDate: body.teacher.joinDate ? new Date(body.teacher.joinDate) : undefined,
      }});
    }
    if (body.staff && user.role === "STAFF") {
      await tx.staff.update({ where: { userId }, data: {
        designation: body.staff.designation ?? undefined,
        employeeId: body.staff.employeeId ?? undefined,
        departmentId: body.staff.departmentId || null,
        joinDate: body.staff.joinDate ? new Date(body.staff.joinDate) : undefined,
        salary: body.staff.salary !== undefined ? (body.staff.salary === "" || body.staff.salary === null ? null : Number(body.staff.salary)) : undefined,
      }});
    }
    if (body.student && user.role === "STUDENT") {
      await tx.student.update({ where: { userId }, data: {
        rollNumber: body.student.rollNumber ?? undefined,
        stream: body.student.stream ?? undefined,
        transportMode: body.student.transportMode ?? undefined,
      }});
    }
    if (body.parent && user.role === "PARENT") {
      await tx.parent.update({ where: { userId }, data: { occupation: body.parent.occupation ?? undefined } });
    }
  });
  return json({ ok: true }, 200, h);
}

async function setUserPassword(req: Request, h: Headers, userId: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.password || typeof body.password !== "string" || body.password.length < 6)
    return err("Password must be at least 6 characters", 400, h);
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { schoolId: true, role: true } });
  if (!target || target.schoolId !== u.schoolId) return err("User not found", 404, h);
  const hashed = await Bun.password.hash(body.password);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  await prisma.auditLog.create({ data: {
    school: { connect: { id: u.schoolId } },
    action: "auth.password_set_by_admin",
    entityType: "User", entityId: userId,
    metadata: { setBy: u.id },
  } });
  return json({ ok: true, message: "Password updated successfully" }, 200, h);
}

// ─── Notifications ──────────────────────────────────────────────────────────────
async function getNotifications(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.notification.findMany({ where: { schoolId: u.schoolId }, orderBy: { createdAt: "desc" }, take: 100 });
  return json(list, 200, h);
}
async function createNotification(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.body) return err("title and body required", 400, h);
  const n = await prisma.notification.create({ data: { schoolId: u.schoolId, title: body.title, body: body.body, type: body.type ?? "info", targetRole: body.targetRole ?? null } });
  return json(n, 201, h);
}
async function deleteNotification(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.notification.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

async function getNotificationsForRole(req: Request, h: Headers, role: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.notification.findMany({
    where: { schoolId: u.schoolId, OR: [{ targetRole: null }, { targetRole: role }] },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return json(list, 200, h);
}

// ─── Routine (Timetable) ──────────────────────────────────────────────────────
async function ensureActiveTimetable(schoolId: string): Promise<string | null> {
  const ay = await prisma.academicYear.findFirst({ where: { schoolId, isActive: true } });
  if (!ay) return null;
  let tt = await prisma.timetable.findFirst({ where: { academicYearId: ay.id, isActive: true } });
  if (!tt) tt = await prisma.timetable.create({ data: { academicYearId: ay.id, name: "Default", isActive: true } });
  return tt.id;
}
async function getRoutine(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const slots = await prisma.timetableSlot.findMany({
    where: { section: { grade: { schoolId: u.schoolId } } },
    include: { section: { include: { grade: true } }, subject: true, teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
  });
  return json(slots.map((s) => ({
    id: s.id, sectionId: s.sectionId, subjectId: s.subjectId, teacherId: s.teacherId,
    sectionName: `${s.section.grade.name} ${s.section.name}`,
    subjectName: s.subject.name,
    teacherName: s.teacher?.user.profile ? `${s.teacher.user.profile.firstName} ${s.teacher.user.profile.lastName}`.trim() : (s.teacher ? s.teacher.user.email : null),
    dayOfWeek: s.dayOfWeek, periodNumber: s.periodNumber, startTime: s.startTime, endTime: s.endTime, roomNo: s.roomNo,
    shift: s.shift, materials: s.materials,
  })), 200, h);
}
async function createRoutineSlot(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || (u.role !== "admin" && u.role !== "teacher")) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.sectionId || !body?.subjectId || body?.dayOfWeek === undefined || body?.periodNumber === undefined || !body?.startTime || !body?.endTime)
    return err("sectionId, subjectId, dayOfWeek, periodNumber, startTime, endTime required", 400, h);
  const timetableId = await ensureActiveTimetable(u.schoolId);
  if (!timetableId) return err("No active academic year. Create one first.", 400, h);
  try {
    const slot = await prisma.timetableSlot.create({ data: {
      timetableId, sectionId: body.sectionId, subjectId: body.subjectId, teacherId: body.teacherId || null,
      dayOfWeek: Number(body.dayOfWeek), periodNumber: Number(body.periodNumber), startTime: body.startTime, endTime: body.endTime, roomNo: body.roomNo || null,
      shift: body.shift === "MORNING" ? "MORNING" : "DAY", materials: body.materials?.trim() || null,
    } });
    return json(slot, 201, h);
  } catch (e: any) {
    if (e?.code === "P2002") return err("A period already exists for this section/day/period.", 400, h);
    return err("Failed to create slot", 400, h);
  }
}
async function deleteRoutineSlot(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || (u.role !== "admin" && u.role !== "teacher")) return err("Unauthorized", 401, h);
  const slot = await prisma.timetableSlot.findFirst({ where: { id, section: { grade: { schoolId: u.schoolId } } } });
  if (!slot) return err("Not found", 404, h);
  await prisma.timetableSlot.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Schedule Manager (Staff) ─────────────────────────────────────────────────

async function authScheduleManager(req: Request): Promise<{ id: string; schoolId: string; role: string } | null> {
  try {
    const u = await authSchool(req);
    if (!u) return null;
    if (u.role === "admin") return u; // admin always allowed
    if (u.role !== "staff") return null;
    const staff = await prisma.staff.findFirst({ where: { userId: u.id } });
    if (!staff) return null;
    const desig = staff.designation?.toLowerCase() ?? "";
    if (!desig.includes("schedule")) return null;
    return u;
  } catch {
    return null;
  }
}

async function getScheduleResources(req: Request, h: Headers): Promise<Response> {
  const u = await authScheduleManager(req);
  if (!u) return err("Unauthorized — Schedule Manager role required", 403, h);
  const [grades, subjects, teachers] = await Promise.all([
    prisma.grade.findMany({
      where: { schoolId: u.schoolId },
      include: { sections: true },
      orderBy: { gradeNumber: "asc" },
    }),
    prisma.subject.findMany({ where: { schoolId: u.schoolId }, orderBy: { name: "asc" } }),
    prisma.teacher.findMany({
      where: { user: { schoolId: u.schoolId } },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const teacherName = (t: any) => t.user.profile
    ? `${t.user.profile.firstName} ${t.user.profile.lastName}`.trim()
    : t.user.email;
  return json({
    sections: grades.flatMap((g) => g.sections.map((s) => ({
      id: s.id, name: `${g.name} — Section ${s.name}`, gradeName: g.name, sectionName: s.name, gradeId: g.id,
    }))),
    subjects: subjects.map((s) => ({ id: s.id, name: s.name, code: s.code, isElective: s.isElective })),
    teachers: teachers.map((t) => ({ id: t.id, name: teacherName(t) })),
  }, 200, h);
}

async function getScheduleSlots(req: Request, h: Headers): Promise<Response> {
  const u = await authScheduleManager(req);
  if (!u) return err("Unauthorized", 403, h);
  const slots = await prisma.timetableSlot.findMany({
    where: { section: { grade: { schoolId: u.schoolId } } },
    include: { section: { include: { grade: true } }, subject: true, teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
  });
  const teacherName = (t: any) => t.user.profile
    ? `${t.user.profile.firstName} ${t.user.profile.lastName}`.trim()
    : t.user.email;
  return json(slots.map((s) => ({
    id: s.id, sectionId: s.sectionId, subjectId: s.subjectId, teacherId: s.teacherId,
    sectionName: `${s.section.grade.name} — Section ${s.section.name}`,
    gradeName: s.section.grade.name, gradeId: s.section.gradeId,
    subjectName: s.subject.name, subjectCode: s.subject.code,
    teacherName: s.teacher ? teacherName(s.teacher) : null,
    dayOfWeek: s.dayOfWeek, periodNumber: s.periodNumber,
    startTime: s.startTime, endTime: s.endTime,
    shift: s.shift, roomNo: s.roomNo,
  })), 200, h);
}

async function createScheduleSlot(req: Request, h: Headers): Promise<Response> {
  const u = await authScheduleManager(req);
  if (!u) return err("Unauthorized", 403, h);
  const body = await req.json().catch(() => null);
  if (!body?.sectionId || !body?.subjectId || body?.dayOfWeek === undefined || body?.periodNumber === undefined || !body?.startTime || !body?.endTime)
    return err("sectionId, subjectId, dayOfWeek, periodNumber, startTime, endTime required", 400, h);
  const timetableId = await ensureActiveTimetable(u.schoolId);
  if (!timetableId) return err("No active academic year. Ask the admin to create one first.", 400, h);
  try {
    const slot = await prisma.timetableSlot.create({ data: {
      timetableId, sectionId: body.sectionId, subjectId: body.subjectId,
      teacherId: body.teacherId || null,
      dayOfWeek: Number(body.dayOfWeek), periodNumber: Number(body.periodNumber),
      startTime: body.startTime, endTime: body.endTime,
      roomNo: body.roomNo || null,
      shift: body.shift === "MORNING" ? "MORNING" : "DAY",
    }});
    return json(slot, 201, h);
  } catch (e: any) {
    if (e?.code === "P2002") return err("A slot already exists for this section/day/period/shift.", 409, h);
    return err("Failed to create slot", 400, h);
  }
}

async function deleteScheduleSlot(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authScheduleManager(req);
  if (!u) return err("Unauthorized", 403, h);
  const slot = await prisma.timetableSlot.findFirst({ where: { id, section: { grade: { schoolId: u.schoolId } } } });
  if (!slot) return err("Not found", 404, h);
  await prisma.timetableSlot.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Duty Roster (Schedule Manager) ──────────────────────────────────────────
// Uses a simple JSON column on a DutySlot model — but since we don't want a
// migration, we store duties as TimetableSlot rows with a special subjectId
// sentinel OR we use a separate in-memory/JSON approach. Instead we'll just
// keep a lightweight duties table backed by a JSON file per school.
// Actually: store duties as a special timetable slot where subjectId = null
// and we use the `materials` field as JSON metadata (type, description).
// No schema migration needed.

async function getDutySlots(req: Request, h: Headers): Promise<Response> {
  const u = await authScheduleManager(req);
  if (!u) return err("Unauthorized — Schedule Manager role required", 403, h);
  // Duties are stored as timetable slots whose subject has code "__duty__"
  const dutySubject = await prisma.subject.findFirst({ where: { schoolId: u.schoolId, code: "__duty__" } });
  if (!dutySubject) return json([], 200, h);
  const duties = await prisma.timetableSlot.findMany({
    where: { subjectId: dutySubject.id, section: { grade: { schoolId: u.schoolId } } },
    include: { teacher: { include: { user: { include: { profile: true } } } }, section: { include: { grade: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
  });
  const teacherName = (t: any) => t?.user?.profile
    ? `${t.user.profile.firstName} ${t.user.profile.lastName}`.trim()
    : t?.user?.email ?? null;
  return json(duties.map((d) => {
    let meta: any = {};
    try { meta = JSON.parse(d.materials ?? "{}"); } catch { /**/ }
    return {
      id: d.id, dayOfWeek: d.dayOfWeek, periodNumber: d.periodNumber,
      startTime: d.startTime, endTime: d.endTime, shift: d.shift,
      teacherId: d.teacherId, teacherName: d.teacher ? teacherName(d.teacher) : null,
      roomNo: d.roomNo, dutyType: meta.dutyType ?? "General Duty", description: meta.description ?? "",
    };
  }), 200, h);
}

async function createDutySlot(req: Request, h: Headers): Promise<Response> {
  const u = await authScheduleManager(req);
  if (!u) return err("Unauthorized — Schedule Manager role required", 403, h);
  const body = await req.json().catch(() => null);
  if (!body?.dayOfWeek === undefined || !body?.startTime || !body?.dutyType)
    return err("dayOfWeek, startTime, dutyType required", 400, h);
  // Ensure sentinel subject exists
  let dutySubject = await prisma.subject.findFirst({ where: { schoolId: u.schoolId, code: "__duty__" } });
  if (!dutySubject) dutySubject = await prisma.subject.create({ data: { schoolId: u.schoolId, name: "Duty / Supervision", code: "__duty__", creditHours: 0 } });
  // Need a section to attach the slot — use first section of school
  let section = await prisma.section.findFirst({ where: { grade: { schoolId: u.schoolId } } });
  if (!section) return err("No classes/sections found. Create a class first.", 400, h);
  const timetableId = await ensureActiveTimetable(u.schoolId);
  if (!timetableId) return err("No active academic year. Ask admin to create one.", 400, h);
  try {
    const slot = await prisma.timetableSlot.create({ data: {
      timetableId, sectionId: section.id, subjectId: dutySubject.id,
      teacherId: body.teacherId || null,
      dayOfWeek: Number(body.dayOfWeek), periodNumber: Number(body.periodNumber ?? 0),
      startTime: body.startTime, endTime: body.endTime ?? body.startTime,
      roomNo: body.roomNo || null, shift: body.shift === "MORNING" ? "MORNING" : "DAY",
      materials: JSON.stringify({ dutyType: body.dutyType, description: body.description ?? "" }),
    }});
    return json(slot, 201, h);
  } catch (e: any) {
    if (e?.code === "P2002") return err("Duplicate duty slot.", 409, h);
    return err("Failed to create duty slot", 400, h);
  }
}

async function deleteDutySlot(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authScheduleManager(req);
  if (!u) return err("Unauthorized", 403, h);
  await prisma.timetableSlot.deleteMany({ where: { id, section: { grade: { schoolId: u.schoolId } } } });
  return json({ ok: true }, 200, h);
}

// ─── DI — Discipline In-charge ────────────────────────────────────────────────

async function authDI(req: Request): Promise<{ id: string; schoolId: string; role: string } | null> {
  try {
    const u = await authSchool(req);
    if (!u) return null;
    if (u.role === "admin") return u;
    if (u.role !== "staff") return null;
    const staff = await prisma.staff.findFirst({ where: { userId: u.id } });
    if (!staff) return null;
    const desig = staff.designation?.toLowerCase() ?? "";
    if (!desig.includes("di") && desig !== "di") return null;
    return u;
  } catch { return null; }
}

async function getDisciplineRecords(req: Request, h: Headers, url: URL): Promise<Response> {
  try {
    const u = await authDI(req);
    if (!u) return err("Unauthorized — DI role required", 403, h);
    const studentId = url.searchParams.get("studentId") ?? undefined;
    const where: any = { schoolId: u.schoolId };
    if (studentId) where.studentId = studentId;
    const records = await prisma.disciplineRecord.findMany({
      where,
      include: {
        student: { include: { user: { include: { profile: true } }, enrollments: { where: { status: "ACTIVE" }, include: { section: { include: { grade: true } } }, take: 1 } } },
        reportedBy: { include: { profile: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const name = (p: any) => p ? `${p.firstName} ${p.lastName}`.trim() : null;
    return json(records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: name(r.student.user.profile) ?? r.student.user.email,
      studentAdmissionNo: r.student.admissionNo,
      className: r.student.enrollments[0]
        ? `${r.student.enrollments[0].section.grade.name} — ${r.student.enrollments[0].section.name}`
        : null,
      reportedBy: name(r.reportedBy.profile) ?? r.reportedBy.email,
      category: r.category,
      description: r.description,
      severity: r.severity,
      actionTaken: r.actionTaken,
      parentNotified: r.parentNotified,
      createdAt: r.createdAt,
    })), 200, h);
  } catch (e) {
    console.error("getDisciplineRecords error:", e);
    return err(`Server error: ${String(e)}`, 500, h);
  }
}

async function createDisciplineRecord(req: Request, h: Headers): Promise<Response> {
  const u = await authDI(req);
  if (!u) return err("Unauthorized — DI role required", 403, h);
  const body = await req.json().catch(() => null);
  if (!body?.studentId || !body?.category || !body?.description)
    return err("studentId, category, description required", 400, h);
  const validCategories = ["NAILS","HAIR","UNIFORM","ID_CARD","MOBILE_PHONE","PUNCTUALITY","BEHAVIOR","CLEANLINESS","OTHER"];
  if (!validCategories.includes(body.category)) return err("Invalid category", 400, h);
  const student = await prisma.student.findFirst({ where: { id: body.studentId, schoolId: u.schoolId } });
  if (!student) return err("Student not found", 404, h);
  const record = await prisma.disciplineRecord.create({
    data: {
      schoolId: u.schoolId,
      studentId: body.studentId,
      reportedById: u.id,
      category: body.category,
      description: body.description,
      severity: ["MINOR","MODERATE","SERIOUS"].includes(body.severity) ? body.severity : "MINOR",
      actionTaken: body.actionTaken || null,
      parentNotified: false,
    },
  });
  return json(record, 201, h);
}

async function updateDisciplineRecord(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authDI(req);
  if (!u) return err("Unauthorized — DI role required", 403, h);
  const body = await req.json().catch(() => null);
  const existing = await prisma.disciplineRecord.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Record not found", 404, h);
  const updated = await prisma.disciplineRecord.update({
    where: { id },
    data: {
      actionTaken: body?.actionTaken ?? existing.actionTaken,
      parentNotified: body?.parentNotified ?? existing.parentNotified,
      severity: body?.severity ?? existing.severity,
    },
  });
  return json(updated, 200, h);
}

async function deleteDisciplineRecord(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authDI(req);
  if (!u) return err("Unauthorized — DI role required", 403, h);
  await prisma.disciplineRecord.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

async function getDIStudents(req: Request, h: Headers, url: URL): Promise<Response> {
  try {
    const u = await authDI(req);
    if (!u) return err("Unauthorized — DI role required", 403, h);
    const search = url.searchParams.get("search") ?? "";
    const students = await prisma.student.findMany({
      where: {
        schoolId: u.schoolId,
        ...(search ? {
          OR: [
            { admissionNo: { contains: search, mode: "insensitive" } },
            { user: { profile: { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }] } } },
          ],
        } : {}),
      },
      include: {
        user: { include: { profile: true } },
        enrollments: { where: { status: "ACTIVE" }, include: { section: { include: { grade: true } } }, take: 1 },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    const name = (p: any) => p ? `${p.firstName} ${p.lastName}`.trim() : null;
    return json(students.map((s) => ({
      id: s.id,
      name: name(s.user.profile) ?? s.user.email,
      admissionNo: s.admissionNo,
      className: s.enrollments[0]
        ? `${s.enrollments[0].section.grade.name} — ${s.enrollments[0].section.name}`
        : null,
      avatar: s.user.profile?.avatar ?? null,
    })), 200, h);
  } catch (e) {
    console.error("getDIStudents error:", e);
    return err(`Server error: ${String(e)}`, 500, h);
  }
}

// Shared slot → JSON shape for the portal routine endpoints (includes section name).
function routineSlotJson(s: any) {
  return {
    id: s.id, sectionId: s.sectionId, subjectId: s.subjectId, teacherId: s.teacherId,
    sectionName: s.section?.grade ? `${s.section.grade.name} ${s.section.name}` : s.section?.name ?? null,
    subjectName: s.subject?.name ?? null,
    teacherName: s.teacher?.user?.profile ? `${s.teacher.user.profile.firstName} ${s.teacher.user.profile.lastName}`.trim() : s.teacher?.user?.email ?? null,
    dayOfWeek: s.dayOfWeek, periodNumber: s.periodNumber, startTime: s.startTime, endTime: s.endTime,
    roomNo: s.roomNo, shift: s.shift, materials: s.materials,
  };
}

// Student sees their own section's routine.
async function studentRoutine(req: Request, h: Headers): Promise<Response> {
  try {
    const u = await authSchool(req);
    if (!u || u.role !== "student") return err("Unauthorized", 401, h);
    const student = await prisma.student.findFirst({ where: { userId: u.id } });
    if (!student) return json({ slots: [], enrolled: false, reason: "no_profile" }, 200, h);
    const enrollment = await prisma.studentEnrollment.findFirst({ where: { studentId: student.id, status: "ACTIVE" }, orderBy: { enrolledAt: "desc" } });
    if (!enrollment) return json({ slots: [], enrolled: false, reason: "no_enrollment" }, 200, h);
    const activeTt = await prisma.timetable.findFirst({ where: { academicYear: { schoolId: u.schoolId, isActive: true }, isActive: true } });
    const slots = await prisma.timetableSlot.findMany({
      where: { sectionId: enrollment.sectionId, ...(activeTt ? { timetableId: activeTt.id } : {}) },
      include: { section: { include: { grade: true } }, subject: true, teacher: { include: { user: { include: { profile: true } } } } },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    });
    return json({ slots: slots.map(routineSlotJson), enrolled: true, reason: null, sectionName: enrollment.section?.grade ? `${enrollment.section.grade.name} ${enrollment.section.name}` : null, className: enrollment.className }, 200, h);
  } catch (e) {
    console.error("studentRoutine error:", e);
    return json({ slots: [], enrolled: false, reason: "error" }, 200, h);
  }
}

// Parent sees a chosen child's section routine (validates the child belongs to this parent).
async function parentRoutine(req: Request, h: Headers, url: URL): Promise<Response> {
  try {
    const u = await authSchool(req);
    if (!u || u.role !== "parent") return err("Unauthorized", 401, h);
    const parent = await prisma.parent.findFirst({ where: { userId: u.id }, include: { children: true } });
    if (!parent) return err("Parent profile not found", 404, h);
    const childId = url.searchParams.get("childId");
    const link = childId ? parent.children.find((c) => c.studentId === childId) : parent.children[0];
    if (!link) return json([], 200, h);
    const enrollment = await prisma.studentEnrollment.findFirst({ where: { studentId: link.studentId, status: "ACTIVE" }, orderBy: { enrolledAt: "desc" } });
    if (!enrollment) return json([], 200, h);
    const activeTt = await prisma.timetable.findFirst({ where: { academicYear: { schoolId: u.schoolId, isActive: true }, isActive: true } });
    const slots = await prisma.timetableSlot.findMany({
      where: { sectionId: enrollment.sectionId, ...(activeTt ? { timetableId: activeTt.id } : {}) },
      include: { section: { include: { grade: true } }, subject: true, teacher: { include: { user: { include: { profile: true } } } } },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    });
    return json(slots.map(routineSlotJson), 200, h);
  } catch (e) {
    console.error("parentRoutine error:", e);
    return json([], 200, h);
  }
}

// Teacher sees their own periods across all sections.
async function teacherRoutine(req: Request, h: Headers): Promise<Response> {
  try {
    const u = await authSchool(req);
    if (!u || u.role !== "teacher") return err("Unauthorized", 401, h);
    const teacher = await prisma.teacher.findFirst({ where: { userId: u.id } });
    if (!teacher) return err("Teacher profile not found", 404, h);
    const activeTt = await prisma.timetable.findFirst({ where: { academicYear: { schoolId: u.schoolId, isActive: true }, isActive: true } });
    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId: teacher.id, ...(activeTt ? { timetableId: activeTt.id } : {}) },
      include: { section: { include: { grade: true } }, subject: true, teacher: { include: { user: { include: { profile: true } } } } },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    });
    return json(slots.map(routineSlotJson), 200, h);
  } catch (e) {
    console.error("teacherRoutine error:", e);
    return json([], 200, h);
  }
}

// ─── Fee Structures / Installment plans ─────────────────────────────────────────
async function getFeeStructures(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const level = url.searchParams.get("level");
  const stream = url.searchParams.get("stream");
  const category = url.searchParams.get("category");
  const list = await prisma.feeStructure.findMany({
    where: {
      schoolId: u.schoolId,
      ...(level !== null && level !== "" ? { level: Number(level) } : {}),
      ...(stream ? { stream } : {}),
      ...(category ? { category: category as any } : {}),
    },
    include: { feeType: true, grade: true, installments: { orderBy: { installmentNo: "asc" } } },
    orderBy: [{ level: "asc" }, { category: "asc" }],
  });
  return json(list, 200, h);
}
async function createFeeStructure(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Only admin can create fee structures", 403, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.category || body?.amount === undefined || body?.amount === null)
    return err("name, category and amount are required", 400, h);
  if (Number.isNaN(Number(body.amount)) || Number(body.amount) < 0) return err("amount must be a positive number", 400, h);
  const installments = Array.isArray(body.installments) ? body.installments.filter((i: any) => i && i.amount !== undefined) : [];
  const structure = await prisma.feeStructure.create({
    data: {
      schoolId: u.schoolId,
      name: body.name,
      category: body.category,
      level: body.level !== undefined && body.level !== null && body.level !== "" ? Number(body.level) : null,
      stream: body.stream?.trim() || null,
      gradeId: body.gradeId || null,
      academicYearId: body.academicYearId || (await activeYearId(u.schoolId)),
      amount: Number(body.amount),
      dueDay: body.dueDay !== undefined && body.dueDay !== null && body.dueDay !== "" ? Number(body.dueDay) : null,
      isRecurring: !!body.isRecurring,
      installments: installments.length ? { create: installments.map((i: any, idx: number) => ({
        installmentNo: i.installmentNo ?? idx + 1,
        label: i.label?.trim() || null,
        dueStage: i.dueStage?.trim() || null,
        amount: Number(i.amount),
        dueDay: i.dueDay !== undefined && i.dueDay !== null && i.dueDay !== "" ? Number(i.dueDay) : null,
      })) } : undefined,
    },
    include: { installments: { orderBy: { installmentNo: "asc" } } },
  });
  return json(structure, 201, h);
}
async function updateFeeStructure(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Only admin can edit fee structures", 403, h);
  const existing = await prisma.feeStructure.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Fee structure not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);
  // Replace installments wholesale when provided.
  if (Array.isArray(body.installments)) {
    await prisma.feeInstallment.deleteMany({ where: { feeStructureId: id } });
  }
  const updated = await prisma.feeStructure.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      category: body.category ?? existing.category,
      level: body.level !== undefined ? (body.level === null || body.level === "" ? null : Number(body.level)) : existing.level,
      stream: body.stream !== undefined ? (body.stream?.trim() || null) : existing.stream,
      gradeId: body.gradeId !== undefined ? (body.gradeId || null) : existing.gradeId,
      amount: body.amount !== undefined ? Number(body.amount) : existing.amount,
      dueDay: body.dueDay !== undefined ? (body.dueDay === null || body.dueDay === "" ? null : Number(body.dueDay)) : existing.dueDay,
      isRecurring: body.isRecurring !== undefined ? !!body.isRecurring : existing.isRecurring,
      ...(Array.isArray(body.installments) ? { installments: { create: body.installments.filter((i: any) => i && i.amount !== undefined).map((i: any, idx: number) => ({
        installmentNo: i.installmentNo ?? idx + 1,
        label: i.label?.trim() || null,
        dueStage: i.dueStage?.trim() || null,
        amount: Number(i.amount),
        dueDay: i.dueDay !== undefined && i.dueDay !== null && i.dueDay !== "" ? Number(i.dueDay) : null,
      })) } } : {}),
    },
    include: { installments: { orderBy: { installmentNo: "asc" } } },
  });
  return json(updated, 200, h);
}
async function deleteFeeStructure(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "admin") return err("Only admin can delete fee structures", 403, h);
  const existing = await prisma.feeStructure.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Fee structure not found", 404, h);
  await prisma.feeStructure.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Homework (Assignments oversight) ───────────────────────────────────────────
async function getHomework(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.assignment.findMany({
    where: { teacher: { user: { schoolId: u.schoolId } } },
    include: { teacher: { include: { user: { include: { profile: true } } } }, _count: { select: { submissions: true } } },
    orderBy: { dueDate: "desc" },
  });
  return json(list.map((a) => ({
    id: a.id, title: a.title, description: a.description, dueDate: a.dueDate, maxMarks: a.maxMarks,
    teacherId: a.teacherId,
    teacherName: a.teacher.user.profile ? `${a.teacher.user.profile.firstName} ${a.teacher.user.profile.lastName}`.trim() : a.teacher.user.email,
    submissionCount: a._count.submissions, createdAt: a.createdAt,
  })), 200, h);
}
async function createHomework(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.dueDate || !body?.teacherId) return err("title, dueDate, teacherId required", 400, h);
  const teacher = await prisma.teacher.findFirst({ where: { id: body.teacherId, user: { schoolId: u.schoolId } } });
  if (!teacher) return err("Teacher not found", 404, h);
  const a = await prisma.assignment.create({ data: {
    teacherId: body.teacherId, sectionId: body.sectionId || null, subjectId: body.subjectId || null,
    title: body.title, description: body.description || null, dueDate: new Date(body.dueDate), maxMarks: body.maxMarks ? Number(body.maxMarks) : null,
  } });
  return json(a, 201, h);
}
async function deleteHomework(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const a = await prisma.assignment.findFirst({ where: { id, teacher: { user: { schoolId: u.schoolId } } } });
  if (!a) return err("Not found", 404, h);
  await prisma.assignment.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Chat (Messages) ────────────────────────────────────────────────────────────
async function getSchoolUsers(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const users = await prisma.user.findMany({ where: { schoolId: u.schoolId, id: { not: u.id } }, include: { profile: true }, orderBy: { createdAt: "desc" } });
  return json(users.map((x) => ({
    id: x.id, email: x.email, role: x.role.toLowerCase(),
    name: x.profile ? `${x.profile.firstName} ${x.profile.lastName}`.trim() : x.email.split("@")[0],
  })), 200, h);
}
async function getMessages(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const withUser = url.searchParams.get("with");
  if (withUser) {
    const msgs = await prisma.message.findMany({
      where: { OR: [{ senderId: u.id, recipientId: withUser }, { senderId: withUser, recipientId: u.id }] },
      orderBy: { createdAt: "asc" }, take: 200,
    });
    await prisma.message.updateMany({ where: { senderId: withUser, recipientId: u.id, readAt: null }, data: { readAt: new Date() } });
    return json(msgs.map((m) => ({ id: m.id, content: m.content, senderId: m.senderId, recipientId: m.recipientId, mine: m.senderId === u.id, createdAt: m.createdAt })), 200, h);
  }
  // conversation list: latest message per counterpart
  const all = await prisma.message.findMany({
    where: { OR: [{ senderId: u.id }, { recipientId: u.id }] },
    include: { sender: { include: { profile: true } }, recipient: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
  });
  const seen = new Set<string>();
  const convos: any[] = [];
  for (const m of all) {
    const other = m.senderId === u.id ? m.recipient : m.sender;
    if (seen.has(other.id)) continue;
    seen.add(other.id);
    const unread = await prisma.message.count({ where: { senderId: other.id, recipientId: u.id, readAt: null } });
    convos.push({
      userId: other.id,
      name: other.profile ? `${other.profile.firstName} ${other.profile.lastName}`.trim() : other.email.split("@")[0],
      role: other.role.toLowerCase(), lastMessage: m.content, lastAt: m.createdAt, unread,
    });
  }
  return json(convos, 200, h);
}
async function sendMessage(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.recipientId || !body?.content?.trim()) return err("recipientId and content required", 400, h);
  const recipient = await prisma.user.findFirst({ where: { id: body.recipientId, schoolId: u.schoolId } });
  if (!recipient) return err("Recipient not found", 404, h);
  const m = await prisma.message.create({ data: { senderId: u.id, recipientId: body.recipientId, content: body.content.trim(), subject: body.subject || null } });
  return json(m, 201, h);
}

// ─── Inventory ──────────────────────────────────────────────────────────────────
async function getInventory(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const items = await prisma.inventory.findMany({ where: { schoolId: u.schoolId }, orderBy: { createdAt: "desc" } });
  return json(items, 200, h);
}
async function createInventory(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name required", 400, h);
  const item = await prisma.inventory.create({ data: {
    schoolId: u.schoolId, name: body.name, category: body.category ?? "STATIONERY", quantity: Number(body.quantity ?? 0),
    unit: body.unit ?? "pcs", condition: body.condition ?? "GOOD", location: body.location || null,
    unitPrice: body.unitPrice != null && body.unitPrice !== "" ? Number(body.unitPrice) : null,
    purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
  } });
  return json(item, 201, h);
}
async function updateInventory(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const existing = await prisma.inventory.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const item = await prisma.inventory.update({ where: { id }, data: {
    name: body.name, category: body.category, quantity: body.quantity != null ? Number(body.quantity) : undefined,
    unit: body.unit, condition: body.condition, location: body.location,
    unitPrice: body.unitPrice != null && body.unitPrice !== "" ? Number(body.unitPrice) : undefined,
  } });
  return json(item, 200, h);
}
async function deleteInventory(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.inventory.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Payroll ──────────────────────────────────────────────────────────────────
async function getPayroll(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.payroll.findMany({
    where: { staff: { schoolId: u.schoolId } },
    include: { staff: { include: { user: { include: { profile: true } } } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return json(list.map((p) => ({
    id: p.id, staffId: p.staffId, month: p.month, year: p.year,
    staffName: p.staff.user.profile ? `${p.staff.user.profile.firstName} ${p.staff.user.profile.lastName}`.trim() : p.staff.user.email,
    designation: p.staff.designation,
    basicSalary: Number(p.basicSalary), allowances: Number(p.allowances), deductions: Number(p.deductions), netPay: Number(p.netPay),
    status: p.status, paidAt: p.paidAt,
  })), 200, h);
}
async function createPayroll(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.staffId || body?.month === undefined || body?.year === undefined) return err("staffId, month, year required", 400, h);
  const staff = await prisma.staff.findFirst({ where: { id: body.staffId, schoolId: u.schoolId } });
  if (!staff) return err("Staff not found", 404, h);
  const basic = Number(body.basicSalary ?? staff.salary ?? 0);
  const allowances = Number(body.allowances ?? 0);
  const deductions = Number(body.deductions ?? 0);
  try {
    const p = await prisma.payroll.create({ data: {
      staffId: body.staffId, month: Number(body.month), year: Number(body.year),
      basicSalary: basic, allowances, deductions, netPay: basic + allowances - deductions, status: "PENDING",
    } });
    return json(p, 201, h);
  } catch (e: any) {
    if (e?.code === "P2002") return err("Payroll for this staff/month/year already exists.", 400, h);
    return err("Failed to create payroll", 400, h);
  }
}
async function updatePayroll(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const existing = await prisma.payroll.findFirst({ where: { id, staff: { schoolId: u.schoolId } } });
  if (!existing) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const data: any = {};
  if (body.status) { data.status = body.status; if (body.status === "PAID") data.paidAt = new Date(); }
  if (body.allowances != null || body.deductions != null || body.basicSalary != null) {
    const basic = Number(body.basicSalary ?? existing.basicSalary);
    const allowances = Number(body.allowances ?? existing.allowances);
    const deductions = Number(body.deductions ?? existing.deductions);
    data.basicSalary = basic; data.allowances = allowances; data.deductions = deductions; data.netPay = basic + allowances - deductions;
  }
  const p = await prisma.payroll.update({ where: { id }, data });
  return json(p, 200, h);
}
async function deletePayroll(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.payroll.deleteMany({ where: { id, staff: { schoolId: u.schoolId } } });
  return json({ ok: true }, 200, h);
}

// ─── Teacher Payroll ──────────────────────────────────────────────────────────
async function getTeacherPayroll(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const teacherId = url.searchParams.get("teacherId");
  const list = await prisma.teacherPayroll.findMany({
    where: { ...(teacherId ? { teacherId } : {}), teacher: { user: { schoolId: u.schoolId } } },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return json(list.map((p) => {
    const prof = p.teacher.user.profile;
    return {
      id: p.id, teacherId: p.teacherId,
      teacherName: prof ? `${prof.firstName} ${prof.lastName}`.trim() : p.teacher.user.email,
      month: p.month, year: p.year,
      basicSalary: Number(p.basicSalary), allowances: Number(p.allowances), deductions: Number(p.deductions),
      netPay: Number(p.netPay), status: p.status, paidAt: p.paidAt,
    };
  }), 200, h);
}
async function createTeacherPayroll(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.teacherId || body?.month === undefined || body?.year === undefined) return err("teacherId, month, year required", 400, h);
  const teacher = await prisma.teacher.findFirst({ where: { id: body.teacherId, user: { schoolId: u.schoolId } } });
  if (!teacher) return err("Teacher not found", 404, h);
  const basic = Number(body.basicSalary ?? teacher.salary ?? 0);
  const allow = Number(body.allowances ?? teacher.allowances ?? 0);
  const deduct = Number(body.deductions ?? teacher.deductions ?? 0);
  try {
    const p = await prisma.teacherPayroll.create({ data: {
      teacherId: body.teacherId, month: Number(body.month), year: Number(body.year),
      basicSalary: basic, allowances: allow, deductions: deduct, netPay: basic + allow - deduct,
    }});
    return json(p, 201, h);
  } catch (e: any) {
    if (e?.code === "P2002") return err("Payroll for this teacher/month/year already exists.", 400, h);
    return err("Failed to create payroll", 400, h);
  }
}
async function updateTeacherPayroll(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const existing = await prisma.teacherPayroll.findFirst({ where: { id, teacher: { user: { schoolId: u.schoolId } } } });
  if (!existing) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const data: any = {};
  if (body?.status) data.status = body.status;
  if (body?.status === "PAID") data.paidAt = new Date();
  if (body?.basicSalary !== undefined || body?.allowances !== undefined || body?.deductions !== undefined) {
    const bs = Number(body?.basicSalary ?? existing.basicSalary);
    const al = Number(body?.allowances ?? existing.allowances);
    const de = Number(body?.deductions ?? existing.deductions);
    data.basicSalary = bs; data.allowances = al; data.deductions = de; data.netPay = bs + al - de;
  }
  const p = await prisma.teacherPayroll.update({ where: { id }, data });
  return json(p, 200, h);
}
async function deleteTeacherPayroll(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.teacherPayroll.deleteMany({ where: { id, teacher: { user: { schoolId: u.schoolId } } } });
  return json({ ok: true }, 200, h);
}

// ─── Leave Notes ────────────────────────────────────────────────────────────────
async function getLeaves(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.leaveApplication.findMany({ where: { schoolId: u.schoolId }, orderBy: { createdAt: "desc" } });
  return json(list, 200, h);
}
async function createLeave(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.fromDate || !body?.toDate || !body?.reason) return err("fromDate, toDate, reason required", 400, h);
  const profile = await prisma.userProfile.findUnique({ where: { userId: u.id } });
  const name = body.applicantName || (profile ? `${profile.firstName} ${profile.lastName}`.trim() : u.email.split("@")[0]);
  const l = await prisma.leaveApplication.create({ data: {
    schoolId: u.schoolId, userId: u.id, applicantRole: u.role.toUpperCase() as any, applicantName: name,
    type: body.type ?? "OTHER", fromDate: new Date(body.fromDate), toDate: new Date(body.toDate), reason: body.reason,
  } });
  return json(l, 201, h);
}
async function updateLeave(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const existing = await prisma.leaveApplication.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const l = await prisma.leaveApplication.update({ where: { id }, data: { status: body.status, reviewNote: body.reviewNote ?? null, reviewedById: u.id } });
  return json(l, 200, h);
}
async function deleteLeave(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.leaveApplication.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Teacher Evaluation ──────────────────────────────────────────────────────────
async function getTeacherEvaluations(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.teacherEvaluation.findMany({
    where: { schoolId: u.schoolId },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return json(list.map((e) => ({
    id: e.id, teacherId: e.teacherId, period: e.period,
    teacherName: e.teacher.user.profile ? `${e.teacher.user.profile.firstName} ${e.teacher.user.profile.lastName}`.trim() : e.teacher.user.email,
    teachingQuality: e.teachingQuality, punctuality: e.punctuality, studentFeedback: e.studentFeedback, collaboration: e.collaboration,
    overallScore: e.overallScore, remarks: e.remarks, createdAt: e.createdAt,
  })), 200, h);
}
async function createTeacherEvaluation(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.teacherId || !body?.period) return err("teacherId and period required", 400, h);
  const teacher = await prisma.teacher.findFirst({ where: { id: body.teacherId, user: { schoolId: u.schoolId } } });
  if (!teacher) return err("Teacher not found", 404, h);
  const scores = [body.teachingQuality, body.punctuality, body.studentFeedback, body.collaboration].map((x) => Number(x ?? 0));
  const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
  const e = await prisma.teacherEvaluation.create({ data: {
    schoolId: u.schoolId, teacherId: body.teacherId, period: body.period,
    teachingQuality: scores[0], punctuality: scores[1], studentFeedback: scores[2], collaboration: scores[3],
    overallScore: Math.round(overall * 10) / 10, remarks: body.remarks || null, evaluatedById: u.id,
  } });
  return json(e, 201, h);
}
async function deleteTeacherEvaluation(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.teacherEvaluation.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Student Assessment (CAS) ─────────────────────────────────────────────────────
async function getStudentAssessments(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const studentId = url.searchParams.get("studentId");
  const where: any = { schoolId: u.schoolId };
  if (studentId) where.studentId = studentId;
  const list = await prisma.studentAssessment.findMany({
    where,
    include: { student: { include: { user: { include: { profile: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return json(list.map((a) => ({
    id: a.id, studentId: a.studentId, term: a.term, area: a.area, grade: a.grade, score: a.score, remarks: a.remarks, createdAt: a.createdAt,
    studentName: a.student.user.profile ? `${a.student.user.profile.firstName} ${a.student.user.profile.lastName}`.trim() : a.student.user.email,
    admissionNo: a.student.admissionNo,
  })), 200, h);
}
async function createStudentAssessment(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.studentId || !body?.term || !body?.area) return err("studentId, term, area required", 400, h);
  const student = await prisma.student.findFirst({ where: { id: body.studentId, schoolId: u.schoolId } });
  if (!student) return err("Student not found", 404, h);
  const a = await prisma.studentAssessment.create({ data: {
    schoolId: u.schoolId, studentId: body.studentId, term: body.term, area: body.area,
    grade: body.grade || null, score: body.score != null && body.score !== "" ? Number(body.score) : null, remarks: body.remarks || null, assessedById: u.id,
  } });
  return json(a, 201, h);
}
async function deleteStudentAssessment(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.studentAssessment.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Documents ────────────────────────────────────────────────────────────────
async function getDocuments(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.document.findMany({ where: { schoolId: u.schoolId }, orderBy: { createdAt: "desc" } });
  return json(list, 200, h);
}
async function createDocument(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.fileUrl) return err("title and fileUrl required", 400, h);
  const d = await prisma.document.create({ data: {
    schoolId: u.schoolId, title: body.title, category: body.category ?? "General", fileUrl: body.fileUrl,
    fileType: body.fileType || null, description: body.description || null, uploadedById: u.id,
  } });
  return json(d, 201, h);
}
async function deleteDocument(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.document.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Canteen ────────────────────────────────────────────────────────────────────
async function getCanteenItems(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.canteenItem.findMany({ where: { schoolId: u.schoolId }, orderBy: { createdAt: "desc" } });
  return json(list.map((c) => ({ ...c, price: Number(c.price) })), 200, h);
}
async function createCanteenItem(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || body?.price === undefined) return err("name and price required", 400, h);
  const c = await prisma.canteenItem.create({ data: {
    schoolId: u.schoolId, name: body.name, category: body.category ?? "Meal", price: Number(body.price),
    dayOfWeek: body.dayOfWeek != null && body.dayOfWeek !== "" ? Number(body.dayOfWeek) : null, available: body.available ?? true,
  } });
  return json(c, 201, h);
}
async function updateCanteenItem(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const existing = await prisma.canteenItem.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const c = await prisma.canteenItem.update({ where: { id }, data: {
    name: body.name, category: body.category, price: body.price != null ? Number(body.price) : undefined,
    dayOfWeek: body.dayOfWeek != null && body.dayOfWeek !== "" ? Number(body.dayOfWeek) : undefined, available: body.available,
  } });
  return json({ ...c, price: Number(c.price) }, 200, h);
}
async function deleteCanteenItem(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.canteenItem.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Support Tickets ──────────────────────────────────────────────────────────────
async function getSupportTickets(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.supportTicket.findMany({ where: { schoolId: u.schoolId }, orderBy: { createdAt: "desc" } });
  return json(list, 200, h);
}
async function createSupportTicket(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.subject || !body?.message) return err("subject and message required", 400, h);
  const profile = await prisma.userProfile.findUnique({ where: { userId: u.id } });
  const t = await prisma.supportTicket.create({ data: {
    schoolId: u.schoolId, subject: body.subject, message: body.message, category: body.category ?? "General",
    priority: body.priority ?? "NORMAL", raisedById: u.id,
    raisedByName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : u.email.split("@")[0],
  } });
  return json(t, 201, h);
}
async function updateSupportTicket(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const existing = await prisma.supportTicket.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const t = await prisma.supportTicket.update({ where: { id }, data: { status: body.status, response: body.response, priority: body.priority } });
  return json(t, 200, h);
}
async function deleteSupportTicket(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.supportTicket.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Surveys ──────────────────────────────────────────────────────────────────
async function getSurveys(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.survey.findMany({ where: { schoolId: u.schoolId }, include: { _count: { select: { responses: true } } }, orderBy: { createdAt: "desc" } });
  return json(list.map((s) => ({ id: s.id, title: s.title, description: s.description, questions: s.questions, targetRole: s.targetRole, isActive: s.isActive, responseCount: s._count.responses, createdAt: s.createdAt })), 200, h);
}
async function createSurvey(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.title || !Array.isArray(body?.questions) || body.questions.length === 0) return err("title and at least one question required", 400, h);
  const s = await prisma.survey.create({ data: {
    schoolId: u.schoolId, title: body.title, description: body.description || null, questions: body.questions,
    targetRole: body.targetRole ?? null, isActive: body.isActive ?? true,
  } });
  return json(s, 201, h);
}
async function updateSurvey(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const existing = await prisma.survey.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const s = await prisma.survey.update({ where: { id }, data: { title: body.title, description: body.description, isActive: body.isActive } });
  return json(s, 200, h);
}
async function deleteSurvey(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.survey.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Infirmary ──────────────────────────────────────────────────────────────────
async function getInfirmaryVisits(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.infirmaryVisit.findMany({
    where: { schoolId: u.schoolId },
    include: { student: { include: { user: { include: { profile: true } } } } },
    orderBy: { visitDate: "desc" },
  });
  return json(list.map((v) => ({
    id: v.id, studentId: v.studentId,
    patientName: v.student ? (v.student.user.profile ? `${v.student.user.profile.firstName} ${v.student.user.profile.lastName}`.trim() : v.student.user.email) : v.visitorName,
    symptoms: v.symptoms, treatment: v.treatment, temperature: v.temperature, medication: v.medication, visitDate: v.visitDate,
  })), 200, h);
}
async function createInfirmaryVisit(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.symptoms) return err("symptoms required", 400, h);
  if (!body?.studentId && !body?.visitorName) return err("studentId or visitorName required", 400, h);
  if (body.studentId) {
    const student = await prisma.student.findFirst({ where: { id: body.studentId, schoolId: u.schoolId } });
    if (!student) return err("Student not found", 404, h);
  }
  const v = await prisma.infirmaryVisit.create({ data: {
    schoolId: u.schoolId, studentId: body.studentId || null, visitorName: body.visitorName || null,
    symptoms: body.symptoms, treatment: body.treatment || null, temperature: body.temperature || null, medication: body.medication || null,
    visitDate: body.visitDate ? new Date(body.visitDate) : new Date(), recordedById: u.id,
  } });
  return json(v, 201, h);
}
async function deleteInfirmaryVisit(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.infirmaryVisit.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── ECA (Extra-Curricular Activities) ────────────────────────────────────────────
async function getEcaActivities(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u) return err("Unauthorized", 401, h);
  const list = await prisma.ecaActivity.findMany({ where: { schoolId: u.schoolId }, orderBy: { createdAt: "desc" } });
  return json(list, 200, h);
}
async function createEcaActivity(req: Request, h: Headers): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name required", 400, h);
  const e = await prisma.ecaActivity.create({ data: {
    schoolId: u.schoolId, name: body.name, category: body.category ?? "Sports", description: body.description || null,
    inchargeName: body.inchargeName || null, schedule: body.schedule || null,
  } });
  return json(e, 201, h);
}
async function updateEcaActivity(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  const existing = await prisma.ecaActivity.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!existing) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const e = await prisma.ecaActivity.update({ where: { id }, data: { name: body.name, category: body.category, description: body.description, inchargeName: body.inchargeName, schedule: body.schedule } });
  return json(e, 200, h);
}
async function deleteEcaActivity(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await adminOnly(req);
  if (!u) return err("Unauthorized", 401, h);
  await prisma.ecaActivity.deleteMany({ where: { id, schoolId: u.schoolId } });
  return json({ ok: true }, 200, h);
}

// ─── Router ───────────────────────────────────────────────────────────────────

Bun.serve({
  port: parseInt(process.env.PORT || "4000"),
  idleTimeout: 0,

  async fetch(req) {
    try {
    const url = new URL(req.url);
    const p = url.pathname;
    const h = cors(req);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });

    // Rate-limit auth endpoints: 10 attempts per IP per minute
    if (p.startsWith("/api/auth") && req.method === "POST") {
      if (rateLimit(req, 10, 60_000)) return err("Too many requests", 429, h);
    }

    // Health
    if (p === "/health") return json({ ok: true, ts: new Date().toISOString() }, 200, h);

    // Public school directory (no auth) — for "Find your school" + branded login
    if (p === "/api/public/schools" && req.method === "GET") return getPublicSchools(req, h, url);
    const publicSchoolMatch = p.match(/^\/api\/public\/schools\/([^/]+)$/);
    if (publicSchoolMatch && req.method === "GET") return getPublicSchool(req, h, publicSchoolMatch[1]);

    // Auth
    if (p === "/api/auth/super-admin/login" && req.method === "POST") return loginSuperAdmin(req, h);
    if (p === "/api/auth/super-admin/me") return meSuperAdmin(req, h);

    // Dashboard
    if (p === "/api/super-admin/dashboard") return dashboard(req, h);

    // Schools
    if (p === "/api/super-admin/schools") {
      if (req.method === "GET") return getSchools(req, h, url);
      if (req.method === "POST") return createSchool(req, h);
    }
    const schoolAdminResetMatch = p.match(/^\/api\/super-admin\/schools\/([^/]+)\/reset-admin-password$/);
    if (schoolAdminResetMatch && req.method === "POST") return resetSchoolAdminPassword(req, h, schoolAdminResetMatch[1]);
    const schoolAdminMatch = p.match(/^\/api\/super-admin\/schools\/([^/]+)\/admin$/);
    if (schoolAdminMatch && req.method === "PATCH") return updateSchoolAdmin(req, h, schoolAdminMatch[1]);
    const schoolMatch = p.match(/^\/api\/super-admin\/schools\/([^/]+)$/);
    if (schoolMatch) {
      const id = schoolMatch[1];
      if (req.method === "GET") return getSchool(req, h, id);
      if (req.method === "PATCH") return updateSchool(req, h, id);
      if (req.method === "DELETE") return deleteSchool(req, h, id);
    }

    // Users
    if (p === "/api/super-admin/users") return getUsers(req, h, url);

    // Plans
    if (p === "/api/super-admin/plans") {
      if (req.method === "GET") return getPlans(req, h);
      if (req.method === "POST") return createPlan(req, h);
    }
    const planMatch = p.match(/^\/api\/super-admin\/plans\/([^/]+)$/);
    if (planMatch) {
      const id = planMatch[1];
      if (req.method === "PATCH") return updatePlan(req, h, id);
      if (req.method === "DELETE") return deletePlan(req, h, id);
    }

    // Payments
    if (p === "/api/super-admin/payments") {
      if (req.method === "GET") return getPayments(req, h, url);
      if (req.method === "POST") return recordPayment(req, h);
    }

    // Analytics
    if (p === "/api/super-admin/analytics") return getAnalytics(req, h);

    // Announcements
    if (p === "/api/super-admin/announcements") {
      if (req.method === "GET") return getAnnouncements(req, h);
      if (req.method === "POST") return createAnnouncement(req, h);
    }
    const annMatch = p.match(/^\/api\/super-admin\/announcements\/([^/]+)$/);
    if (annMatch) {
      if (req.method === "DELETE") return deleteAnnouncement(req, h, annMatch[1]);
    }

    // Activity
    if (p === "/api/super-admin/activity") return getActivity(req, h, url);

    // Settings
    if (p === "/api/super-admin/settings" && req.method === "PATCH") return updateSettings(req, h);

    // ── School Portal Auth ──────────────────────────────────────────────────
    if (p === "/api/auth/super-admin/login" && req.method === "POST") return loginSuperAdmin(req, h);
    if (p === "/api/auth/super-admin/me") return meSuperAdmin(req, h);

    // School creation with admin
    if (p === "/api/auth/super-admin/create-school" && req.method === "POST") return createSchoolEndpoint(req, h);

    // School user login and management
    if (p === "/api/auth/school/login" && req.method === "POST") {
      return loginSchoolUserEndpoint(req, h);
    }
    if (p === "/api/auth/school/me") return getSchoolUserEndpoint(req, h);
    if (p === "/api/auth/school/change-password" && req.method === "POST") return changePasswordEndpoint(req, h);

    // Create users by role
    const createUserMatch = p.match(/^\/api\/auth\/school\/users\/(teacher|staff|student|parent)$/);
    if (createUserMatch && req.method === "POST") {
      return createSchoolUserEndpoint(req, h, createUserMatch[1] as "teacher" | "staff" | "student" | "parent");
    }

    // Bulk create users
    const bulkUserMatch = p.match(/^\/api\/auth\/school\/users\/bulk\/(teacher|staff|student|parent)$/);
    if (bulkUserMatch && req.method === "POST") {
      return bulkCreateUsersEndpoint(req, h, bulkUserMatch[1] as "teacher" | "staff" | "student" | "parent");
    }

    // Reset password (admin only)
    const resetPassMatch = p.match(/^\/api\/auth\/school\/reset-password\/([^/]+)$/);
    if (resetPassMatch && req.method === "POST") {
      return resetPasswordEndpoint(req, h, resetPassMatch[1]);
    }

    // ── Admin Portal ────────────────────────────────────────────────────────
    if (p === "/api/admin/dashboard") return adminDashboard(req, h);

    // Students
    if (p === "/api/admin/students") {
      if (req.method === "GET") return getStudents(req, h, url);
      if (req.method === "POST") return createStudent(req, h);
    }
    const studentAllocMatch = p.match(/^\/api\/admin\/students\/([^/]+)\/allocate$/);
    if (studentAllocMatch && req.method === "POST") return allocateStudentSection(req, h, studentAllocMatch[1]);
    const studentCredsMatch = p.match(/^\/api\/admin\/students\/([^/]+)\/credentials$/);
    if (studentCredsMatch && req.method === "PATCH") return updateStudentCredentials(req, h, studentCredsMatch[1]);
    const studentMatch = p.match(/^\/api\/admin\/students\/([^/]+)$/);
    if (studentMatch) {
      if (req.method === "GET") return getStudentDetail(req, h, studentMatch[1]);
      if (req.method === "PATCH") return updateStudent(req, h, studentMatch[1]);
      if (req.method === "DELETE") return deleteStudent(req, h, studentMatch[1]);
    }

    // Teachers
    if (p === "/api/admin/teachers") {
      if (req.method === "GET") return getTeachers(req, h, url);
      if (req.method === "POST") return createTeacher(req, h);
    }
    const teacherMatch = p.match(/^\/api\/admin\/teachers\/([^/]+)$/);
    if (teacherMatch) {
      if (req.method === "GET") return getTeacherDetail(req, h, teacherMatch[1]);
      if (req.method === "PATCH") return updateTeacher(req, h, teacherMatch[1]);
      if (req.method === "DELETE") return deleteTeacher(req, h, teacherMatch[1]);
    }
    const teacherCredsMatch = p.match(/^\/api\/admin\/teachers\/([^/]+)\/credentials$/);
    if (teacherCredsMatch && req.method === "PATCH") return updateTeacherCredentials(req, h, teacherCredsMatch[1]);
    const teacherAssignmentsMatch = p.match(/^\/api\/admin\/teachers\/([^/]+)\/assignments$/);
    if (teacherAssignmentsMatch) {
      if (req.method === "GET") return getTeacherAssignments(req, h, teacherAssignmentsMatch[1]);
      if (req.method === "POST") return addTeacherAssignment(req, h, teacherAssignmentsMatch[1]);
    }
    const deleteAssignmentMatch = p.match(/^\/api\/admin\/teacher-assignments\/([^/]+)$/);
    if (deleteAssignmentMatch && req.method === "DELETE") return deleteTeacherAssignment(req, h, deleteAssignmentMatch[1]);

    // Staff (non-teaching)
    if (p === "/api/admin/staff") {
      if (req.method === "GET") return getStaff(req, h, url);
      if (req.method === "POST") return createStaff(req, h);
    }
    const staffMatch = p.match(/^\/api\/admin\/staff\/([^/]+)$/);
    if (staffMatch) {
      if (req.method === "GET") return getStaffDetail(req, h, staffMatch[1]);
      if (req.method === "PATCH") return updateStaff(req, h, staffMatch[1]);
      if (req.method === "DELETE") return deleteStaff(req, h, staffMatch[1]);
    }

    // Departments
    if (p === "/api/admin/departments") {
      if (req.method === "GET") return getDepartments(req, h);
      if (req.method === "POST") return createDepartment(req, h);
    }
    const deptMatch = p.match(/^\/api\/admin\/departments\/([^/]+)$/);
    if (deptMatch) {
      if (req.method === "PATCH") return updateDepartment(req, h, deptMatch[1]);
      if (req.method === "DELETE") return deleteDepartment(req, h, deptMatch[1]);
    }

    // Classes / Academic Structure
    if (p === "/api/admin/classes") return getClasses(req, h);
    if (p === "/api/admin/grades") {
      if (req.method === "GET") return getGradesWithSections(req, h);
      if (req.method === "POST") return createGrade(req, h);
    }
    const gradeMatch = p.match(/^\/api\/admin\/grades\/([^/]+)$/);
    if (gradeMatch) {
      if (req.method === "PATCH") return updateGrade(req, h, gradeMatch[1]);
      if (req.method === "DELETE") return deleteGrade(req, h, gradeMatch[1]);
    }
    const sectionListMatch = p.match(/^\/api\/admin\/grades\/([^/]+)\/sections$/);
    if (sectionListMatch && req.method === "POST") return createSection(req, h, sectionListMatch[1]);
    const sectionMatch = p.match(/^\/api\/admin\/sections\/([^/]+)$/);
    if (sectionMatch) {
      if (req.method === "GET") return getSectionDetail(req, h, sectionMatch[1]);
      if (req.method === "PATCH") return updateSectionMeta(req, h, sectionMatch[1]);
      if (req.method === "DELETE") return deleteSection(req, h, sectionMatch[1]);
    }
    const sectionSubjectsMatch = p.match(/^\/api\/admin\/sections\/([^/]+)\/subjects$/);
    if (sectionSubjectsMatch) {
      if (req.method === "GET") return getSectionSubjects(req, h, sectionSubjectsMatch[1]);
      if (req.method === "POST") return addSectionSubject(req, h, sectionSubjectsMatch[1]);
    }
    const sectionSubjectDeleteMatch = p.match(/^\/api\/admin\/section-subjects\/([^/]+)$/);
    if (sectionSubjectDeleteMatch && req.method === "DELETE") return removeSectionSubject(req, h, sectionSubjectDeleteMatch[1]);

    // Transport (buses & routes)
    if (p === "/api/admin/buses") {
      if (req.method === "GET") return getBuses(req, h);
      if (req.method === "POST") return createBus(req, h);
    }
    if (p === "/api/admin/bus-routes" && req.method === "GET") return getBusRoutes(req, h);
    const busRouteListMatch = p.match(/^\/api\/admin\/buses\/([^/]+)\/routes$/);
    if (busRouteListMatch && req.method === "POST") return createBusRoute(req, h, busRouteListMatch[1]);
    const busMatch = p.match(/^\/api\/admin\/buses\/([^/]+)$/);
    if (busMatch) {
      if (req.method === "PATCH") return updateBus(req, h, busMatch[1]);
      if (req.method === "DELETE") return deleteBus(req, h, busMatch[1]);
    }
    const busRouteMatch = p.match(/^\/api\/admin\/bus-routes\/([^/]+)$/);
    if (busRouteMatch) {
      if (req.method === "PATCH") return updateBusRoute(req, h, busRouteMatch[1]);
      if (req.method === "DELETE") return deleteBusRoute(req, h, busRouteMatch[1]);
    }

    // Academic Years
    if (p === "/api/admin/academic-years") {
      if (req.method === "GET") return getAcademicYears(req, h);
      if (req.method === "POST") return createAcademicYear(req, h);
    }
    const academicYearMatch = p.match(/^\/api\/admin\/academic-years\/([^/]+)$/);
    if (academicYearMatch) {
      if (req.method === "PATCH") return updateAcademicYear(req, h, academicYearMatch[1]);
      if (req.method === "DELETE") return deleteAcademicYear(req, h, academicYearMatch[1]);
    }

    // Student Promotion
    if (p === "/api/admin/promote" && req.method === "POST") return promoteStudents(req, h);
    if (p === "/api/admin/promote/preview" && req.method === "GET") return getPromotionPreview(req, h, url);

    // Attendance
    if (p === "/api/admin/attendance") {
      if (req.method === "GET") return getAttendance(req, h, url);
    }
    if (p === "/api/admin/attendance/mark" && req.method === "POST") return markAttendance(req, h);
    if (p === "/api/admin/attendance/summary") return getAttendanceSummary(req, h, url);
    if (p === "/api/admin/attendance/range") return getAttendanceRange(req, h, url);

    // Fees
    if (p === "/api/admin/fees") {
      if (req.method === "GET") return getFees(req, h, url);
      if (req.method === "POST") return createFeeCollection(req, h);
    }
    const feePayMatch = p.match(/^\/api\/admin\/fees\/([^/]+)\/pay$/);
    if (feePayMatch && req.method === "POST") return recordFeePayment(req, h, feePayMatch[1]);
    const feeStatusMatch = p.match(/^\/api\/admin\/fees\/([^/]+)\/status$/);
    if (feeStatusMatch && req.method === "PATCH") return updateFeeStatus(req, h, feeStatusMatch[1]);

    // Fee Types
    if (p === "/api/admin/fee-types") {
      if (req.method === "GET") return getFeeTypes(req, h);
      if (req.method === "POST") return createFeeType(req, h);
    }

    // Fee Structures / Installment plans
    if (p === "/api/admin/fee-structures") {
      if (req.method === "GET") return getFeeStructures(req, h, url);
      if (req.method === "POST") return createFeeStructure(req, h);
    }
    const feeStructMatch = p.match(/^\/api\/admin\/fee-structures\/([^/]+)$/);
    if (feeStructMatch) {
      if (req.method === "PATCH") return updateFeeStructure(req, h, feeStructMatch[1]);
      if (req.method === "DELETE") return deleteFeeStructure(req, h, feeStructMatch[1]);
    }

    // Notices
    if (p === "/api/admin/notices") {
      if (req.method === "GET") return getNotices(req, h);
      if (req.method === "POST") return createNotice(req, h);
    }
    const noticeMatch = p.match(/^\/api\/admin\/notices\/([^/]+)$/);
    if (noticeMatch && req.method === "DELETE") return deleteNotice(req, h, noticeMatch[1]);

    // Exams
    if (p === "/api/admin/exams") {
      if (req.method === "GET") return getExams(req, h);
      if (req.method === "POST") return createExam(req, h);
    }
    const examMatch = p.match(/^\/api\/admin\/exams\/([^/]+)$/);
    if (examMatch) {
      if (req.method === "GET") return getExamSchedule(req, h, examMatch[1]);
      if (req.method === "PATCH") return updateExam(req, h, examMatch[1]);
      if (req.method === "DELETE") return deleteExam(req, h, examMatch[1]);
    }
    const examSubjectMatch = p.match(/^\/api\/admin\/exams\/([^/]+)\/subjects$/);
    if (examSubjectMatch && req.method === "POST") return upsertExamSubject(req, h, examSubjectMatch[1]);
    const examSubjectDelMatch = p.match(/^\/api\/admin\/exam-subjects\/([^/]+)$/);
    if (examSubjectDelMatch && req.method === "DELETE") return deleteExamSubject(req, h, examSubjectDelMatch[1]);

    // Subjects
    if (p === "/api/admin/subjects") {
      if (req.method === "GET") return getSubjects(req, h);
      if (req.method === "POST") return createSubject(req, h);
    }
    const subjectMatch = p.match(/^\/api\/admin\/subjects\/([^/]+)$/);
    if (subjectMatch) {
      if (req.method === "GET") return getSubjectDetail(req, h, subjectMatch[1]);
      if (req.method === "DELETE") return deleteSubject(req, h, subjectMatch[1]);
    }
    if (p === "/api/admin/schedule/teachers-free") return getTeachersAvailability(req, h, url);
    const gradeSubjectsMatch = p.match(/^\/api\/admin\/grades\/([^/]+)\/subjects$/);
    if (gradeSubjectsMatch && req.method === "POST") return assignSubjectToGrade(req, h, gradeSubjectsMatch[1]);

    // Library
    if (p === "/api/admin/library/books") {
      if (req.method === "GET") return getLibraryBooks(req, h, url);
      if (req.method === "POST") return createLibraryBook(req, h);
    }
    const bookMatch = p.match(/^\/api\/admin\/library\/books\/([^/]+)$/);
    if (bookMatch) {
      if (req.method === "PATCH") return updateLibraryBook(req, h, bookMatch[1]);
      if (req.method === "DELETE") return deleteLibraryBook(req, h, bookMatch[1]);
    }
    if (p === "/api/admin/library/issues") {
      if (req.method === "GET") return getBookIssues(req, h, url);
      if (req.method === "POST") return issueBook(req, h);
    }
    const issueReturnMatch = p.match(/^\/api\/admin\/library\/issues\/([^/]+)\/return$/);
    if (issueReturnMatch && req.method === "POST") return returnBook(req, h, issueReturnMatch[1]);

    // Admissions
    if (p === "/api/admin/admissions") {
      if (req.method === "GET") return getAdmissions(req, h, url);
      if (req.method === "POST") return createAdmission(req, h);
    }
    const admissionEnrollMatch = p.match(/^\/api\/admin\/admissions\/([^/]+)\/enroll$/);
    if (admissionEnrollMatch && req.method === "POST") return enrollAdmission(req, h, admissionEnrollMatch[1]);
    const admissionFeeMatch = p.match(/^\/api\/admin\/admissions\/([^/]+)\/fee-payment$/);
    if (admissionFeeMatch && req.method === "PATCH") return markAdmissionFee(req, h, admissionFeeMatch[1]);
    const admissionMatch = p.match(/^\/api\/admin\/admissions\/([^/]+)$/);
    if (admissionMatch) {
      if (req.method === "PATCH") return updateAdmission(req, h, admissionMatch[1]);
      if (req.method === "DELETE") return deleteAdmission(req, h, admissionMatch[1]);
    }

    // School Settings
    if (p === "/api/admin/settings") {
      if (req.method === "GET") return getSchoolSettings(req, h);
      if (req.method === "PATCH") return updateSchoolSettings(req, h);
    }

    // ── Enterprise Feature Modules ────────────────────────────────────────────
    // Notifications
    if (p === "/api/admin/notifications") {
      if (req.method === "GET") return getNotifications(req, h);
      if (req.method === "POST") return createNotification(req, h);
    }
    const notifMatch = p.match(/^\/api\/admin\/notifications\/([^/]+)$/);
    if (notifMatch && req.method === "DELETE") return deleteNotification(req, h, notifMatch[1]);

    // User Management
    if (p === "/api/admin/users" && req.method === "GET") return listSchoolUsers(req, h);
    const userIdMatch = p.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (userIdMatch) {
      if (req.method === "GET") return getSchoolUser(req, h, userIdMatch[1]);
      if (req.method === "PATCH") return updateSchoolUser(req, h, userIdMatch[1]);
    }
    const setPassMatch = p.match(/^\/api\/admin\/users\/([^/]+)\/set-password$/);
    if (setPassMatch && req.method === "POST") return setUserPassword(req, h, setPassMatch[1]);

    // Routine (Timetable)
    if (p === "/api/admin/routine") {
      if (req.method === "GET") return getRoutine(req, h);
      if (req.method === "POST") return createRoutineSlot(req, h);
    }
    const routineMatch = p.match(/^\/api\/admin\/routine\/([^/]+)$/);
    if (routineMatch && req.method === "DELETE") return deleteRoutineSlot(req, h, routineMatch[1]);

    // Staff / Schedule Manager routes
    if (p === "/api/staff/notices") return getNotices(req, h);
    if (p === "/api/staff/notifications") return getNotificationsForRole(req, h, "STAFF");
    if (p === "/api/staff/schedule/resources") return getScheduleResources(req, h);
    if (p === "/api/staff/schedule/teachers-free") return getTeachersAvailability(req, h, url);
    if (p === "/api/staff/schedule/duties") {
      if (req.method === "GET") return getDutySlots(req, h);
      if (req.method === "POST") return createDutySlot(req, h);
    }
    const staffDutyMatch = p.match(/^\/api\/staff\/schedule\/duties\/([^/]+)$/);
    if (staffDutyMatch && req.method === "DELETE") return deleteDutySlot(req, h, staffDutyMatch[1]);
    if (p === "/api/staff/schedule") {
      if (req.method === "GET") return getScheduleSlots(req, h);
      if (req.method === "POST") return createScheduleSlot(req, h);
    }
    const staffSlotMatch = p.match(/^\/api\/staff\/schedule\/([^/]+)$/);
    if (staffSlotMatch && req.method === "DELETE") return deleteScheduleSlot(req, h, staffSlotMatch[1]);

    // DI — Discipline In-charge
    if (p === "/api/staff/discipline/students") return getDIStudents(req, h, url);
    if (p === "/api/staff/discipline") {
      if (req.method === "GET") return getDisciplineRecords(req, h, url);
      if (req.method === "POST") return createDisciplineRecord(req, h);
    }
    const diMatch = p.match(/^\/api\/staff\/discipline\/([^/]+)$/);
    if (diMatch) {
      if (req.method === "PATCH") return updateDisciplineRecord(req, h, diMatch[1]);
      if (req.method === "DELETE") return deleteDisciplineRecord(req, h, diMatch[1]);
    }

    // Homework
    if (p === "/api/admin/homework") {
      if (req.method === "GET") return getHomework(req, h);
      if (req.method === "POST") return createHomework(req, h);
    }
    const homeworkMatch = p.match(/^\/api\/admin\/homework\/([^/]+)$/);
    if (homeworkMatch && req.method === "DELETE") return deleteHomework(req, h, homeworkMatch[1]);

    // Chat
    if (p === "/api/admin/chat/users") return getSchoolUsers(req, h);
    if (p === "/api/admin/chat/messages") {
      if (req.method === "GET") return getMessages(req, h, url);
      if (req.method === "POST") return sendMessage(req, h);
    }

    // Inventory
    if (p === "/api/admin/inventory") {
      if (req.method === "GET") return getInventory(req, h);
      if (req.method === "POST") return createInventory(req, h);
    }
    const inventoryMatch = p.match(/^\/api\/admin\/inventory\/([^/]+)$/);
    if (inventoryMatch) {
      if (req.method === "PATCH") return updateInventory(req, h, inventoryMatch[1]);
      if (req.method === "DELETE") return deleteInventory(req, h, inventoryMatch[1]);
    }

    // Payroll
    if (p === "/api/admin/payroll") {
      if (req.method === "GET") return getPayroll(req, h, url);
      if (req.method === "POST") return createPayroll(req, h);
    }
    const payrollMatch = p.match(/^\/api\/admin\/payroll\/([^/]+)$/);
    if (payrollMatch) {
      if (req.method === "PATCH") return updatePayroll(req, h, payrollMatch[1]);
      if (req.method === "DELETE") return deletePayroll(req, h, payrollMatch[1]);
    }
    if (p === "/api/admin/teacher-payroll") {
      if (req.method === "GET") return getTeacherPayroll(req, h, url);
      if (req.method === "POST") return createTeacherPayroll(req, h);
    }
    const teacherPayrollMatch = p.match(/^\/api\/admin\/teacher-payroll\/([^/]+)$/);
    if (teacherPayrollMatch) {
      if (req.method === "PATCH") return updateTeacherPayroll(req, h, teacherPayrollMatch[1]);
      if (req.method === "DELETE") return deleteTeacherPayroll(req, h, teacherPayrollMatch[1]);
    }

    // Leave Notes
    if (p === "/api/admin/leaves") {
      if (req.method === "GET") return getLeaves(req, h);
      if (req.method === "POST") return createLeave(req, h);
    }
    const leaveMatch = p.match(/^\/api\/admin\/leaves\/([^/]+)$/);
    if (leaveMatch) {
      if (req.method === "PATCH") return updateLeave(req, h, leaveMatch[1]);
      if (req.method === "DELETE") return deleteLeave(req, h, leaveMatch[1]);
    }

    // Teacher Evaluation
    if (p === "/api/admin/teacher-evaluations") {
      if (req.method === "GET") return getTeacherEvaluations(req, h);
      if (req.method === "POST") return createTeacherEvaluation(req, h);
    }
    const teacherEvalMatch = p.match(/^\/api\/admin\/teacher-evaluations\/([^/]+)$/);
    if (teacherEvalMatch && req.method === "DELETE") return deleteTeacherEvaluation(req, h, teacherEvalMatch[1]);

    // Student Assessment (CAS)
    if (p === "/api/admin/assessments") {
      if (req.method === "GET") return getStudentAssessments(req, h, url);
      if (req.method === "POST") return createStudentAssessment(req, h);
    }
    const assessmentMatch = p.match(/^\/api\/admin\/assessments\/([^/]+)$/);
    if (assessmentMatch && req.method === "DELETE") return deleteStudentAssessment(req, h, assessmentMatch[1]);

    // Documents
    if (p === "/api/admin/documents") {
      if (req.method === "GET") return getDocuments(req, h);
      if (req.method === "POST") return createDocument(req, h);
    }
    const documentMatch = p.match(/^\/api\/admin\/documents\/([^/]+)$/);
    if (documentMatch && req.method === "DELETE") return deleteDocument(req, h, documentMatch[1]);

    // Canteen
    if (p === "/api/admin/canteen") {
      if (req.method === "GET") return getCanteenItems(req, h);
      if (req.method === "POST") return createCanteenItem(req, h);
    }
    const canteenMatch = p.match(/^\/api\/admin\/canteen\/([^/]+)$/);
    if (canteenMatch) {
      if (req.method === "PATCH") return updateCanteenItem(req, h, canteenMatch[1]);
      if (req.method === "DELETE") return deleteCanteenItem(req, h, canteenMatch[1]);
    }

    // Support Tickets
    if (p === "/api/admin/support") {
      if (req.method === "GET") return getSupportTickets(req, h);
      if (req.method === "POST") return createSupportTicket(req, h);
    }
    const supportMatch = p.match(/^\/api\/admin\/support\/([^/]+)$/);
    if (supportMatch) {
      if (req.method === "PATCH") return updateSupportTicket(req, h, supportMatch[1]);
      if (req.method === "DELETE") return deleteSupportTicket(req, h, supportMatch[1]);
    }

    // Surveys
    if (p === "/api/admin/surveys") {
      if (req.method === "GET") return getSurveys(req, h);
      if (req.method === "POST") return createSurvey(req, h);
    }
    const surveyMatch = p.match(/^\/api\/admin\/surveys\/([^/]+)$/);
    if (surveyMatch) {
      if (req.method === "PATCH") return updateSurvey(req, h, surveyMatch[1]);
      if (req.method === "DELETE") return deleteSurvey(req, h, surveyMatch[1]);
    }

    // Infirmary
    if (p === "/api/admin/infirmary") {
      if (req.method === "GET") return getInfirmaryVisits(req, h);
      if (req.method === "POST") return createInfirmaryVisit(req, h);
    }
    const infirmaryMatch = p.match(/^\/api\/admin\/infirmary\/([^/]+)$/);
    if (infirmaryMatch && req.method === "DELETE") return deleteInfirmaryVisit(req, h, infirmaryMatch[1]);

    // ECA
    if (p === "/api/admin/eca") {
      if (req.method === "GET") return getEcaActivities(req, h);
      if (req.method === "POST") return createEcaActivity(req, h);
    }
    const ecaMatch = p.match(/^\/api\/admin\/eca\/([^/]+)$/);
    if (ecaMatch) {
      if (req.method === "PATCH") return updateEcaActivity(req, h, ecaMatch[1]);
      if (req.method === "DELETE") return deleteEcaActivity(req, h, ecaMatch[1]);
    }

    // ── Teacher Portal ──────────────────────────────────────────────────────
    if (p === "/api/teacher/dashboard") return teacherDashboard(req, h);
    if (p === "/api/teacher/classes") return getTeacherClasses(req, h);
    if (p === "/api/teacher/assignments") {
      if (req.method === "GET") return getAssignments(req, h);
      if (req.method === "POST") return createAssignment(req, h);
    }
    if (p === "/api/teacher/attendance") {
      if (req.method === "GET") return getAttendance(req, h, url);
    }
    if (p === "/api/teacher/attendance/mark" && req.method === "POST") return markAttendance(req, h);
    if (p === "/api/teacher/notices") return getNotices(req, h);
    if (p === "/api/teacher/notifications") return getNotificationsForRole(req, h, "TEACHER");
    if (p === "/api/teacher/routine") return teacherRoutine(req, h);
    if (p === "/api/teacher/exams") return getTeacherExams(req, h);

    // ── Student Portal ──────────────────────────────────────────────────────
    if (p === "/api/student/profile") return studentProfile(req, h);
    if (p === "/api/student/dashboard") return studentDashboard(req, h);
    if (p === "/api/student/attendance") return getStudentAttendance(req, h, url);
    if (p === "/api/student/results") return getStudentResults(req, h);
    if (p === "/api/student/fees") return getStudentFees(req, h);
    if (p === "/api/student/notices") return getNotices(req, h);
    if (p === "/api/student/notifications") return getNotificationsForRole(req, h, "STUDENT");
    if (p === "/api/student/subjects") return getSubjects(req, h);
    if (p === "/api/student/routine") return studentRoutine(req, h);
    if (p === "/api/student/exams") return getStudentExams(req, h);

    // ── Parent Portal ───────────────────────────────────────────────────────
    if (p === "/api/parent/dashboard") return parentDashboard(req, h);
    if (p === "/api/parent/notices") return getNotices(req, h);
    if (p === "/api/parent/notifications") return getNotificationsForRole(req, h, "PARENT");
    if (p === "/api/parent/results") return getParentResults(req, h);
    if (p === "/api/parent/fees") return getParentFees(req, h);
    if (p === "/api/parent/attendance") return getParentAttendance(req, h);
    if (p === "/api/parent/routine") return parentRoutine(req, h, url);

    return json({ error: "Not found" }, 404, h);
    } catch (e) {
      console.error("Unhandled request error:", e);
      const h2 = cors(req);
      return new Response(JSON.stringify({ error: "Internal server error", detail: String(e) }), {
        status: 500,
        headers: h2,
      });
    }
  },
});

console.log(`Server running at http://localhost:${process.env.PORT ?? 4000}`);

// ─── Super admin seed from env ────────────────────────────────────────────────
const SA_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SA_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SA_NAME = process.env.SUPER_ADMIN_NAME ?? "Super Admin";

if (SA_EMAIL && SA_PASSWORD) {
  const existing = await prisma.superAdmin.findUnique({ where: { email: SA_EMAIL } });
  if (!existing) {
    const hashed = await hashPassword(SA_PASSWORD);
    await prisma.superAdmin.create({ data: { email: SA_EMAIL, password: hashed, name: SA_NAME } });
    console.log(`Super admin created: ${SA_EMAIL}`);
  } else {
    console.log(`Super admin already exists: ${SA_EMAIL}`);
  }
}
