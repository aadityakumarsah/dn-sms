# DN-SMS Authentication - Quick Reference

## 🚀 30-Second Overview

**What**: Multi-tenant, multi-role authentication system  
**Where**: Super Admin creates schools → Admins create users → Users log in  
**How**: JWT tokens + school slug + role-based access  
**Auto-Generate**: User IDs, emails, passwords  

---

## 🔑 Three Simple Flows

### Flow 1: Create School (Super Admin)
```bash
POST /api/auth/super-admin/create-school
{
  "name": "My School",
  "city": "Kathmandu"
}
↓
Returns: school + auto-generated admin credentials
```

### Flow 2: Create Users (Admin)
```bash
POST /api/auth/school/users/:role
{
  "firstName": "John",
  "lastName": "Doe"
}
↓
Returns: user + auto-generated credentials
```

### Flow 3: Login (Any User)
```bash
POST /api/auth/school/login
{
  "email": "user@school.edu.np",
  "password": "password",
  "schoolSlug": "my-school"
}
↓
Returns: JWT token + user details
```

---

## 📍 Key Concepts (60 seconds)

| Concept | What | Example |
|---------|------|---------|
| **School Slug** | URL-friendly school ID | `kathmandu-public-school` |
| **User ID** | Format: ROLE_SCHOOL_RANDOM | `TEA_KPS_X1Y2Z3` |
| **Email** | Auto-generated if not provided | `sita.poudel@school.edu.np` |
| **Password** | Auto-generated 12-char | `SecureP@ss9876` |
| **JWT Token** | 7-day auth token | Sent in `Authorization` header |
| **Role** | ADMIN, TEACHER, STAFF, STUDENT, PARENT | Controls what user can access |

---

## 🎯 API Methods (Frontend)

### Create & Manage
```typescript
// School (Super Admin only)
api.auth.createSchool(data)

// Individual users
api.auth.createTeacher(data)
api.auth.createStaff(data)
api.auth.createStudent(data)
api.auth.createParent(data)

// Bulk users
api.auth.bulkCreateTeachers(usersArray)
api.auth.bulkCreateStaff(usersArray)
api.auth.bulkCreateStudents(usersArray)
api.auth.bulkCreateParents(usersArray)
```

### Authenticate
```typescript
// Login
api.auth.loginSchool(email, password, schoolSlug)

// Get current user
api.auth.meSchool()

// Password
api.auth.changePassword(oldPass, newPass)
api.auth.resetPassword(userId)  // Admin only
```

---

## 🔐 Security Cheat Sheet

| What | How |
|------|-----|
| Passwords | Bun.password.hash() |
| Tokens | JWT 7-day expiration |
| Isolation | School slug context |
| Access | Role-based (RBAC) |
| Logging | All actions audited |

---

## 💻 Usage Examples (2 minutes)

### Create School + Admin
```typescript
const { school, admin } = await api.auth.createSchool({
  name: "XYZ School",
  city: "Kathmandu"
});

console.log({
  schoolSlug: school.slug,
  adminEmail: admin.email,
  adminPassword: admin.password  // Share this securely!
});
```

### Admin Creates Teacher
```typescript
const { user, credentials } = await api.auth.createTeacher({
  firstName: "Sita",
  lastName: "Poudel"
});

console.log({
  teacherId: user.id,
  email: credentials.email,
  password: credentials.password  // Share with teacher
});
```

### Teacher Logs In
```typescript
const { token, user } = await api.auth.loginSchool(
  "sita.poudel@xyz-school.edu.np",
  "SecureP@ss9876",
  "xyz-school"
);

localStorage.setItem("token", token);
// Teacher now logged in!
```

### Any User Changes Password
```typescript
await api.auth.changePassword(
  "OldPassword123",
  "NewPassword456"
);
// Done - session remains active
```

---

## ⚠️ Common Mistakes to Avoid

❌ **Storing password in code**
```typescript
// BAD
const user = createUser({ password: "hardcoded123" });
```

✅ **Let system generate**
```typescript
// GOOD
const user = await api.auth.createTeacher({ firstName: "John" });
// Password auto-generated
```

---

❌ **Forgetting school slug**
```typescript
// BAD
api.auth.loginSchool("user@school.edu.np", "pass");
// Missing schoolSlug!
```

✅ **Always include school slug**
```typescript
// GOOD
api.auth.loginSchool(
  "user@school.edu.np",
  "pass",
  "school-slug"  // ← Required!
);
```

---

❌ **Reusing admin credentials**
```typescript
// BAD
const admin = await api.auth.createSchool(...);
// Use admin credentials in multiple places
```

✅ **Admin creates unique users**
```typescript
// GOOD
const admin = await api.auth.createSchool(...);
// Admin logs in once to create other users
const teacher = await api.auth.createTeacher(...);
// Teacher gets unique credentials
```

---

## 📋 When to Use What

| Situation | Use |
|-----------|-----|
| New school onboarding | `api.auth.createSchool()` |
| Hire new teacher | `api.auth.createTeacher()` |
| Add many students | `api.auth.bulkCreateStudents()` |
| Import from CSV | Parse CSV → `bulkCreateStudents()` |
| Forgotten password | `api.auth.resetPassword()` |
| User wants new password | `api.auth.changePassword()` |
| Building login page | `api.auth.loginSchool()` |

---

## 🧪 Test These (5 minutes)

1. **Create school** → Get admin credentials ✓
2. **Login as admin** → Get JWT token ✓
3. **Create teacher** → Get teacher credentials ✓
4. **Login as teacher** → Get JWT token ✓
5. **Change password** → Still logged in ✓
6. **Create bulk students** → All get credentials ✓

---

## 📞 When Things Break

| Error | Probably |
|-------|----------|
| "School not found" | Wrong school slug |
| "Invalid credentials" | Wrong password |
| "Email already exists" | Email used in school |
| "Unauthorized" | Token missing or expired |
| "Only admin can..." | Wrong role for action |

**Fix**: Check AUTHENTICATION.md or IMPLEMENTATION_GUIDE.md

---

## 🎓 Learn More

- **Full API Docs**: `AUTHENTICATION.md`
- **Examples**: `IMPLEMENTATION_GUIDE.md`
- **Project Overview**: `README.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`

---

## 🔗 API Endpoints Reference

```
POST /api/auth/super-admin/login              ← Start here
POST /api/auth/super-admin/create-school      ← Create school
POST /api/auth/school/login                   ← User login
POST /api/auth/school/users/teacher           ← Create teacher
POST /api/auth/school/users/student           ← Create student
POST /api/auth/school/users/bulk/teacher      ← Bulk teachers
POST /api/auth/school/change-password         ← Change password
POST /api/auth/school/reset-password/:id      ← Admin resets
```

---

## 💡 Pro Tips

1. **Use bulk create** for importing students → Saves time
2. **Share credentials securely** → Don't email passwords
3. **Encourage password change** → On first login
4. **Check audit logs** → See all auth actions
5. **Test with Postman** → Before frontend integration

---

**Last Updated**: June 2026  
**Version**: 1.0 Quick Reference
