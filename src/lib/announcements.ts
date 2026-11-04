// Role-targeted notices. Shown in-app; optionally also sent by SMS / WhatsApp through the messaging service.
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { audit, type Actor } from "./audit";
import { ApiError } from "./api";
import { messagingService, type MessageChannel } from "@/services";
import type { Audience, Role } from "./constants";

const STAFF_AUDIENCE: Partial<Record<Audience, Role>> = { OFFICIALS: "OFFICIAL", COACHES: "COACH", MEDICAL: "MEDICAL" };

function studentFilter(audience: Audience, eventId: string | null): Prisma.StudentWhereInput | null {
  if (audience === "EVERYONE" || audience === "ATHLETES") return { status: "APPROVED" };
  if (audience === "EVENT") return { status: "APPROVED", registrations: { some: { eventId: eventId ?? "" } } };
  if (audience === "CAPTAINS") return { status: "APPROVED", captainOf: { some: {} } };
  return null;
}

export async function sendAnnouncement(input: { title: string; body: string; audience: Audience; eventId: string | null; channels: MessageChannel[] }, actor: Actor & { type: "STAFF" }, ip: string | null) {
  if (input.audience === "EVENT" && !input.eventId) throw new ApiError(400, "Choose the event.", { eventId: "Choose the event" });
  const sf = studentFilter(input.audience, input.eventId);
  const students = sf ? await prisma.student.findMany({ where: sf, select: { mobile: true } }) : [];
  const role = STAFF_AUDIENCE[input.audience];
  const staff = role ? await prisma.staffUser.count({ where: { role, active: true } }) : input.audience === "EVERYONE" ? await prisma.staffUser.count({ where: { active: true } }) : 0;
  const mobiles = students.map((s) => s.mobile).filter((m): m is string => !!m);
  const text = `${input.title}: ${input.body}`.slice(0, 300);
  for (const channel of input.channels) if (mobiles.length) await messagingService.broadcast({ channel, to: mobiles, text });
  const a = await prisma.announcement.create({
    data: { title: input.title, body: input.body, audience: input.audience, eventId: input.eventId, channels: ["IN_APP", ...input.channels].join(","), recipients: students.length + staff, createdById: actor.id, createdByName: actor.name },
  });
  await audit({ actor, action: "ANNOUNCEMENT_SENT", entityType: "Announcement", entityId: a.id, summary: `Announcement “${input.title}” to ${input.audience.toLowerCase()} (${students.length + staff} people${input.channels.length ? `, also ${input.channels.join(" + ")}` : ""})`, ip });
  return a;
}

/** Notices for one student, newest first. */
export async function announcementsForStudent(studentId: string, take = 5) {
  const s = await prisma.student.findUnique({ where: { id: studentId }, select: { status: true, registrations: { select: { eventId: true } }, captainOf: { select: { id: true } } } });
  if (!s || s.status !== "APPROVED") return [];
  const or: Prisma.AnnouncementWhereInput[] = [{ audience: "EVERYONE" }, { audience: "ATHLETES" }, { audience: "EVENT", eventId: { in: s.registrations.map((r) => r.eventId) } }];
  if (s.captainOf.length) or.push({ audience: "CAPTAINS" });
  return prisma.announcement.findMany({ where: { OR: or }, orderBy: { createdAt: "desc" }, take, include: { event: { select: { name: true } } } });
}

/** Notices for a staff role, newest first. */
export async function announcementsForStaff(role: Role, take = 5) {
  const mine = Object.entries(STAFF_AUDIENCE).find(([, r]) => r === role)?.[0];
  return prisma.announcement.findMany({ where: { audience: { in: ["EVERYONE", ...(mine ? [mine] : [])] } }, orderBy: { createdAt: "desc" }, take });
}
