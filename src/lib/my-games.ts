import { prisma } from "./prisma";
import { sideOf } from "./competition";

/** Everything competition-related for one athlete: teams, matches (as player or team member), placings, certificates. */
export async function myGames(studentId: string) {
  const teams = await prisma.teamMember.findMany({ where: { studentId }, include: { team: { include: { event: { include: { sport: true } } } } } });
  const teamIds = teams.map((t) => t.teamId);
  const [matches, placings, certificates] = await Promise.all([
    prisma.match.findMany({
      where: { bye: false, OR: [{ homeStudentId: studentId }, { awayStudentId: studentId }, { homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] },
      orderBy: [{ scheduledAt: "asc" }, { round: "asc" }],
      include: {
        event: { include: { sport: true } },
        homeTeam: { include: { school: true } }, awayTeam: { include: { school: true } },
        homeStudent: { select: { id: true, fullName: true, universityName: true, school: { select: { name: true } } } },
        awayStudent: { select: { id: true, fullName: true, universityName: true, school: { select: { name: true } } } },
      },
    }),
    prisma.placing.findMany({ where: { event: { resultsFinal: true }, OR: [{ studentId }, { teamId: { in: teamIds } }] }, include: { event: { include: { sport: true } }, team: true } }),
    prisma.certificate.findMany({ where: { studentId, revokedAt: null }, orderBy: { issuedAt: "desc" } }),
  ]);
  const mine = (m: (typeof matches)[number]): "HOME" | "AWAY" => (m.homeStudentId === studentId || (m.homeTeamId && teamIds.includes(m.homeTeamId)) ? "HOME" : "AWAY");
  return {
    teams: teams.map((t) => ({ id: t.teamId, name: t.team.name, event: `${t.team.event.sport.name} · ${t.team.event.name}`, captain: t.team.captainId === studentId })),
    matches: matches.map((m) => {
      const side = mine(m);
      const opp = sideOf(m, side === "HOME" ? "AWAY" : "HOME");
      const done = m.status === "COMPLETED" || m.status === "WALKOVER";
      const us = side === "HOME" ? m.homeScore : m.awayScore;
      const them = side === "HOME" ? m.awayScore : m.homeScore;
      return {
        id: m.id,
        eventId: m.eventId,
        title: `${m.event.sport.name} · ${m.event.name}${m.division ? ` · ${m.division}` : ""} · ${m.roundLabel}`,
        opponent: opp?.name ?? "To be decided",
        when: m.scheduledAt,
        venue: m.venue,
        status: m.status,
        score: us != null && them != null ? `${us}–${them}` : null,
        outcome: done ? (m.winner === "DRAW" ? "Draw" : m.winner === side ? "Won" : "Lost") : null,
      };
    }),
    medals: placings.filter((p) => p.position <= 3).map((p) => ({ id: p.id, position: p.position, event: `${p.event.sport.name} · ${p.event.name}${p.division ? ` · ${p.division}` : ""}`, team: p.team?.name ?? null })),
    certificates: certificates.map((c) => ({ code: c.code, kind: c.kind, title: c.title })),
  };
}
