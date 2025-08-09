import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, teacherProcedure } from "~/server/api/trpc";

export const teacherCourseRouter = createTRPCRouter({
  // Get all courses assigned to the logged-in teacher
  getTeacherCourses: teacherProcedure.query(async ({ ctx }) => {
    const courses = await ctx.db.course.findMany({
      where: {
        teacherId: ctx.session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return courses;
  }),

  // Get comprehensive course management details for a specific course
  getCourseManagementDetails: teacherProcedure
    .input(z.object({ courseId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      const teacherId = ctx.session.user.id;

      // First, fetch the course and verify ownership
      const course = await ctx.db.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          price: true,
          teacherId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      // Verify ownership
      if (course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to manage this course.",
        });
      }

      // Fetch all related resources (lessons/exercises)
      const resources = await ctx.db.resource.findMany({
        where: { courseId: courseId },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          url: true,
          week: true,
          order: true,
          createdAt: true,
        },
        orderBy: [{ week: "asc" }, { order: "asc" }],
      });

      // Fetch enrolled students with their enrollment details
      const enrollments = await ctx.db.enrollment.findMany({
        where: { courseId: courseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          enrolledAt: "desc",
        },
      });

      return {
        course,
        resources,
        enrollments,
      };
    }),

  // Get student progress data for a course
  getStudentProgress: teacherProcedure
    .input(z.object({ courseId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      const teacherId = ctx.session.user.id;

      // Verify course ownership
      const course = await ctx.db.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          teacherId: true,
        },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      if (course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to view this course's student progress.",
        });
      }

      // Get all course resources to calculate total counts
      const [totalLessons, totalExercises] = await Promise.all([
        ctx.db.resource.count({
          where: {
            courseId: courseId,
            type: { not: "AUDIO_EXERCISE" },
          },
        }),
        ctx.db.resource.count({
          where: {
            courseId: courseId,
            type: "AUDIO_EXERCISE",
          },
        }),
      ]);

      // Get all enrolled students with their progress data
      const enrollments = await ctx.db.enrollment.findMany({
        where: {
          courseId: courseId,
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          lessonCompletions: {
            include: {
              lesson: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                },
              },
            },
          },
          submissions: {
            include: {
              resource: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                },
              },
            },
            orderBy: {
              submittedAt: "desc",
            },
          },
        },
      });

      // Calculate progress for each student
      const students = enrollments.map((enrollment) => {
        const lessonsCompleted = enrollment.lessonCompletions.filter(
          (completion) => completion.lesson.type !== "AUDIO_EXERCISE",
        ).length;

        const exercisesCompleted = enrollment.submissions.length;

        // Calculate overall progress (60% lessons, 40% exercises)
        const lessonProgress =
          totalLessons > 0 ? (lessonsCompleted / totalLessons) * 60 : 0;
        const exerciseProgress =
          totalExercises > 0 ? (exercisesCompleted / totalExercises) * 40 : 0;
        const overallProgress = Math.round(lessonProgress + exerciseProgress);

        // Calculate average grade from graded submissions
        const gradedSubmissions = enrollment.submissions.filter(
          (sub) => sub.grade !== null,
        );
        const averageGrade =
          gradedSubmissions.length > 0
            ? gradedSubmissions.reduce(
                (sum, sub) => sum + (sub.grade ?? 0),
                0,
              ) / gradedSubmissions.length
            : undefined;

        // Get recent activity
        const lastLessonCompleted =
          enrollment.lessonCompletions.length > 0
            ? enrollment.lessonCompletions.sort(
                (a, b) =>
                  new Date(b.completedAt).getTime() -
                  new Date(a.completedAt).getTime(),
              )[0]?.lesson.title
            : undefined;

        const lastSubmission =
          enrollment.submissions.length > 0
            ? enrollment.submissions[0]?.submittedAt
            : undefined;

        return {
          id: enrollment.user.id,
          name: enrollment.user.name ?? "Unknown",
          email: enrollment.user.email ?? "",
          profileImage: enrollment.user.image,
          enrollmentDate: enrollment.enrolledAt,
          lastAccessed: enrollment.lastAccessedAt,
          progress: {
            overallProgress,
            lessonsCompleted,
            totalLessons,
            exercisesCompleted,
            totalExercises,
            averageGrade: averageGrade
              ? Math.round(averageGrade * 100) / 100
              : undefined,
          },
          recentActivity: {
            lastLessonCompleted,
            lastSubmission,
          },
        };
      });

      return { students };
    }),
});
