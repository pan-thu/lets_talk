import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { TicketPriority } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const supportRouter = createTRPCRouter({
  // Create a new support ticket
  createTicket: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1, "Subject is required"),
        description: z.string().min(1, "Description is required"),
        priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subject, description, priority } = input;

      try {
        const ticket = await ctx.db.supportTicket.create({
          data: {
            subject,
            description,
            priority,
            submitterId: ctx.session.user.id,
          },
          include: {
            submitter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          success: true,
          message: "Support ticket created successfully.",
          ticket,
        };
      } catch (error) {
        console.error("Error creating support ticket:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create support ticket.",
        });
      }
    }),

  // Get user's own tickets
  getMyTickets: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [tickets, total] = await Promise.all([
        ctx.db.supportTicket.findMany({
          where: {
            submitterId: ctx.session.user.id,
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                responses: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.supportTicket.count({
          where: {
            submitterId: ctx.session.user.id,
          },
        }),
      ]);

      return {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Get a specific ticket with responses (user can only see their own tickets)
  getTicketDetails: protectedProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { ticketId } = input;

      const ticket = await ctx.db.supportTicket.findUnique({
        where: {
          id: ticketId,
          submitterId: ctx.session.user.id, // Ensure user can only see their own tickets
        },
        include: {
          submitter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          responses: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Support ticket not found.",
        });
      }

      return ticket;
    }),
});
