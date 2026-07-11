# DN-SMS: School Management System Project Overview

DN-SMS is a modern, enterprise-grade, multi-tenant, and multi-role **School Management System** built with a full-stack TypeScript architecture. The project leverages **Bun** as its primary runtime and compiler, **React 19** with **Tailwind CSS v4** for a modular and highly interactive frontend UI, and **Prisma ORM** with **PostgreSQL** for data management.

This document provides a developer-focused overview of the repository structure, system architecture, database schema, and key application workflows.

---

## 🏗️ System Architecture

DN-SMS operates on a two-tiered hierarchy to manage multiple schools under a single host instance while keeping data completely isolated:

```mermaid
graph TD
    subgraph Platform Level
        SA[Super Admin] -->|Manages| PL[Plans & Subscriptions]
        SA -->|Manages| S[Schools Directory]
        SA -->|Broadcasts| PA[Platform Announcements]
    end

    subgraph School Level (Multi-Tenant)
        S -->|Hosts| Sch[School Instance]
        Sch -->|Managed by| AD[School Admin]
        AD -->|Creates & Directs| T[Teachers]
        AD -->|Creates & Directs| ST[Staff]
        AD -->|Admits| SD[Students]
        AD -->|Links| PR[Parents]
        
        T -->|Coordinates| C[Classes & Grading]
        ST -->|Handles| OP[Operations: Inventory, Payroll, Discipline]
        SD -->|Submits| HW[Assignments & Exams]
        PR -->|Monitors| SD
    end
```

---

## 🛠️ Technology Stack

### Frontend Client
- **Framework & Libraries**: [React 19](https://react.dev/), [React Router v7](https://reactrouter.com/) (using lazy loading for efficient code-splitting), [Radix UI](https://www.radix-ui.com/) primitives.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom configuration (injected via `@/styles/index.css`).
- **Icons**: [Lucide React](https://lucide.dev/).
- **Bundler & Dev Server**: [Bun's compiler runtime](https://bun.sh/) directly targeting browser environment outputs via a custom build pipeline (`build.ts`).

### Backend Server
- **Runtime**: [Bun Runtime](https://bun.sh/) (utilizing high-performance `Bun.serve()`).
- **Framework & HTTP Router**: Custom middleware & matching routes built directly on `Request`/`Response` APIs (no external frameworks like Express/Koa).
- **ORM & Database**: [Prisma ORM v7](https://www.prisma.io/) with a [PostgreSQL](https://www.postgresql.org/) database backend.
- **Security & Session**: JWT-based session tokens with role check middlewares, rate-limiters on authentication endpoints, and password hashing using native `Bun.password`.

---

## 📦 Project Directory Structure

The project is structured as a monorepo with dedicated `client/` and `server/` subfolders:

```
dn-sms/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/        # Shared components and Shadcn UI primitives
│   │   │   ├── common/        # Router protections (ProtectedRoute) & layouts
│   │   │   └── ui/            # UI components (Buttons, Dialogs, Cards)
│   │   ├── contexts/          # React contexts (e.g., AuthContext)
│   │   ├── hooks/             # Custom React hooks (e.g., useSuperAdminDashboard)
│   │   ├── lib/               # Utility scripts & API client (api.ts)
│   │   ├── pages/             # Eagerly loaded public and landing pages
│   │   ├── portals/           # Multi-portal components, views, and navigation configuration
│   │   │   ├── admin/         # School Administrator Portal
│   │   │   ├── parent/        # Student Parent Portal
│   │   │   ├── staff/         # Administrative Staff Portal
│   │   │   ├── student/       # Student Portal
│   │   │   ├── super-admin/   # Super Admin Platform Dashboard
│   │   │   └── teacher/       # Teacher Portal
│   │   └── frontend.tsx       # React entry mount point
│   ├── build.ts               # Custom build compilation script for Bun production bundling
│   └── package.json           # Frontend dependencies
│
├── server/                    # Backend API
│   ├── index.ts               # Core server app, middlewares, and API routing (Monolithic backend)
│   ├── auth.handlers.ts       # Auth handlers & business logic (create school, users, logins, resets)
│   ├── auth.utils.ts          # Helpers for generating emails, secure passwords, and unique IDs
│   ├── prisma/
│   │   ├── schema.prisma      # Comprehensive Prisma database schema
│   │   └── seed.ts            # Seeding scripts for plans, mock schools, and portal users
│   └── package.json           # Backend runtime scripts & dependencies
│
├── README.md                  # Quick setup and technology details
├── SETUP_GUIDE.md             # In-depth setup, local environment variables, and testing guide
├── AUTHENTICATION.md          # Multi-tenant Authentication design and complete API reference
├── QUICK_REFERENCE.md         # Auth API cheat sheet and usage examples
├── CASCADE_DELETE_SUMMARY.md  # Detailed overview of cascading deletion configurations
└── CASCADE_DELETE_DYNAMIC_UI.md # Overview of dynamic updates and dashboard UI transitions
```

---

## 🗄️ Database Schema & Models

The database schema in [schema.prisma](file:///c:/Users/91707/OneDrive/Desktop/Workspace/Projects/dn-sms/dn-sms/server/prisma/schema.prisma) features over 50 interconnected tables. They can be conceptualized in the following model categories:

### 1. Platform & Subscription Management
- **`SuperAdmin`**: Manages platform global settings, plan structures, and schools.
- **`Plan`**: Subscription plans defining limits (max students, max teachers, storage limits, active features).
- **`Subscription`**: Records active subscription periods, pricing structure, and limits mapped to individual schools.
- **`BillingTransaction`**: Chronological log of subscription payments.
- **`PlatformAnnouncement`**: System-wide notifications broadcasted to all schools.

### 2. School Core Setup
- **`School`**: Defines the tenant. Fields contain name, slug, principal info, capacities, type, status, and geographical coordinates.
- **`AcademicYear`**: Defines school calendar periods (e.g. standard Gregorian or Nepali BS Year like "2081/82 BS").
- **`Department`**: Departmental structures mapping courses, subjects, and staff.
- **`Grade`**: Academic grades (e.g., Grade 9, Grade 10).
- **`Section`**: Subdivisions within grades (e.g., Section A, Section B) with set student capacities.
- **`Subject`**: Academic subjects (e.g., Mathematics, Science) with codes and credit hours.

### 3. Users, Profiles, and Roles
- **`User`**: Core authentication model. Scoped with unique emails *within* each school. Roles include `ADMIN`, `TEACHER`, `STAFF`, `STUDENT`, and `PARENT`.
- **`UserProfile`**: Stores names, phone numbers, genders, dates of birth, and avatar media references.
- **`Student` & `StudentEnrollment`**: Links academic profiles, admission details, roll numbers, sections, and parent bindings.
- **`Teacher` & `TeacherSubjectAssignment`**: Maps teaching credentials, qualifications, and class/subject allocations.
- **`Staff`**: Records non-teaching personnel designations (e.g. Accountant, Librarian, Bus Supervisor, Schedule Manager).
- **`Parent` & `ParentStudent`**: Relational tables linking parents/guardians to one or multiple students within a school.

### 4. Academics & Grading
- **`Exam` & `ExamSubject`**: Manages school-wide exams, full/pass marks, schedule slots, and categories.
- **`ExamResult`**: Links students to their grades, marks obtained, remarks, and GPA assessments.
- **`Assignment` & `AssignmentSubmission`**: Enables teachers to assign homework and track student attachments, submission status, and feedback grades.
- **`Timetable` & `TimetableSlot`**: Maps schedule routines for classes, subjects, classrooms, and teacher timings.
- **`StudentAttendance` & `StaffAttendance`**: Daily clock-in/out records tracking presence, absence, or tardiness.

### 5. Operations & Assets
- **`LibraryBook` & `BookIssue`**: Catalog of library inventory with check-out dates, return dates, and fine tracking.
- **`Bus` & `BusRoute`**: Fleet logistics monitoring driver details, stop points, bus capacities, and student assignments.
- **`Inventory`**: School asset tracking (e.g., computers, books, science lab materials).
- **`AuditLog`**: Logs all administrative and authentication changes with metadata for auditing.
- **`LeaveApplication`**: Leave requests for teachers and staff with approval tracking.
- **`TeacherEvaluation`**: Student-led or admin-led teacher rating metrics.
- **`DisciplineRecord`**: Conduct violations, warnings, or suspension records.

---

## 🔄 Core System Workflows

### 1. Multi-Tenant School Onboarding
When a school signs up, the platform establishes strict data isolation bounds:
1. **Super Admin** triggers school registration.
2. The server sanitizes the school name into a unique **School Slug** (e.g., `bagmati-secondary`).
3. An administrative **User** is automatically created for the new school with a random 12-character secure password, flagged as a temporary credential requiring reset on first login.
4. Future API requests are validated using middleware (`authSchoolUser`) that validates the user's token and extracts the `schoolId` context, ensuring they can only CRUD data corresponding to their school.

### 2. Auto-Credential Generation
To simplify account provisioning:
- **ID format**: Generates custom prefix structures (`TEA_SCHOOLPREFIX_RANDOM` or `STU_SCHOOLPREFIX_RANDOM`).
- **Emails**: Automatically formatted using their first name, last name, and school URL structure (e.g., `bibek.kc@bagmati.edu.np`).
- **Passwords**: Raw random strings are securely displayed once to the administrator during creation and stored as cryptographic bcrypt hashes in the database.

### 3. Cascading Deletion Mechanism
To prevent orphaned references and data clutter, a multi-tier cascade delete is configured at the ORM layer. Deleting a `School` automatically cleanses the database of all:
- Subscriptions & Billing history.
- Class structures, Grades, Sections, and Subjects.
- User accounts, Profiles, Students, Teachers, Staff, and Parent links.
- Exams, Results, Assignments, Timetables, and Attendance records.
- Logs, Notices, Buses, Library books, and Inventory assets.

### 4. Real-time Admin Dashboards
The Super Admin dashboard (`client/src/portals/super-admin/pages/Dashboard.tsx`) features:
- **Stat Highlights**: Total schools, subscriber counts, and active plans updated in real-time.
- **Optimistic UI Updates**: Immediately updates the table display and animates counts downward during school deletions before the server completes the database sweep.
- **Auto-Refresh Toggle**: Utilizes custom hooks (`useSuperAdminDashboard`) to query metrics via short-polling interval loops.

---

## ⚡ Setup and Execution Quick Links

To get your development environment running quickly:
1. **Install Bun Dependencies**: Run `bun install` in both `/client` and `/server`.
2. **Environment Configuration**: Setup databases using variables specified in [SETUP_GUIDE.md](file:///c:/Users/91707/OneDrive/Desktop/Workspace/Projects/dn-sms/dn-sms/SETUP_GUIDE.md).
3. **Database Migration & Seeding**: Run `bun prisma migrate dev` and `bun prisma db seed` in `/server`.
4. **Boot App**:
   - Backend: Run `bun run dev` inside `/server` (ports onto `:4000`).
   - Frontend: Run `bun run dev` inside `/client` (ports onto `:3000`).
5. **API Reference**: Check [AUTHENTICATION.md](file:///c:/Users/91707/OneDrive/Desktop/Workspace/Projects/dn-sms/dn-sms/AUTHENTICATION.md) and [QUICK_REFERENCE.md](file:///c:/Users/91707/OneDrive/Desktop/Workspace/Projects/dn-sms/dn-sms/QUICK_REFERENCE.md).
