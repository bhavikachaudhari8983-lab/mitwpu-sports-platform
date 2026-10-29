import { prisma } from "./prisma";
import type { AuditAction, Role } from "./constants";

export type Actor =
  | { type: "STAFF"; id: string; name: string; role: Role }
  | { type: "STUDENT"; id: string; name: string }
  | { type: "SYSTEM" };

export async function audit(input: {
  actor: Actor;
  action: AuditAction;
  summary: string;
  studentId?: string | null;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  const a = input.actor;
  await prisma.auditLog.create({
    data: {
      actorType: a.type,
      actorId: a.type === "SYSTEM" ? null : a.id,
      actorName: a.type === "SYSTEM" ? "System" : a.name,
      actorRole: a.type === "STAFF" ? a.role : a.type === "STUDENT" ? "STUDENT" : null,
      action: input.action,
      summary: input.summary,
      studentId: input.studentId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      details: input.details ? JSON.stringify(input.details) : null,
      ip: input.ip ?? null,
    },
  });
}
