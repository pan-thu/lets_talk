import { createTRPCRouter } from "~/server/api/trpc";
import { paymentRouter } from "./payment.router";
import { dashboardRouter } from "./dashboard.router";
import { studentCourseRouter } from "./course.router";
import { lessonCommentRouter } from "./lessonComment.router";
import { errorReportRouter } from "./errorReport.router";
import { resourceRouter } from "./resource.router";
import { submissionRouter } from "./submission.router";

export const studentRouter = createTRPCRouter({
  payment: paymentRouter,
  dashboard: dashboardRouter,
  course: studentCourseRouter,
  lessonComment: lessonCommentRouter,
  errorReport: errorReportRouter,
  resource: resourceRouter,
  submission: submissionRouter,
});
