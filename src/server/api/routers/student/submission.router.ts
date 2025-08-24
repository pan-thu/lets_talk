import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const submissionRouter = createTRPCRouter({
  createAudioSubmission: protectedProcedure
    .input(
      z.object({
        exerciseId: z.number(),
        enrollmentId: z.number(),
        resourceAttachmentId: z.number(),
        // Accept local file paths like /uploads/..., not just absolute URLs
        audioFileUrl: z.string().min(1),
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
        include: { attachments: { select: { id: true } } },
      });

      if (!exercise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Audio exercise not found in this course",
        });
      }

      // Verify the attachment belongs to the exercise
      const isAttachmentOfExercise = exercise.attachments.some((a) => a.id === input.resourceAttachmentId);
      if (!isAttachmentOfExercise) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid exercise item." });
      }

      // Check if user already has a submission for this attachment (no resubmits allowed)
      const existingSubmission = await ctx.db.submission.findFirst({
        where: {
          resourceAttachmentId: input.resourceAttachmentId,
          resourceId: input.exerciseId,
          enrollmentId: input.enrollmentId,
          studentId: ctx.session.user.id,
        },
      });

      if (existingSubmission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You have already submitted for this exercise item." });
      }

      const submission = await ctx.db.submission.create({
        data: {
          audioUrl: input.audioFileUrl,
          status: "PENDING_REVIEW",
          resourceId: input.exerciseId,
          resourceAttachmentId: input.resourceAttachmentId,
          enrollmentId: input.enrollmentId,
          studentId: ctx.session.user.id,
        },
      });

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

      // Get all submissions for this exercise (per attachment)
      const submissions = await ctx.db.submission.findMany({
        where: {
          resourceId: input.exerciseId,
          enrollmentId: input.enrollmentId,
          studentId: ctx.session.user.id,
        },
        include: {
          grader: { select: { name: true } },
        },
      });

      return submissions;
    }),
});
