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
            student: { select: { name: true, email: true } },
            assignedTo: { select: { name: true, email: true } },
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
            student: { select: { name: true, email: true } },
            assignedTo: { select: { name: true, email: true } },
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
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.supportTicket.findUnique({
        where: { id: input.id },
        include: {
          student: { select: { name: true, email: true } },
          assignedTo: { select: { name: true, email: true } },
          responses: {
            include: {
              user: { select: { name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  updateTicketStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(TicketStatus),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.supportTicket.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  assignTicket: adminProcedure
    .input(z.object({
      ticketId: z.string(),
      assignedToId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.supportTicket.update({
        where: { id: input.ticketId },
        data: { assignedToId: input.assignedToId },
      });
    }),

  addTicketResponse: adminProcedure
    .input(z.object({
      ticketId: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.ticketResponse.create({
        data: {
          content: input.content,
          ticketId: input.ticketId,
          userId: ctx.session.user.id,
        },
      });
    }),
});
