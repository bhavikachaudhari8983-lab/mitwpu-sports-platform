import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Radio, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { medalTally, sideOf } from "@/lib/competition";
import { getSettings } from "@/lib/settings";
import { formatDob } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { MedalTable } from "@/components/competition/medal-table";
import { AutoRefresh } from "@/components/competition/auto-refresh";

export const metadata: Metadata = { title: "Results & schedule", description: "Live scores, fixtures, standings and the medal tally." };
export const dynamic = "force-dynamic";

const sides = {
  homeTeam: { include: { school: true } }, awayTeam: { include: { school: true } },
  homeStudent: { select: { id: true, fullName: true, universityName: true, school: { select: { name: true } } } },
  awayStudent: { select: { id: true, fullName: true, universityName: true, school: { select: { name: true } } } },
} as const;

/** Public: anyone can follow the games. Shows names and institutions only — no IDs, ages or contact details. */
export default async function EventsPage() {
  const [settings, tally, live, sports] = await Promise.all([
    getSettings(),
    medalTally(),
    prisma.match.findMany({ where: { status: "LIVE" }, include: { event: { include: { sport: true } }, ...sides } }),
    prisma.sport.findMany({
      where: { active: true, events: { some: { active: true, OR: [{ matches: { some: {} } }, { placings: { some: {} } }] } } },
      orderBy: { name: "asc" },
      include: { events: { where: { active: true, OR: [{ matches: { some: {} } }, { placings: { some: {} } }] }, orderBy: { name: "asc" }, include: { matches: { select: { status: true, bye: true } } } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 pb-24 sm:px-6 sm:py-12">
      <AutoRefresh active={live.length > 0} />
      <div>
        <p className="text-muted">{settings.meetName}</p>
        <h1 className="text-fg">Results & schedule</h1>
      </div>

      {live.length > 0 && (
        <section aria-labelledby="live-h" className="space-y-2">
          <h2 id="live-h" className="flex items-center gap-2 text-xl">
            <Radio className="size-5 text-danger-fg" aria-hidden /> Live now
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {live.map((m) => (
              <li key={m.id}>
                <Link href={`/events/${m.eventId}`} className="block rounded-xl border border-danger/40 bg-surface p-4 shadow-card hover:border-danger">
                  <span className="block text-small text-muted">
                    {m.event.sport.name} · {m.event.name} · {m.roundLabel}
                  </span>
                  <span className="mt-1 flex items-center gap-3">
                    <span className="min-w-0 flex-1 font-semibold break-words">{sideOf(m, "HOME")?.name}</span>
                    <span className="font-mono text-2xl font-bold tabular">
                      {m.homeScore ?? 0}–{m.awayScore ?? 0}
                    </span>
                    <span className="min-w-0 flex-1 text-right font-semibold break-words">{sideOf(m, "AWAY")?.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="ev-h" className="space-y-3">
          <h2 id="ev-h" className="text-xl">
            Events
          </h2>
          {sports.length === 0 ? (
            <EmptyState icon={<Trophy className="size-7" aria-hidden />} title="Nothing scheduled yet" description="Fixtures appear here once the sports office publishes them." />
          ) : (
            sports.map((sp) => (
              <Card key={sp.id}>
                <CardHeader title={sp.name} />
                <ul className="divide-y divide-border">
                  {sp.events.map((ev) => {
                    const real = ev.matches.filter((m) => !m.bye);
                    const done = real.filter((m) => m.status === "COMPLETED" || m.status === "WALKOVER").length;
                    return (
                      <li key={ev.id}>
                        <Link href={`/events/${ev.id}`} className="flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-surface-2">
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold">{ev.name}</span>
                            <span className="block text-small text-muted">
                              {[ev.eventDate && formatDob(ev.eventDate), ev.venue, real.length ? `${done}/${real.length} played` : null].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {ev.resultsFinal ? <Badge tone="success">Final</Badge> : ev.matches.some((m) => m.status === "LIVE") ? <Badge tone="danger">Live</Badge> : done > 0 ? <Badge tone="info">In progress</Badge> : <Badge>Upcoming</Badge>}
                          <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))
          )}
        </section>
        <Card className="self-start">
          <CardHeader title="Medal tally" />
          <CardBody>
            <MedalTable rows={tally} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
