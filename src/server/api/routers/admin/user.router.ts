import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  createTeacher: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await ctx.hashPassword(input.password);
      
      const teacher = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: Role.TEACHER,
        },
      });
      
      return teacher;
    }),

  getAllTeachers: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.user.findMany({
        where: { role: Role.TEACHER },
        select: { id: true, name: true, email: true },
      });
    }),

  listUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      role: z.nativeEnum(Role).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, role } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(role && { role }),
      };

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            image: true,
            // Include enrollments for students
            enrollments: {
              select: {
                id: true,
                status: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
            // Include courses for teachers
            courses: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  updateUser: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.nativeEnum(Role).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.user.update({
        where: { id },
        data,
      });
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.delete({
        where: { id: input.id },
      });
    }),

  getAdminUsers: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.user.findMany({
        where: { role: { in: [Role.ADMIN, Role.TEACHER] } },
        select: { id: true, name: true, email: true, role: true },
      });
    }),
});
