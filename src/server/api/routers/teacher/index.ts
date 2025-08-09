import { createTRPCRouter } from "~/server/api/trpc";
import { resourceRouter } from "./resource.router";
import { submissionRouter } from "./submission.router";
import { liveSessionRouter } from "./liveSession.router";
import { teacherCourseRouter } from "./course.router";

export const teacherRouter = createTRPCRouter({
  resource: resourceRouter,
  submission: submissionRouter,
  liveSession: liveSessionRouter,
  course: teacherCourseRouter,
});
