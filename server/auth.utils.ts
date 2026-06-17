/**
 * Generate a unique user ID for a specific role
 * Format: ROLE_SCHOOLSLUG_RANDOMSTRING
 * Examples: STU_abc123_x8k2m, TEA_xyz789_p9q1r, PAR_def456_n3v7w
 */
export function generateUserId(role: "ADMIN" | "TEACHER" | "STAFF" | "PARENT" | "STUDENT", schoolSlug: string): string {
  const rolePrefix = role.substring(0, 3).toUpperCase();
  const schoolPrefix = schoolSlug.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${rolePrefix}_${schoolPrefix}_${random}`;
}

/**
 * Generate a random password (alphanumeric + special chars)
 */
export function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Hash a password using Bun.password
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash_: string): Promise<boolean> {
  return await Bun.password.verify(password, hash_);
}

/**
 * Generate an admin ID from school slug
 * Format: ADMIN_SCHOOLSLUG_TIMESTAMP
 */
export function generateAdminId(schoolSlug: string): string {
  const schoolPrefix = schoolSlug.substring(0, 6).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `ADMIN_${schoolPrefix}_${timestamp}`;
}

/**
 * Generate default email format for auto-created users
 */
export function generateDefaultEmail(userId: string, schoolSlug: string): string {
  return `${userId.toLowerCase()}@${schoolSlug}.local`;
}

/**
 * Sanitize school slug (lowercase, remove special chars, replace spaces with hyphen)
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

/**
 * Create credential object for new users
 */
export interface UserCredential {
  userId: string;
  email: string;
  password: string;
  temporaryPassword: boolean;
}

export function createUserCredential(role: "ADMIN" | "TEACHER" | "STAFF" | "PARENT" | "STUDENT", schoolSlug: string): UserCredential {
  const userId = generateUserId(role, schoolSlug);
  const password = generatePassword();
  const email = generateDefaultEmail(userId, schoolSlug);

  return {
    userId,
    email,
    password,
    temporaryPassword: true,
  };
}
