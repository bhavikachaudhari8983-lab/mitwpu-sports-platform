// Data for the admin home screen: registrations, the competition, and everything waiting for a decision.
import { prisma } from "./prisma";
import { institutionOf, sideOf, teamInstitution } from "./competition";

const sides = {
  homeTeam: { include: { school: true } }, awayTeam: { include: { school: true } },
  homeStudent: { select: { id: true, fullName: true, universityName: true, school: { select: { name: true } } } },
  awayStudent: { select: { id: true, fullName: true, universityName: true, school: { select: { name: true } } } },
} as const;
const bothSides = { AND: [{ OR: [{ homeTeamId: { not: null } }, { homeStudentId: { not: null } }] }, { OR: [{ awayTeamId: { not: null } }, { awayStudentId: { not: null } }] }] };

export async function competitionSnapshot() {
  const now = new Date();
  const [teams, live, upcoming, overdue, certificates, medals, recent, unsetEvents] = await Promise.all([
    prisma.team.count(),
    prisma.match.findMany({ where: { status: "LIVE" }, include: { event: { include: { sport: true } }, ...sides }, orderBy: { updatedAt: "desc" }, take: 6 }),
    prisma.match.findMany({ where: { status: "SCHEDULED", bye: false, scheduledAt: { gte: new Date(now.getTime() - 60 * 60_000) }, ...bothSides }, include: { event: { include: { sport: true } }, ...sides }, orderBy: { scheduledAt: "asc" }, take: 5 }),
    // Kick-off was more than 2 hours ago and still no result.
    prisma.match.count({ where: { status: "SCHEDULED", bye: false, scheduledAt: { lt: new Date(now.getTime() - 2 * 60 * 60_000) }, ...bothSides } }),
    prisma.certificate.count({ where: { revokedAt: null } }),
    prisma.placing.count({ where: { position: { lte: 3 }, event: { resultsFinal: true } } }),
    prisma.placing.findMany({
      where: { position: { lte: 3 }, event: { resultsFinal: true } },
      orderBy: [{ createdAt: "desc" }, { position: "asc" }],
      take: 6,
      include: { event: { include: { sport: true } }, team: { include: { school: true } }, student: { select: { fullName: true, universityName: true, school: { select: { name: true } } } } },
    }),
    // Events with enough approved athletes to start, but no format chosen yet.
    prisma.event.findMany({ where: { active: true, format: null, registrations: { some: { student: { status: "APPROVED" } } } }, select: { id: true, _count: { select: { registrations: { where: { student: { status: "APPROVED" } } } } } } }),
  ]);
  const label = (m: (typeof live)[number]) => ({
    id: m.id,
    eventId: m.eventId,
    title: `${m.event.sport.name} · ${m.event.name}${m.division ? ` · ${m.division}` : ""}`,
    round: m.roundLabel,
    home: sideOf(m, "HOME")?.name ?? "—",
    away: sideOf(m, "AWAY")?.name ?? "—",
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    at: m.scheduledAt,
  });
  return {
    teams,
    live: live.map(label),
    upcoming: upcoming.map(label),
    overdue,
    certificates,
    medals,
    recentMedals: recent.map((p) => ({
      id: p.id,
      position: p.position,
      who: p.team?.name ?? p.student?.fullName ?? "—",
      institution: p.team ? teamInstitution(p.team) : p.student ? institutionOf(p.student) : "",
      event: `${p.event.sport.name} · ${p.event.name}${p.division ? ` · ${p.division}` : ""}`,
      eventId: p.eventId,
    })),
    eventsToSetUp: unsetEvents.filter((e) => e._count.registrations >= 2).length,
  };
}
