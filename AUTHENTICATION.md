# DN-SMS Multi-Tenant, Multi-Role Authentication System

## Overview

This document describes the complete authentication and user management flow for DN-SMS, a hierarchical multi-tenant school management system.

## 🏗️ System Architecture

### Hierarchy
```
Platform (DN-SMS)
├── Super Admin (manages all schools & platform)
└── Schools
    ├── Admin (principal - manages school)
    │   ├── Teachers (create & manage classes)
    │   ├── Staff (administrative support)
    │   ├── Students (enrolled & managed)
    │   └── Parents (linked to students)
```

### Database Structure

**SuperAdmin Model**: Platform-level administrators
```
- id: unique identifier
- email: unique email
- password: hashed password
- name: full name
```

**School Model**: School instance with unique slug
```
- id: unique identifier
- name: school name
- slug: unique URL-friendly identifier (auto-generated/sanitized)
- status: TRIAL | ACTIVE | SUSPENDED | PAUSED | INACTIVE
- subscription: linked Plan subscription
- ... (other school details)
```

**User Model**: School users (one per school per email)
```
- id: unique identifier
- schoolId: foreign key to School
- email: email (unique within school)
- password: hashed password
- role: ADMIN | TEACHER | STAFF | PARENT | STUDENT
- status: ACTIVE | INACTIVE | SUSPENDED
- lastLoginAt: timestamp
- profile: UserProfile relation
```

**UserProfile Model**: Extended user information
```
- userId: foreign key to User
- firstName: first name
- lastName: last name
- phone: phone number
- avatar: avatar URL
- gender: MALE | FEMALE | OTHER
- dateOfBirth: date of birth
```

## 🔐 Authentication Flow

### 1. Super Admin Login
```
POST /api/auth/super-admin/login
Body: { email, password }
Response: { token, user: { id, name, email, role: "super_admin" } }
```

### 2. Create School with Admin Credentials
Only Super Admin can create schools. Each school is created with initial admin credentials.

```
POST /api/auth/super-admin/create-school
Auth: Bearer {superAdminToken}
Body: {
  name: "School Name",
  slug?: "custom-slug",  // optional, auto-generated if not provided
  adminEmail?: "admin@school.edu.np",  // optional, auto-generated if not provided
  adminPassword?: "password123",  // optional, auto-generated if not provided
  principalName?: "Principal Name",
  city: "Kathmandu",
  // ... other school details
}
Response: {
  school: { id, name, slug, ... },
  admin: { userId, email, password, temporaryPassword: true }
}
```

**Generated Credentials Format**:
- **School Slug**: `sanitized-school-name` (lowercase, hyphens, unique with timestamp if needed)
- **Admin Email**: If not provided, auto-generated as `ADMIN_SCHOOLPREFIX_TIMESTAMP@schoolslug.local`
- **Admin Password**: 12-character random alphanumeric + special characters

### 3. School User (Admin, Teacher, Staff, Student, Parent) Login
```
POST /api/auth/school/login
Body: { email, password, schoolSlug }
Response: {
  token,
  user: {
    id,
    email,
    name,
    role: "admin" | "teacher" | "staff" | "parent" | "student",
    schoolId,
    schoolName,
    schoolSlug
  }
}
```

## 👥 User Management (Admin)

### Create Single User
Admin can create users for different roles. Credentials are auto-generated if not provided.

```
POST /api/auth/school/users/:role
Auth: Bearer {adminToken}
Body: {
  email?: "user@school.edu.np",  // optional, auto-generated if not provided
  password?: "password123",  // optional, auto-generated if not provided
  firstName: "First Name",
  lastName: "Last Name",
  phone?: "+977-1-1234567",
  // ... other profile fields
}
Response: {
  user: { id, email, role, ... },
  credentials: { userId, email, password, temporaryPassword: true }
}
```

**Supported Roles**: `teacher`, `staff`, `student`, `parent`

**Generated User ID Format**:
- Format: `{ROLE}_{SCHOOLSLUG}_{RANDOM}`
- Examples:
  - Teacher: `TEA_KTM_A1B2C3`
  - Student: `STU_KTM_X9Y8Z7`
  - Staff: `STA_KTM_M5N4O3`
  - Parent: `PAR_KTM_P2Q1R0`

### Create Bulk Users
Create multiple users of the same role in one request.

```
POST /api/auth/school/users/bulk/:role
Auth: Bearer {adminToken}
Body: {
  users: [
    { email?, password?, firstName, lastName, phone?, ... },
    { email?, password?, firstName, lastName, phone?, ... },
    // ...
  ]
}
Response: {
  created: 10,
  users: [ /* array of created users with credentials */ ]
}
```

### Reset User Password (Admin Only)
Admin can reset any user's password in their school.

```
POST /api/auth/school/reset-password/:userId
Auth: Bearer {adminToken}
Response: {
  credentials: { userId, email, password, temporaryPassword: true },
  message: "Password reset successfully..."
}
```

## 🔑 Account Management (All Users)

### Get Current User Details
```
GET /api/auth/school/me
Auth: Bearer {token}
Response: {
  id, email, name, role, schoolId, schoolName, schoolSlug, status, lastLoginAt
}
```

### Change Password (Self)
```
POST /api/auth/school/change-password
Auth: Bearer {token}
Body: { currentPassword, newPassword }
Response: { success: true, message: "..." }
```

## 🔄 Complete User Lifecycle Example

### Scenario: New School Onboarding

#### 1. Super Admin Creates School
```bash
curl -X POST http://localhost:4000/api/auth/super-admin/create-school \
  -H "Authorization: Bearer {superAdminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kathmandu Public School",
    "principalName": "Dr. Ramesh Kumar",
    "city": "Kathmandu",
    "district": "Kathmandu",
    "province": "Bagmati"
  }'
```

**Response:**
```json
{
  "school": {
    "id": "school-id-123",
    "name": "Kathmandu Public School",
    "slug": "kathmandu-public-school-1718700000000",
    "city": "Kathmandu",
    "status": "TRIAL"
  },
  "admin": {
    "userId": "user-admin-123",
    "email": "ADMIN_KAT_1718700000@kathmandu-public-school-1718700000000.local",
    "password": "SecureP@ss9876",
    "temporaryPassword": true
  }
}
```

#### 2. Admin Logs In
```bash
curl -X POST http://localhost:4000/api/auth/school/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ADMIN_KAT_1718700000@kathmandu-public-school-1718700000000.local",
    "password": "SecureP@ss9876",
    "schoolSlug": "kathmandu-public-school-1718700000000"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-admin-123",
    "email": "admin@kps.edu.np",
    "name": "Dr. Ramesh Kumar",
    "role": "admin",
    "schoolId": "school-id-123",
    "schoolName": "Kathmandu Public School",
    "schoolSlug": "kathmandu-public-school-1718700000000"
  }
}
```

#### 3. Admin Creates Teacher
```bash
curl -X POST http://localhost:4000/api/auth/school/users/teacher \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sita.poudel@kps.edu.np",
    "firstName": "Sita",
    "lastName": "Poudel",
    "phone": "+977-1-4123456"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "user-teacher-456",
    "email": "sita.poudel@kps.edu.np",
    "role": "TEACHER",
    "schoolId": "school-id-123"
  },
  "credentials": {
    "userId": "user-teacher-456",
    "email": "sita.poudel@kps.edu.np",
    "password": "TempPass@123456",
    "temporaryPassword": true
  }
}
```

#### 4. Teacher Changes Password
```bash
curl -X POST http://localhost:4000/api/auth/school/change-password \
  -H "Authorization: Bearer {teacherToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TempPass@123456",
    "newPassword": "MySecurePassword@2024"
  }'
```

#### 5. Admin Bulk Creates Students
```bash
curl -X POST http://localhost:4000/api/auth/school/users/bulk/student \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "firstName": "Bibek",
        "lastName": "Sharma",
        "phone": "+977-1-4111111"
      },
      {
        "firstName": "Anita",
        "lastName": "Dhakal",
        "phone": "+977-1-4122222"
      }
    ]
  }'
```

## 🔒 Security Features

1. **Password Hashing**: All passwords are hashed using Bun's secure `Bun.password.hash()`
2. **JWT Tokens**: 7-day expiration, signed with JWT_SECRET
3. **School Isolation**: Users can only access resources within their school
4. **Role-Based Access Control (RBAC)**: Each route validates user role
5. **Audit Logging**: All auth-related actions are logged
6. **Status Checks**: Only ACTIVE users can login; suspended/inactive users are blocked
7. **School Status Validation**: SUSPENDED/INACTIVE schools cannot be accessed

## 📊 Auto-Generated Credentials

### Email Format
- **Teacher/Staff/Parent**: `{firstName.lastName}@{schoolSlug}.edu.np`
- **Student**: `{admissionNo}@{schoolSlug}.edu.np` or `student_{rollNo}@{schoolSlug}.edu.np`
- **Default Fallback**: `{userId}@{schoolSlug}.local`

### Password Format
- 12 characters
- Mix of uppercase, lowercase, numbers, and special characters (!@#$%^&*)
- Randomly generated using cryptographically secure methods

### User ID Format
- Pattern: `{ROLE}_{SCHOOLSLUG}_{RANDOM}`
- Examples: `TEA_KPS_X1Y2Z3`, `STU_KPS_A9B8C7`

## 🚀 Frontend Integration

### Login Component Flow
1. User selects role (Admin, Teacher, Staff, Student, Parent)
2. User enters email, password, and school slug
3. Frontend calls `POST /api/auth/school/login`
4. Token and user data stored in localStorage
5. User redirected to role-specific portal

### Protected Routes
- Use `useAuth()` hook to get current user
- Validate role for specific features
- Redirect to login if token expired

### Update Password
- User navigates to account settings
- Enters current password and new password
- Calls `POST /api/auth/school/change-password`
- Session remains active after password change

## 📝 Environment Variables

```env
# Server
DATABASE_URL=postgresql://user:pass@localhost/db_name
JWT_SECRET=your-secret-key-min-32-chars
PORT=4000

# Frontend
PUBLIC_API_URL=http://localhost:4000
```

## ✅ Testing

### Manual Testing Flow

1. **Create School**
   - Login as Super Admin
   - Create a school through API or UI
   - Note the returned admin credentials

2. **Login as Admin**
   - Use returned admin credentials
   - Verify access to admin portal

3. **Create Users**
   - As admin, create teacher/student/staff
   - Save returned credentials

4. **Login as Different Roles**
   - Test each role with created credentials
   - Verify role-specific portals work

5. **Test Features**
   - Change password (as any user)
   - Reset password (as admin for other users)
   - Verify audit logs for actions

## 🐛 Troubleshooting

### "School not found"
- Verify school slug is correct
- Check school status (not SUSPENDED/INACTIVE)

### "Invalid credentials"
- Verify email exists in school
- Check password is correct
- Confirm user status is ACTIVE

### "Unauthorized"
- Check JWT token is valid
- Verify token has not expired (7 days)
- Confirm user role matches endpoint requirements

### "User not found"
- Ensure user is in same school
- Check user status is ACTIVE

## 📚 API Endpoints Summary

```
Authentication
POST   /api/auth/super-admin/login              - Super admin login
GET    /api/auth/super-admin/me                 - Get super admin details
POST   /api/auth/super-admin/create-school      - Create school with admin
POST   /api/auth/school/login                   - School user login
GET    /api/auth/school/me                      - Get current user details
POST   /api/auth/school/change-password         - Change own password

User Management (Admin only)
POST   /api/auth/school/users/:role             - Create single user
POST   /api/auth/school/users/bulk/:role        - Create multiple users
POST   /api/auth/school/reset-password/:userId  - Reset user password
```

---

**Last Updated**: June 2026  
**Version**: 1.0.0
