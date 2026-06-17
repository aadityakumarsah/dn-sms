# DN-SMS: Complete Implementation Guide

## ✅ What Has Been Implemented

### 1. **Backend Authentication System** (`/server/auth.utils.ts` & `/server/auth.handlers.ts`)

#### Utility Functions (`auth.utils.ts`)
- `generateUserId()`: Creates unique IDs for each user by role
  - Format: `{ROLE}_{SCHOOLSLUG}_{RANDOM}`
  - Example: `TEA_KTM_X8K2M`, `STU_ABC_P9Q1R`

- `generatePassword()`: Auto-generates 12-character secure passwords
  - Mix of uppercase, lowercase, numbers, special chars

- `generateAdminId()`: Creates admin-specific IDs

- `generateDefaultEmail()`: Auto-generates email addresses
  - Format: `{userId}@{schoolSlug}.local`

- `sanitizeSlug()`: Converts school names to URL-friendly slugs
  - Example: "Kathmandu Public School" → "kathmandu-public-school"

- `createUserCredential()`: Creates complete credential package

#### Handler Functions (`auth.handlers.ts`)
- `createSchoolWithAdmin()`: Create school + admin user in transaction
- `createUserByRole()`: Create individual users (teacher/staff/student/parent)
- `createBulkUsers()`: Bulk create users
- `loginSchoolUser()`: Authenticate and generate JWT token
- `updateUserPassword()`: User changes own password
- `resetUserPassword()`: Admin resets user password
- `getCurrentUser()`: Fetch current user details

### 2. **Backend API Endpoints** (`/server/index.ts`)

#### Authentication Routes
```
POST   /api/auth/super-admin/login              - SuperAdmin login
GET    /api/auth/super-admin/me                 - Get SuperAdmin details
POST   /api/auth/super-admin/create-school      - Create school with admin (NEW)

POST   /api/auth/school/login                   - School user login (UPDATED)
GET    /api/auth/school/me                      - Get current user (NEW)
POST   /api/auth/school/change-password         - Change password (NEW)

POST   /api/auth/school/users/:role             - Create user (NEW)
  - role: teacher, staff, student, parent
POST   /api/auth/school/users/bulk/:role        - Bulk create users (NEW)
POST   /api/auth/school/reset-password/:userId  - Reset password (NEW)
```

#### Middleware Functions
- `authSA()`: Validate Super Admin token
- `authSchoolUser()`: Validate school user token (teachers, admins, etc.)

### 3. **Frontend API Client** (`/client/src/lib/api.ts`)

```typescript
api.auth.loginSuperAdmin()
api.auth.meSuperAdmin()
api.auth.createSchool()

api.auth.loginSchool()
api.auth.meSchool()
api.auth.changePassword()
api.auth.resetPassword()

api.auth.createTeacher()
api.auth.createStaff()
api.auth.createStudent()
api.auth.createParent()

api.auth.bulkCreateTeachers()
api.auth.bulkCreateStaff()
api.auth.bulkCreateStudents()
api.auth.bulkCreateParents()
```

### 4. **Database Schema Support**

The system works with existing models:
- **SuperAdmin**: Platform-level admin
- **School**: School with unique slug
- **User**: School users with roles (ADMIN, TEACHER, STAFF, STUDENT, PARENT)
- **UserProfile**: Extended user information
- **AuditLog**: Tracks all auth actions

### 5. **Documentation**

- `AUTHENTICATION.md`: Complete authentication system documentation
- This file: Implementation guide and usage examples

---

## 🚀 Quick Start Examples

### 1. Create a School (as Super Admin)

**Frontend Code:**
```typescript
import { api } from "@/lib/api";

const result = await api.auth.createSchool({
  name: "Kathmandu Public School",
  principalName: "Dr. Ramesh Kumar",
  city: "Kathmandu",
  district: "Kathmandu",
  province: "Bagmati",
  phone: "+977-1-4123456",
  email: "principal@kps.edu.np"
});

console.log(result);
// {
//   school: { id, name, slug, ... },
//   admin: { 
//     userId, 
//     email: "ADMIN_KAT_..@kathmandu-public-school.local",
//     password: "SecureP@ss123",
//     temporaryPassword: true
//   }
// }
```

### 2. Login as School Admin

**Frontend Code:**
```typescript
import { api } from "@/lib/api";

const { token, user } = await api.auth.loginSchool(
  "admin@kps.edu.np",
  "AdminPassword123",
  "kathmandu-public-school"
);

// Store token
localStorage.setItem("dn_sms_token", token);
localStorage.setItem("dn_sms_user", JSON.stringify(user));

// Redirect to admin portal
navigate("/portals/admin/dashboard");
```

### 3. Create a Teacher (as Admin)

**Frontend Code:**
```typescript
import { api } from "@/lib/api";

const result = await api.auth.createTeacher({
  firstName: "Sita",
  lastName: "Poudel",
  phone: "+977-1-4122222"
  // email and password auto-generated if not provided
});

console.log(result);
// {
//   user: { id, email, role: "TEACHER", ... },
//   credentials: {
//     userId: "user-id",
//     email: "sita.poudel@kathmandu-public-school.local",
//     password: "TempPass@123456",
//     temporaryPassword: true
//   }
// }

// Share these credentials with teacher
// Teacher can use them to login
```

### 4. Bulk Create Students

**Frontend Code:**
```typescript
import { api } from "@/lib/api";

const result = await api.auth.bulkCreateStudents([
  { firstName: "Bibek", lastName: "Sharma" },
  { firstName: "Anita", lastName: "Dhakal" },
  { firstName: "Ramesh", lastName: "Singh" },
]);

console.log(result);
// {
//   created: 3,
//   users: [
//     { user: {...}, credentials: {...} },
//     { user: {...}, credentials: {...} },
//     { user: {...}, credentials: {...} },
//   ],
//   message: "3 student users created successfully"
// }
```

### 5. Change Password (any user)

**Frontend Code:**
```typescript
import { api } from "@/lib/api";

await api.auth.changePassword(
  "OldPassword123",
  "NewSecurePassword@2024"
);

// User remains logged in
```

### 6. Reset Password (Admin resetting student password)

**Frontend Code:**
```typescript
import { api } from "@/lib/api";

const newCreds = await api.auth.resetPassword("student-user-id");

console.log(newCreds);
// {
//   credentials: {
//     userId: "student-user-id",
//     email: "student@school.local",
//     password: "NewTempPass@789",
//     temporaryPassword: true
//   },
//   message: "Password reset successfully. New temporary password sent."
// }
```

---

## 🔧 Usage in UI Components

### Login Page
```typescript
import { useState } from "react";
import { api } from "@/lib/api";

export function RoleSelectLogin() {
  const [role, setRole] = useState<"admin" | "teacher" | "student" | "parent" | "staff">();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");

  const handleLogin = async () => {
    try {
      const { token, user } = await api.auth.loginSchool(
        email,
        password,
        schoolSlug
      );
      
      localStorage.setItem("dn_sms_token", token);
      localStorage.setItem("dn_sms_user", JSON.stringify(user));
      
      // Redirect based on role
      navigate(`/portals/${user.role}`);
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  return (
    // JSX for role selection and form
  );
}
```

### Create User Modal (Admin)
```typescript
import { useState } from "react";
import { api } from "@/lib/api";

export function CreateTeacherModal() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleCreate = async () => {
    try {
      const result = await api.auth.createTeacher({
        firstName,
        lastName,
        email,
        phone,
      });
      
      // Show credentials to admin to share with teacher
      alert(`
        Teacher created!
        Email: ${result.credentials.email}
        Password: ${result.credentials.password}
        (Temporary password - please ask to change)
      `);
      
      // Close modal, refresh list
    } catch (error) {
      console.error("Failed to create teacher:", error);
    }
  };

  return (
    // JSX for form
  );
}
```

### Account Settings (Change Password)
```typescript
import { useState } from "react";
import { api } from "@/lib/api";

export function AccountSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setSuccess(true);
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Password change failed:", error);
    }
  };

  return (
    // JSX for password change form
  );
}
```

---

## 📋 Key Concepts

### 1. School Slug
- **What**: Unique identifier for each school in URL format
- **Format**: `kathmandu-public-school` (lowercase, hyphenated)
- **Auto-generated**: From school name, ensures uniqueness
- **Usage**: Required for login, identifies school context
- **Example**: `https://app.dn-sms.edu.np/login?school=kathmandu-public-school`

### 2. User ID
- **What**: Unique identifier combining role, school, and random string
- **Format**: `{ROLE}_{SCHOOLPREFIX}_{RANDOM}`
- **Examples**:
  - Teacher: `TEA_KPS_X1Y2Z3`
  - Student: `STU_KPS_A9B8C7`
  - Admin: `ADM_KPS_M5N4O3`

### 3. Temporary Passwords
- **What**: Auto-generated passwords for new users
- **Flag**: `temporaryPassword: true`
- **Action**: Users should change on first login
- **Security**: Should be shared securely (email, printed, etc.)

### 4. School Isolation
- Each user belongs to exactly one school
- Users cannot access other schools' data
- Email is unique within a school (can reuse across schools)

---

## 🔒 Security Best Practices

1. **Store Token Safely**
   ```typescript
   // Use localStorage for web, secure storage for mobile
   localStorage.setItem("dn_sms_token", token);
   
   // Send in Authorization header for all API calls
   headers.Authorization = `Bearer ${token}`;
   ```

2. **Handle Sensitive Data**
   ```typescript
   // Don't log passwords
   console.log({ email, password }); // ❌ BAD
   
   // Don't expose credentials after first display
   // Encourage users to change temporary passwords
   ```

3. **Validate on Frontend**
   ```typescript
   // Validate form before submit
   if (!email || !password || !schoolSlug) {
     setError("All fields required");
     return;
   }
   
   // Validate password strength
   if (newPassword.length < 8) {
     setError("Password must be at least 8 characters");
     return;
   }
   ```

4. **Handle Errors Gracefully**
   ```typescript
   try {
     const { token, user } = await api.auth.loginSchool(...);
   } catch (error) {
     if (error.message.includes("suspended")) {
       setError("Your account has been suspended");
     } else if (error.message.includes("not found")) {
       setError("School not found");
     } else {
       setError("Invalid credentials");
     }
   }
   ```

---

## 📊 Database Audit Logging

All auth actions create audit logs:

```typescript
// Log entry examples:
{
  schoolId: "school-id",
  action: "school.created_with_admin",
  entityType: "School",
  entityId: "school-id",
  details: { adminEmail, createdBy }
}

{
  schoolId: "school-id",
  action: "user.teacher.created",
  entityType: "User",
  entityId: "user-id",
  details: { email, createdBy }
}

{
  schoolId: "school-id",
  action: "auth.teacher.login",
  entityType: "User",
  entityId: "user-id"
}

{
  schoolId: "school-id",
  action: "auth.password_changed",
  entityType: "User",
  entityId: "user-id"
}
```

---

## 🧪 Testing Checklist

- [ ] Super Admin can create school with auto-generated admin credentials
- [ ] Admin can login using generated credentials
- [ ] Admin can create teachers with auto-generated credentials
- [ ] Teachers can login using generated credentials
- [ ] Admin can create bulk students
- [ ] Students can login and see their portal
- [ ] Any user can change their password
- [ ] Admin can reset any user's password
- [ ] Suspended users cannot login
- [ ] Users cannot access other schools' data
- [ ] Audit logs record all actions

---

## ⚠️ Common Issues & Solutions

### Issue: "School not found"
**Cause**: Incorrect school slug or school status is SUSPENDED/INACTIVE
**Solution**: 
- Verify school slug in database
- Check school status
- Ensure school was created successfully

### Issue: "Email already exists"
**Cause**: Email is already used in the school
**Solution**:
- Use different email
- System auto-appends number if generating (e.g., `sita+1@school.local`)

### Issue: "Unauthorized"
**Cause**: Invalid token or expired token
**Solution**:
- Check token is stored in localStorage
- Verify token hasn't expired (7 days)
- Re-login if needed

### Issue: "Only admin can create users"
**Cause**: Non-admin user trying to create users
**Solution**:
- Only ADMIN role can create users
- Ensure logged-in user has ADMIN role

---

## 🎯 Next Steps

1. **Frontend UI Components**
   - Create user management pages
   - Implement bulk import from CSV
   - Add user status management

2. **Email Notifications**
   - Send credentials via email on creation
   - Password reset confirmation emails
   - Login notifications

3. **Advanced Features**
   - Two-factor authentication (2FA)
   - OAuth/SSO integration
   - API token management for integrations

4. **Admin Dashboard**
   - User management interface
   - Activity logs viewer
   - Access reports

---

## 📞 Support

For questions or issues, refer to:
- `AUTHENTICATION.md` - Detailed API reference
- `README.md` - Project overview
- Database schema in `server/prisma/schema.prisma`

---

**Last Updated**: June 2026  
**Version**: 1.0.0
