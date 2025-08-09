import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const submissionRouter = createTRPCRouter({
  createAudioSubmission: protectedProcedure
    .input(
      z.object({
        exerciseId: z.number(),
        enrollmentId: z.number(),
        audioFileUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this enrollment
      const enrollment = await ctx.db.enrollment.findFirst({
        where: {
          id: input.enrollmentId,
          userId: ctx.session.user.id,
        },
        include: {
          course: true,
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not enrolled in this course",
        });
      }

      // Verify the exercise exists and belongs to the enrolled course
      const exercise = await ctx.db.resource.findFirst({
        where: {
          id: input.exerciseId,
          courseId: enrollment.courseId,
          type: "AUDIO_EXERCISE",
        },
      });

      if (!exercise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Audio exercise not found in this course",
        });
      }

      // Check if user already has a submission for this exercise
      const existingSubmission = await ctx.db.submission.findFirst({
        where: {
          resourceId: input.exerciseId,
          enrollmentId: input.enrollmentId,
          studentId: ctx.session.user.id,
        },
      });

      if (existingSubmission?.status === "GRADED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "This exercise has already been graded and cannot be resubmitted.",
        });
      }

      let submission;

      if (existingSubmission) {
        // Update existing submission
        submission = await ctx.db.submission.update({
          where: {
            id: existingSubmission.id,
          },
          data: {
            audioUrl: input.audioFileUrl,
            status: "PENDING_REVIEW",
            submittedAt: new Date(),
            grade: null, // Reset grade since it's a new submission
            feedback: null, // Reset feedback
            gradedAt: null,
          },
        });
      } else {
        // Create new submission
        submission = await ctx.db.submission.create({
          data: {
            audioUrl: input.audioFileUrl,
            status: "PENDING_REVIEW",
            resourceId: input.exerciseId,
            enrollmentId: input.enrollmentId,
            studentId: ctx.session.user.id,
          },
        });
      }

      return {
        success: true,
        submissionId: submission.id,
        message: existingSubmission
          ? "Submission updated successfully"
          : "Submission created successfully",
      };
    }),

  getSubmissionsForExercise: protectedProcedure
    .input(
      z.object({
        exerciseId: z.number(),
        enrollmentId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify the user owns this enrollment
      const enrollment = await ctx.db.enrollment.findFirst({
        where: {
          id: input.enrollmentId,
          userId: ctx.session.user.id,
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not enrolled in this course",
        });
      }

      // Get submission for this exercise
      const submission = await ctx.db.submission.findFirst({
        where: {
          resourceId: input.exerciseId,
          enrollmentId: input.enrollmentId,
          studentId: ctx.session.user.id,
        },
        include: {
          grader: {
            select: {
              name: true,
            },
          },
        },
      });

      return submission;
    }),
});
