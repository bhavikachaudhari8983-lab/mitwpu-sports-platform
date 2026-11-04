import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Medal } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { medalTally } from "@/lib/competition";
import { FORMAT_LABEL, type Format } from "@/lib/constants";
import { formatDob } from "@/lib/utils";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { MedalTable } from "@/components/competition/medal-table";

export const metadata: Metadata = { title: "Competition" };

export default async function CompetitionPage() {
  await requireStaffPage(["ADMIN"], "/admin/competition");
  const [sports, tally] = await Promise.all([
    prisma.sport.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        events: {
          where: { active: true },
          orderBy: { name: "asc" },
          include: { _count: { select: { teams: true, certificates: true, registrations: { where: { student: { status: "APPROVED" } } } } }, matches: { select: { status: true, bye: true } } },
        },
      },
    }),
    medalTally(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competition"
        description="Set each event's format, build teams from approved athletes, generate fixtures, record results and issue verifiable certificates."
        actions={
          <Link href="/events" className={buttonClass("outline", "md")} target="_blank">
            Public results page
          </Link>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {sports.filter((s) => s.events.length).map((sp) => (
            <Card key={sp.id}>
              <CardHeader title={sp.name} description={sp.isTeam ? "Team sport" : sp.isWeightCategory ? "Individual · weight classes" : "Individual"} />
              <ul className="divide-y divide-border">
                {sp.events.map((ev) => {
                  const played = ev.matches.filter((m) => !m.bye && (m.status === "COMPLETED" || m.status === "WALKOVER")).length;
                  const total = ev.matches.filter((m) => !m.bye).length;
                  const live = ev.matches.some((m) => m.status === "LIVE");
                  return (
                    <li key={ev.id}>
                      <Link href={`/admin/competition/${ev.id}`} className="flex min-h-16 items-center gap-3 px-5 py-3 hover:bg-surface-2">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{ev.name}</span>
                          <span className="flex flex-wrap gap-x-3 text-small text-muted">
                            {ev.eventDate && <span>{formatDob(ev.eventDate)}</span>}
                            <span>{sp.isTeam ? `${ev._count.teams} teams` : `${ev._count.registrations} approved athletes`}</span>
                            {total > 0 && <span>{played}/{total} matches played</span>}
                          </span>
                        </span>
                        <span className="flex flex-wrap justify-end gap-1.5">
                          {live && <Badge tone="danger">Live</Badge>}
                          {ev.format ? <Badge>{FORMAT_LABEL[ev.format as Format].split(" (")[0]}</Badge> : <Badge tone="warning">Set up</Badge>}
                          {ev.resultsFinal && <Badge tone="success">Final</Badge>}
                          {ev._count.certificates > 0 && <Badge tone="info">{ev._count.certificates} certs</Badge>}
                        </span>
                        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
        <Card className="self-start">
          <CardHeader title="Medal tally" description="Finalised events only" action={<Medal className="size-5 text-muted" aria-hidden />} />
          <CardBody>
            <MedalTable rows={tally} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
