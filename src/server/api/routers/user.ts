import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        password: true,
      },
    });

    if (!user) return null;

    const { password, ...rest } = user;
    return { ...rest, hasPassword: Boolean(password) };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      return { ...user, message: "Profile updated successfully" } as const;
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (user.password) {
        const isValid = await ctx.comparePassword(
          input.currentPassword,
          user.password,
        );
        if (!isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Current password is incorrect",
          });
        }
      }

      const newHashed = await ctx.hashPassword(input.newPassword);
      await ctx.db.user.update({
        where: { id: user.id },
        data: { password: newHashed },
      });

      return { message: "Password updated successfully" } as const;
    }),

  // Minimal implementation to support the contribution calendar UI
  getContributionData: protectedProcedure.query(async () => {
    const days = 365;
    const today = new Date();
    const data = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        date: `${yyyy}-${mm}-${dd}`,
        count: 0,
        level: 0 as 0 | 1 | 2 | 3 | 4,
      };
    }).reverse();
    return data;
  }),
});
