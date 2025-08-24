import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ResourceType } from "@prisma/client";
import { unlink } from "fs/promises";
import { join } from "path";

import { createTRPCRouter, teacherProcedure } from "~/server/api/trpc";

export const resourceRouter = createTRPCRouter({
  // ---- Teacher CRUD Operations ----

  // Create new resource
  create: teacherProcedure
    .input(
      z.object({
        courseId: z.number().int().positive(),
        title: z.string().min(1, "Title is required"),
        // Restrict to only VIDEO or AUDIO_EXERCISE
        type: z.nativeEnum(ResourceType).refine((t) => t === "VIDEO" || t === "AUDIO_EXERCISE", {
          message: "Type must be VIDEO or AUDIO_EXERCISE",
        }),
        url: z.string().min(1),
        content: z.string().optional(),
        week: z.number().int().positive(),
        releaseDate: z.date().optional(),
        attachments: z.array(
          z.object({ fileUrl: z.string().min(1), mimeType: z.string().min(1), filename: z.string().min(1) })
        ).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { courseId, week, ...resourceData } = input;
      const teacherId = ctx.session.user.id;

      // 1. Verify teacher owns the course
      const course = await ctx.db.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });

      if (!course || course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to add resources to this course.",
        });
      }

      // 2. Validate the week number
      const latestResource = await ctx.db.resource.findFirst({
        where: { courseId },
        orderBy: { week: "desc" },
        select: { week: true },
      });

      const highestWeek = latestResource?.week ?? 0;

      // A new resource can be added to the current highest week, or the next one.
      // If no resources exist (highestWeek is 0), it must be week 1.
      if (highestWeek === 0) {
        if (week !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The first week of a course must be Week 1.",
          });
        }
      } else if (week < highestWeek || week > highestWeek + 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can only add resources to the latest week (${highestWeek}) or the next week (${highestWeek + 1}).`,
        });
      }

      // 3. Automatically determine the order
      const latestResourceInWeek = await ctx.db.resource.findFirst({
        where: { courseId, week },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const newOrder = (latestResourceInWeek?.order ?? -1) + 1;

      try {
        const resource = await ctx.db.resource.create({
          data: {
            ...resourceData,
            courseId,
            week,
            order: newOrder,
            url: resourceData.url,
            attachments: resourceData.attachments && resourceData.attachments.length > 0 ? {
              createMany: { data: resourceData.attachments.map(a => ({ fileUrl: a.fileUrl, mimeType: a.mimeType, filename: a.filename })) }
            } : undefined,
          },
          include: { attachments: true },
        });

        return {
          success: true,
          message: "Resource created successfully.",
          resource,
        };
      } catch (error) {
        console.error("Error creating resource:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create resource.",
        });
      }
    }),

  // Update existing resource
  update: teacherProcedure
    .input(
      z.object({
        resourceId: z.number().int().positive(),
        title: z.string().min(1).optional(),
        type: z.nativeEnum(ResourceType).optional().refine((t) => !t || t === "VIDEO" || t === "AUDIO_EXERCISE", {
          message: "Type must be VIDEO or AUDIO_EXERCISE",
        }),
        url: z.string().optional(),
        content: z.string().optional(),
        week: z.number().int().positive().optional(),
        order: z.number().int().min(0).optional(),
        releaseDate: z.date().optional(),
        // Replace attachments in full (simpler flow):
        attachments: z.array(
          z.object({ fileUrl: z.string().min(1), mimeType: z.string().min(1), filename: z.string().min(1) })
        ).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { resourceId, ...updateData } = input;
      const teacherId = ctx.session.user.id;

      // Verify resource exists and teacher owns the course
      const resource = await ctx.db.resource.findUnique({
        where: { id: resourceId },
        include: {
          course: {
            select: { teacherId: true, title: true },
          },
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found.",
        });
      }

      if (resource.course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this resource.",
        });
      }

      // We won't allow changing week/order for now to keep it simple
      if (updateData.week || updateData.order) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Changing week or order is not supported in this update." });
      }

      try {
        const updatedResource = await ctx.db.$transaction(async (prisma) => {
          const baseUpdate = await prisma.resource.update({
            where: { id: resourceId },
            data: {
              title: updateData.title,
              type: updateData.type as any,
              url: updateData.url,
              content: updateData.content,
              releaseDate: updateData.releaseDate,
            },
          });

          if (updateData.attachments) {
            await prisma.resourceAttachment.deleteMany({ where: { resourceId } });
            if (updateData.attachments.length > 0) {
              await prisma.resourceAttachment.createMany({
                data: updateData.attachments.map((a) => ({ resourceId, fileUrl: a.fileUrl, mimeType: a.mimeType, filename: a.filename })),
              });
            }
          }

          return prisma.resource.findUnique({ where: { id: resourceId }, include: { attachments: true } });
        });

        return {
          success: true,
          message: "Resource updated successfully.",
          resource: updatedResource,
        };
      } catch (error) {
        console.error("Error updating resource:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update resource.",
        });
      }
    }),

  // Delete resource
  delete: teacherProcedure
    .input(
      z.object({
        resourceId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { resourceId } = input;
      const teacherId = ctx.session.user.id;

      // Verify resource exists and teacher owns the course
      const resource = await ctx.db.resource.findUnique({
        where: { id: resourceId },
        include: {
          course: {
            select: { teacherId: true },
          },
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found.",
        });
      }

      if (resource.course.teacherId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this resource.",
        });
      }

      try {
        // If the resource has a local file URL, delete it from the server.
        if (resource.url && resource.url.startsWith("/uploads/")) {
          try {
            const filePath = join(process.cwd(), "public", resource.url);
            await unlink(filePath);
          } catch (fileError) {
            console.error("Failed to delete file:", fileError);
            // Continue with resource deletion even if file deletion fails
          }
        }

        await ctx.db.resource.delete({
          where: { id: resourceId },
        });

        // After deletion, we might need to re-order the remaining resources in the same week.
        const remainingResources = await ctx.db.resource.findMany({
            where: {
                courseId: resource.courseId,
                week: resource.week,
            },
            orderBy: {
                order: 'asc'
            }
        });

        // Start a transaction to update the order of remaining resources
        const updates = remainingResources.map((res, index) => {
            return ctx.db.resource.update({
                where: { id: res.id },
                data: { order: index }
            });
        });

        await ctx.db.$transaction(updates);


        return {
          success: true,
          message: "Resource deleted successfully.",
        };
      } catch (error) {
        console.error("Error deleting resource:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not delete resource.",
        });
      }
    }),
});
