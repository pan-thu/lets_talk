import { PrismaClient } from "@prisma/client";

type EmitAuditParams = {
  type:
    | "LIVE_SCHEDULED"
    | "LIVE_UPDATED"
    | "LIVE_CANCELLED"
    | "RECORDING_UPLOADED"
    | "EXERCISE_ADDED"
    | "SUBMISSION_GRADED"
    | "ENROLLMENT_ACTIVATED";
  title: string;
  courseId?: number | null;
  actorUserId?: string | null;
  occurredAt?: Date;
};

export async function emitAudit(db: PrismaClient, params: EmitAuditParams) {
  const { occurredAt, ...rest } = params;
  try {
    await db.auditEvent.create({
      data: {
        ...rest,
        occurredAt: occurredAt ?? new Date(),
      } as any,
    });
  } catch (error) {
    console.error("emitAudit error", error);
  }
}


