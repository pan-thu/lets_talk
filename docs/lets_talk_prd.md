// docs/lets_talk_prd.md
// docs/lets_talk_prd.md

# Product Requirements Document (PRD)

## Project Name: Let's Talk

An education platform for students to enroll in courses, access learning resources, and attend live classes. Teachers manage course content, while administrators control course creation and user roles.

---

## User Roles & Permissions

| Role        | Permissions                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Student** | Register, view/enroll in courses, submit payment proof for paid courses, access resources, participate in discussions, track progress |
| **Teacher** | Manage content for assigned courses, schedule live sessions, grade students, send announcements                                       |
| **Admin**   | Create/manage courses, assign teachers, manage users, monitor platform, review and approve/reject payment proofs                      |

---

## Tech Stack

| Layer              | Technology                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | **Next.js (React Framework), Tailwind CSS, Shadcn (conceptually)**                                                                |
| **Backend**        | **Node.js (via Next.js runtime)**                                                                                                 |
| API Layer          | **tRPC (via Next.js API Routes)**                                                                                                 |
| **ORM**            | **Prisma (schema in `prisma/`)**                                                                                                  |
| **Database**       | **MySQL**                                                                                                                         |
| **Authentication** | **NextAuth.js (integrated within Next.js)**                                                                                       |
| **Payment Flow**   | **Manual Verification** (QR/Bank Transfer instructions, Unique Reference ID, Screenshot Upload by student; Admin Review deferred) |
| **File Storage**   | **Cloudflare R2 / S3-compatible** (for video assets and payment proofs)                                                           |
| **Hosting**        | **VPS (Next.js App: Frontend & API)**, **Managed MySQL**                                                                          |
| Process Manager    | **PM2 (or similar, on VPS)**                                                                                                      |
| Reverse Proxy      | **Nginx / Apache (on VPS, recommended)**                                                                                          |
| Versioning         | GitHub                                                                                                                            |
| CI/CD              | GitHub Actions (deploying to VPS)                                                                                                 |

---

## System Architecture

### Architecture Type

**Monolithic Next.js Application (Hosted on VPS):** The project utilizes a structure common in the T3 Stack, where frontend (`src/app`), backend API logic (`src/server/api`, exposed via `src/app/api`), and database schema (`prisma/`) are organized within a single Next.js application. This entire application is deployed and run on a Virtual Private Server (VPS). For paid courses, students submit proof of manual payment, which will be reviewed by an admin in a later phase.

### Design Overview

```

User (Browser)
↓
NGINX/Apache Reverse Proxy (on VPS, handles SSL, optional caching)
↓
Next.js Application (Node.js process managed by PM2 on VPS)
│ (Serves Frontend from src/app, NextAuth routes from src/app/api/auth, tRPC API from src/app/api/trpc)
│ 1. User initiates enrollment for paid course.
│ 2. App generates/shows Payment Instructions (QR/Bank Details + Unique Ref ID).
│ 3. User pays externally, gets screenshot.
│ 4. User uploads proof to App. (Proof stored in Cloudflare R2 / S3, Payment status becomes PROOF_SUBMITTED).
│ (Admin review and approval/rejection is a future step to activate enrollment)
↓ Prisma Client (from src/server/db)
MySQL (Managed MySQL / Other)

Cloudflare R2/S3 (Stores Payment Proofs & Video Assets)

```

**Description:** The Next.js application, hosted on a VPS, serves both frontend and backend API. Users interact with the frontend. For paid courses, the system provides payment instructions and a unique reference ID. The student pays manually and uploads proof (e.g., a screenshot). The platform records this submission. Actual enrollment activation based on admin review of this proof is a subsequent development phase. tRPC handles API calls, NextAuth.js manages authentication, and Prisma interacts with the MySQL database.

---

## Suggested File Structure

/lets_talk -------------- Root of the Project
│
├── prisma/ ------------- Prisma ORM Files
│ ├── schema.prisma --- Database schema (MySQL)
│ └── migrations/ ----- Database migration files managed by Prisma
│
├── public/ ------------- Static Assets (images, fonts, static QR code if used)
│ └── favicon.ico
│
├── src/ ---------------- Main Source Code Directory
│ │
│ ├── app/ ------------ Next.js App Router Directory
│ │ ├── (app)/courses/[courseId]/enroll-pay/ -- Page for payment instructions & proof upload
│ │ ├── \_components/ -- UI Components
│ │ │ └── payment/ ---- Payment related UI components (e.g., ProofUploadForm.tsx)
│ │ ├── api/ -------- Next.js API Routes (auth, trpc)
│ │ └── ... (other app routes)
│ │
│ ├── server/ --------- Server-side Logic
│ │ ├── api/ -------- tRPC API Definition
│ │ │ ├── routers/
│ │ │ │ └── payment.ts -- tRPC router for payment initiation and proof submission
│ │ │ └── ... (other routers)
│ │ └── ... (auth, db)
│ │
│ ├── styles/ --------- Global Stylesheets
│ ├── trpc/ ----------- tRPC Client-side Setup
│ └── env.js ------------ Environment variable validation
│
├── .env.example, .gitignore, package.json, etc.
│
├── docs/ --------------- Project Documentation
│
└── .github/ ------------ GitHub specific files (Workflows for CI/CD to VPS)

---

## Functional Requirements

_(User stories S1-A14 from `docs/user_story.md` would be listed or referenced here.)_

**Student**

- S1: Register and create account
- S2: Login and logout
- S3: Recover password
- S4: Update profile
- S5: Access personalized dashboard
- S6: Use persistent sidebar for navigation
- S7: Browse available courses and see enrolled courses
- S8: As a student, I want to initiate enrollment in a course. If the course is paid, this will lead me to a payment instruction page.
- S9: As a student, I want to view payment instructions (QR code, bank/e-wallet details, unique reference ID) for a paid course, make the payment manually, and then upload proof of payment (e.g., a screenshot) to the platform.
- S10: Visit individual course page (access might be pending payment approval for paid courses).
- S11: Video-courses show lesson & test items.
- S12: Live-courses show Join Zoom button and recording.
- S13: View lesson page with video/resource, report issue, download, ask question.
- S14: Upload test/exercise submissions.
- S15: View announcements.
- S16: Browse Blog page.
- S17: View Privacy & Policies.
- S18: Visit About Us.
- S19: Access Settings page.

**Teacher**
_(Teacher stories T1-T18 remain as previously defined)_

**Admin**
_(Admin stories A1-A14 remain as previously defined, with the understanding that A10 "manage all payment transactions" will initially involve reviewing manually submitted proofs once that feature is built)._

- AXX (New - Deferred): As an admin, I want to view submitted payment proofs, match them with bank transactions using a reference ID, and approve or reject enrollments based on this verification.

---

## Development Phases

_(Focus areas remain, mapping to the Next.js/Node + MySQL + tRPC + NextAuth structure on VPS)_

### Phase 1 – Setup & Core Student Features

- [x] GitHub repo setup
- [x] Next.js project initialization (T3 Stack based)
- [x] Backend logic structure in `src/server`
- [x] **MySQL** instance setup
- [x] **Prisma ORM** setup, configure for **MySQL**
- [x] **tRPC** setup
- [x] **NextAuth.js** setup
- [x] Basic API connectivity test
- [x] **VPS Setup:** Basic Node.js environment, PM2, Nginx/Apache.
- [x] **CI/CD to VPS:** Initial setup.
- [x] **Database Schema for Manual Payments:** Update `Payment` and `Enrollment` models for student proof submission.
- [x] **Student-Side Manual Payment Flow (UI & Backend):**
  - Display payment instructions (QR/Bank/E-wallet, Unique Reference ID).
  - Implement proof upload mechanism (student UI).
  - tRPC endpoint to initiate payment (create `Payment` record, generate reference ID, set initial `Enrollment` status to `PENDING_PAYMENT_CONFIRMATION`).
  - tRPC endpoint for user to submit proof (link proof to `Payment` record, update `Payment` status to `PROOF_SUBMITTED`).
- [x] **Profile Management Page (UI & Backend):**
  - Implement UI for updating user name, email, profile picture, and password.
  - Implement backend tRPC procedures for these update actions.
  - Implement functionality to link a Google account to an existing credentials-based account.
  - Direct file upload for profile images with security validation.
- [x] Implement remaining Student user stories (S3-S7, S10-S19, adapting S10 for pending payment status).

### Phase 2 – Course Content Management & Initial Teacher Tools

- [ ] Course content management (resources, sessions by teachers/admins).
- [ ] Implement core Teacher user stories (T1-T10).

### Phase 3 – Admin Tools (including Payment Review)

- [ ] **Admin Payment Review Panel (UI & Backend):** Interface for admins to view pending proofs, details, and approve/reject. Update `Enrollment` and `Payment` statuses.
- [ ] Implement other Admin user stories (A2-A14).

### Phase 4 – Advanced Teacher Tools & Communications

- [ ] Implement remaining Teacher user stories (T11-T18).
- [ ] Notifications, progress tracking enhancements.
- [ ] Chat/discussion features.

### Phase 5 – Testing, Final Polish, Deploy

- [ ] Comprehensive testing (unit, integration, E2E).
- [ ] Quality Assurance, bug fixing.
- [ ] Refine CI/CD for VPS.
- [ ] Production launch preparations on VPS.

---

## Prisma Database Schema Overview (MySQL Adapted)

_(Schema defined in `prisma/schema.prisma`. `User`/`Auth` models use CUID `String` IDs, other models use auto-incrementing `Int` IDs. `Payment` and `Enrollment` models updated for student-side manual payment proof submission.)_

```prisma
// Located in prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role { STUDENT TEACHER ADMIN }
enum CourseStatus { DRAFT PUBLISHED ARCHIVED }
enum CourseType { VIDEO LIVE }
enum ResourceType { VIDEO PDF LINK TEXT FILE AUDIO_EXERCISE }

enum PaymentStatus {
  AWAITING_PAYMENT_PROOF
  PROOF_SUBMITTED
  // COMPLETED // Admin action
  // REJECTED // Admin action
  // REFUNDED // Admin action
  ERROR
}

enum EnrollmentStatus {
  PENDING_PAYMENT_CONFIRMATION
  // ACTIVE // Admin action
  // CANCELLED // Admin action
  COMPLETED
}

enum PostStatus { DRAFT PUBLISHED }
enum TicketStatus { OPEN IN_PROGRESS RESOLVED CLOSED }
enum TicketPriority { LOW MEDIUM HIGH }
enum ReportStatus { OPEN IN_PROGRESS RESOLVED CLOSED }


model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  enrollments Enrollment[]
  taughtCourses Course[] @relation("TeacherCourses")
  submissions Submission[] @relation("StudentSubmissions")
  gradedSubmissions Submission[] @relation("GradedSubmissions")
  payments Payment[]
  // reviewedPayments Payment[] @relation("ReviewedPayments") // Deferred
  createdAnnouncements Announcement[] @relation("CreatedAnnouncements")
  authoredBlogPosts BlogPost[] @relation("AuthoredBlogPosts")
  submittedSupportTickets SupportTicket[] @relation("SubmittedTickets")
  assignedSupportTickets SupportTicket[] @relation("AssignedTickets")
  lessonCompletions UserLessonCompletion[]
  lessonComments LessonComment[]
  errorReports ErrorReport[]
}

model Account {
  id                       String  @id @default(cuid())
  userId                   String
  type                     String
  provider                 String
  providerAccountId        String
  refresh_token            String? @db.Text
  access_token             String? @db.Text
  expires_at               Int?
  token_type               String?
  scope                    String?
  id_token                 String? @db.Text
  session_state            String?
  refresh_token_expires_in Int?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Course {
  id            Int          @id @default(autoincrement())
  title         String
  description   String?      @db.Text
  price         Float        @default(0.0)
  status        CourseStatus @default(DRAFT)
  type          CourseType
  coverImageUrl String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  teacherId     String?
  teacher       User?        @relation("TeacherCourses", fields: [teacherId], references: [id], onDelete: SetNull)
  enrollments   Enrollment[]
  resources     Resource[]
  courseSessions CourseSession[]
  announcements Announcement[] @relation("CourseAnnouncements")
  payments      Payment[]
  @@index([teacherId])
}

model Enrollment {
  id            Int              @id @default(autoincrement())
  paid          Boolean          @default(false)
  status        EnrollmentStatus @default(PENDING_PAYMENT_CONFIRMATION)
  progress      Float            @default(0.0)
  grade         Float?
  enrolledAt    DateTime         @default(now())
  activatedAt   DateTime?
  completedAt   DateTime?
  userId        String
  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId      Int
  course        Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  submissions   Submission[]
  payment       Payment?
  lessonCompletions UserLessonCompletion[]
  @@unique([userId, courseId])
  @@index([courseId])
  @@index([userId])
}

model UserLessonCompletion {
  id           Int      @id @default(autoincrement())
  userId       String
  lessonId     Int
  enrollmentId Int
  completedAt  DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson       Resource @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  @@unique([userId, lessonId, enrollmentId])
  @@index([userId])
  @@index([lessonId])
  @@index([enrollmentId])
}

model Resource {
  id                Int          @id @default(autoincrement())
  title             String
  type              ResourceType
  url               String
  content           String?      @db.Text
  week              Int?
  order             Int?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  courseId          Int
  course            Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessonCompletions UserLessonCompletion[]
  lessonComments    LessonComment[]
  errorReports      ErrorReport[]
  submissions       Submission[]
  @@index([courseId])
}

model CourseSession {
  id            Int       @id @default(autoincrement())
  title         String
  description   String?   @db.Text
  meetingLink   String
  startTime     DateTime
  endTime       DateTime?
  recordingUrl  String?
  week          Int?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  courseId      Int
  course        Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  @@index([courseId])
}

model Submission {
  id            Int       @id @default(autoincrement())
  fileUrl       String?
  audioUrl      String?
  textAnswer    String?   @db.Text
  grade         Float?
  feedback      String?   @db.Text
  status        String    @default("PENDING_REVIEW")
  submittedAt   DateTime  @default(now())
  gradedAt      DateTime?
  resourceId    Int?
  resource      Resource? @relation(fields: [resourceId], references: [id], onDelete: SetNull)
  enrollmentId  Int
  enrollment    Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  studentId     String
  student       User      @relation("StudentSubmissions", fields: [studentId], references: [id], onDelete: Cascade)
  graderId      String?
  grader        User?     @relation("GradedSubmissions", fields: [graderId], references: [id], onDelete: SetNull)
  @@index([enrollmentId])
  @@index([studentId])
  @@index([graderId])
  @@index([resourceId])
}

model Payment {
  id                 Int           @id @default(autoincrement())
  paymentReferenceId String        @unique
  amount             Float
  currency           String        @default("USD")
  status             PaymentStatus @default(AWAITING_PAYMENT_PROOF)
  proofImageUrl      String?
  provider           String?
  providerPaymentId  String?
  // adminNotes      String?       @db.Text // Deferred
  // reviewedAt      DateTime?     // Deferred
  // reviewedById    String?       // Deferred
  // reviewedBy      User?         @relation("ReviewedPayments", fields: [reviewedById], references: [id], onDelete:SetNull) // Deferred
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  userId             String
  user               User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  courseId           Int
  course             Course        @relation(fields: [courseId], references: [id], onDelete: Restrict)
  enrollmentId       Int           @unique
  enrollment         Enrollment    @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([courseId])
  // @@index([reviewedById]) // Deferred
}

model Announcement {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @db.Text
  isGlobal  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  String?
  author    User?    @relation("CreatedAnnouncements", fields: [authorId], references: [id], onDelete: SetNull)
  courseId  Int?
  course    Course?  @relation("CourseAnnouncements", fields: [courseId], references: [id], onDelete: Cascade)
  @@index([authorId])
  @@index([courseId])
}

model BlogPost {
  id          Int        @id @default(autoincrement())
  title       String
  slug        String     @unique
  content     String     @db.Text
  excerpt     String?    @db.Text
  imageUrl    String?
  status      PostStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  authorId    String?
  author      User?      @relation("AuthoredBlogPosts", fields: [authorId], references: [id], onDelete: SetNull)
  @@index([authorId])
}

model SupportTicket {
  id            Int            @id @default(autoincrement())
  subject       String
  description   String         @db.Text
  status        TicketStatus   @default(OPEN)
  priority      TicketPriority @default(MEDIUM)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  resolvedAt    DateTime?
  submitterId   String
  submitter     User           @relation("SubmittedTickets", fields: [submitterId], references: [id], onDelete: Cascade)
  assigneeId    String?
  assignee      User?          @relation("AssignedTickets", fields: [assigneeId], references: [id], onDelete: SetNull)
  @@index([submitterId])
  @@index([assigneeId])
}

model LessonComment {
  id        Int      @id @default(autoincrement())
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId  Int
  lesson    Resource @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  parentId  Int?
  parent    LessonComment?  @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  replies   LessonComment[] @relation("Replies")
  @@index([userId])
  @@index([lessonId])
  @@index([parentId])
}

model ErrorReport {
  id          Int          @id @default(autoincrement())
  description String       @db.Text
  status      ReportStatus @default(OPEN)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId    Int
  lesson      Resource     @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([lessonId])
}
```

---

## CI/CD: GitHub Actions (Deploying to VPS)

_(Conceptual YAML for VPS deployment remains largely the same as previously defined, focusing on building and transferring the Next.js app. Secrets for file storage access (e.g., Cloudflare R2 for proofs) might be needed for the runtime environment on the VPS.)_

---

## Suggested Timeline

_(Timeline will need to account for developing the student-side payment instruction UI and proof upload. Admin review panel is deferred.)_

---
