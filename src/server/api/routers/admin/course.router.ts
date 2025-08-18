// src/server/api/routers/admin/course.router.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { CourseStatus, CourseType } from "@prisma/client";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const courseRouter = createTRPCRouter({
  createCourse: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      price: z.number().min(0),
      type: z.nativeEnum(CourseType),
      status: z.nativeEnum(CourseStatus),
      coverImageUrl: z.string().url().optional(),
      teacherId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.course.create({
        data: input,
      });
    }),

  updateCourse: adminProcedure
    .input(z.object({
      courseId: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().min(0).optional(),
      type: z.nativeEnum(CourseType).optional(),
      status: z.nativeEnum(CourseStatus).optional(),
      coverImageUrl: z.string().url().optional(),
      teacherId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { courseId, ...data } = input;
      return await ctx.db.course.update({
        where: { id: courseId },
        data,
      });
    }),

  archiveCourse: adminProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId },
      });

      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found.' });
      }

      return await ctx.db.course.update({
        where: { id: input.courseId },
        data: { status: CourseStatus.ARCHIVED },
      });
    }),

  getCourseDetails: adminProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;

      // Fetch the course with teacher information
      const course = await ctx.db.course.findUnique({
        where: { id: courseId },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
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

      // Fetch course statistics
      const stats = await ctx.db.enrollment.groupBy({
        by: ["status"],
        where: { courseId: courseId },
        _count: { id: true },
      });

      // Calculate total revenue
      const totalRevenue = await ctx.db.payment.aggregate({
        where: {
          courseId: courseId,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      });

      // Fetch error reports for this course
      const errorReports = await ctx.db.errorReport.findMany({
        where: {
          lesson: {
            courseId: courseId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lesson: {
            select: {
              id: true,
              title: true,
              week: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        course,
        resources,
        enrollments,
        errorReports,
        stats: {
          totalEnrollments: enrollments.length,
          activeEnrollments: stats.find(s => s.status === "ACTIVE")?._count.id || 0,
          pendingEnrollments: stats.find(s => s.status === "PENDING_PAYMENT_CONFIRMATION")?._count.id || 0,
          totalRevenue: totalRevenue._sum.amount || 0,
          totalResources: resources.length,
          totalErrorReports: errorReports.length,
          openErrorReports: errorReports.filter(r => r.status === "OPEN").length,
        },
      };
    }),

  updateErrorReportStatus: adminProcedure
    .input(z.object({
      errorReportId: z.number(),
      status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { errorReportId, status } = input;

      const errorReport = await ctx.db.errorReport.findUnique({
        where: { id: errorReportId },
        include: {
          lesson: {
            select: {
              courseId: true,
            },
          },
        },
      });

      if (!errorReport) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Error report not found.",
        });
      }

      return await ctx.db.errorReport.update({
        where: { id: errorReportId },
        data: { status },
      });
    }),
  
  listAllCourses: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      status: z.nativeEnum(CourseStatus).optional(),
      type: z.nativeEnum(CourseType).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, type } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        }),
        ...(status && { status }),
        ...(type && { type }),
      };

      const [courses, total] = await Promise.all([
        ctx.db.course.findMany({
          where,
          skip,
          take: limit,
          include: {
            teacher: { select: { id: true, name: true } },
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.course.count({ where }),
      ]);

      return {
        courses,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
        },
      };
    }),
});