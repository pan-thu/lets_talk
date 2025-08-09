import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { Role, CourseStatus, CourseType, PaymentStatus, PostStatus, TicketStatus, TicketPriority } from "@prisma/client";

export const managementRouter = createTRPCRouter({
  // Teacher Management
  createTeacher: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await ctx.hashPassword(input.password);
      
      const teacher = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: Role.TEACHER,
        },
      });
      
      return teacher;
    }),

  // Payment Management
  approvePayment: adminProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.update({
        where: { id: input.paymentId },
        data: { status: PaymentStatus.APPROVED },
        include: { student: true, course: true },
      });
      
      // Create enrollment
      await ctx.db.enrollment.create({
        data: {
          studentId: payment.studentId,
          courseId: payment.courseId,
          status: "ACTIVE",
        },
      });
      
      return payment;
    }),

  rejectPayment: adminProcedure
    .input(z.object({ 
      paymentId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.payment.update({
        where: { id: input.paymentId },
        data: { 
          status: PaymentStatus.REJECTED,
          notes: input.reason,
        },
      });
    }),

  // Course Management
  getAllTeachers: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.user.findMany({
        where: { role: Role.TEACHER },
        select: { id: true, name: true, email: true },
      });
    }),

  getAllCourses: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.course.findMany({
        include: {
          teacher: { select: { name: true, email: true } },
          _count: { select: { enrollments: true } },
        },
      });
    }),

  assignCourseToTeacher: adminProcedure
    .input(z.object({
      courseId: z.string(),
      teacherId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.course.update({
        where: { id: input.courseId },
        data: { teacherId: input.teacherId },
      });
    }),

  createCourse: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string(),
      price: z.number().positive(),
      type: z.nativeEnum(CourseType),
      teacherId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.course.create({
        data: {
          title: input.title,
          description: input.description,
          price: input.price,
          type: input.type,
          status: CourseStatus.DRAFT,
          teacherId: input.teacherId,
        },
      });
    }),

  updateCourse: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      type: z.nativeEnum(CourseType).optional(),
      status: z.nativeEnum(CourseStatus).optional(),
      teacherId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.course.update({
        where: { id },
        data,
      });
    }),

  listAllCourses: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      status: z.nativeEnum(CourseStatus).optional(),
      type: z.nativeEnum(CourseType).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, type } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(status && { status }),
        ...(type && { type }),
      };

      const [courses, total] = await Promise.all([
        ctx.db.course.findMany({
          where,
          skip,
          take: limit,
          include: {
            teacher: { select: { name: true, email: true } },
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.course.count({ where }),
      ]);

      return {
        courses,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // User Management
  listUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      role: z.nativeEnum(Role).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, role } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(role && { role }),
      };

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            image: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  updateUser: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.nativeEnum(Role).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.user.update({
        where: { id },
        data,
      });
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.delete({
        where: { id: input.id },
      });
    }),

  // Announcement Management
  createAnnouncement: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      scope: z.enum(["GLOBAL", "COURSE"]),
      courseId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          scope: input.scope,
          courseId: input.courseId,
        },
      });
    }),

  updateAnnouncement: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      scope: z.enum(["GLOBAL", "COURSE"]).optional(),
      courseId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.announcement.update({
        where: { id },
        data,
      });
    }),

  deleteAnnouncement: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.announcement.delete({
        where: { id: input.id },
      });
    }),

  listAllAnnouncements: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      scope: z.enum(["GLOBAL", "COURSE"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, scope } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(scope && { scope }),
      };

      const [announcements, total] = await Promise.all([
        ctx.db.announcement.findMany({
          where,
          skip,
          take: limit,
          include: {
            course: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.announcement.count({ where }),
      ]);

      return {
        announcements,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // Blog Management
  createBlogPost: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      excerpt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.blogPost.create({
        data: {
          title: input.title,
          content: input.content,
          excerpt: input.excerpt,
          tags: input.tags,
          status: input.status,
          authorId: ctx.session.user.id,
        },
      });
    }),

  updateBlogPost: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.nativeEnum(PostStatus).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.blogPost.update({
        where: { id },
        data,
      });
    }),

  deleteBlogPost: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.blogPost.delete({
        where: { id: input.id },
      });
    }),

  listAllBlogPosts: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      status: z.nativeEnum(PostStatus).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(status && { status }),
      };

      const [posts, total] = await Promise.all([
        ctx.db.blogPost.findMany({
          where,
          skip,
          take: limit,
          include: {
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.blogPost.count({ where }),
      ]);

      return {
        posts,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // Support Ticket Management
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

  getAdminUsers: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.user.findMany({
        where: { role: { in: [Role.ADMIN, Role.TEACHER] } },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  // Dashboard Statistics
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
            student: { select: { name: true } },
            course: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.supportTicket.findMany({
          take: 5,
          include: {
            student: { select: { name: true } },
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
