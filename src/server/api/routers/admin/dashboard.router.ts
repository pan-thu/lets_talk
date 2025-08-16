// src/server/api/routers/admin/dashboard.router.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { PaymentStatus, Role, CourseStatus, TicketStatus } from "@prisma/client";

export const dashboardRouter = createTRPCRouter({
  getDashboardStats: adminProcedure
    .query(async ({ ctx }) => {
      const [
        userCounts,
        courseCounts,
        paymentStats,
        ticketCounts,
        recentActivity,
      ] = await Promise.all([
        // User stats
        ctx.db.user.groupBy({
          by: ["role"],
          _count: { id: true },
        }),
        // Course stats
        ctx.db.course.groupBy({
          by: ["status"],
          _count: { id: true },
        }),
        // Payment stats
        ctx.db.payment.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { status: PaymentStatus.COMPLETED },
        }),
        // Ticket stats
        ctx.db.supportTicket.groupBy({
          by: ["status"],
          _count: { id: true },
        }),
        // Recent Activities (combined)
        ctx.db.enrollment.findMany({
          take: 3,
          orderBy: { enrolledAt: "desc" },
          select: { id: true, user: { select: { name: true } }, course: { select: { title: true } }, enrolledAt: true },
        }),
      ]);
      
      const recentPayments = await ctx.db.payment.findMany({
        take: 3,
        where: { status: PaymentStatus.PROOF_SUBMITTED },
        orderBy: { createdAt: "desc" },
        select: { id: true, user: { select: { name: true } }, course: { select: { title: true } }, createdAt: true },
      });

      const recentTickets = await ctx.db.supportTicket.findMany({
        take: 3,
        where: { status: TicketStatus.OPEN },
        orderBy: { createdAt: "desc" },
        select: { id: true, submitter: { select: { name: true } }, subject: true, createdAt: true },
      });

      const recentCourses = await ctx.db.course.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true },
      });


      const userStats = {
        students: userCounts.find(u => u.role === Role.STUDENT)?._count.id ?? 0,
        teachers: userCounts.find(u => u.role === Role.TEACHER)?._count.id ?? 0,
        total: userCounts.reduce((acc, curr) => acc + curr._count.id, 0),
      };

      const courseStats = {
        published: courseCounts.find(c => c.status === CourseStatus.PUBLISHED)?._count.id ?? 0,
        draft: courseCounts.find(c => c.status === CourseStatus.DRAFT)?._count.id ?? 0,
        archived: courseCounts.find(c => c.status === CourseStatus.ARCHIVED)?._count.id ?? 0,
        total: courseCounts.reduce((acc, curr) => acc + curr._count.id, 0),
      };

      const ticketStats = {
        open: ticketCounts.find(t => t.status === TicketStatus.OPEN)?._count.id ?? 0,
        inProgress: ticketCounts.find(t => t.status === TicketStatus.IN_PROGRESS)?._count.id ?? 0,
        total: ticketCounts.reduce((acc, curr) => acc + curr._count.id, 0),
      };
      
      const enrollments = await ctx.db.enrollment.count();

      const allActivities = [
        ...recentActivity.map(e => ({ type: 'enrollment', description: `${e.user.name} enrolled in ${e.course.title}`, timestamp: e.enrolledAt, id: e.id })),
        ...recentPayments.map(p => ({ type: 'payment', description: `${p.user.name} submitted payment for ${p.course.title}`, timestamp: p.createdAt, id: p.id })),
        ...recentTickets.map(t => ({ type: 'ticket', description: `${t.submitter.name} opened ticket: ${t.subject}`, timestamp: t.createdAt, id: t.id })),
        ...recentCourses.map(c => ({ type: 'course', description: `New course created: ${c.title}`, timestamp: c.createdAt, id: c.id })),
      ];


      return {
        users: userStats,
        courses: courseStats,
        payments: {
          pending: await ctx.db.payment.count({ where: { status: PaymentStatus.PROOF_SUBMITTED } }),
          completed: paymentStats._count.id,
          totalRevenue: paymentStats._sum.amount ?? 0,
        },
        enrollments: {
          total: enrollments
        },
        tickets: ticketStats,
        recentActivity: {
          enrollments: recentActivity.map(e => ({ type: 'enrollment', description: `${e.user.name} enrolled in ${e.course.title}`, timestamp: e.enrolledAt, id: e.id })),
          payments: recentPayments.map(p => ({ type: 'payment', description: `${p.user.name} submitted payment for ${p.course.title}`, timestamp: p.createdAt, id: p.id })),
          tickets: recentTickets.map(t => ({ type: 'ticket', description: `${t.submitter.name} opened ticket: ${t.subject}`, timestamp: t.createdAt, id: t.id })),
          courses: recentCourses.map(c => ({ type: 'course', description: `New course created: ${c.title}`, timestamp: c.createdAt, id: c.id })),
        },
      };
    }),
});