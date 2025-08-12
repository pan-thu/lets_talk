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
      scope: z.enum(["GLOBAL", "COURSE"]),
      courseId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          isGlobal: input.scope === "GLOBAL",
          courseId: input.scope === "COURSE" && input.courseId ? Number(input.courseId) : null,
        },
      });
    }),

  updateAnnouncement: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      scope: z.enum(["GLOBAL", "COURSE"]).optional(),
      courseId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, courseId, ...rest } = input;
      return await ctx.db.announcement.update({
        where: { id: Number(id) },
        data: {
          title: rest.title,
          content: rest.content,
          ...(typeof rest.scope !== "undefined" && {
            isGlobal: rest.scope === "GLOBAL",
          }),
          ...(typeof courseId !== "undefined" && {
            courseId: courseId ? Number(courseId) : null,
          }),
        },
      });
    }),

  deleteAnnouncement: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.announcement.delete({
        where: { id: Number(input.id) },
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
      tags: z.array(z.string()).optional(),
      status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
    }))
    .mutation(async ({ ctx, input }) => {
      const baseSlug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      return await ctx.db.blogPost.create({
        data: {
          title: input.title,
          slug: uniqueSlug,
          content: input.content,
          excerpt: input.excerpt,
          status: input.status,
          authorId: ctx.session.user.id,
        },
      });
    }),

  updateBlogPost: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.nativeEnum(PostStatus).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, tags, ...rest } = input;
      return await ctx.db.blogPost.update({
        where: { id: Number(id) },
        data: {
          ...rest,
        },
      });
    }),

  deleteBlogPost: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.blogPost.delete({
        where: { id: Number(input.id) },
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
