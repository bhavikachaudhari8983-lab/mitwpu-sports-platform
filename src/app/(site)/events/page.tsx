import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Radio, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { medalTally, sideOf } from "@/lib/competition";
import { getSettings } from "@/lib/settings";
import { formatDob } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { PageHero } from "@/components/layout/page-hero";
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
    <>
    <PageHero eyebrow={settings.meetName} title={<>Results & <span className="text-volt">schedule</span></>} lead="Live scores, fixtures, standings and the medal tally, updated as every match is played." mark="Score" />
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 pb-24 sm:px-6 sm:py-12">
      <AutoRefresh active={live.length > 0} />

      {live.length > 0 && (
        <section aria-labelledby="live-h" className="space-y-3">
          <h2 id="live-h" className="display flex items-center gap-3 text-3xl">
            <Radio className="size-7 text-danger" aria-hidden /> Live now
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {live.map((m) => (
              <li key={m.id}>
                <Link href={`/events/${m.eventId}`} className="lift stage relative block overflow-hidden rounded-lg p-4 sm:p-5">
                  <span className="flex items-center gap-2 text-small text-stage-muted">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-volt px-2 py-0.5 text-xs font-bold text-volt-fg uppercase">
                      <span className="live-dot !bg-volt-fg" /> Live
                    </span>
                    <span className="truncate">
                      {m.event.sport.name} · {m.event.name} · {m.roundLabel}
                    </span>
                  </span>
                  <span className="mt-3 flex items-center gap-3">
                    <span className="min-w-0 flex-1 font-bold break-words">{sideOf(m, "HOME")?.name}</span>
                    <span className="display rounded-md bg-stage-2 px-3 py-1 text-4xl tabular text-volt not-italic">
                      {m.homeScore ?? 0}–{m.awayScore ?? 0}
                    </span>
                    <span className="min-w-0 flex-1 text-right font-bold break-words">{sideOf(m, "AWAY")?.name}</span>
                  </span>
                  <span className="brand-stripe absolute inset-x-0 bottom-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="ev-h" className="space-y-3">
          <h2 id="ev-h" className="display text-3xl">
            Events
          </h2>
          {sports.length === 0 ? (
            <EmptyState icon={<Trophy className="size-7" aria-hidden />} title="Nothing scheduled yet" description="Fixtures appear here once the sports office publishes them." />
          ) : (
            sports.map((sp, i) => (
              <Card key={sp.id} className="lift overflow-hidden" style={{ "--c": RING[i % RING.length] } as React.CSSProperties}>
                <div className="flex items-center gap-3 border-b border-border px-5 py-3">
                  <span className="sport-tab" aria-hidden />
                  <h3 className="font-heading text-xl font-black italic uppercase">{sp.name}</h3>
                </div>
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
        <Card className="self-start overflow-hidden">
          <div className="stage flex items-center gap-3 px-5 py-4">
            <Trophy className="size-6 text-volt" aria-hidden />
            <h2 className="display text-2xl text-stage-fg">Medal tally</h2>
          </div>
          <div className="brand-stripe" aria-hidden />
          <CardBody>
            <MedalTable rows={tally} />
          </CardBody>
        </Card>
      </div>
    </div>
    </>
  );
}

/** The logo's ring colours, used to tell sports apart. */
const RING = ["#ee7a2b", "#4e7eb4", "#7cb342", "#ea4248", "#e0a800"];
