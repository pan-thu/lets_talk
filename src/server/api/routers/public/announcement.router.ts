import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const announcementRouter = createTRPCRouter({
  list: publicProcedure
    .query(async ({ ctx }) => {
      const announcements = await ctx.db.announcement.findMany({
        where: {
          isGlobal: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      return announcements.map((announcement) => ({
        ...announcement,
        content: announcement.content.length > 200 
          ? announcement.content.substring(0, 200) + "..." 
          : announcement.content,
      }));
    }),
});
