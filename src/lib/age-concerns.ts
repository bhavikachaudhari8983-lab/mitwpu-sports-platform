// Age concerns ("protests"): any coach, official or medical officer can say "I doubt this athlete's age".
// A concern never changes the athlete's status by itself, so a rival can't knock a player out with a complaint.
// An admin investigates and either dismisses it or upholds it (which flags the registration).
import { prisma } from "./prisma";
import { audit, type Actor } from "./audit";
import { ApiError } from "./api";
import { flag } from "./workflow";
import type { StaffSession } from "./rbac";

export async function raiseAgeConcern(ref: { studentId?: string; sportsId?: string }, reason: string, staff: StaffSession, actor: Actor, ip: string | null) {
  const s = await prisma.student.findFirst({
    where: ref.studentId ? { id: ref.studentId } : { sportsId: ref.sportsId?.trim().toUpperCase() },
    select: { id: true, fullName: true, status: true, registrations: { select: { event: { select: { sportId: true } } } } },
  });
  if (!s || s.status === "DRAFT") throw new ApiError(404, "No submitted registration has that Sports ID.");
  // Coaches may only raise concerns about athletes in their own sport (team-mates or opponents).
  if (staff.role === "COACH" && !s.registrations.some((r) => r.event.sportId === staff.sportId)) throw new ApiError(403, "You can only raise concerns about athletes in your sport.");
  if (await prisma.ageConcern.findFirst({ where: { studentId: s.id, raisedById: staff.id, status: "OPEN" }, select: { id: true } })) {
    throw new ApiError(409, "You already have an open concern about this athlete.");
  }
  const c = await prisma.ageConcern.create({ data: { studentId: s.id, reason, raisedById: staff.id, raisedByName: staff.name, raisedByRole: staff.role } });
  await audit({ actor, action: "AGE_CONCERN_RAISED", studentId: s.id, entityType: "AgeConcern", entityId: c.id, summary: `Age concern raised by ${staff.name} (${staff.role.toLowerCase()}): ${reason}`, ip });
  return { name: s.fullName ?? "athlete" };
}

export async function resolveAgeConcern(studentId: string, concernId: string, outcome: "UPHELD" | "DISMISSED", resolution: string, actor: Actor & { type: "STAFF" }, ip: string | null) {
  const c = await prisma.ageConcern.findUnique({ where: { id: concernId } });
  if (!c || c.studentId !== studentId || c.status !== "OPEN") throw new ApiError(404, "This concern is no longer open.");
  await prisma.ageConcern.update({ where: { id: c.id }, data: { status: outcome, resolution, resolvedById: actor.id, resolvedByName: actor.name, resolvedAt: new Date() } });
  await audit({ actor, action: "AGE_CONCERN_RESOLVED", studentId, entityType: "AgeConcern", entityId: c.id, summary: `Age concern from ${c.raisedByName} ${outcome === "UPHELD" ? "upheld" : "dismissed"}: ${resolution}`, ip });
  if (outcome === "UPHELD") {
    const s = await prisma.student.findUnique({ where: { id: studentId }, select: { status: true } });
    if (s && s.status !== "FLAGGED" && s.status !== "REJECTED") {
      await flag(studentId, "Your age is being reviewed by the sports office. Please bring your original birth certificate and Class 10 certificate.", actor, ip);
    }
  }
}
