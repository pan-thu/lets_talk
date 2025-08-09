import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { userRouter } from "~/server/api/routers/user";
import { publicRouter } from "~/server/api/routers/public";
import { studentRouter } from "~/server/api/routers/student";
import { teacherRouter } from "~/server/api/routers/teacher";
import { adminRouter } from "~/server/api/routers/admin";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  public: publicRouter,
  student: studentRouter,
  teacher: teacherRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
