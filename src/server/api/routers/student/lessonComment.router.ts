import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const lessonCommentRouter = createTRPCRouter({
  listByLesson: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Fetch all comments for the lesson, including user info and nested replies up to 3 levels
      const comments = await ctx.db.lessonComment.findMany({
        where: {
          lessonId: input.lessonId,
          parentId: null, // Only get top-level comments
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      name: true,
                      image: true,
                    },
                  },
                  replies: {
                    include: {
                      user: {
                        select: {
                          name: true,
                          image: true,
                        },
                      },
                    },
                    orderBy: {
                      createdAt: "asc",
                    },
                  },
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return comments;
    }),

  add: protectedProcedure
    .input(
      z.object({
        lessonId: z.number(),
        content: z.string().min(1).max(1000),
        parentId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.lessonComment.create({
        data: {
          content: input.content,
          userId: ctx.session.user.id,
          lessonId: input.lessonId,
          parentId: input.parentId,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      return comment;
    }),
});
