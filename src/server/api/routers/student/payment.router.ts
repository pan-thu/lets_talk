import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  CourseStatus,
  PaymentStatus,
  EnrollmentStatus,
  Prisma,
} from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const paymentRouter = createTRPCRouter({
  confirmManualPayment: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        proofImageUrl: z.string().url("A valid image URL is required."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { courseId, proofImageUrl } = input;
      const userId = ctx.session.user.id;

      const course = await ctx.db.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      if (course.price <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This course is free and does not require payment.",
        });
      }

      if (course.status !== CourseStatus.PUBLISHED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This course is not currently published.",
        });
      }

      // Check if user is already enrolled
      const existingEnrollment = await ctx.db.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });

      if (existingEnrollment) {
        if (
          existingEnrollment.status === EnrollmentStatus.ACTIVE ||
          existingEnrollment.status === EnrollmentStatus.COMPLETED
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You are already enrolled in this course.",
          });
        }
      }

      try {
        const result = await ctx.db.$transaction(async (prisma) => {
          // Create enrollment
          const newEnrollment = await prisma.enrollment.create({
            data: {
              userId,
              courseId,
              status: EnrollmentStatus.PENDING_PAYMENT_CONFIRMATION,
              paid: false,
            },
          });

          // Generate payment reference ID
          const paymentReferenceId = `PAY-${courseId}-${userId.slice(-4)}-${Date.now().toString().slice(-6)}`;

          // Create payment record with proof already submitted
          const newPayment = await prisma.payment.create({
            data: {
              userId,
              courseId,
              enrollmentId: newEnrollment.id,
              amount: course.price,
              paymentReferenceId,
              status: PaymentStatus.PROOF_SUBMITTED,
              provider: "MANUAL_TRANSFER",
              proofImageUrl,
            },
          });

          return { newEnrollment, newPayment };
        });

        return {
          success: true,
          paymentReferenceId: result.newPayment.paymentReferenceId,
          message:
            "Payment proof submitted successfully. It is now pending review.",
        };
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "A payment process for this course already exists. Please refresh the page.",
          });
        }
        console.error("Failed to confirm manual payment:", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not process payment confirmation.",
        });
      }
    }),

  handleMockWebhook: protectedProcedure
    .input(
      z.object({
        paymentId: z.number(),
        courseId: z.number(),
        event: z.enum(["payment_succeeded", "payment_failed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { paymentId, courseId, event } = input;
      const userId = ctx.session.user.id;

      const payment = await ctx.db.payment.findFirst({
        where: { id: paymentId, userId, courseId },
        include: { enrollment: true },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment record not found.",
        });
      }

      try {
        if (event === "payment_succeeded") {
          await ctx.db.$transaction(async (prisma) => {
            await prisma.payment.update({
              where: { id: paymentId },
              data: { status: PaymentStatus.COMPLETED },
            });

            await prisma.enrollment.update({
              where: { id: payment.enrollment.id },
              data: {
                status: EnrollmentStatus.ACTIVE,
                paid: true,
              },
            });
          });

          return {
            success: true,
            message:
              "Payment completed successfully! You are now enrolled in the course.",
          };
        } else {
          await ctx.db.payment.update({
            where: { id: paymentId },
            data: { status: PaymentStatus.ERROR },
          });

          return {
            success: false,
            message: "Payment failed. Please try again.",
          };
        }
      } catch (error) {
        console.error("Failed to process mock webhook:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process payment webhook.",
        });
      }
    }),
});
