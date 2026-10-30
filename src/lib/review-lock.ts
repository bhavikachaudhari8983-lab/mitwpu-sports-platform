import { prisma } from "./prisma";
import type { StaffSession } from "./rbac";

/** A reviewer who hasn't sent a heartbeat for this long is treated as gone. */
export const REVIEW_TTL_MS = 3 * 60 * 1000;

const fresh = (seenAt: Date) => Date.now() - seenAt.getTime() < REVIEW_TTL_MS;

/** Returns the other admin currently reviewing, or null after taking (or refreshing) the marker ourselves. */
export async function claimReview(studentId: string, staff: StaffSession): Promise<{ name: string; since: string } | null> {
  const lock = await prisma.reviewLock.findUnique({ where: { studentId } });
  if (lock && lock.staffId !== staff.id && fresh(lock.seenAt)) return { name: lock.staffName, since: lock.since.toISOString() };
  const now = new Date();
  await prisma.reviewLock.upsert({
    where: { studentId },
    create: { studentId, staffId: staff.id, staffName: staff.name, since: now, seenAt: now },
    update: lock?.staffId === staff.id ? { seenAt: now } : { staffId: staff.id, staffName: staff.name, since: now, seenAt: now },
  });
  return null;
}

export async function releaseReview(studentId: string, staffId: string) {
  await prisma.reviewLock.deleteMany({ where: { studentId, staffId } });
}

/** For lists: which records someone is reviewing right now. */
export async function activeReviews(studentIds: string[]) {
  const rows = await prisma.reviewLock.findMany({ where: { studentId: { in: studentIds }, seenAt: { gte: new Date(Date.now() - REVIEW_TTL_MS) } } });
  return new Map(rows.map((r) => [r.studentId, r.staffName]));
}
