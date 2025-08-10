// docs/architecture.md

# 🏛️ Architecture Document: Let's Talk (Next.js Monolith on VPS)

## 1. Introduction

This document outlines the technical architecture for the **Let's Talk** project, an education platform enabling students to enroll in courses, access resources, and attend live classes, while teachers manage content and administrators oversee the platform.

This version reflects a **monolithic Next.js application hosted on a Virtual Private Server (VPS)**. The application includes the frontend, NextAuth.js for authentication, and a tRPC API (via Next.js API routes). A **MySQL database** is used for data persistence. Video content is delivered via Cloudflare CDN. Payments for paid courses are handled via a **manual verification flow**: users are provided payment instructions (QR code/bank details) and a unique reference ID, make the payment externally, and then upload proof (e.g., a screenshot) to the platform. This proof is later reviewed by an administrator to activate enrollment.

The architecture aims for type safety, maintainability, and a good developer experience using established Node/React-stack patterns combined with modern tooling, self-hosted on a VPS.

## 2. Architectural Goals & Principles

- **Modularity:** Separate concerns using a structured Next.js application layout (e.g., `src/app` for frontend routes/UI, `src/server` for backend logic including tRPC routers and NextAuth config, `prisma/` for database schema).
- **Scalability:** The VPS can be scaled vertically (more resources). The manual payment review process is a potential bottleneck for enrollment scalability if volume becomes high. Video content delivery is scalable via Cloudflare CDN.
- **Developer Experience:** Employ popular and well-documented technologies (Next.js, TypeScript, Node.js, Prisma, MySQL, tRPC, NextAuth.js, FFmpeg, Plyr.io) with strong tooling support.
- **Maintainability:** Enforce type safety using TypeScript across the stack. Structure code logically within the `src/` directory.
- **Type Safety:** Leverage tRPC for end-to-end type safety between the frontend and backend.
- **Flexible Authentication:** Use NextAuth.js for robust authentication.
- **Performance:** Utilize Next.js features for frontend optimization. Backend performance depends on API implementation, database optimization, and VPS resources. Video delivery is optimized through CDN usage.
- **Cost-Effectiveness:** Opt for cost-effective solutions like VPS hosting and manual payment review initially. Video hosting via Cloudflare R2 & CDN is cost-effective. File storage for payment proofs will also be considered for cost.

## 3. High-Level Architecture

The system is a monolithic Next.js application hosted on a VPS. The Next.js app serves the frontend, NextAuth.js authentication routes, and the tRPC API. It connects to a managed MySQL database. Video assets are processed with FFmpeg, stored in Cloudflare R2, and served via Cloudflare CDN. The manual payment proof upload and subsequent admin review are key parts of the enrollment flow for paid courses.

```mermaid
graph TD
    A[User (Browser)] --> B{Next.js App @ VPS};
    B -- Serves --> A;
    B -- tRPC Client Calls (src/trpc) --> B;
    B -- NextAuth.js Client/Server Interaction --> B;
    B -- Prisma Client (src/server/db) --> D[(MySQL @ PlanetScale / RDS / Other)];

    subgraph NextJsApp_on_VPS ["Next.js Application (on VPS)"]
        direction LR
        P_Frontend[src/app - Frontend UI, App Router]
        P_ApiRoutes[src/app/api - NextAuth & tRPC Routes]
        P_ServerLogic[src/server - Backend Logic (tRPC routers, Auth config, DB client, Payment Logic)]
        P_Prisma[prisma - Prisma Schema/Migrations]
    end

    subgraph ManualPaymentStudentFlow ["Manual Payment (Student-Side)"]
        direction TB
        MP_PayInfo[User sees Payment Info + Unique Ref ID on Platform] --> MP_UserPays[User Pays Manually (External App)];
        MP_UserPays --> MP_UploadProof[User Uploads Screenshot to Platform];
        MP_UploadProof --> B; // Proof submitted to Next.js App
    end
    B -- Serves Payment UI & Upload Form --> MP_PayInfo;

    subgraph VideoDelivery ["Video Delivery Infrastructure"]
        direction TB
        VD_Enc[FFmpeg Encoding (Local/Scripted)] --> VD_R2[Cloudflare R2 Storage];
        VD_R2 --> VD_CDN[Cloudflare CDN];
    end

    B -- Plyr.io Player uses URL from API --> VD_CDN;
    B -- Provides Video Metadata (URL) --> A;


    style B fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#9c9,stroke:#333,stroke-width:2px
    style VD_CDN fill:#lightblue,stroke:#333,stroke-width:1px
    style MP_UploadProof fill:#fcf,stroke:#333,stroke-width:1px
```

**Flow Description:**

1.  **User Interaction & Core App:** Users access the platform via their browser, interacting with the Next.js application hosted on the VPS. This includes browsing courses, authentication, and accessing free content.
2.  **Enrollment & Manual Payment (for Paid Courses - Student Side):**
    - User selects a paid course and initiates enrollment.
    - The Next.js application (via a tRPC procedure) generates a **unique payment reference ID** and records an initial `Enrollment` (status: `PENDING_PAYMENT_CONFIRMATION`) and `Payment` (status: `AWAITING_PAYMENT_PROOF`).
    - The frontend displays payment instructions (static QR code, bank details, e-wallet numbers) along with the unique reference ID. The user is instructed to include this reference ID in their payment.
    - User makes the payment manually using their external banking/e-wallet application.
    - User returns to the platform and uploads a screenshot as proof of payment. This proof is stored (e.g., Cloudflare R2), and the `Payment` record is updated (status: `PROOF_SUBMITTED`, `proofImageUrl` set).
3.  **Admin Review (Future Task):** An administrator will later review the submitted proof against bank statements (matching via reference ID) and approve or reject the payment, which will update the `Payment` and `Enrollment` statuses accordingly to grant course access.
4.  **Database Interaction:** The backend logic (via Prisma) connects to the MySQL database for data persistence (user data, course structure, enrollments, payment records including proof URLs and statuses, etc.).
5.  **Authentication (`NextAuth.js`):** Handled entirely within the Next.js application on the VPS. Uses Prisma Adapter.
6.  **Video Content Delivery:**
    - **Encoding:** Original video files are processed using FFmpeg into optimized single-rendition MP4 (H.264) files.
    - **Storage:** These optimized MP4 files are stored in Cloudflare R2.
    - **Delivery:** When a user accesses a video lesson, the frontend (using Plyr.io) streams the MP4 file directly from Cloudflare CDN. The VPS provides the video URL but is not involved in streaming video bytes.
7.  **Other File Storage (Non-Video):** General course resources or user uploads (like payment proofs) might use Cloudflare R2 or another S3-compatible service.

## 4. Technology Stack

| Layer                             | Technology                                                                                        | Rationale                                                                                                               |
| :-------------------------------- | :------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------- |
| **Application Framework**         | **Next.js (React Framework)**                                                                     | Rich features, large ecosystem. Serves frontend and API. Uses App Router.                                               |
| UI Framework                      | **Tailwind CSS, Shadcn UI (conceptually)**                                                        | Utility-first CSS, pre-built accessible components.                                                                     |
| **Backend Runtime**               | **Node.js (via Next.js)**                                                                         | Next.js runs on Node.js, handling API routes.                                                                           |
| **API Layer**                     | **tRPC (via Next.js API Routes)**                                                                 | End-to-end type safety, simplified API development within the Next.js app.                                              |
| **Database**                      | **MySQL (via PlanetScale, AWS RDS, or similar)**                                                  | Robust relational database, strong consistency.                                                                         |
| **ORM**                           | **Prisma (schema in `prisma/`)**                                                                  | Type-safe database access for MySQL, schema migrations.                                                                 |
| **Authentication**                | **NextAuth.js (within Next.js app)**                                                              | Comprehensive auth solution, Prisma adapter.                                                                            |
| **Payment Flow**                  | **Manual Verification** (QR/Bank Transfer details, User-provided Reference ID, Screenshot Upload) | Addresses target audience familiarity; requires admin review for final enrollment activation.                           |
| **File Storage (Payment Proofs)** | **Cloudflare R2 / S3-compatible / VPS local storage (less ideal for scale)**                      | Securely store uploaded payment proof images. Cloudflare R2 is preferred if already used for video.                     |
| **Video Delivery**                | **FFmpeg (Encoding), Cloudflare R2 (Storage), Cloudflare CDN (Delivery), Plyr.io (Player)**       | FFmpeg for MP4 optimization. Cloudflare for cost-effective, performant global delivery. Plyr.io for lightweight player. |
| **Hosting**                       | **VPS (Next.js App), Managed MySQL, Cloudflare (CDN & R2)**                                       | VPS for the main application. Managed DB. Cloudflare for static assets, video, and payment proofs.                      |
| **Versioning**                    | **GitHub**                                                                                        | Industry standard.                                                                                                      |
| **CI/CD**                         | **GitHub Actions (deploying to VPS)**                                                             | Automation for building, testing, migrating DB, and deploying to VPS.                                                   |
| **Build/Deps Tooling**            | **npm/yarn/pnpm**                                                                                 | Managing dependencies and scripts.                                                                                      |
| **Process Manager (VPS)**         | **PM2 (or similar)**                                                                              | Keeps the Next.js application running on the VPS.                                                                       |
| **Reverse Proxy (VPS)**           | **Nginx / Apache (recommended)**                                                                  | Handles SSL, serves static content, routes requests to the Node.js process.                                             |

## 5. Component Breakdown (Project Structure)

The Next.js application follows a T3 Stack-influenced structure with **role-based route groups** for clear separation of concerns and improved security, plus a **domain-driven tRPC API architecture** for better maintainability and type safety. The manual payment flow will necessitate:

- UI components for displaying payment instructions and the unique reference ID.
- A file upload component for payment proof submission.
- (Future) Admin panel UI components for reviewing payments.
- Corresponding tRPC routers/procedures in the domain-specific router structure for payment initiation and proof handling.

**/lets_talk (Root of Project)**
│
├── **prisma/** ------------- Prisma ORM Files (schema.prisma, migrations)
│
├── **public/** ------------- Static Assets for Next.js app (e.g., static QR code image)
│
├── **src/** ---------------- Next.js Application Source Code
│ │
│ ├── **app/** ------------ Next.js App Router with Role-Based Route Groups
│ │ ├── **layout.tsx** ---- Root layout
│ │ ├── **page.tsx** ------ Root homepage
│ │ ├── **middleware.ts** -- Role-based route protection
│ │ │
│ │ ├── **(app)/** -------- Main application routes with role-based groups
│ │ │ ├── **layout.tsx** -- App layout with sidebar and mobile header
│ │ │ ├── **(admin)/** ---- Admin-only routes (requires ADMIN role)
│ │ │ │ └── **admin/** -- Admin dashboard and management pages
│ │ │ │
│ │ │ ├── **(global)/** --- Shared routes accessible by all authenticated users
│ │ │ │ ├── **announcements/** -- Public announcements
│ │ │ │ ├── **blog/** -------- Blog posts and articles
│ │ │ │ └── **calendar/** ---- Calendar functionality
│ │ │ │
│ │ │ ├── **(student)/** -- Student-specific routes (requires STUDENT role)
│ │ │ │ ├── **dashboard/** -- Student dashboard
│ │ │ │ └── **courses/** -- Course enrollment & learning
│ │ │ │
│ │ │ └── **(teacher)/** -- Teacher-specific routes (requires TEACHER or ADMIN role)
│ │ │ └── **teacher/** -- Teacher course management
│ │ │
│ │ ├── **auth/** --------- Authentication pages (sign-in, sign-up)
│ │ └── **api/** --------- Next.js API Routes (auth, tRPC)
│ │
│ ├── **_components/** ---- React Components with Organized Structure
│ │ ├── **layouts/** ----- Layout components (Sidebar, MobileHeader, UserProfile)
│ │ ├── **ui/** ---------- Reusable UI components (AdminModalWrapper, BreadcrumbsWithAnimation, ConfirmationToast)
│ │ ├── **features/** ---- Feature-specific components organized by role
│ │ │ ├── **shared/** ---- Shared business components (AnnouncementCard, BlogPostCard, CourseCard, etc.)
│ │ │ ├── **student/** --- Student-specific components (DashboardMetricCard, ProgressBarDisplay, etc.)
│ │ │ ├── **teacher/** --- Teacher-specific components
│ │ │ └── **admin/** ----- Admin-specific components
│ │ └── **auth/** -------- Authentication components (SignInForm, SignUpForm)
│ │
│ ├── **server/** --------- Server-side Logic with Domain-Driven tRPC Architecture
│ │ ├── **api/routers/** -- Domain-organized tRPC routers
│ │ │ ├── **_app.ts** ---- Main application router (orchestrates all domain routers)
│ │ │ ├── **auth.ts** ---- Authentication procedures
│ │ │ ├── **user.ts** ---- User profile and management procedures
│ │ │ ├── **student/** --- Student domain-specific routers
│ │ │ │ ├── **index.ts** -- Student domain router aggregator
│ │ │ │ ├── **course.router.ts** -- Student course operations (enroll, view progress, etc.)
│ │ │ │ ├── **payment.router.ts** -- Student payment flow (manual payment, proof upload)
│ │ │ │ └── **dashboard.router.ts** -- Student dashboard data
│ │ │ ├── **teacher/** --- Teacher domain-specific routers
│ │ │ │ ├── **index.ts** -- Teacher domain router aggregator
│ │ │ │ ├── **course.router.ts** -- Teacher course management
│ │ │ │ ├── **resource.router.ts** -- Lesson and resource CRUD
│ │ │ │ ├── **submission.router.ts** -- Review student submissions
│ │ │ │ └── **liveSession.router.ts** -- Live session management
│ │ │ ├── **admin/** ----- Admin domain-specific routers
│ │ │ │ ├── **index.ts** -- Admin domain router aggregator
│ │ │ │ ├── **content.router.ts** -- Content management (announcements, blog)
│ │ │ │ ├── **course.router.ts** -- Course administration
│ │ │ │ ├── **dashboard.router.ts** -- Admin dashboard data
│ │ │ │ ├── **payment.router.ts** -- Payment review and management
│ │ │ │ ├── **support.router.ts** -- Support ticket management
│ │ │ │ └── **user.router.ts** -- User management
│ │ │ └── **public/** ---- Public (non-authenticated) routers
│ │ │ ├── **index.ts** -- Public domain router aggregator
│ │ │ ├── **announcement.router.ts** -- Public announcements
│ │ │ ├── **blog.router.ts** -- Blog posts and articles
│ │ │ ├── **lessonComment.router.ts** -- Lesson comments
│ │ │ └── **errorReport.router.ts** -- Error reporting
│ │ └── ... (other existing server files: auth, db, trpc)
│ │
│ └── ... (other existing src files: trpc, styles, components)
│
├── **.env.example**, **.gitignore**, **package.json**, etc.
│
├── **docs/** --------------- Project Documentation
│
└── **.github/** ------------ GitHub specific files (Workflows for CI/CD to VPS)

### Route Group Architecture

The new structure implements **Next.js 13+ route groups** for role-based access control:

- **`(admin)`**: Admin-only functionality requiring `ADMIN` role
- **`(global)`**: Shared content accessible by all authenticated users (announcements, blog, calendar)
- **`(student)`**: Student-specific features requiring `STUDENT` role (dashboard, course enrollment)
- **`(teacher)`**: Teacher management features requiring `TEACHER` or `ADMIN` role

### Domain-Driven tRPC API Architecture

The tRPC API follows a **domain-driven architecture** with clear separation of concerns:

#### **Domain Organization:**
- **`student/`**: Student-specific operations (course enrollment, payments, dashboard)
- **`teacher/`**: Teacher-specific operations (course management, resource CRUD, submission review)
- **`admin/`**: Administrative operations (platform management, user administration)
- **`public/`**: Public operations (announcements, blog, comments, error reporting)
- **Global**: Authentication and user profile operations

#### **API Call Pattern:**
```typescript
// Student domain operations
api.student.course.listPublished.useQuery()
api.student.payment.initiateManualPayment.useMutation()
api.student.dashboard.getTodayTasks.useQuery()

// Teacher domain operations
api.teacher.course.getTeacherCourses.useQuery()
api.teacher.resource.createResource.useMutation()
api.teacher.submission.reviewSubmission.useMutation()

// Admin domain operations
api.admin.management.createTeacherAccount.useMutation()

// Public domain operations
api.public.announcement.getLatest.useQuery()
api.public.blog.getPublishedPosts.useQuery()

// Global operations
api.auth.signIn.useMutation()
api.user.updateProfile.useMutation()
```

#### **Benefits of Domain-Driven Structure:**
- **Clear Separation**: Each domain handles its own business logic
- **Better Type Safety**: Scoped procedures reduce naming conflicts
- **Improved Maintainability**: Easier to locate and modify domain-specific functionality
- **Enhanced Security**: Role-based authorization at the router level
- **Scalability**: Simple to add new procedures within existing domains or create new domains

### Component Organization

Components are organized by scope and reusability:

- **`_components/layouts/`**: Layout components (Sidebar, MobileHeader, UserProfile)
- **`_components/ui/`**: Pure UI components with no business logic
- **`_components/features/shared/`**: Business components used across multiple user roles
- **`_components/features/student/`**: Student-specific components with domain logic
- **`_components/features/teacher/`**: Teacher-specific components
- **`_components/features/admin/`**: Admin-specific components
- **`_components/auth/`**: Authentication components

## 6. Data Model

The core data structure is defined using Prisma in `prisma/schema.prisma`, targeting a **MySQL** database. Key entities include: `User`, `Account`, `Session`, `VerificationToken`, `Course`, `Enrollment`, `Resource`, `CourseSession`, `Submission`, `Payment`, `Announcement`, `BlogPost`, `SupportTicket`, `LessonComment`, `ErrorReport`.

- The `Payment` model is updated to include `paymentReferenceId` (unique for matching), `proofImageUrl`, and `status` (e.g., `AWAITING_PAYMENT_PROOF`, `PROOF_SUBMITTED`).
- The `Enrollment` model includes a `status` (e.g., `PENDING_PAYMENT_CONFIRMATION` until admin approval).
- The **tRPC router structure** ensures that database operations are properly scoped to their respective domains, with student payment operations in `student/payment.router.ts`, teacher course management in `teacher/course.router.ts`, etc.

## 7. Authentication and Authorization

- **Authentication:** Handled by **NextAuth.js**, with its API routes hosted within the Next.js application on the VPS. Uses Prisma Adapter.
- **Authorization:** Implemented at multiple levels:
  - **Route Level**: Middleware-based route protection for Next.js app routes
  - **API Level**: Role-based access control (RBAC) via `User.role` in domain-specific tRPC routers
  - **Domain Level**: Each tRPC domain router (`student/`, `teacher/`, `admin/`, `public/`) enforces appropriate authorization
  - tRPC procedures check the authenticated user's role and permissions from `ctx.session`
  - Domain-specific authorization patterns:
    - `student/*`: Requires `STUDENT` role
    - `teacher/*`: Requires `TEACHER` or `ADMIN` role  
    - `admin/*`: Requires `ADMIN` role
    - `public/*`: Generally accessible, some procedures may require authentication

## 8. Key Architectural Patterns

- **Monolithic Application Architecture:** Next.js handles frontend, API, and auth within one application process on the VPS.
- **Domain-Driven Design (DDD):** tRPC routers organized by business domain rather than technical concerns.
- **tRPC with Domain Boundaries:** For type-safe API communication with clear domain separation.
- **NextAuth.js:** For robust authentication.
- **CDN for Static Assets & Video:** Cloudflare for global distribution.
- **Manual Payment Verification Workflow (Student-Side Implemented First):** This is a key distinct pattern. Students submit proof; admin review is a subsequent phase.
- **Repository Pattern (Implicit):** Prisma acts as a data access layer.
- **Application-Layer Authorization:** Security rules enforced in the backend API logic at both route and domain levels.

## 9. Deployment & CI/CD

- **Next.js Application (Frontend, Auth, tRPC API):** Deployed to a **VPS**.
  - `next build` and `next start` managed by a process manager (e.g., PM2).
  - A reverse proxy (e.g., Nginx) is recommended in front of the Node.js process.
- **Video Assets & Payment Proofs:** FFmpeg-encoded MP4s and uploaded payment proofs stored in Cloudflare R2 (or chosen file storage), served by Cloudflare CDN or secure links.
- **Database:** Schema migrations via `prisma migrate deploy` during CI/CD.
- **Workflow (GitHub Actions for VPS):**
  1.  Checkout code.
  2.  Install dependencies & Build Next.js application.
  3.  Run tests.
  4.  Apply Database Migrations.
  5.  Package build artifacts.
  6.  Securely transfer artifacts to VPS.
  7.  On VPS: Unpack artifacts, restart application server (e.g., PM2).
- **Secrets Management:** For `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` (VPS public URL), Cloudflare keys (for R2 if used for proofs), etc., managed on the VPS environment or via GitHub secrets for the CI/CD pipeline.

## 10. External Integrations

- Managed MySQL.
- Cloudflare (R2 for storage, CDN for delivery).
- VPS Provider.
- File storage provider for payment proofs (e.g., Cloudflare R2).

## 11. Future Considerations / Scalability (on VPS)

- **Automated Payment Gateway:** Integrating a proper payment gateway with webhooks is a primary future consideration to reduce manual overhead and improve user experience once the platform gains traction or if the manual process becomes unmanageable.
- **Admin Panel for Payment Review:** A dedicated interface for administrators to efficiently review and process submitted payment proofs.
- **Realtime features:** WebSockets.
- **Background Jobs:** Job queues.
- **Database Scaling:** Read replicas, connection pooling.
- **Application Scaling (VPS):** Vertical scaling, or horizontal scaling with a load balancer (more complex). Containerization (Docker).
- **Video Processing Automation:** Automate FFmpeg encoding and R2 upload.
- **Adaptive Bitrate Streaming (ABR):** Consider if budget/needs evolve.
- **Comprehensive Testing:** Unit, integration, E2E tests.