import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const announcementRouter = createTRPCRouter({
  list: publicProcedure
    .query(async ({ ctx }) => {
      const announcements = await ctx.db.announcement.findMany({
        where: {
          isGlobal: true,
        },
        include: {
          author: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      return announcements;
    }),
});
