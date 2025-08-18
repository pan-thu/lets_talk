import { createTRPCRouter } from "~/server/api/trpc";
import { paymentRouter } from "./payment.router";
import { userRouter } from "./user.router";
import { courseRouter } from "./course.router";
import { contentRouter } from "./content.router";
import { dashboardRouter } from "./dashboard.router";

export const adminRouter = createTRPCRouter({
  payment: paymentRouter,
  user: userRouter,
  course: courseRouter,
  content: contentRouter,
  dashboard: dashboardRouter,
});
