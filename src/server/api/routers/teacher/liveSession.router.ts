import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, teacherProcedure } from "~/server/api/trpc";
import { emitAudit } from "~/server/lib/audit";

export const liveSessionRouter = createTRPCRouter({
  // Create a new live session
  create: teacherProcedure
    .input(
      z.object({
        courseId: z.number().int(),
        title: z.string().min(1),
        description: z.string().optional(),
        meetingLink: z.string().url(),
        startTime: z.date(),
        endTime: z.date().optional(),
        week: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        courseId,
        title,
        description,
        meetingLink,
        startTime,
        endTime,
        week,
      } = input;
      const teacherId = ctx.session.user.id;

      // Verify course ownership
      const course = await ctx.db.course.findUnique({
        where: { id: courseId },
        select: { id: true, teacherId: true },
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
            "You do not have permission to create sessions for this course.",
        });
      }

      // Validate session times
      if (endTime && endTime <= startTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time.",
        });
      }

      try {
        const session = await ctx.db.courseSession.create({
          data: {
            courseId,
            title,
            description,
            meetingLink,
            startTime,
            endTime,
            week,
          },
        });

        await emitAudit(ctx.db, {
          type: "LIVE_SCHEDULED",
          title: `Live session scheduled: ${title}`,
          courseId,
          actorUserId: teacherId,
          occurredAt: startTime,
        });

        return session;
      } catch (error) {
        console.error("Error creating live session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create live session.",
        });
      }
    }),

  // Update an existing live session
  update: teacherProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        meetingLink: z.string().url().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        week: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, ...updateData } = input;
      const teacherId = ctx.session.user.id;

      // Get session with course info
      const session = await ctx.db.courseSession.findUnique({
        where: { id: sessionId },
        include: {
          course: {
            select: { id: true, teacherId: true },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Live session not found.",
        });
      }

      if (session.course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this session.",
        });
      }

      // Validate session times if both are provided
      if (
        updateData.startTime &&
        updateData.endTime &&
        updateData.endTime <= updateData.startTime
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time.",
        });
      }

      try {
        const updatedSession = await ctx.db.courseSession.update({
          where: { id: sessionId },
          data: updateData,
        });

        await emitAudit(ctx.db, {
          type: "LIVE_UPDATED",
          title: `Live session updated: ${updatedSession.title}`,
          courseId: updatedSession.courseId,
          actorUserId: teacherId,
          occurredAt: updatedSession.startTime,
        });

        return updatedSession;
      } catch (error) {
        console.error("Error updating live session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update live session.",
        });
      }
    }),

  // Delete a live session
  delete: teacherProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId } = input;
      const teacherId = ctx.session.user.id;

      // Get session with course info
      const session = await ctx.db.courseSession.findUnique({
        where: { id: sessionId },
        include: {
          course: {
            select: { id: true, teacherId: true },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Live session not found.",
        });
      }

      if (session.course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this session.",
        });
      }

      try {
        const deleted = await ctx.db.courseSession.delete({
          where: { id: sessionId },
        });

        await emitAudit(ctx.db, {
          type: "LIVE_CANCELLED",
          title: `Live session cancelled: ${deleted.title}`,
          courseId: deleted.courseId,
          actorUserId: teacherId,
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting live session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not delete live session.",
        });
      }
    }),

  // Upload recording for a session
  uploadRecording: teacherProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
        recordingUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, recordingUrl } = input;
      const teacherId = ctx.session.user.id;

      // Get session with course info
      const session = await ctx.db.courseSession.findUnique({
        where: { id: sessionId },
        include: {
          course: {
            select: { id: true, teacherId: true },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Live session not found.",
        });
      }

      if (session.course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to upload recordings for this session.",
        });
      }

      try {
        const updatedSession = await ctx.db.courseSession.update({
          where: { id: sessionId },
          data: { recordingUrl },
        });

        await emitAudit(ctx.db, {
          type: "RECORDING_UPLOADED",
          title: `Recording uploaded: ${updatedSession.title}`,
          courseId: updatedSession.courseId,
          actorUserId: teacherId,
        });

        return updatedSession;
      } catch (error) {
        console.error("Error uploading recording:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not upload recording.",
        });
      }
    }),

  // Get live sessions for a course (teacher view)
  getForCourse: teacherProcedure
    .input(
      z.object({
        courseId: z.number().int(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      const teacherId = ctx.session.user.id;

      // Verify course ownership
      const course = await ctx.db.course.findUnique({
        where: { id: courseId },
        select: { id: true, teacherId: true },
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
            "You do not have permission to view sessions for this course.",
        });
      }

      const sessions = await ctx.db.courseSession.findMany({
        where: { courseId },
        orderBy: [{ week: "asc" }, { startTime: "asc" }],
      });

      return sessions;
    }),
});
