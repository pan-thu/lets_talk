import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PaymentStatus, EnrollmentStatus } from "@prisma/client";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const paymentRouter = createTRPCRouter({
  listPendingPayments: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        ctx.db.payment.findMany({
          where: { status: PaymentStatus.AWAITING_PAYMENT_PROOF },
          skip,
          take: limit,
          include: {
            user: { select: { name: true, email: true } },
            course: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.payment.count({ where: { status: PaymentStatus.AWAITING_PAYMENT_PROOF } }),
      ]);

      return {
        payments,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  approvePayment: adminProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.update({
        where: { id: input.paymentId },
        data: { status: PaymentStatus.COMPLETED },
        include: { user: true, course: true },
      });
      
      // Create enrollment
      await ctx.db.enrollment.create({
        data: {
          userId: payment.userId,
          courseId: payment.courseId,
          status: EnrollmentStatus.ACTIVE,
        },
      });
      
      return payment;
    }),

  rejectPayment: adminProcedure
    .input(z.object({ 
      paymentId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.payment.update({
        where: { id: input.paymentId },
        data: { 
          status: PaymentStatus.REJECTED,
          adminNotes: input.reason ?? undefined,
        },
      });
    }),
});
