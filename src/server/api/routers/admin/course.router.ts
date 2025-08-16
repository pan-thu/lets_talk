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