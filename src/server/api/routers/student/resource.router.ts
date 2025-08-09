import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const resourceRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(
      z.object({
        lessonId: z.number(),
        courseId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First, verify user is enrolled in the course
      const enrollment = await ctx.db.enrollment.findFirst({
        where: {
          userId: ctx.session.user.id,
          courseId: input.courseId,
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to view lessons",
        });
      }

      // Fetch the lesson (resource) ensuring it belongs to the course
      const lesson = await ctx.db.resource.findFirst({
        where: {
          id: input.lessonId,
          courseId: input.courseId,
        },
        include: {
          course: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found or does not belong to this course",
        });
      }

      return {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        url: lesson.url,
        courseTitle: lesson.course.title,
        courseId: lesson.courseId,
      };
    }),

  getExerciseDetails: protectedProcedure
    .input(
      z.object({
        exerciseId: z.number(),
        courseId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First, verify user is enrolled in the course
      const enrollment = await ctx.db.enrollment.findFirst({
        where: {
          userId: ctx.session.user.id,
          courseId: input.courseId,
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to view exercises",
        });
      }

      // Fetch the exercise (resource) ensuring it's an audio exercise and belongs to the course
      const exercise = await ctx.db.resource.findFirst({
        where: {
          id: input.exerciseId,
          courseId: input.courseId,
          type: "AUDIO_EXERCISE",
        },
        include: {
          course: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!exercise) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Audio exercise not found or does not belong to this course",
        });
      }

      return {
        id: exercise.id,
        title: exercise.title,
        textInstructions: exercise.content, // content field stores text instructions
        teacherAudioUrl: exercise.url, // url field stores teacher's audio prompt
        courseTitle: exercise.course.title,
        courseId: exercise.courseId,
        enrollmentId: enrollment.id, // Include enrollment ID for submissions
      };
    }),
});
