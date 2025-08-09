import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const dashboardRouter = createTRPCRouter({
  getTodaysTasks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const tasks = await ctx.db.resource.findMany({
      where: {
        releaseDate: {
          gte: today,
          lt: tomorrow,
        },
        course: {
          enrollments: {
            some: {
              userId: userId,
              status: "ACTIVE",
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        releaseDate: "asc",
      },
    });

    return tasks.map((task) => ({
      taskName: `${task.course.title}: ${task.title}`,
    }));
  }),

  getCalendarEvents: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Fetch lessons scheduled for the user's enrolled and active courses
    const resources = await ctx.db.resource.findMany({
      where: {
        releaseDate: {
          not: null, // Only fetch resources that have a release date
        },
        course: {
          enrollments: {
            some: {
              userId: userId,
              status: "ACTIVE",
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        releaseDate: true,
      },
    });

    // Format for the calendar component
    return resources.map((resource) => ({
      day: resource.releaseDate!.getDate(),
      month: resource.releaseDate!.getMonth(),
      year: resource.releaseDate!.getFullYear(),
      title: resource.title,
    }));
  }),

  getRecentlyAccessedCourses: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const enrollments = await ctx.db.enrollment.findMany({
      where: {
        userId: userId,
        lastAccessedAt: {
          not: null,
        },
      },
      orderBy: {
        lastAccessedAt: "desc",
      },
      take: 3,
      include: {
        course: {
          include: {
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      coverImageUrl: enrollment.course.coverImageUrl,
      teacherName: enrollment.course.teacher?.name,
    }));
  }),
});
