import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Radio } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sideOf } from "@/lib/competition";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Live scoring" };

const sides = {
  homeTeam: { include: { school: true } }, awayTeam: { include: { school: true } },
  homeStudent: { select: { id: true, fullName: true, universityName: true, school: { select: { name: true } } } },
  awayStudent: { select: { id: true, fullName: true, universityName: true, school: { select: { name: true } } } },
} as const;

/** Matches an official can score now: live first, then upcoming ones whose two sides are known. */
export default async function ScoreList() {
  await requireStaffPage(["ADMIN", "OFFICIAL"], "/score");
  const matches = await prisma.match.findMany({
    where: { bye: false, status: { in: ["LIVE", "SCHEDULED"] }, OR: [{ homeTeamId: { not: null } }, { homeStudentId: { not: null } }], AND: [{ OR: [{ awayTeamId: { not: null } }, { awayStudentId: { not: null } }] }] },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
    take: 60,
    include: { event: { include: { sport: true } }, ...sides },
  });
  const ordered = [...matches.filter((m) => m.status === "LIVE"), ...matches.filter((m) => m.status !== "LIVE")];
  return (
    <div className="space-y-6">
      <PageHeader title="Live scoring" description="Pick a match and score it from your phone. Works with a weak signal — taps are kept on the phone until they reach the server." />
      {ordered.length === 0 ? (
        <EmptyState icon={<Radio className="size-7" aria-hidden />} title="No matches to score" description="Matches appear here once an admin generates fixtures." />
      ) : (
        <ul className="space-y-2">
          {ordered.map((m) => (
            <li key={m.id}>
              <Link href={`/score/${m.id}`} className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card hover:border-border-strong">
                <span className="min-w-0 flex-1">
                  <span className="block text-small text-muted">
                    {m.event.sport.name} · {m.event.name}
                    {m.division ? ` · ${m.division}` : ""} · {m.roundLabel}
                  </span>
                  <span className="block font-semibold break-words">
                    {sideOf(m, "HOME")?.name} <span className="text-muted">vs</span> {sideOf(m, "AWAY")?.name}
                  </span>
                  {m.scheduledAt && <span className="block text-small text-muted">{formatDateTime(m.scheduledAt)}</span>}
                </span>
                {m.status === "LIVE" && (
                  <Badge tone="danger" icon={<Radio className="size-3.5" aria-hidden />}>
                    {m.homeScore ?? 0}–{m.awayScore ?? 0}
                  </Badge>
                )}
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
