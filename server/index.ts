import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { SignJWT, jwtVerify } from "jose";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
    .setExpirationTime("7d")
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

async function authSA(req: Request): Promise<{ id: string; email: string } | null> {
  const token = getToken(req);
  if (!token) return null;
  const p = await verifyToken(token);
  if (!p || p.role !== "super_admin") return null;
  return { id: p.id as string, email: p.email as string };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  const sa = await authSA(req);
  if (!sa) return err("Unauthorized", 401, h);
  const data = await prisma.superAdmin.findUnique({ where: { id: sa.id }, select: { id: true, email: true, name: true, createdAt: true } });
  if (!data) return err("Not found", 404, h);
  return json({ ...data, role: "super_admin" }, 200, h);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function dashboard(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req);
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
  const sa = await authSA(req);
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
  const sa = await authSA(req);
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
    data: { schoolId: school.id, action: "school.created", entityType: "School", entityId: school.id },
  });

  const result = await prisma.school.findUnique({
    where: { id: school.id },
    include: { subscription: { include: { plan: true } } },
  });
  return json(result, 201, h);
}

async function getSchool(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req);
  if (!sa) return err("Unauthorized", 401, h);

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { users: true, students: true, staff: true } },
      billingTransactions: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });
  if (!school) return err("Not found", 404, h);
  return json(school, 200, h);
}

async function updateSchool(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req);
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
        schoolId: id,
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

async function deleteSchool(req: Request, h: Headers, id: string): Promise<Response> {
  const sa = await authSA(req);
  if (!sa) return err("Unauthorized", 401, h);
  await prisma.school.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function getUsers(req: Request, h: Headers, url: URL): Promise<Response> {
  const sa = await authSA(req);
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
  const sa = await authSA(req);
  if (!sa) return err("Unauthorized", 401, h);
  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });
  return json(plans, 200, h);
}

async function createPlan(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req);
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
  const sa = await authSA(req);
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
  const sa = await authSA(req);
  if (!sa) return err("Unauthorized", 401, h);
  const subs = await prisma.subscription.count({ where: { planId: id } });
  if (subs > 0) return err(`Cannot delete plan with ${subs} active subscriptions`, 400, h);
  await prisma.plan.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Payments ─────────────────────────────────────────────────────────────────

async function getPayments(req: Request, h: Headers, url: URL): Promise<Response> {
  const sa = await authSA(req);
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
  const sa = await authSA(req);
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
    data: { schoolId: body.schoolId, action: "payment.recorded", entityType: "BillingTransaction", entityId: tx.id, metadata: { amount: body.amount, status: body.status } },
  });

  return json(tx, 201, h);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

async function getAnalytics(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req);
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
  const sa = await authSA(req);
  if (!sa) return err("Unauthorized", 401, h);
  const items = await prisma.platformAnnouncement.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return json(items, 200, h);
}

async function createAnnouncement(req: Request, h: Headers): Promise<Response> {
  const sa = await authSA(req);
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
  const sa = await authSA(req);
  if (!sa) return err("Unauthorized", 401, h);
  await prisma.platformAnnouncement.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Activity ─────────────────────────────────────────────────────────────────

async function getActivity(req: Request, h: Headers, url: URL): Promise<Response> {
  const sa = await authSA(req);
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
  const sa = await authSA(req);
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
  return { id: p.id as string, schoolId: p.schoolId as string, role: p.role as string, email: p.email as string };
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
        className: enroll ? `${enroll.section.grade.name} ${enroll.section.name}` : null,
        rollNo: enroll?.rollNo ?? s.rollNumber ?? null,
        stream: s.stream ?? null,
        transportMode: s.transportMode,
        busRouteName: s.busRoute?.name ?? null,
        academicYear: enroll?.academicYear?.name ?? null,
        feeStatus, status: s.user.status,
      };
    }),
    total, page, limit, totalPages: Math.ceil(total / limit),
  }, 200, h);
}

async function createStudent(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || (u.role !== "ADMIN")) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.lastName || !body?.email) return err("firstName, lastName, email required", 400, h);

  const sid = u.schoolId;
  const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: sid, email: body.email } } });
  if (existing) return err("A user with this email already exists in this school", 400, h);

  const password = await Bun.password.hash(body.password ?? "changeme123");
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

  await prisma.auditLog.create({ data: { schoolId: sid, action: "student.created", entityType: "Student", entityId: student.id, metadata: { name: `${body.firstName} ${body.lastName}` } } });
  return json({ id: student.id, admissionNo: student.admissionNo }, 201, h);
}

async function updateStudent(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);

  const student = await prisma.student.findFirst({ where: { id, schoolId: u.schoolId }, include: { user: { include: { profile: true } } } });
  if (!student) return err("Student not found", 404, h);

  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);

  // Student academic fields (only update keys that were sent).
  const studentData: any = {};
  if (body.rollNumber !== undefined) studentData.rollNumber = body.rollNumber;
  if (body.class10Marks !== undefined) studentData.class10Marks = body.class10Marks;
  if (body.entranceMarks !== undefined) studentData.entranceMarks = body.entranceMarks;
  if (body.stream !== undefined) studentData.stream = body.stream;
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!student) return err("Not found", 404, h);
  await prisma.user.delete({ where: { id: student.userId } });
  return json({ ok: true }, 200, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.lastName || !body?.email) return err("firstName, lastName, email required", 400, h);

  const sid = u.schoolId;
  const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: sid, email: body.email } } });
  if (existing) return err("User with this email already exists", 400, h);

  const password = await Bun.password.hash(body.password ?? "teacher123");
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
  await prisma.auditLog.create({ data: { schoolId: sid, action: "teacher.created", entityType: "Teacher", entityId: teacher.id, metadata: { name: `${body.firstName} ${body.lastName}` } } });
  return json({ id: teacher.id }, 201, h);
}

async function updateTeacher(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { id, user: { schoolId: u.schoolId } }, include: { user: { include: { profile: true } } } });
  if (!teacher) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);
  await Promise.all([
    prisma.userProfile.update({ where: { userId: teacher.userId }, data: { firstName: body.firstName, lastName: body.lastName, phone: body.phone, gender: body.gender } }),
    prisma.teacher.update({ where: { id }, data: { qualification: body.qualification, experience: body.experience, specialization: body.specialization } }),
  ]);
  if (body.status) await prisma.user.update({ where: { id: teacher.userId }, data: { status: body.status } });
  return json({ ok: true }, 200, h);
}

async function deleteTeacher(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.startDate || !body?.endDate) return err("name, startDate, endDate required", 400, h);
  if (body.isActive) await prisma.academicYear.updateMany({ where: { schoolId: u.schoolId }, data: { isActive: false } });
  const ay = await prisma.academicYear.create({ data: { schoolId: u.schoolId, name: body.name, startDate: new Date(body.startDate), endDate: new Date(body.endDate), isActive: body.isActive ?? false } });
  return json(ay, 201, h);
}

async function updateAcademicYear(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const ay = await prisma.academicYear.findFirst({ where: { id, schoolId: u.schoolId }, include: { _count: { select: { enrollments: true } } } });
  if (!ay) return err("Not found", 404, h);
  if ((ay as any)._count.enrollments > 0) return err("Cannot delete: this year has student enrollments. Archive it instead.", 400, h);
  await prisma.academicYear.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function getPromotionPreview(req: Request, h: Headers, url: URL): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || (u.role !== "ADMIN" && u.role !== "TEACHER")) return err("Unauthorized", 401, h);

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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);

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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);

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
  if (!u || (u.role !== "ADMIN" && u.role !== "TEACHER")) return err("Unauthorized", 401, h);

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.content) return err("title and content required", 400, h);

  const notice = await prisma.notice.create({
    data: { schoolId: u.schoolId, title: body.title, content: body.content, targetRole: body.targetRole ?? null, isUrgent: body.isUrgent ?? false, publishedById: u.id },
  });
  return json(notice, 201, h);
}

async function deleteNotice(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const exam = await prisma.exam.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!exam) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.exam.update({ where: { id }, data: { name: body?.name, status: body?.status, startDate: body?.startDate ? new Date(body.startDate) : undefined, endDate: body?.endDate ? new Date(body.endDate) : undefined } });
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.code) return err("name and code required", 400, h);
  const subject = await prisma.subject.create({ data: { schoolId: u.schoolId, name: body.name, code: body.code, creditHours: body.creditHours ?? 5, isElective: body.isElective ?? false, departmentId: body.departmentId ?? null } });
  return json(subject, 201, h);
}

async function getSchoolSettings(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const school = await prisma.school.findUnique({ where: { id: u.schoolId }, include: { subscription: { include: { plan: true } }, academicYears: { where: { isActive: true } } } });
  if (!school) return err("Not found", 404, h);
  return json({ ...school, password: undefined }, 200, h);
}

async function updateSchoolSettings(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body) return err("No data", 400, h);
  const updated = await prisma.school.update({ where: { id: u.schoolId }, data: { phone: body.phone, altPhone: body.altPhone, email: body.email, website: body.website, principalName: body.principalName, principalPhone: body.principalPhone, address: body.address, city: body.city } });
  return json(updated, 200, h);
}

// ─── Teacher Portal ───────────────────────────────────────────────────────────

async function teacherDashboard(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "TEACHER") return err("Unauthorized", 401, h);

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
  if (!u || u.role !== "TEACHER") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { userId: u.id } });
  if (!teacher) return err("Teacher record not found", 404, h);

  const sections = await prisma.section.findMany({
    where: { timetableSlots: { some: { teacherId: teacher.id } } },
    include: { grade: true, enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: { include: { profile: true } } } } } } },
    distinct: ["id"],
  });

  return json(sections.map((s) => ({
    id: s.id, name: `${s.grade.name} ${s.name}`, gradeNumber: s.grade.gradeNumber,
    students: s.enrollments.map((e) => ({
      id: e.student.id,
      rollNo: e.rollNo ?? e.student.rollNumber ?? null,
      name: e.student.user.profile ? `${e.student.user.profile.firstName} ${e.student.user.profile.lastName}`.trim() : e.student.user.email,
      avatar: e.student.user.profile?.avatar ?? null,
      stream: e.student.stream ?? null,
    })),
  })), 200, h);
}

async function getAssignments(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "TEACHER") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "TEACHER") return err("Unauthorized", 401, h);
  const teacher = await prisma.teacher.findFirst({ where: { userId: u.id } });
  if (!teacher) return err("Teacher record not found", 404, h);
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.dueDate) return err("title and dueDate required", 400, h);
  const assignment = await prisma.assignment.create({ data: { teacherId: teacher.id, title: body.title, description: body.description ?? null, dueDate: new Date(body.dueDate), maxMarks: body.maxMarks ?? null, subjectId: body.subjectId ?? null, sectionId: body.sectionId ?? null } });
  return json(assignment, 201, h);
}

// ─── Student Portal ───────────────────────────────────────────────────────────

async function studentDashboard(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "STUDENT") return err("Unauthorized", 401, h);

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
  if (!u || u.role !== "STUDENT") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!student) return err("Not found", 404, h);

  const records = await prisma.studentAttendance.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" }, take: 90 });
  const present = records.filter((r) => r.status === "PRESENT").length;
  return json({ records, total: records.length, present, absent: records.filter((r) => r.status === "ABSENT").length, late: records.filter((r) => r.status === "LATE").length, pct: records.length ? Math.round((present / records.length) * 100) : 0 }, 200, h);
}

async function getStudentResults(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "STUDENT") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "STUDENT") return err("Unauthorized", 401, h);
  const student = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!student) return err("Not found", 404, h);
  const fees = await prisma.feeCollection.findMany({ where: { studentId: student.id }, include: { feeType: true }, orderBy: { dueDate: "desc" } });
  return json(fees.map((f) => ({ ...f, amountDue: Number(f.amountDue), amountPaid: Number(f.amountPaid), feeTypeName: f.feeType.name })), 200, h);
}

// ─── Parent Portal ────────────────────────────────────────────────────────────

async function parentDashboard(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "PARENT") return err("Unauthorized", 401, h);

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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name required", 400, h);
  const dept = await prisma.department.create({ data: { schoolId: u.schoolId, name: body.name, code: body.code ?? null, description: body.description ?? null, stream: body.stream ?? "OTHER" } });
  return json(dept, 201, h);
}

async function updateDepartment(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const dept = await prisma.department.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!dept) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.department.update({ where: { id }, data: { name: body?.name ?? dept.name, code: body?.code ?? dept.code, description: body?.description ?? dept.description, stream: body?.stream ?? dept.stream } });
  return json(updated, 200, h);
}

async function deleteDepartment(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.title) return err("title required", 400, h);
  const copies = body.totalCopies ?? 1;
  const book = await prisma.libraryBook.create({ data: { schoolId: u.schoolId, title: body.title, author: body.author ?? null, isbn: body.isbn ?? null, publisher: body.publisher ?? null, category: body.category ?? null, totalCopies: copies, availableCopies: copies, shelfNo: body.shelfNo ?? null, publishYear: body.publishYear ? parseInt(body.publishYear) : null } });
  return json(book, 201, h);
}

async function updateLibraryBook(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const book = await prisma.libraryBook.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!book) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.libraryBook.update({ where: { id }, data: { title: body?.title ?? book.title, author: body?.author ?? book.author, isbn: body?.isbn ?? book.isbn, publisher: body?.publisher ?? book.publisher, category: body?.category ?? book.category, totalCopies: body?.totalCopies ?? book.totalCopies, shelfNo: body?.shelfNo ?? book.shelfNo, publishYear: body?.publishYear ?? book.publishYear } });
  return json(updated, 200, h);
}

async function deleteLibraryBook(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
    prisma.admission.findMany({ where, include: { grade: { select: { name: true } }, department: { select: { name: true } } }, orderBy: { appliedAt: "desc" }, skip: (page - 1) * 20, take: 20 }),
    prisma.admission.count({ where }),
  ]);
  const statusCounts = await prisma.admission.groupBy({ by: ["status"], where: { schoolId: u.schoolId }, _count: { status: true } });
  return json({ admissions: admissions.map((a) => ({ ...a, name: `${a.firstName} ${a.lastName}`, gradeName: a.grade?.name ?? null, deptName: a.department?.name ?? null })), total, statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])) }, 200, h);
}

async function createAdmission(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.lastName) return err("firstName and lastName required", 400, h);
  const count = await prisma.admission.count({ where: { schoolId: u.schoolId } });
  const applicationNo = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  const admission = await prisma.admission.create({ data: { schoolId: u.schoolId, applicationNo, firstName: body.firstName, lastName: body.lastName, email: body.email ?? null, phone: body.phone ?? null, gender: body.gender ?? null, dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null, address: body.address ?? null, gradeId: body.gradeId ?? null, departmentId: body.departmentId ?? null, previousSchool: body.previousSchool ?? null, guardianName: body.guardianName ?? null, guardianPhone: body.guardianPhone ?? null, notes: body.notes ?? null } });
  return json(admission, 201, h);
}

async function updateAdmission(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const adm = await prisma.admission.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!adm) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.admission.update({ where: { id }, data: { firstName: body?.firstName ?? adm.firstName, lastName: body?.lastName ?? adm.lastName, email: body?.email ?? adm.email, phone: body?.phone ?? adm.phone, gender: body?.gender ?? adm.gender, gradeId: body?.gradeId ?? adm.gradeId, departmentId: body?.departmentId ?? adm.departmentId, previousSchool: body?.previousSchool ?? adm.previousSchool, guardianName: body?.guardianName ?? adm.guardianName, guardianPhone: body?.guardianPhone ?? adm.guardianPhone, status: body?.status ?? adm.status, notes: body?.notes ?? adm.notes } });
  return json(updated, 200, h);
}

async function deleteAdmission(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const adm = await prisma.admission.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!adm) return err("Not found", 404, h);
  await prisma.admission.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Student Promotion ────────────────────────────────────────────────────────

async function promoteStudents(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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

  return json({
    id: section.id, name: section.name, performance: section.performance,
    totalSeats: section.totalSeats, occupiedSeats: students.length,
    seatsRemaining: Math.max(0, section.totalSeats - students.length),
    roomNo: section.roomNo,
    gradeName: section.grade.name, gradeId: section.gradeId,
    academicYear: section.grade.academicYear?.name ?? null,
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const bus = await prisma.bus.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!bus) return err("Not found", 404, h);
  await prisma.bus.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function createBusRoute(req: Request, h: Headers, busId: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const route = await prisma.busRoute.findFirst({ where: { id, bus: { schoolId: u.schoolId } } });
  if (!route) return err("Not found", 404, h);
  await prisma.busRoute.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

// ─── Admission → Student enrollment ─────────────────────────────────────────────

async function enrollAdmission(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const adm = await prisma.admission.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!adm) return err("Application not found", 404, h);
  if (adm.status === "ENROLLED") return err("This applicant is already enrolled", 400, h);

  const body = await req.json().catch(() => ({}));
  const email = body.email ?? adm.email ?? `${adm.applicationNo.toLowerCase()}@student.local`;

  const existing = await prisma.user.findUnique({ where: { schoolId_email: { schoolId: u.schoolId, email } } });
  if (existing) return err("A user with this email already exists in this school", 400, h);

  const password = await Bun.password.hash(body.password ?? "changeme123");
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

  await prisma.admission.update({ where: { id }, data: { status: "ENROLLED" } });
  await prisma.auditLog.create({ data: { schoolId: u.schoolId, action: "admission.enrolled", entityType: "Student", entityId: student.id, metadata: { applicationNo: adm.applicationNo } } });
  return json({ id: student.id, admissionNo: student.admissionNo }, 201, h);
}

// ─── Enhanced Grade/Section ────────────────────────────────────────────────────

async function updateGrade(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const sec = await prisma.section.findFirst({ where: { id, grade: { schoolId: u.schoolId } } });
  if (!sec) return err("Not found", 404, h);
  const body = await req.json().catch(() => null);
  const updated = await prisma.section.update({ where: { id }, data: { name: body?.name ?? sec.name, totalSeats: body?.totalSeats ?? sec.totalSeats, performance: body?.performance ?? sec.performance, roomNo: body?.roomNo ?? sec.roomNo } });
  return json(updated, 200, h);
}

async function updateSection(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const sec = await prisma.section.findFirst({ where: { id, grade: { schoolId: u.schoolId } } });
  if (!sec) return err("Not found", 404, h);
  await prisma.section.delete({ where: { id } });
  return json({ ok: true }, 200, h);
}

async function deleteGrade(req: Request, h: Headers, id: string): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
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
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name required", 400, h);
  const ft = await prisma.feeType.create({ data: { schoolId: u.schoolId, name: body.name, description: body.description ?? null, isRecurring: body.isRecurring ?? true } });
  return json(ft, 201, h);
}

async function createFeeCollection(req: Request, h: Headers): Promise<Response> {
  const u = await authSchool(req);
  if (!u || u.role !== "ADMIN") return err("Unauthorized", 401, h);
  const body = await req.json().catch(() => null);
  if (!body?.studentId || !body?.feeTypeId || !body?.amountDue || !body?.dueDate) return err("studentId, feeTypeId, amountDue, dueDate required", 400, h);
  const count = await prisma.feeCollection.count({ where: { student: { schoolId: u.schoolId } } });
  const receiptNo = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  const fc = await prisma.feeCollection.create({ data: { studentId: body.studentId, feeTypeId: body.feeTypeId, amountDue: body.amountDue, amountPaid: body.amountPaid ?? 0, dueDate: new Date(body.dueDate), status: body.status ?? "PENDING", remarks: body.remarks ?? null, receiptNo, academicYearId: body.academicYearId ?? null } });
  return json(fc, 201, h);
}

// ─── Router ───────────────────────────────────────────────────────────────────

Bun.serve({
  port: parseInt(process.env.PORT ?? "4000"),
  idleTimeout: 0,

  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    const h = cors(req);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });

    // Health
    if (p === "/health") return json({ ok: true, ts: new Date().toISOString() }, 200, h);

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
    if (p === "/api/auth/school/login" && req.method === "POST") return loginSchool(req, h);
    if (p === "/api/auth/school/me") return meSchool(req, h);

    // ── Admin Portal ────────────────────────────────────────────────────────
    if (p === "/api/admin/dashboard") return adminDashboard(req, h);

    // Students
    if (p === "/api/admin/students") {
      if (req.method === "GET") return getStudents(req, h, url);
      if (req.method === "POST") return createStudent(req, h);
    }
    const studentAllocMatch = p.match(/^\/api\/admin\/students\/([^/]+)\/allocate$/);
    if (studentAllocMatch && req.method === "POST") return allocateStudentSection(req, h, studentAllocMatch[1]);
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
      if (req.method === "PATCH") return updateSection(req, h, sectionMatch[1]);
      if (req.method === "DELETE") return deleteSection(req, h, sectionMatch[1]);
    }

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

    // ── Student Portal ──────────────────────────────────────────────────────
    if (p === "/api/student/dashboard") return studentDashboard(req, h);
    if (p === "/api/student/attendance") return getStudentAttendance(req, h, url);
    if (p === "/api/student/results") return getStudentResults(req, h);
    if (p === "/api/student/fees") return getStudentFees(req, h);
    if (p === "/api/student/notices") return getNotices(req, h);
    if (p === "/api/student/subjects") return getSubjects(req, h);

    // ── Parent Portal ───────────────────────────────────────────────────────
    if (p === "/api/parent/dashboard") return parentDashboard(req, h);
    if (p === "/api/parent/notices") return getNotices(req, h);

    return json({ error: "Not found" }, 404, h);
  },
});

console.log(`Server running at http://localhost:${process.env.PORT ?? 4000}`);
