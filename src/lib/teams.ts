// Squads for team events. A player can only be added if they are APPROVED (identity, age and desk checks done),
// registered for this event, not already in another squad for it, and — for a school squad — belong to that school.
import { prisma } from "./prisma";
import { audit, type Actor } from "./audit";
import { ApiError } from "./api";
import { UNIVERSITY_NAME } from "./constants";

async function loadTeam(teamId: string) {
  const t = await prisma.team.findUnique({ where: { id: teamId }, include: { event: { include: { sport: true } }, members: true, school: true } });
  if (!t) throw new ApiError(404, "Team not found");
  return t;
}

const unlocked = (t: { lockedAt: Date | null }) => {
  if (t.lockedAt) throw new ApiError(409, "This roster is locked. Unlock it first.");
};

export async function createTeam(input: { eventId: string; name: string; shortName: string; schoolId: string | null; collegeName: string | null }, actor: Actor, ip: string | null) {
  const ev = await prisma.event.findUnique({ where: { id: input.eventId }, include: { sport: true } });
  if (!ev) throw new ApiError(404, "Event not found");
  if (!ev.sport.isTeam) throw new ApiError(400, `${ev.sport.name} is an individual sport. Athletes are entered directly.`);
  if (await prisma.team.findFirst({ where: { eventId: ev.id, name: input.name }, select: { id: true } })) throw new ApiError(409, "A team with this name is already in the event.", { name: "Already used" });
  const t = await prisma.team.create({ data: { eventId: ev.id, name: input.name, shortName: input.shortName.toUpperCase(), schoolId: input.schoolId, collegeName: input.schoolId ? null : input.collegeName } });
  await audit({ actor, action: "TEAM_CHANGED", entityType: "Team", entityId: t.id, summary: `Team created: ${t.name} (${ev.sport.name} · ${ev.name})`, ip });
  return t;
}

/** Athletes who could be added to this team right now. */
export async function eligiblePlayers(teamId: string) {
  const t = await loadTeam(teamId);
  const taken = await prisma.teamMember.findMany({ where: { team: { eventId: t.eventId } }, select: { studentId: true } });
  const takenIds = new Set(taken.map((m) => m.studentId));
  const students = await prisma.student.findMany({
    where: {
      status: "APPROVED",
      registrations: { some: { eventId: t.eventId } },
      ...(t.schoolId ? { schoolId: t.schoolId } : t.collegeName ? { universityName: t.collegeName } : {}),
    },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, sportsId: true, playingPosition: true, universityName: true, school: { select: { name: true } } },
  });
  return students.filter((s) => !takenIds.has(s.id));
}

export async function addMember(teamId: string, studentId: string, actor: Actor, ip: string | null) {
  const t = await loadTeam(teamId);
  unlocked(t);
  if (t.event.rosterMax && t.members.length >= t.event.rosterMax) throw new ApiError(409, `The roster is full (${t.event.rosterMax} players).`);
  const s = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true, fullName: true, status: true, schoolId: true, universityName: true, registrations: { where: { eventId: t.eventId }, select: { id: true } } } });
  if (!s) throw new ApiError(404, "Athlete not found");
  if (s.status !== "APPROVED") throw new ApiError(409, `${s.fullName ?? "This athlete"} isn't approved yet. Only verified, approved athletes can play.`);
  if (!s.registrations.length) throw new ApiError(409, `${s.fullName} isn't registered for ${t.event.name}.`);
  if (t.schoolId && s.schoolId !== t.schoolId) throw new ApiError(409, `${s.fullName} doesn't belong to ${t.school?.name}.`);
  if (!t.schoolId && t.collegeName && s.universityName !== t.collegeName) throw new ApiError(409, `${s.fullName} isn't from ${t.collegeName}.`);
  const other = await prisma.teamMember.findFirst({ where: { studentId, team: { eventId: t.eventId } }, include: { team: true } });
  if (other) throw new ApiError(409, `${s.fullName} already plays for ${other.team.name} in this event.`);
  await prisma.teamMember.create({ data: { teamId, studentId } });
  await audit({ actor, action: "TEAM_CHANGED", studentId, entityType: "Team", entityId: teamId, summary: `${s.fullName} added to ${t.name}`, ip });
}

export async function removeMember(teamId: string, studentId: string, actor: Actor, ip: string | null) {
  const t = await loadTeam(teamId);
  unlocked(t);
  await prisma.teamMember.deleteMany({ where: { teamId, studentId } });
  if (t.captainId === studentId) await prisma.team.update({ where: { id: teamId }, data: { captainId: null } });
  await audit({ actor, action: "TEAM_CHANGED", studentId, entityType: "Team", entityId: teamId, summary: `Removed from ${t.name}`, ip });
}

export async function setCaptain(teamId: string, studentId: string, actor: Actor, ip: string | null) {
  const t = await loadTeam(teamId);
  if (!t.members.some((m) => m.studentId === studentId)) throw new ApiError(400, "The captain must be on the roster.");
  await prisma.team.update({ where: { id: teamId }, data: { captainId: studentId } });
  await audit({ actor, action: "TEAM_CHANGED", studentId, entityType: "Team", entityId: teamId, summary: `Captain of ${t.name} set`, ip });
}

export async function setLocked(teamId: string, locked: boolean, actor: Actor, ip: string | null) {
  const t = await loadTeam(teamId);
  if (locked && t.event.rosterMin && t.members.length < t.event.rosterMin) throw new ApiError(409, `At least ${t.event.rosterMin} players are needed before locking.`);
  await prisma.team.update({ where: { id: teamId }, data: { lockedAt: locked ? new Date() : null } });
  await audit({ actor, action: "TEAM_CHANGED", entityType: "Team", entityId: teamId, summary: `Roster ${locked ? "locked" : "unlocked"}: ${t.name}`, ip });
}

export async function deleteTeam(teamId: string, actor: Actor, ip: string | null) {
  const t = await loadTeam(teamId);
  if (await prisma.match.count({ where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }], status: { in: ["LIVE", "COMPLETED"] } } })) throw new ApiError(409, "This team has played matches and can't be deleted.");
  await prisma.team.delete({ where: { id: teamId } });
  await audit({ actor, action: "TEAM_CHANGED", entityType: "Team", entityId: teamId, summary: `Team deleted: ${t.name}`, ip });
}

export const representsLabel = (t: { school?: { name: string } | null; collegeName?: string | null }) => t.school?.name ?? t.collegeName ?? UNIVERSITY_NAME;
