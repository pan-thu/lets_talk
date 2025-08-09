// docs/teacher_prd.md
// docs/teacher_features_prd.md
# Product Requirements Document: Teacher Role Features

**Phase:** 2
**Status:** Planning

## 1. Overview

This document outlines the requirements and implementation plan for the core features of the **Teacher** role. The primary goal is to empower teachers with the tools they need to manage their assigned courses, upload and organize educational resources, and review and grade student submissions.

## 2. Key Features & User Stories

This phase will address the following core user stories for the Teacher role from `docs/user_story.md`:

-   **T6:** View my assigned courses on a Courses page.
-   **T7:** Visit an individual course page to see and manage its structure and content.
-   **T8:** Manage course structure by adding weeks, lessons, and tests.
-   **T9:** Upload and organize course materials (slides, videos, links).
-   **T11:** Access student submissions, download or view them, and provide grades and feedback.

## 3. Phased Implementation Plan

We will implement the teacher features in three logical phases:

### Phase 2.1: Teacher Dashboard & Course Management View

**Goal:** Provide teachers with a secure, centralized view of their assigned courses and a dashboard for managing a single course.

**Backend (tRPC):**

1.  **Teacher-Specific Procedure:** Create a `teacherProcedure` in `src/server/api/trpc.ts`. This will be a middleware that extends `protectedProcedure` to ensure the user has the `TEACHER` role.
2.  **Fetch Assigned Courses:** Create a `course.getTeacherCourses` procedure using `teacherProcedure` to fetch all courses where the `teacherId` matches the logged-in user.
3.  **Fetch Course Details for Management:** Create a `course.getCourseManagementDetails` procedure. It will take a `courseId`, verify the teacher's ownership, and return detailed course information, including all associated resources and a list of enrolled students.

**Frontend (UI):**

1.  **My Courses Page (`/teacher/courses`):** A new page that lists all courses returned by `getTeacherCourses`. This page will use a new `TeacherCourseCard` component.
2.  **Course Management Page (`/teacher/courses/[courseId]`):** A detailed dashboard for a single course, fetched by `getCourseManagementDetails`. It will feature a tabbed interface or separate sections for:
    -   **Course Info:** View/edit title, description, status.
    -   **Content (Resources):** List all lessons and exercises. This is where the CRUD functionality will live.
    -   **Students:** List all enrolled students and their progress.
    -   **Submissions:** A dedicated view for student submissions.

---

### Phase 2.2: Resource (Lesson) CRUD Functionality

**Goal:** Enable teachers to create, update, and delete lessons and exercises within their courses, including support for video and audio uploads.

**Backend (tRPC & API):**

1.  **CRUD Mutations:** In `src/server/api/routers/resource.ts`, create the following mutations, all protected by the `teacherProcedure` and including ownership checks:
    -   `create`: Creates a new `Resource` (lesson/exercise) linked to a course.
    -   `update`: Updates the details of an existing `Resource`.
    -   `delete`: Deletes a `Resource`.
2.  **File Upload API:**
    -   Create a new API route, `/api/upload/resource`, to handle file uploads for course materials (videos, audio files, PDFs).
    -   This route will take a file, upload it to a cloud storage service (like Cloudflare R2 or AWS S3), and return the public URL.
    -   **Environment Variables:** New variables will be needed in `.env` for the storage provider (e.g., `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).

**Frontend (UI):**

1.  **Content Management UI:** On the Course Management page, the "Content" section will be made interactive.
2.  **"Add/Edit Lesson" Modal:** A reusable modal form will be created.
    -   It will include fields for title, description, week, content, and `releaseDate`.
    -   It will feature a file upload component that interacts with the `/api/upload/resource` endpoint. When a file is uploaded, the form will store the returned URL.
    -   The form will use the `create` or `update` tRPC mutations on submission.
3.  **Delete Functionality:** Each lesson in the list will have a "Delete" button that triggers a confirmation dialog before calling the `delete` mutation.
4.  **UI Updates:** The list of resources will automatically refresh upon any successful CRUD operation by invalidating the `getCourseManagementDetails` query.

---

### Phase 2.3: Student Submission Review

**Goal:** Allow teachers to view and grade student submissions for exercises.

**Backend (tRPC):**

1.  **Fetch Submissions:** Create a `submission.getForCourse` procedure in `src/server/api/routers/submission.ts` using the `teacherProcedure`. It will take a `courseId` and return all submissions for that course, including student and resource details.
2.  **Grade Submission Mutation:** Create a `submission.grade` mutation. It will take `submissionId`, `grade`, and `feedback` as input. It will verify that the teacher owns the course associated with the submission before updating the `Submission` record.

**Frontend (UI):**

1.  **Submissions Tab:** On the Course Management page, the "Submissions" tab will display a table or list of all submissions fetched by `getForCourse`.
2.  **Grading View:** Clicking on a submission will open a modal or dedicated view.
    -   This view will display the student's submission (e.g., an audio player for audio submissions).
    -   It will include a form for the teacher to enter a grade and feedback text.
    -   A "Save Grade" button will call the `grade` mutation.
    -   The UI will update optimistically or by refetching data on success.

## 4. Proposed File Structure Changes

```
src/
├── app/
│   ├── (app)/
│   │   └── teacher/                  -- New top-level route group for teachers
│   │       ├── courses/
│   │       │   ├── page.tsx          -- Teacher's "My Courses" list
│   │       │   └── [courseId]/
│   │       │       └── page.tsx      -- Course Management Dashboard
│   │       └── layout.tsx            -- Optional: Layout specific to teacher pages
│   └── api/
│       └── upload/
│           └── resource/
│               └── route.ts          -- New API route for resource file uploads
├── _components/
│   └── teacher/                      -- New component group for teacher features
│       ├── TeacherCourseCard.tsx
│       ├── ResourceFormModal.tsx
│       └── SubmissionGradingView.tsx
└── server/
    └── api/
        ├── routers/
        │   ├── course.ts             -- Add getTeacherCourses, getCourseManagementDetails
        │   ├── resource.ts           -- Add create, update, delete mutations
        │   └── submission.ts         -- Add getForCourse, grade procedures
        └── trpc.ts                   -- Add teacherProcedure


]]
