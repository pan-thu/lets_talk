import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PostStatus } from "@prisma/client";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const contentRouter = createTRPCRouter({
  // Announcement Management
  createAnnouncement: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      isGlobal: z.boolean().default(false),
      courseId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          isGlobal: input.isGlobal,
          courseId: input.courseId,
          authorId: ctx.session.user.id,
        },
      });
    }),

  updateAnnouncement: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      isGlobal: z.boolean().optional(),
      courseId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.announcement.update({
        where: { id },
        data,
      });
    }),

  deleteAnnouncement: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.announcement.delete({
        where: { id: input.id },
      });
    }),

  listAllAnnouncements: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      scope: z.enum(["GLOBAL", "COURSE"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, scope } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(scope && { scope }),
      };

      const [announcements, total] = await Promise.all([
        ctx.db.announcement.findMany({
          where,
          skip,
          take: limit,
          include: {
            course: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.announcement.count({ where }),
      ]);

      return {
        announcements,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // Blog Management
  createBlogPost: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      excerpt: z.string().optional(),
      imageUrl: z.string().optional(),
      status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
    }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return await ctx.db.blogPost.create({
        data: {
          title: input.title,
          slug,
          content: input.content,
          excerpt: input.excerpt,
          imageUrl: input.imageUrl,
          status: input.status,
          authorId: ctx.session.user.id,
        },
      });
    }),

  updateBlogPost: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      imageUrl: z.string().optional(),
      status: z.nativeEnum(PostStatus).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.blogPost.update({
        where: { id },
        data,
      });
    }),

  deleteBlogPost: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.blogPost.delete({
        where: { id: input.id },
      });
    }),

  listAllBlogPosts: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      status: z.nativeEnum(PostStatus).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(status && { status }),
      };

      const [posts, total] = await Promise.all([
        ctx.db.blogPost.findMany({
          where,
          skip,
          take: limit,
          include: {
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.blogPost.count({ where }),
      ]);

      return {
        posts,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),
});
