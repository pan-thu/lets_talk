import { z } from "zod";
import { createTRPCRouter, protectedProcedure, teacherProcedure } from "~/server/api/trpc";

export const calendarRouter = createTRPCRouter({
  // Student calendar events: enrolled courses only
  student: protectedProcedure
    .input(z.object({ start: z.date().optional(), end: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const enrollments = await ctx.db.enrollment.findMany({
        where: { userId, status: "ACTIVE" },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);
      if (courseIds.length === 0) return [];

      const [events, sessions] = await Promise.all([
        ctx.db.auditEvent.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: { occurredAt: "desc" },
          take: 500,
        }),
        ctx.db.courseSession.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: [{ startTime: "asc" }],
        }),
      ]);

      const now = new Date();
      const liveItems = sessions.map((s) => ({
        id: `live-${s.id}`,
        type: "LIVE",
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        status: (() => {
          const start = new Date(s.startTime);
          const end = s.endTime ? new Date(s.endTime) : null;
          const joinWindowStart = new Date(start.getTime() - 15 * 60 * 1000);
          if (now < joinWindowStart) return "upcoming";
          if (now >= joinWindowStart && now <= start) return "joinable";
          if (end && now > start && now <= end) return "live";
          if ((end && now > end) || (!end && now > start)) return s.recordingUrl ? "completed" : "missed";
          return "upcoming";
        })(),
      }));

      const eventItems = events.map((e) => ({
        id: `evt-${e.id}`,
        type: e.type,
        title: e.title,
        occurredAt: e.occurredAt,
      }));

      return [...liveItems, ...eventItems];
    }),

  // Teacher calendar events: owned courses only
  teacher: teacherProcedure
    .input(z.object({ start: z.date().optional(), end: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const courses = await ctx.db.course.findMany({
        where: { teacherId: ctx.session.user.id },
        select: { id: true },
      });
      const courseIds = courses.map((c) => c.id);
      if (courseIds.length === 0) return [];

      const [events, sessions] = await Promise.all([
        ctx.db.auditEvent.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: { occurredAt: "desc" },
          take: 500,
        }),
        ctx.db.courseSession.findMany({
          where: { courseId: { in: courseIds } },
          orderBy: [{ startTime: "asc" }],
        }),
      ]);

      const now = new Date();
      const liveItems = sessions.map((s) => ({
        id: `live-${s.id}`,
        type: "LIVE",
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        status: (() => {
          const start = new Date(s.startTime);
          const end = s.endTime ? new Date(s.endTime) : null;
          const joinWindowStart = new Date(start.getTime() - 15 * 60 * 1000);
          if (now < joinWindowStart) return "upcoming";
          if (now >= joinWindowStart && now <= start) return "joinable";
          if (end && now > start && now <= end) return "live";
          if ((end && now > end) || (!end && now > start)) return s.recordingUrl ? "completed" : "missed";
          return "upcoming";
        })(),
      }));

      const eventItems = events.map((e) => ({
        id: `evt-${e.id}`,
        type: e.type,
        title: e.title,
        occurredAt: e.occurredAt,
      }));

      return [...liveItems, ...eventItems];
    }),
});


