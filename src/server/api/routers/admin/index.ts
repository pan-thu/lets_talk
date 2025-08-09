import { createTRPCRouter } from "~/server/api/trpc";
import { managementRouter } from "./management.router";

export const adminRouter = createTRPCRouter({
  management: managementRouter,
});
