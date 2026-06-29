/**
 * Comprehensive auth handler functions for multi-role, multi-tenant SMS system
 * Includes: School creation, user creation, role-based login, password management
 */

import { PrismaClient } from "./generated/prisma/client.ts";
import { SignJWT, jwtVerify } from "jose";
import {
  generateUserId,
  generatePassword,
  hashPassword,
  verifyPassword,
  generateAdminId,
  generateDefaultEmail,
  sanitizeSlug,
  createUserCredential,
  type UserCredential,
} from "./auth.utils.ts";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production — refusing to start with the insecure dev fallback.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * ─── School Creation with Admin User ──────────────────────────────────
 * Super Admin creates a school and auto-generates admin credentials
 * Returns school details and admin credentials
 */
export async function createSchoolWithAdmin(
  prisma: PrismaClient,
  superAdminId: string,
  schoolData: {
    name: string;
    slug?: string;
    adminEmail?: string;
    adminPassword?: string;
    principalName?: string;
    principalEmail?: string;
    [key: string]: any;
  }
): Promise<{
  school: any;
  adminCredentials: UserCredential;
}> {
  // Sanitize and create slug
  let slug = schoolData.slug ? sanitizeSlug(schoolData.slug) : sanitizeSlug(schoolData.name);
  
  // Ensure unique slug
  let counter = 1;
  let existingSlug = await prisma.school.findUnique({ where: { slug } });
  while (existingSlug) {
    slug = `${slug}-${counter}`;
    existingSlug = await prisma.school.findUnique({ where: { slug } });
    counter++;
  }

  // Create admin credentials
  let adminEmail = schoolData.adminEmail;
  let adminPassword = schoolData.adminPassword ?? generatePassword();

  if (!adminEmail) {
    const adminId = generateAdminId(slug);
    adminEmail = generateDefaultEmail(adminId, slug);
  }

  const hashedPassword = await hashPassword(adminPassword);

  // Create school
  const school = await prisma.school.create({
    data: {
      name: schoolData.name,
      slug,
      address: schoolData.address || null,
      city: schoolData.city || null,
      district: schoolData.district || null,
      province: schoolData.province || null,
      phone: schoolData.phone || null,
      altPhone: schoolData.altPhone || null,
      email: schoolData.email || null,
      website: schoolData.website || null,
      logo: schoolData.logo || null,
      principalName: schoolData.principalName || null,
      principalPhone: schoolData.principalPhone || null,
      principalEmail: schoolData.principalEmail || null,
      establishedYear: schoolData.establishedYear ? parseInt(schoolData.establishedYear) : null,
      registrationNo: schoolData.registrationNo || null,
      panNo: schoolData.panNo || null,
      affiliatedTo: schoolData.affiliatedTo || null,
      totalCapacity: schoolData.totalCapacity ? parseInt(schoolData.totalCapacity) : null,
      schoolType: schoolData.schoolType ?? "SECONDARY",
      status: schoolData.status ?? "TRIAL",
      notes: schoolData.notes || null,
    },
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // Create user profile
  await prisma.userProfile.create({
    data: {
      userId: adminUser.id,
      firstName: schoolData.principalName?.split(" ")[0] ?? "Admin",
      lastName: schoolData.principalName?.split(" ").slice(1).join(" ") ?? school.name,
      phone: schoolData.principalPhone,
    },
  });

  // Create audit log (use relation connect; generated client may not expose scalar FK directly)
  await prisma.auditLog.create({
    data: {
      school: { connect: { id: school.id } },
      action: "school.created_with_admin",
      metadata: { adminEmail, createdBy: superAdminId },
    },
  });

  return {
    school,
    adminCredentials: {
      userId: adminUser.id,
      email: adminEmail,
      password: adminPassword,
      temporaryPassword: true,
    },
  };
}

/**
 * ─── Create User for Different Roles ──────────────────────────────────
 * Admin creates users for teachers, staff, students, and parents
 * Auto-generates credentials if not provided
 */
export async function createUserByRole(
  prisma: PrismaClient,
  schoolId: string,
  role: "TEACHER" | "STAFF" | "STUDENT" | "PARENT",
  userData: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: any;
  }
): Promise<{
  user: any;
  credentials: UserCredential;
}> {
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { slug: true } });
  if (!school) throw new Error("School not found");

  // Generate or validate credentials
  const credentials = {
    email: userData.email,
    password: userData.password ?? generatePassword(),
  };

  const hashedPassword = await hashPassword(credentials.password);

  // Ensure unique email within school
  let existingUser = await prisma.user.findUnique({
    where: { schoolId_email: { schoolId, email: credentials.email } },
  });

  let counter = 1;
  let uniqueEmail = credentials.email;
  while (existingUser) {
    const [localPart, domain] = credentials.email.split("@");
    uniqueEmail = `${localPart}+${counter}@${domain}`;
    existingUser = await prisma.user.findUnique({
      where: { schoolId_email: { schoolId, email: uniqueEmail } },
    });
    counter++;
  }
  credentials.email = uniqueEmail;

  // Create user
  const user = await prisma.user.create({
    data: {
      schoolId,
      email: credentials.email,
      password: hashedPassword,
      role,
      status: "ACTIVE",
    },
  });

  // Create user profile
  await prisma.userProfile.create({
    data: {
      userId: user.id,
      firstName: userData.firstName ?? role,
      lastName: userData.lastName ?? "",
      phone: userData.phone,
    },
  });

  return {
    user,
    credentials: {
      userId: user.id,
      email: credentials.email,
      password: credentials.password,
      temporaryPassword: !userData.password,
    },
  };
}

/**
 * ─── Create Multiple Users ────────────────────────────────────────────
 * Bulk create users for teachers, students, staff, or parents
 */
export async function createBulkUsers(
  prisma: PrismaClient,
  schoolId: string,
  role: "TEACHER" | "STAFF" | "STUDENT" | "PARENT",
  users: Array<{
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: any;
  }>
): Promise<Array<{ user: any; credentials: UserCredential }>> {
  const results = [];
  for (const userData of users) {
    try {
      const result = await createUserByRole(prisma, schoolId, role, userData);
      results.push(result);
    } catch (error) {
      console.error(`Failed to create ${role} user:`, error);
    }
  }
  return results;
}

/**
 * ─── Login for Different Roles ────────────────────────────────────────
 * Unified login endpoint supporting all roles with school context
 * Returns JWT token and user details
 */
export async function loginSchoolUser(
  prisma: PrismaClient,
  email: string,
  password: string,
  schoolSlug: string
): Promise<{
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    schoolId: string;
    schoolName: string;
    schoolSlug: string;
    status: string;
    features: string[];
    planSlug: string | null;
    planName: string | null;
    schoolStatus: string;
  };
}> {
  // Find school by slug
  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    select: { id: true, name: true, slug: true, status: true, subscription: { select: { plan: { select: { slug: true, name: true, features: true } } } } },
  });
  if (!school) throw new Error("School not found");

  // Find user by email within school
  const user = await prisma.user.findUnique({
    where: { schoolId_email: { schoolId: school.id, email } },
    include: { profile: true },
  });
  if (!user) throw new Error("Invalid credentials");

  // Verify password
  const passwordMatch = await verifyPassword(password, user.password);
  if (!passwordMatch) throw new Error("Invalid credentials");

  // Check if user is active
  if (user.status !== "ACTIVE") throw new Error("User account is not active");

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate JWT token
  const token = await signToken({
    id: user.id,
    email: user.email,
    role: user.role.toLowerCase(),
    schoolId: school.id,
    schoolSlug: school.slug,
  });

  const fullName = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
    : user.email.split("@")[0];

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: fullName,
      role: user.role.toLowerCase(),
      schoolId: school.id,
      schoolName: school.name,
      schoolSlug: school.slug,
      status: user.status,
      features: normalizeFeatures(school.subscription?.plan?.features ?? []),
      planSlug: school.subscription?.plan?.slug ?? null,
      planName: school.subscription?.plan?.name ?? null,
      schoolStatus: school.status,
    },
  };
}

/**
 * ─── Update User Password ─────────────────────────────────────────────
 * Allow users to change their password
 */
export async function updateUserPassword(
  prisma: PrismaClient,
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // Verify current password
  const passwordMatch = await verifyPassword(currentPassword, user.password);
  if (!passwordMatch) throw new Error("Current password is incorrect");

  // Hash and update new password
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

/**
 * ─── Reset User Password (Admin) ──────────────────────────────────────
 * Admin can reset a user's password
 */
export async function resetUserPassword(
  prisma: PrismaClient,
  userId: string
): Promise<UserCredential> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return {
    userId,
    email: user.email,
    password: newPassword,
    temporaryPassword: true,
  };
}

// Canonical feature keys (mirror of client ALL_FEATURES). Old plans may store
// human labels instead of keys, so we normalize both ways.
const FEATURE_LABEL_TO_KEY: Record<string, string> = {
  "student and staff management": "student_staff_mgmt",
  "notifications": "notifications",
  "calendar and routine": "calendar_routine",
  "homework management": "homework_mgmt",
  "exams and ledger": "exams_ledger",
  "attendance and leave notes": "attendance_leave",
  "reading materials and course plan": "reading_course_plan",
  "online class and staff meeting": "online_class",
  "billing and finance": "billing_finance",
  "teacher evaluation and analytics": "teacher_evaluation",
  "student evaluation cas & record": "student_evaluation",
  "library management": "library_mgmt",
  "document management": "document_mgmt",
  "lunch & canteen": "lunch_canteen",
  "dedicated support": "dedicated_support",
  "chat system": "chat_system",
  "inventory, payroll & survey": "inventory_payroll",
  "infirmary & sca logo": "infirmary_sca",
  "mobile app (school's branding)": "mobile_app",
};

// Old broad keys expand into the new granular nav-item keys for backward compat.
const LEGACY_KEY_EXPANSION: Record<string, string[]> = {
  student_staff_mgmt: ["students", "teachers", "staff_mgmt", "classes_sections", "section_mgmt", "subjects_mgmt", "departments", "admissions", "academic_promotion"],
  calendar_routine:   ["calendar_routine"],
  attendance_leave:   ["attendance_leave"],
  exams_ledger:       ["exams_ledger"],
  billing_finance:    ["billing_finance"],
  library_mgmt:       ["library_mgmt"],
  notifications:      ["notifications"],
  reports:            ["reports"],
};

function normalizeFeatures(raw: string[]): string[] {
  const keys = raw.map((f) => FEATURE_LABEL_TO_KEY[f.toLowerCase()] ?? f);
  const expanded = new Set<string>();
  for (const k of keys) {
    expanded.add(k);
    for (const g of LEGACY_KEY_EXPANSION[k] ?? []) expanded.add(g);
  }
  return [...expanded];
}

/**
 * ─── Get Current User Details ─────────────────────────────────────────
 */
export async function getCurrentUser(
  prisma: PrismaClient,
  userId: string
): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  status: string;
  lastLoginAt: Date | null;
  features: string[];
  planSlug: string | null;
  planName: string | null;
  schoolStatus: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      school: {
        select: {
          id: true, name: true, slug: true, status: true,
          subscription: { select: { plan: { select: { slug: true, name: true, features: true } } } },
        },
      },
    },
  });
  if (!user) throw new Error("User not found");

  const fullName = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
    : user.email.split("@")[0];

  const rawFeatures = user.school.subscription?.plan?.features ?? [];

  return {
    id: user.id,
    email: user.email,
    name: fullName,
    role: user.role.toLowerCase(),
    schoolId: user.school.id,
    schoolName: user.school.name,
    schoolSlug: user.school.slug,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    features: normalizeFeatures(rawFeatures),
    planSlug: user.school.subscription?.plan?.slug ?? null,
    planName: user.school.subscription?.plan?.name ?? null,
    schoolStatus: user.school.status,
  };
}
