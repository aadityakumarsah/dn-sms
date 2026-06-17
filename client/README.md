# DN-SMS — School Management System (SaaS)

A modern, multi-tenant SaaS School Management System built for Nepal's schools, colleges, and universities.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| UI Framework | React 19 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix UI) |
| Icons | Lucide React |
| Language | TypeScript |

---

## Portals

| Portal | Route | Who Uses It |
|--------|-------|-------------|
| 🏛️ Super Admin | `/super-admin` | SaaS founder — manage all schools, plans, billing |
| 🏫 Admin | `/admin` | School principal/admin — manage the school |
| 👩‍🏫 Teacher | `/teacher` | Teachers — classes, attendance, grades |
| 🧑‍💼 Staff | `/staff` | Non-teaching staff — payroll, inventory |
| 👨‍👩‍👧 Parent | `/parent` | Parents — monitor child's progress & fees |
| 🎒 Student | `/student` | Students — schedule, results, notices |

---

## Folder Structure

```
client/
├── src/
│   ├── index.ts                  # Bun server entry
│   ├── index.html                # HTML shell
│   ├── frontend.tsx              # React root mount
│   ├── App.tsx                   # Root router & all route definitions
│   │
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types (User, School, NavItem…)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth state, login/logout, mock users
│   │
│   ├── lib/
│   │   ├── utils.ts              # cn() tailwind utility
│   │   └── constants.ts          # Portal configs, role→route map, app name
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitive components
│   │   └── common/
│   │       ├── PortalLayout.tsx  # Shared sidebar + topbar for all portals
│   │       ├── ProtectedRoute.tsx# Role-based route guard
│   │       └── StatCard.tsx      # Reusable stats card widget
│   │
│   ├── pages/
│   │   ├── Landing.tsx           # Public marketing/landing page
│   │   └── auth/
│   │       └── Login.tsx         # Portal selector + login form
│   │
│   └── portals/
│       ├── super-admin/
│       │   ├── layout/nav.ts
│       │   └── pages/
│       │       ├── Dashboard.tsx
│       │       └── Schools.tsx
│       ├── admin/
│       │   ├── layout/nav.ts
│       │   └── pages/
│       │       ├── Dashboard.tsx
│       │       └── Students.tsx
│       ├── teacher/
│       │   ├── layout/nav.ts
│       │   └── pages/Dashboard.tsx
│       ├── staff/
│       │   ├── layout/nav.ts
│       │   └── pages/Dashboard.tsx
│       ├── parent/
│       │   ├── layout/nav.ts
│       │   └── pages/Dashboard.tsx
│       └── student/
│           ├── layout/nav.ts
│           └── pages/Dashboard.tsx
└── README.md
```

---

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server (with HMR)
bun dev

# Build for production
bun run build
```

The server runs at **http://localhost:3000** by default.

---

## Demo Login

On the login page, select any portal and enter **any email + any password** to log in.

| Portal | Logged in as |
|--------|-------------|
| Super Admin | Aaditya Shrestha |
| Admin | Ramesh Sharma |
| Teacher | Sita Thapa |
| Staff | Hari Prasad |
| Parent | Kamala Devi |
| Student | Bibek KC |

---

## Architecture Decisions

### Multi-tenancy
Each school (`schoolId`) is a tenant. The Super Admin portal operates across all tenants. Every other portal is scoped to a single `schoolId` derived from the logged-in user's profile.

### Role-Based Access
`ProtectedRoute` checks `user.role` against `allowedRoles`. Unauthenticated users redirect to `/login`. Wrong-role users also redirect to `/login`.

### Portal Isolation
Each portal lives under `src/portals/<role>/`. Nav items (`layout/nav.ts`) and pages are fully isolated. Adding a feature to the teacher portal never touches admin code.

### Shared Layout
`PortalLayout` (sidebar + topbar) is shared across all portals. It reads `user.role` to apply the correct accent color and renders the portal-specific `navItems` array.

---

## Roadmap — Features to Build

### Core Modules
- [ ] Student admission & profile management
- [ ] Teacher profile & subject assignment
- [ ] Class & section management
- [ ] Timetable builder
- [ ] Attendance (daily + period-wise)
- [ ] Exam & grade management (NEB format)
- [ ] Fee collection & receipts (eSewa / Khalti)
- [ ] Payroll & salary slips
- [ ] Library management
- [ ] Transport tracking

### Communication
- [ ] Notice board
- [ ] In-app messaging (teacher ↔ parent)
- [ ] SMS gateway (Sparrow SMS / Aakash SMS)
- [ ] Push notifications

### Reports
- [ ] Student progress report card (NEB format)
- [ ] Attendance summary PDF export
- [ ] Fee collection report
- [ ] Class-wise performance analytics

### Platform (Super Admin)
- [ ] School onboarding workflow
- [ ] Plan & subscription management (monthly/annual)
- [ ] Usage analytics dashboard
- [ ] Custom branding per school

### Nepal-Specific
- [ ] Bikram Sambat (BS) calendar
- [ ] NEB grading system (GPA + percentage)
- [ ] Multi-language (Nepali + English)
- [ ] Nepal district/province data for addresses

---

## Backend Integration

The `src/index.ts` Bun server currently serves only the SPA. To integrate with the backend (`../server`):

1. Add proxy routes or API handlers in `src/index.ts`
2. Replace mock data in `AuthContext.tsx` with real API calls
3. Use httpOnly cookies for token storage (more secure than localStorage)
4. Add a global API client in `src/lib/api.ts`

---

## Adding a New Portal Page

1. Create `src/portals/<role>/pages/YourPage.tsx`
2. Add the nav item in `src/portals/<role>/layout/nav.ts`
3. Register the route in `src/App.tsx` inside the correct portal `<Route path="/<role>/*">` block
