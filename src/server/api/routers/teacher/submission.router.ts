import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, teacherProcedure } from "~/server/api/trpc";

export const submissionRouter = createTRPCRouter({
  // Get all submissions for a course (teacher view)
  getSubmissionsForCourse: teacherProcedure
    .input(
      z.object({
        courseId: z.number().int(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        status: z.enum(["PENDING_REVIEW", "GRADED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { courseId, page, limit, status } = input;
      const teacherId = ctx.session.user.id;
      const skip = (page - 1) * limit;

      // Verify course ownership
      const course = await ctx.db.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
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
          message: "You do not have permission to view submissions for this course.",
        });
      }

      const where = {
        resource: {
          courseId: courseId,
        },
        ...(status && { status }),
      };

      const [submissions, total] = await Promise.all([
        ctx.db.submission.findMany({
          where,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            resource: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
            grader: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.submission.count({ where }),
      ]);

      return {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Grade a submission
  gradeSubmission: teacherProcedure
    .input(
      z.object({
        submissionId: z.number().int(),
        grade: z.number().min(0).max(100),
        feedback: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { submissionId, grade, feedback } = input;
      const teacherId = ctx.session.user.id;

      // Get submission with resource and course info
      const submission = await ctx.db.submission.findUnique({
        where: { id: submissionId },
        include: {
          resource: {
            include: {
              course: {
                select: { teacherId: true },
              },
            },
          },
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found.",
        });
      }

      if (!submission.resource || submission.resource.course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to grade this submission.",
        });
      }

      try {
        const updatedSubmission = await ctx.db.submission.update({
          where: { id: submissionId },
          data: {
            grade,
            feedback,
            status: "GRADED",
            gradedAt: new Date(),
            graderId: teacherId,
          },
          include: {
            student: {
              select: {
                name: true,
                email: true,
              },
            },
            resource: {
              select: {
                title: true,
              },
            },
          },
        });

        return {
          success: true,
          message: "Submission graded successfully.",
          submission: updatedSubmission,
        };
      } catch (error) {
        console.error("Error grading submission:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not grade submission.",
        });
      }
    }),

  // Get submission details
  getSubmissionDetails: teacherProcedure
    .input(z.object({ submissionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { submissionId } = input;
      const teacherId = ctx.session.user.id;

      const submission = await ctx.db.submission.findUnique({
        where: { id: submissionId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          resource: {
            include: {
              course: {
                select: { teacherId: true, title: true },
              },
            },
          },
          grader: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found.",
        });
      }

      if (!submission.resource || submission.resource.course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this submission.",
        });
      }

      return submission;
    }),
});
