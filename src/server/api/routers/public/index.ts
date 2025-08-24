import { createTRPCRouter } from "~/server/api/trpc";
import { announcementRouter } from "./announcement.router";
import { blogRouter } from "./blog.router";
import { calendarRouter } from "./calendar.router";

export const publicRouter = createTRPCRouter({
  announcement: announcementRouter,
  blog: blogRouter,
  calendar: calendarRouter,
});
