import { z } from "zod";
import { CourseStatus, EnrollmentStatus, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const studentCourseRouter = createTRPCRouter({
  listPublished: protectedProcedure.query(async ({ ctx }) => {
    const courses = await ctx.db.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return courses;
  }),

  // ---- Get Course Info (for payment page) ----
  getCourseInfo: protectedProcedure
    .input(z.object({ courseId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;

      const course = await ctx.db.course.findUnique({
        where: {
          id: courseId,
          status: CourseStatus.PUBLISHED,
        },
        select: {
          id: true,
          title: true,
          price: true,
          description: true,
        },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Published course not found.",
        });
      }

      if (course.price <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This course is free and does not require payment.",
        });
      }

      return course;
    }),

  // ---- Enroll Mutation (FREE Courses Only) ----
  enroll: protectedProcedure
    .input(z.object({ courseId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { courseId } = input;
      const userId = ctx.session.user.id;

      const course = await ctx.db.course.findUnique({
        where: { id: courseId, status: CourseStatus.PUBLISHED },
        select: { id: true, price: true },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Published course not found.",
        });
      }

      // Ensure it's only for free courses
      if (course.price > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This course requires payment. Use the payment flow instead.",
        });
      }

      try {
        const enrollment = await ctx.db.enrollment.create({
          data: {
            userId: userId,
            courseId: courseId,
            paid: true, // Free course enrollment is considered 'paid'
            status: EnrollmentStatus.ACTIVE, // Free courses are immediately active
          },
        });
        return { success: true, enrollmentId: enrollment.id };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You are already enrolled in this course.",
          });
        }
        console.error("Free enrollment error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not enroll in the free course.",
        });
      }
    }),

  // ----  Get User Enrollments Query ----
  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const enrollments = await ctx.db.enrollment.findMany({
      where: {
        userId: ctx.session.user.id,
        status: EnrollmentStatus.ACTIVE, // Only return active enrollments
      },
      select: {
        courseId: true,
      },
    });
    return new Set(enrollments.map((e) => e.courseId));
  }),

  // ---- Get User Enrollment Status (Active + Pending) ----
  getMyEnrollmentStatus: protectedProcedure.query(async ({ ctx }) => {
    const enrollments = await ctx.db.enrollment.findMany({
      where: {
        userId: ctx.session.user.id,
        OR: [
          { status: EnrollmentStatus.ACTIVE },
          { status: EnrollmentStatus.PENDING_PAYMENT_CONFIRMATION },
        ],
      },
      select: {
        courseId: true,
        status: true,
      },
    });

    return new Map(enrollments.map((e) => [e.courseId, e.status]));
  }),

  // ---- Get Course Details for Enrolled User ----
  getDetailsForEnrolledUser: protectedProcedure
    .input(z.object({ courseId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      const userId = ctx.session.user.id;

      // Verify user is enrolled and get enrollment details
      const enrollment = await ctx.db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not enrolled in this course.",
        });
      }

      // Check if enrollment is active (payment approved)
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Your enrollment is pending payment confirmation. Please complete the payment process first.",
        });
      }

      // Fire-and-forget update for lastAccessedAt
      ctx.db.enrollment
        .update({
          where: { id: enrollment.id },
          data: { lastAccessedAt: new Date() },
        })
        .catch((err) => {
          console.error("Failed to update lastAccessedAt:", err);
        });

      // Fetch all resources (lessons) for this course
      const resources = await ctx.db.resource.findMany({
        where: { courseId: courseId },
        orderBy: [{ week: "asc" }, { order: "asc" }],
        select: {
          id: true,
          title: true,
          type: true,
          week: true,
          order: true,
        },
      });

      // Fetch user's lesson completions for this enrollment
      const completions = await ctx.db.userLessonCompletion.findMany({
        where: {
          userId: userId,
          enrollmentId: enrollment.id,
        },
        select: {
          lessonId: true,
        },
      });

      const completedLessonIds = new Set(completions.map((c) => c.lessonId));

      // Group resources by week and add completion status
      const weekMap = new Map<
        number,
        Array<{
          id: number;
          title: string;
          type: string;
          isCompleted: boolean;
        }>
      >();

      resources.forEach((resource) => {
        const week = resource.week ?? 1; // Default to week 1 if not specified
        if (!weekMap.has(week)) {
          weekMap.set(week, []);
        }
        weekMap.get(week)!.push({
          id: resource.id,
          title: resource.title,
          type: resource.type,
          isCompleted: completedLessonIds.has(resource.id),
        });
      });

      // Convert to weeks array
      const weeks = Array.from(weekMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([weekNumber, lessons]) => ({
          id: weekNumber.toString(),
          title: `Week ${weekNumber}`,
          lessons: lessons,
        }));

      // Calculate progress percentage
      const totalLessons = resources.length;
      const completedLessons = completions.length;
      const progressPercentage =
        totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      // Update enrollment progress if it's different
      if (Math.abs(enrollment.progress - progressPercentage) > 0.01) {
        await ctx.db.enrollment.update({
          where: { id: enrollment.id },
          data: { progress: progressPercentage },
        });
      }

      return {
        enrollmentId: enrollment.id,
        courseTitle: enrollment.course.title,
        progressPercentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
        currentMarks: enrollment.grade ?? 0,
        totalMarks: 100, // Static for now
        weeks: weeks,
      };
    }),

  // ---- Toggle Lesson Completion ----
  toggleLessonCompletion: protectedProcedure
    .input(
      z.object({
        lessonId: z.number().int(),
        courseId: z.number().int(),
        enrollmentId: z.number().int(),
        isCompleted: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { lessonId, courseId, enrollmentId, isCompleted } = input;
      const userId = ctx.session.user.id;

      // Verify the enrollment belongs to the user and course
      const enrollment = await ctx.db.enrollment.findUnique({
        where: {
          id: enrollmentId,
          userId: userId,
          courseId: courseId,
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Invalid enrollment or you don't have access to this course.",
        });
      }

      // Check if enrollment is active (payment approved)
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your enrollment is pending payment confirmation.",
        });
      }

      // Verify the lesson belongs to this course
      const lesson = await ctx.db.resource.findUnique({
        where: {
          id: lessonId,
          courseId: courseId,
        },
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found in this course.",
        });
      }

      try {
        if (isCompleted) {
          // Create completion record (use upsert to handle duplicates gracefully)
          await ctx.db.userLessonCompletion.upsert({
            where: {
              userId_lessonId_enrollmentId: {
                userId: userId,
                lessonId: lessonId,
                enrollmentId: enrollmentId,
              },
            },
            update: {}, // Do nothing if it already exists
            create: {
              userId: userId,
              lessonId: lessonId,
              enrollmentId: enrollmentId,
            },
          });
        } else {
          // Delete completion record
          await ctx.db.userLessonCompletion.deleteMany({
            where: {
              userId: userId,
              lessonId: lessonId,
              enrollmentId: enrollmentId,
            },
          });
        }

        // Recalculate progress
        const totalLessons = await ctx.db.resource.count({
          where: { courseId: courseId },
        });

        const completedLessons = await ctx.db.userLessonCompletion.count({
          where: {
            enrollmentId: enrollmentId,
          },
        });

        const newProgressPercentage =
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        // Update enrollment progress
        await ctx.db.enrollment.update({
          where: { id: enrollmentId },
          data: { progress: newProgressPercentage },
        });

        return {
          success: true,
          newProgressPercentage: Math.round(newProgressPercentage * 100) / 100,
        };
      } catch (error) {
        console.error("Error toggling lesson completion:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update lesson completion status.",
        });
      }
    }),

  // Get live sessions for enrolled students with time-lock logic
  getLiveSessions: protectedProcedure
    .input(z.object({ courseId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      const userId = ctx.session.user.id;

      // Verify user is enrolled in the course
      const enrollment = await ctx.db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId,
          },
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not enrolled in this course.",
        });
      }

      // Check if enrollment is active
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your enrollment is pending payment confirmation.",
        });
      }

      // Get all live sessions for the course
      const sessions = await ctx.db.courseSession.findMany({
        where: { courseId },
        orderBy: [{ week: "asc" }, { startTime: "asc" }],
      });

      // Add time-lock logic to each session
      const now = new Date();
      const sessionsWithStatus = sessions.map((session) => {
        const startTime = new Date(session.startTime);
        const endTime = session.endTime ? new Date(session.endTime) : null;
        const joinWindowStart = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 minutes before

        let status: "upcoming" | "joinable" | "live" | "completed" | "missed";
        let canJoin = false;
        let meetingLink: string | null = null;

        if (now < joinWindowStart) {
          status = "upcoming";
        } else if (now >= joinWindowStart && now <= startTime) {
          status = "joinable";
          canJoin = true;
          meetingLink = session.meetingLink;
        } else if (endTime && now > startTime && now <= endTime) {
          status = "live";
          canJoin = true;
          meetingLink = session.meetingLink;
        } else if (endTime && now > endTime) {
          status = session.recordingUrl ? "completed" : "missed";
        } else if (!endTime && now > startTime) {
          // No end time specified, assume session is live for 2 hours
          const assumedEndTime = new Date(
            startTime.getTime() + 2 * 60 * 60 * 1000,
          );
          if (now <= assumedEndTime) {
            status = "live";
            canJoin = true;
            meetingLink = session.meetingLink;
          } else {
            status = session.recordingUrl ? "completed" : "missed";
          }
        } else {
          status = "upcoming";
        }

        return {
          id: session.id,
          title: session.title,
          description: session.description,
          startTime: session.startTime,
          endTime: session.endTime,
          week: session.week,
          recordingUrl: session.recordingUrl,
          status,
          canJoin,
          meetingLink,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        };
      });

      return sessionsWithStatus;
    }),
});
