// docs/technical.md

# ⚙️ Technical Documentation: Let's Talk (Next.js Monolith on VPS)

## 1. Introduction

This document provides detailed technical information for developers working on the **Let's Talk** project. It focuses on the stack comprising a **Next.js application (frontend, NextAuth.js, and tRPC API via API routes) hosted on a Virtual Private Server (VPS)**, a **MySQL database** managed by **Prisma**. **Authentication uses email/password only** (Google OAuth removed for simplicity). The payment flow for paid courses involves users making **manual payments** (via QR code scan or direct bank/e-wallet transfer using a **unique reference ID** provided by the platform), uploading proof of payment (e.g., a screenshot), and subsequent (future task) **admin verification** to activate enrollment. Video delivery uses **FFmpeg, Cloudflare R2 & CDN, and Plyr.io**. Payment proofs will also likely be stored in a cloud object storage like Cloudflare R2.

## 2. Development Environment Setup

### Prerequisites

- **Node.js:** Version 18.x or later.
- **Package Manager:** `npm` (as per `package-lock.json`).
- **MySQL:** Local instance or cloud-hosted (e.g., PlanetScale, Docker).
- **FFmpeg:** Installed locally for video processing.
- **Git:** For version control.
- **Cloudflare Account:** For R2 storage (videos, payment proofs) and CDN configuration.
- **VPS Access (Optional for Local Dev):** SSH access if you intend to test deployment early.

### Initial Setup

1.  **Clone Repository:**
    ```bash
    git clone <repository-url>
    cd lets_talk
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**

    - Copy `.env.example` to `.env` in the root directory.
    - **Edit `.env` (for local development):**

      ```env
      # Database
      DATABASE_URL="mysql://root:password@localhost:3306/lets_talk" # Example

      # NextAuth.js / Application Secret
      AUTH_SECRET="YOUR_AUTH_SECRET_HERE"
      NEXTAUTH_URL="http://localhost:3000"

      # Note: Google OAuth has been removed for simplified authentication
      # Authentication now uses email/password only

      # Cloudflare R2 (Example - if backend needs to generate presigned URLs for proof uploads)
      # R2_ACCOUNT_ID=""
      # R2_ACCESS_KEY_ID=""
      # R2_SECRET_ACCESS_KEY=""
      # R2_BUCKET_NAME_PROOFS=""
      # R2_PUBLIC_URL_PROOFS="" (Base URL for accessing proofs if served via CDN)
      ```

    - Ensure `src/env.js` is updated for any new server-side runtime variables. For VPS deployment, these variables will be set on the server itself.

4.  **Database Setup & Migrations:**

    - Ensure your MySQL instance is running.
    - Generate Prisma client: `npm run prisma:generate`
    - Apply migrations: `npm run db:migrate` (or `prisma:migrate:dev` for development)

5.  **Video Asset Preparation (Manual/Scripted):**

    - Encode source videos using FFmpeg to optimized MP4s.
    - Upload these MP4s to your Cloudflare R2 bucket for videos.
    - Configure public access for these files via Cloudflare CDN.
    - Update `Resource.url` in your database with the Cloudflare CDN URLs.

6.  **Run Development Server (Local):**
    ```bash
    npm run dev
    ```

## 3. Technology Deep Dive

- **Next.js (`src/` directory, hosted on VPS):**

  - Handles frontend rendering, App Router, NextAuth.js API routes, and tRPC API routes.
  - Frontend components will be developed for displaying payment instructions (QR, bank details, unique reference ID) and a form for payment proof upload.
  - (Future) Admin panel components for payment review.

- **Authentication (Email/Password Only):**

  - **Simplified Flow:** Uses NextAuth.js with Credentials provider for email/password authentication only
  - **Google OAuth Removed:** Eliminated for simpler authentication surface and reduced complexity
  - **User Profile Management:** Accessible through sidebar modal instead of dedicated settings page
  - **Mobile Optimized:** Profile modal uses React portals for proper mobile positioning

- **User Profile System:**

  - **Sidebar Integration:** Profile access through user icon in sidebar with real user data display
  - **Modal Interface:** Multi-view modal (Profile Display, Edit Profile, Change Password)
  - **React Portal:** Modal renders outside sidebar DOM tree for proper mobile centering
  - **Real-time Updates:** Uses tRPC for immediate profile data updates
  - **Direct Image Upload:** Secure file upload system for profile pictures

- **Manual Payment Flow (Student-Side):**

  1.  **Enrollment Intent:** User clicks "Enroll" on a paid course and is redirected to the payment instructions page.
  2.  **Payment Instructions UI:** Frontend page (`/courses/[courseId]/enroll-pay`) displays static payment methods (QR image, bank/e-wallet details) and a suggested payment reference format. User is instructed to include a reference in their payment for easier identification.
  3.  **User Pays Manually:** User performs the transaction via their external banking/e-wallet app, including the suggested reference in the payment notes.
  4.  **Proof Upload & Enrollment Creation:** User returns to the `enroll-pay` page and uses a file input to select their payment proof screenshot. When they click "Submit Proof":
      - The frontend first calls `payment.initiateManualPayment` to create the `Enrollment` record (status: `PENDING_PAYMENT_CONFIRMATION`) and `Payment` record (status: `AWAITING_PAYMENT_PROOF`) with a unique `paymentReferenceId`.
      - Immediately after, it calls `payment.submitPaymentProof` with the `paymentId` and `proofImageUrl` to update the payment status to `PROOF_SUBMITTED`.
      - This ensures enrollment records are only created when the user actually submits proof, not when they first visit the page.
  5.  **Proof Submission & Storage:**
      - For now, the proof image URL is provided by the user (for testing) or uploaded as a placeholder.
      - The backend updates the `Payment` record status to `PROOF_SUBMITTED` and stores the `proofImageUrl`.
  6.  **Admin Review & Activation (Future Task):** An administrator will later review these `PROOF_SUBMITTED` payments and associated proofs to approve or reject them, which will then update the `Enrollment` status to `ACTIVE` or `CANCELLED`.

- **UI Status Handling:** The course listing page now shows three distinct sections:

  - **Enrolled Courses:** Active enrollments where payment has been approved
  - **Pending Approval:** Enrollments with `PENDING_PAYMENT_CONFIRMATION` status, displayed with orange "Pending Approval" buttons that are non-clickable
  - **Available Courses:** Courses the user hasn't enrolled in yet, showing normal "Enroll" buttons

- **Video Content Delivery Strategy:** (Remains the same: FFmpeg, R2, CDN, Plyr.io)

- **Prisma (`prisma/` directory):** ORM for MySQL. Schema in `prisma/schema.prisma`.

## 4. Key Directory Structure

The application follows a **role-based route group architecture** for clear separation of concerns and enhanced security, plus a **domain-driven tRPC API architecture**:

```
src/
├── app/
│   ├── (app)/                    # Main application with role-based groups
│   │   ├── (admin)/             # Admin-only routes (Role: ADMIN)
│   │   │   └── admin/test/      # Admin test functionality
│   │   ├── (global)/            # Shared routes (All authenticated users)
│   │   │   ├── announcements/  # Public announcements
│   │   │   ├── blog/           # Blog posts and articles
│   │   │   └── calendar/       # Calendar functionality
│   │   ├── (student)/          # Student-specific routes (Role: STUDENT)
│   │   │   ├── layout.tsx      # Student layout with sidebar
│   │   │   ├── dashboard/      # Student dashboard
│   │   │   └── courses/        # Course enrollment & learning
│   │   └── (teacher)/          # Teacher routes (Role: TEACHER or ADMIN)
│   │       └── teacher/courses/ # Course management interface
│   ├── auth/                    # Authentication pages
│   └── api/                     # NextAuth & tRPC API routes
├── _components/
│   ├── Sidebar.tsx             # Global navigation with role-based links
│   ├── ui/                     # Pure UI components (BreadcrumbsWithAnimation, etc.)
│   ├── shared/                 # Business components (CourseCard, AnnouncementCard, etc.)
│   └── student/                # Student-specific components (Dashboard, Lesson, etc.)
├── server/
│   └── api/routers/           # Domain-driven tRPC routers
│       ├── _app.ts            # Main application router (orchestrates all domains)
│       ├── auth.ts            # Authentication procedures
│       ├── user.router.ts     # User profile and management procedures
│       ├── student/           # Student domain-specific routers
│       │   ├── index.ts       # Student domain router aggregator
│       │   ├── course.router.ts    # Student course operations
│       │   ├── payment.router.ts   # Student payment flow
│       │   └── dashboard.router.ts # Student dashboard data
│       ├── teacher/           # Teacher domain-specific routers
│       │   ├── index.ts       # Teacher domain router aggregator
│       │   ├── course.router.ts    # Teacher course management
│       │   ├── resource.router.ts  # Lesson and resource CRUD
│       │   ├── submission.router.ts # Review student submissions
│       │   └── liveSession.router.ts # Live session management
│       ├── admin/             # Admin domain-specific routers
│       │   ├── index.ts       # Admin domain router aggregator
│       │   └── management.router.ts # Platform administration
│       └── public/            # Public (non-authenticated) routers
│           ├── index.ts       # Public domain router aggregator
│           ├── announcement.router.ts # Public announcements
│           ├── blog.router.ts      # Blog posts and articles
│           ├── lessonComment.router.ts # Lesson comments
│           └── errorReport.router.ts # Error reporting
└── middleware.ts              # Role-based route protection
```

## 4.1. Role-Based Route Protection

The application implements comprehensive **middleware-based route protection** using Next.js 13+ middleware:

### Route Protection Logic

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: env.AUTH_SECRET });
  const userRole = token?.role as Role;

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    if (userRole !== Role.ADMIN) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Teacher route protection
  if (pathname.startsWith("/teacher")) {
    if (userRole !== Role.TEACHER && userRole !== Role.ADMIN) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Student-only route protection
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) {
    if (userRole !== Role.STUDENT) {
      const roleHome =
        userRole === Role.ADMIN ? "/admin/test" : "/teacher/courses";
      return NextResponse.redirect(new URL(roleHome, request.url));
    }
  }
}
```

### Route Group Benefits

- **Security**: Role-based access control enforced at the routing level
- **Organization**: Clear separation of functionality by user role
- **Maintainability**: Easier to locate and modify role-specific features
- **Scalability**: Simple to add new roles or modify permissions

### Navigation Logic

The `Sidebar.tsx` component implements **conditional navigation** based on user roles:

```typescript
// Student-only links
{userRole === Role.STUDENT && (
  <Link href="/dashboard">Dashboard</Link>
)}

// Teacher & Admin links
{(userRole === Role.TEACHER || userRole === Role.ADMIN) && (
  <Link href="/teacher/courses">Teacher</Link>
)}

// Admin-only links
{userRole === Role.ADMIN && (
  <Link href="/admin/test">Admin</Link>
)}

// Shared links (all users)
<Link href="/courses">Courses</Link>
<Link href="/announcements">Announcements</Link>
```

## 4.2. Domain-Driven tRPC API Architecture

The tRPC API follows a **domain-driven architecture** that organizes routers by business domain rather than technical concerns:

### Domain Organization

The API is structured into the following domains:

- **`student/`**: Student-specific operations (course enrollment, payments, dashboard)
- **`teacher/`**: Teacher-specific operations (course management, resource CRUD, submission review)
- **`admin/`**: Administrative operations (platform management, user administration)
- **`public/`**: Public operations (announcements, blog, comments, error reporting)
- **Global**: Authentication and user profile operations

### API Call Pattern

Frontend components use domain-scoped tRPC calls:

```typescript
// Student domain operations
const { data: courses } = api.student.course.listPublished.useQuery();
const enrollMutation = api.student.payment.initiateManualPayment.useMutation();
const { data: tasks } = api.student.dashboard.getTodayTasks.useQuery();

// Teacher domain operations
const { data: teacherCourses } =
  api.teacher.course.getTeacherCourses.useQuery();
const createResource = api.teacher.resource.createResource.useMutation();
const reviewSubmission = api.teacher.submission.reviewSubmission.useMutation();

// Admin domain operations
const createTeacher = api.admin.management.createTeacherAccount.useMutation();

// Public domain operations
const { data: announcements } = api.public.announcement.getLatest.useQuery();
const { data: blogPosts } = api.public.blog.getPublishedPosts.useQuery();

// Global operations
const signIn = api.auth.signIn.useMutation();
const updateProfile = api.user.updateProfile.useMutation();
```

### Router Structure

Each domain has its own router file and index aggregator:

```typescript
// src/server/api/routers/student/index.ts
export const studentRouter = createTRPCRouter({
  payment: paymentRouter,
  dashboard: dashboardRouter,
  course: studentCourseRouter,
});

// src/server/api/routers/teacher/index.ts
export const teacherRouter = createTRPCRouter({
  resource: resourceRouter,
  submission: submissionRouter,
  liveSession: liveSessionRouter,
  course: teacherCourseRouter,
});

// src/server/api/routers/_app.ts
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  public: publicRouter,
  student: studentRouter,
  teacher: teacherRouter,
  admin: adminRouter,
});
```

### Benefits of Domain-Driven Structure

- **Clear Separation**: Each domain handles its own business logic
- **Better Type Safety**: Scoped procedures reduce naming conflicts
- **Improved Maintainability**: Easier to locate and modify domain-specific functionality
- **Enhanced Security**: Role-based authorization at the router level
- **Scalability**: Simple to add new procedures within existing domains or create new domains
- **Better Developer Experience**: Intuitive API structure that mirrors business requirements

## 5. Core Implementation Patterns

- **Type Safety (tRPC).**
- **Environment Variables.**
- **API Communication (tRPC React Query hooks).**
- **Authorization (Protected tRPC procedures).**
- **Unique Reference IDs for Manual Payments:** Crucial for matching.
- **Secure File Handling for Payment Proofs:** Involves client-side or backend-proxied uploads to cloud storage, and storing URLs.
- **State Management for Payments/Enrollments:** Using enums like `PaymentStatus` and `EnrollmentStatus`.
- **React Portals for Modals:** Ensures proper positioning independent of parent component DOM tree.
- **Simplified Authentication:** Email/password only, removing OAuth complexity.

## 6. Database Details (MySQL via Prisma)

- **Schema:** `prisma/schema.prisma`.
  - `Payment` model includes `paymentReferenceId String @unique`, `proofImageUrl String?`, `status PaymentStatus`.
  - `Enrollment` model includes `status EnrollmentStatus` and `lastAccessedAt DateTime?`.
  - `Resource` model includes `releaseDate DateTime?`.
  - `User` model simplified without OAuth provider fields.
  - (See `prisma/schema.prisma` for full details).

## 7. Authentication Flow (NextAuth.js on VPS)

**Simplified Email/Password Only:**

- **Sign In:** Email and password credentials via NextAuth.js Credentials provider.
- **Session Management:** NextAuth.js handles session cookies and validation.
- **No OAuth:** Google authentication removed for reduced complexity.
- **Password Security:** bcrypt for password hashing and verification.

## 8. API Design (tRPC on Next.js API Routes)

- **User Management** (`src/server/api/routers/user.ts`):

  - `user.getProfile`: Fetches current user profile.
  - `user.updateProfile`: Updates user's name.
  - `user.changePassword`: Secure password changes with validation.
  - `user.getContributionData`: Generates activity data for the contribution calendar.

- **Payment Management** (`src/server/api/routers/payment.ts`):

  - `payment.initiateManualPayment`: Creates initial records for a manual payment.
  - `payment.submitPaymentProof`: Updates payment status after proof is submitted.

- **Dashboard Management** (`src/server/api/routers/dashboard.ts`):

  - `dashboard.getTodaysTasks`: Fetches lessons scheduled for the current day.
  - `dashboard.getCalendarEvents`: Fetches all scheduled lessons for the user's courses.
  - `dashboard.getRecentlyAccessedCourses`: Fetches up to 3 most recently visited courses.

- **Course Management** (`src/server/api/routers/course.ts`):

  - `course.getDetailsForEnrolledUser`: Fetches course content and **updates `lastAccessedAt`** on the enrollment record.

- **File Upload API** (`src/app/api/upload/profile-image/route.ts`):
  - Handles direct file uploads for profile images with security validation.

## 9. UI Component Architecture

### UserProfile Modal System

- **Portal Implementation:** Uses `createPortal` to render outside sidebar DOM tree.
- **Multi-View Interface:** Single modal with three distinct views.
- **Mobile Responsive:** Proper centering and constraints for mobile devices.
- **Real-time Updates:** Integrates with tRPC for immediate data synchronization.

### Sidebar Enhancement

- **Real User Data:** Displays actual user names, profile pictures, and generated initials.
- **Click Integration:** Opens UserProfile modal when user area is clicked.
- **Responsive Design:** Adapts to collapsed/expanded states.

### Dynamic Dashboard Components

- **Contribution Calendar:** Uses `react-activity-calendar` and connects to the `user.getContributionData` endpoint.
- **Today's Task List:** Dynamically populated by the `dashboard.getTodaysTasks` endpoint.
- **Recently Accessed Courses:** A dynamic section populated by `dashboard.getRecentlyAccessedCourses`, displaying `RecentlyAccessedCourseCard` components. Handles loading, error, and empty states.

## 10. CI/CD Pipeline (`.github/workflows/deploy-vps.yml`)

- (Remains conceptually the same as previous VPS version).
- Runtime environment on VPS will need credentials for accessing the payment proof storage service (e.g., R2 API keys if backend generates presigned URLs or uploads directly).

## 11. VPS Configuration (High-Level)

- (Remains the same as previous VPS version).
- If payment proofs are uploaded via the backend, ensure the Next.js process has write permissions to a temporary directory if needed, and network access to the cloud storage service.

## 12. Coding Standards & Conventions

- ESLint + Prettier.
- TypeScript strict mode.
- Conventional commits.
- React portals for modal positioning.
- Simplified authentication patterns.

## 13. Testing Strategy

- Unit tests for reference ID generation, payment/enrollment status logic.
- Integration tests for tRPC procedures (mocking DB and file storage interactions).
- E2E tests for student flows.
- Authentication tests for email/password flow.
- UI tests for modal functionality and mobile responsiveness.
