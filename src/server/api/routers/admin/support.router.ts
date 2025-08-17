import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { TicketStatus, TicketPriority } from "@prisma/client";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const supportRouter = createTRPCRouter({
  listSupportTickets: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      status: z.nativeEnum(TicketStatus).optional(),
      priority: z.nativeEnum(TicketPriority).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, priority } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { subject: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(status && { status }),
        ...(priority && { priority }),
      };

      const [tickets, total] = await Promise.all([
        ctx.db.supportTicket.findMany({
          where,
          skip,
          take: limit,
          include: {
            submitter: { select: { name: true, email: true } },
            assignee: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.supportTicket.count({ where }),
      ]);

      return {
        tickets,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  getAllAdmins: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.user.findMany({
        where: { role: { in: ["ADMIN", "TEACHER"] } },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  listTickets: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      status: z.nativeEnum(TicketStatus).optional(),
      priority: z.nativeEnum(TicketPriority).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, priority } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { subject: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(status && { status }),
        ...(priority && { priority }),
      };

      const [tickets, total] = await Promise.all([
        ctx.db.supportTicket.findMany({
          where,
          skip,
          take: limit,
          include: {
            submitter: { select: { name: true, email: true } },
            assignee: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.supportTicket.count({ where }),
      ]);

      return {
        tickets,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  getTicketDetails: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.supportTicket.findUnique({
        where: { id: Number(input.id) },
        include: {
          submitter: { select: { name: true, email: true } },
          assignee: { select: { name: true, email: true } },
          responses: {
            include: {
              author: { select: { name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  updateTicketStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.nativeEnum(TicketStatus),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.supportTicket.update({
        where: { id: Number(input.id) },
        data: { status: input.status },
      });
    }),

  assignTicket: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      assignedToId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: { assigneeId: input.assignedToId },
      });
    }),

  addTicketResponse: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.ticketResponse.create({
        data: {
          message: input.content,
          ticketId: input.ticketId,
          authorId: ctx.session.user.id,
        },
      });
    }),
});
