import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const errorReportRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        lessonId: z.number(),
        description: z.string().min(10).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.errorReport.create({
        data: {
          description: input.description,
          userId: ctx.session.user.id,
          lessonId: input.lessonId,
        },
      });

      return { success: true };
    }),
});
