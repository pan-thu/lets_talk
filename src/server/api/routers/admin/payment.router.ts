// src/server/api/routers/admin/payment.router.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PaymentStatus, EnrollmentStatus } from "@prisma/client";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const paymentRouter = createTRPCRouter({
  listPendingPayments: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = {
        status: PaymentStatus.PROOF_SUBMITTED,
        ...(search && {
          OR: [
            { user: { name: { contains: search } } },
            { user: { email: { contains: search } } },
            { course: { title: { contains: search } } },
            { paymentReferenceId: { contains: search } },
          ],
        }),
      };

      const [payments, total] = await Promise.all([
        ctx.db.payment.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: { select: { name: true, email: true } },
            course: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.payment.count({ where }),
      ]);

      return {
        payments,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
        },
      };
    }),

  approvePayment: adminProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (prisma) => {
        const payment = await prisma.payment.update({
          where: { id: input.paymentId, status: PaymentStatus.PROOF_SUBMITTED },
          data: { status: PaymentStatus.COMPLETED, reviewedById: ctx.session.user.id, reviewedAt: new Date() },
        });

        if (!payment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment not found or not pending.' });
        }

        await prisma.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: EnrollmentStatus.ACTIVE, activatedAt: new Date() },
        });

        return payment;
      });
    }),

  rejectPayment: adminProcedure
    .input(z.object({ 
      paymentId: z.number(),
      reason: z.string().min(1, "A reason for rejection is required."),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (prisma) => {
        const payment = await prisma.payment.update({
          where: { id: input.paymentId, status: PaymentStatus.PROOF_SUBMITTED },
          data: { 
            status: PaymentStatus.REJECTED,
            adminNotes: input.reason,
            reviewedById: ctx.session.user.id,
            reviewedAt: new Date(),
          },
        });
        
        if (!payment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment not found or not pending.' });
        }

        await prisma.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: EnrollmentStatus.CANCELLED },
        });

        return payment;
      });
    }),
});