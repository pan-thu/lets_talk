import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { CourseStatus, CourseType } from "@prisma/client";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const courseRouter = createTRPCRouter({
  getAllCourses: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.course.findMany({
        include: {
          teacher: { select: { name: true, email: true } },
          _count: { select: { enrollments: true } },
        },
      });
    }),

  assignCourseToTeacher: adminProcedure
    .input(z.object({
      courseId: z.string(),
      teacherId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.course.update({
        where: { id: Number(input.courseId) },
        data: { teacherId: input.teacherId },
      });
    }),

  createCourse: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string(),
      price: z.number().positive(),
      type: z.nativeEnum(CourseType),
      teacherId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.course.create({
        data: {
          title: input.title,
          description: input.description,
          price: input.price,
          type: input.type,
          status: CourseStatus.DRAFT,
          teacherId: input.teacherId,
        },
      });
    }),

  updateCourse: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      type: z.nativeEnum(CourseType).optional(),
      status: z.nativeEnum(CourseStatus).optional(),
      teacherId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.course.update({
        where: { id: Number(id) },
        data,
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
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
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
            teacher: { select: { name: true, email: true } },
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.course.count({ where }),
      ]);

      return {
        courses,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),
});
