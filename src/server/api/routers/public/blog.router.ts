import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { PostStatus } from "@prisma/client";

export const blogRouter = createTRPCRouter({
  listPublished: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        ctx.db.blogPost.findMany({
          where: {
            status: PostStatus.PUBLISHED,
          },
          skip,
          take: limit,
          include: {
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            publishedAt: "desc",
          },
        }),
        ctx.db.blogPost.count({
          where: {
            status: PostStatus.PUBLISHED,
          },
        }),
      ]);

      return {
        posts,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.blogPost.findFirst({
        where: {
          slug: input.slug,
          status: PostStatus.PUBLISHED,
        },
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      return post;
    }),
});
