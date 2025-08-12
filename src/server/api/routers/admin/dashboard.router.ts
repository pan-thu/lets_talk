import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  getDashboardStats: adminProcedure
    .query(async ({ ctx }) => {
      const [
        totalUsers,
        totalCourses,
        totalPayments,
        totalTickets,
        recentPayments,
        recentTickets,
      ] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.course.count(),
        ctx.db.payment.count(),
        ctx.db.supportTicket.count(),
        ctx.db.payment.findMany({
          take: 5,
          include: {
            user: { select: { name: true } },
            course: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.supportTicket.findMany({
          take: 5,
          include: {
            submitter: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        totalUsers,
        totalCourses,
        totalPayments,
        totalTickets,
        recentPayments,
        recentTickets,
      };
    }),
});
