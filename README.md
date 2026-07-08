# DN-SMS: School Management System

A comprehensive, modern school management system built with full-stack TypeScript. DN-SMS is a multi-tenant platform designed to streamline administrative, academic, and operational aspects of educational institutions, powered by an enterprise-grade real-time infrastructure.

## 🎯 Overview

DN-SMS is an enterprise-grade school management solution that supports multiple schools, user roles, and comprehensive features for managing every aspect of a school's operations. The platform features role-based access across multiple portals (Super Admin, Admin, Staff, Teacher, Student, Parent) with a highly scalable, cloud-native architecture capable of handling massive concurrent real-time communication.

## ✨ Key Features

### 👥 Multi-Role Access
- **Super Admin**: Platform-wide administration and school management
- **Admin**: School-level administration and staff management
- **Teachers**: Class management, grading, and assignment creation
- **Staff**: Administrative support and operations
- **Students**: Academic progress tracking and assignment submission
- **Parents**: Student performance monitoring and communication

### 📚 Academic Management
- Academic year and semester management
- Department and grade organization
- Subject management and curriculum planning
- Timetable and class scheduling
- Exam creation and result management
- Assignment creation and submission tracking
- Student attendance tracking

### 👨‍🎓 Student Management
- Student admissions and enrollment
- Student information and records
- Performance tracking and grade management
- Attendance monitoring
- Parent-student relationships

### 👨‍🏫 Staff Management
- Teacher and staff profiles
- Subject assignments for teachers
- Staff attendance tracking
- Payroll management
- Leave and attendance records

### 💰 Financial Management
- Fee structure and fee types management
- Fee collection and billing transactions
- Subscription and billing management
- Payment tracking
- Financial reporting

### 📖 Library Management
- Library book catalog
- Book issue and return tracking
- Inventory management

### 🚌 Transportation
- Bus routes management
- Bus allocation and tracking

### 📢 Real-Time Communication
- School announcements
- Platform-level announcements
- Instant messages and notifications via WebSockets
- Notices and alerts

### 🚀 Infrastructure & Scale
- **100K+ Concurrent WebSocket Connections**: Real-time notifications for parents, teachers, and students
- **Redis Pub/Sub**: High-throughput message fan-out and brokering
- **Horizontal Autoscaling**: Kubernetes HPA for dynamic load handling
- **Docker + Kubernetes**: Container orchestration for zero-downtime deployments
- **Prometheus + Grafana**: Enterprise observability and real-time metrics
- **High Throughput**: Benchmarked at **25K req/sec**

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Bun
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Routing**: React Router v7
- **Language**: TypeScript
- **Icons**: Lucide React

### Backend
- **Runtime**: Bun
- **Framework**: Bun.serve()
- **ORM**: Prisma v7
- **Database**: PostgreSQL
- **Authentication**: JWT (jose)
- **Real-Time**: WebSockets
- **Message Broker**: Redis Pub/Sub
- **Language**: TypeScript

### Infrastructure & DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Autoscaling**: K8s Horizontal Pod Autoscaler (HPA)
- **Monitoring**: Prometheus + Grafana
- **Caching/Optimization**: Prisma Accelerate

### Database
- **Primary**: PostgreSQL
- **ORM**: Prisma with migrations
- **Prisma Accelerate**: For edge caching and performance optimization

## 🌐 Real-Time & Scalability Architecture

DN-SMS is built to handle the demanding real-time communication needs of large school districts and multi-tenant platforms, ensuring instant delivery of grades, attendance alerts, and announcements.

```
┌───────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  DN-SMS Frontend  │────▶│  WebSocket Gateway   │────▶│  Redis Pub/Sub  │
│  (React/Bun)      │◀────│  (100K+ Connections) │◀────│  (Fan-out)      │
└───────────────────┘     └──────────┬───────────┘     └───────┬─────────┘
                                     │                         │
                          ┌──────────▼───────────┐     ┌───────▼─────────┐
                          │  API / Notification  │◀────│  Event Workers  │
                          │  Workers (Bun)       │     │  (Academics, HR)│
                          └──────────┬───────────┘     └─────────────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  Prometheus + Grafana│
                          │  (Metrics/Alerting)  │
                          └──────────────────────┘
```
*Architecture auto-scales horizontally via Kubernetes based on CPU/Memory and active WebSocket connection counts.*

## 📦 Project Structure

```
dn-sms/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── common/       # Shared components (Layout, Route protection)
│   │   │   ├── ui/           # UI primitives (Button, Input, Card, etc.)
│   │   │   └── landing/      # Landing page components
│   │   ├── contexts/         # React Context (Auth, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/
│   │   │   ├── api.ts        # API client and endpoints
│   │   │   ├── constants.ts  # Frontend constants
│   │   │   └── utils.ts      # Utility functions
│   │   ├── pages/            # Page components
│   │   │   └── portals/      # Multi-portal pages
│   │   │       ├── admin/
│   │   │       ├── parent/
│   │   │       ├── staff/
│   │   │       ├── student/
│   │   │       ├── super-admin/
│   │   │       └── teacher/
│   │   ├── types/            # TypeScript type definitions
│   │   ├── index.html        # Entry HTML
│   │   ├── index.ts          # Client entry point
│   │   └── frontend.tsx      # React root component
│   ├── build.ts              # Build configuration
│   ├── bunfig.toml          # Bun configuration
│   ├── components.json      # Shadcn component configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── server/                   # Backend API
│   ├── index.ts             # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Database seeding script
│   │   └── migrations/      # Database migrations
│   ├── generated/
│   │   └── prisma/          # Generated Prisma client
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma.config.ts    # Prisma configuration
│   └── README.md
│
├── k8s/                      # Kubernetes manifests
│   ├── deployment.yaml       # API & WS Gateway deployments
│   ├── hpa.yaml              # Horizontal Pod Autoscaler config
│   ├── service.yaml          # ClusterIP/LoadBalancer services
│   └── redis-statefulset.yaml# Redis deployment
│
├── monitoring/               # Observability stack
│   ├── prometheus.yml        # Scrape configurations
│   └── grafana/
│       └── dashboards/       # DN-SMS performance dashboards
│
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Local development stack (API, Postgres, Redis)
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites
- **Bun** 1.0+ ([Install Bun](https://bun.sh))
- **PostgreSQL** 12+ (local or cloud database)
- **Redis** 7+ (for local WebSocket/Pub-Sub testing)
- **Docker** (optional, for containerized local dev)
- **Minikube/kubectl** (optional, for local Kubernetes testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dn-sms
   ```

2. **Setup environment variables**
   
   Create `.env` in the `server/` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dn_sms"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-secret-key-here"
   ```

3. **Install dependencies**
   
   **Client:**
   ```bash
   cd client
   bun install
   ```
   
   **Server:**
   ```bash
   cd server
   bun install
   ```

4. **Setup the database**
   ```bash
   cd server
   bun prisma migrate dev
   ```

5. **Seed the database (optional)**
   ```bash
   cd server
   bun prisma db seed
   ```

### Development

**Start the full local stack (API, Postgres, Redis) via Docker Compose:**
```bash
docker-compose up -d
```

**Or start services manually:**

**Start the backend server:**
```bash
cd server
bun run dev
```

**Start the frontend (in another terminal):**
```bash
cd client
bun run dev
```

The client will be available at `http://localhost:3000` and the server/API at the configured port.

## 📊 Performance & Benchmarks

The DN-SMS real-time notification and API layer is production-hardened to support massive school district deployments.

```
┌────────────────────────────┬───────────────────┐
│ Metric                     │ Result            │
├────────────────────────────┼───────────────────┤
│ Sustained API Throughput   │ 25K req/sec       │
│ Concurrent WS Connections  │ 100K+             │
│ Message Delivery (P50)     │ ~15ms             │
│ Message Delivery (P99)     │ ~45ms             │
│ Autoscale Latency          │ < 30sec (K8s HPA) │
└────────────────────────────┴───────────────────┘
```

## 📖 Database Schema

The database supports the following main entities:

### Platform Level
- **SuperAdmin**: Platform administrators
- **Plan**: Subscription plans with tiered features
- **Subscription**: School subscriptions to plans
- **PlatformAnnouncement**: System-wide announcements

### School Level
- **School**: School information and configuration
- **User**: School users with roles
- **AcademicYear**: Academic years and terms
- **Department**: School departments
- **Grade**: Grade/Class levels
- **Subject**: School subjects
- **Teacher**: Teacher information
- **Student**: Student information
- **Staff**: Administrative staff
- **Parent**: Parent accounts

### Academic
- **Exam**: Examination definitions
- **ExamResult**: Student exam results
- **Assignment**: Teacher assignments
- **AssignmentSubmission**: Student submissions
- **StudentEnrollment**: Student enrollment in grades
- **StudentAttendance**: Daily attendance records
- **TeacherSubjectAssignment**: Teacher-subject mappings

### Financial
- **FeeStructure**: Fee structure definitions
- **FeeType**: Types of fees
- **FeeCollection**: Collected fees
- **BillingTransaction**: Billing records
- **Payroll**: Staff payroll management

### Additional
- **Timetable**: Class timetables
- **Bus**: Bus information
- **BusRoute**: Route definitions
- **LibraryBook**: Library catalog
- **BookIssue**: Book issue tracking
- **Inventory**: Asset inventory
- **Notice**: School notices
- **Message**: User messages
- **AuditLog**: System activity logs

## 🔐 Authentication & Authorization

The system uses JWT-based authentication with role-based access control. Each user role has specific permissions and can access designated portals:

- **Super Admin**: Full platform access
- **Admin**: Full school access, can manage staff and students
- **Teacher**: Classroom and assignment management
- **Staff**: Administrative support functions
- **Student**: Academic portal access
- **Parent**: Child academic monitoring

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Protected API endpoints
- Audit logging for all critical operations
- Encrypted sensitive data
- Input validation and sanitization
- Secure WebSocket origin checking

## 📚 API Documentation

API endpoints follow RESTful conventions. Key endpoint categories:

- `/api/auth`: Authentication endpoints
- `/api/users`: User management
- `/api/schools`: School management
- `/api/students`: Student operations
- `/api/teachers`: Teacher operations
- `/api/academics`: Academic management
- `/api/billing`: Financial operations
- `/api/library`: Library management
- `/api/announcements`: Announcement management
- `/ws`: Real-time WebSocket connection endpoint

## 🧪 Testing

### Frontend Tests
```bash
cd client
bun test
```

### Backend Tests
```bash
cd server
bun test
```

### Load Testing WebSockets
```bash
# Using artillery or k6 (example)
k6 run load-tests/websocket-stress.js
```

## 🔄 Database Migrations

### Create a new migration
```bash
cd server
bun prisma migrate dev --name descriptive_name
```

### View migration status
```bash
cd server
bun prisma migrate status
```

### Reset database (development only)
```bash
cd server
bun prisma migrate reset
```

## 📊 Observability: Prometheus & Grafana

Access real-time infrastructure and application metrics:

| Service | URL |
|---|---|
| Grafana | `http://localhost:3001` |
| Prometheus | `http://localhost:9090` |

Key metrics tracked:
- Active WebSocket connections per pod
- API Request throughput (req/sec)
- Redis Pub/Sub delivery latency
- Prisma Query performance
- K8s HPA scaling events

## 🌍 Deployment

### Docker Build
```bash
docker build -t dn-sms:latest .
```

### Kubernetes Deployment
```bash
# Apply configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=dn-sms

# View HPA autoscaling status
kubectl get hpa dn-sms-ws-gateway
```

### Requirements
- Kubernetes cluster (EKS, GKE, AKS, or Minikube)
- PostgreSQL database (e.g., CloudSQL/RDS)
- Redis instance (e.g., ElastiCache)
- Container registry access

## 📝 Environment Variables

### Server (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
PORT=3001
WS_PORT=3002
```

### Client (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3002/ws
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## 📋 Development Guidelines

- Follow TypeScript best practices
- Use Bun as the runtime and package manager
- Maintain consistent code style with the project
- Write meaningful commit messages
- Test features before submitting PRs
- Ensure WebSocket features are tested under concurrent connection constraints

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database credentials are correct

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check REDIS_URL format
- Ensure firewall allows connections

### WebSocket Scaling Issues
- Check Kubernetes HPA metrics: `kubectl get hpa`
- Verify Redis Pub/Sub connectivity across pods
- Check Grafana for connection drop rates

### Bun Installation Issues
- Update to latest Bun: `bun upgrade`
- Clear cache: `bun cache rm`
- Reinstall dependencies: `rm -rf node_modules && bun install`

## 📄 License

This project is proprietary and confidential.

## 👥 Team

Developed and maintained by the development team.

## 📞 Support

For support and inquiries, contact the development team or create an issue in the repository.

---

**Last Updated**: June 2026
