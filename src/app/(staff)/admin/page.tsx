import type { Metadata } from "next";
import Link from "next/link";
import { Award, Building2, CalendarClock, CheckCircle2, ChevronRight, ExternalLink, Flag, ListChecks, Medal, Megaphone, Radio, Repeat, Shield, ShieldQuestion, Timer, Trophy, Users, XCircle } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { dashboardStats, FILTER_KEYS, listStudents, oversightCounts, PAGE_SIZE, parseFilters } from "@/lib/admin-queries";
import { activeReviews } from "@/lib/review-lock";
import { competitionSnapshot } from "@/lib/dashboard";
import { getSettings } from "@/lib/settings";
import { cn, formatDateTime } from "@/lib/utils";
import { STUDENT_TYPE_LABEL, type StudentType } from "@/lib/constants";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { BarChart } from "@/components/admin/bar-chart";
import { FiltersBar } from "@/components/admin/filters-bar";
import { Pagination, StudentsTable } from "@/components/admin/students-table";

export const metadata: Metadata = { title: "Admin dashboard" };

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const MEDAL_BG = ["", "bg-[#C9A227]", "bg-[#8A939E]", "bg-[#B0703A]"];
const MEDAL_NAME = ["", "Gold", "Silver", "Bronze"];

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireStaffPage(["ADMIN"], "/admin");
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [stats, oversight, { rows, total }, sports, cats, pendingDeletions, untrustedColleges, schools, comp, settings] = await Promise.all([
    dashboardStats(),
    oversightCounts(),
    listStudents(filters),
    prisma.sport.findMany({ select: { id: true, name: true, events: { select: { id: true, name: true }, orderBy: { name: "asc" } }, weightCategories: { select: { id: true, name: true, gender: true, maxKg: true } } }, orderBy: { name: "asc" } }),
    prisma.ageCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true } }),
    prisma.deletionRequest.count({ where: { status: "PENDING" } }),
    prisma.student.count({ where: { studentType: "OUTSIDE_INDIAN", status: "PENDING", college: { trusted: false } } }),
    prisma.school.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    competitionSnapshot(),
    getSettings(),
  ]);
  const reviewing = Object.fromEntries(await activeReviews(rows.map((r) => r.id)));
  const params = Object.fromEntries(FILTER_KEYS.map((k) => [k, filters[k]]));
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  const bySport = stats.bySport.filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
  const filterSports = sports.map((s) => ({ id: s.id, name: s.name, events: s.events, weights: [...s.weightCategories].sort((a, b) => (a.maxKg ?? 999) - (b.maxKg ?? 999)) }));

  type Item = { tone: "danger" | "warning" | "info" | "success"; icon: typeof Users; text: string; href: string; action: string };
  const attention: Item[] = [
    oversight.dobCorrections > 0 && { tone: "danger" as const, icon: CalendarClock, text: `${plural(oversight.dobCorrections, "DOB correction")} waiting for a second admin`, href: "/admin?view=dob#students", action: "Review" },
    oversight.ageConcerns > 0 && { tone: "warning" as const, icon: ShieldQuestion, text: `${plural(oversight.ageConcerns, "age concern")} raised by coaches or officials`, href: "/admin?view=concerns#students", action: "Investigate" },
    stats.ready > 0 && { tone: "success" as const, icon: ListChecks, text: `${plural(stats.ready, "athlete")} verified and ready to approve`, href: "/admin/ready", action: "Approve" },
    stats.flagged > 0 && { tone: "warning" as const, icon: Flag, text: `${plural(stats.flagged, "registration")} flagged for review`, href: "/admin?status=FLAGGED#students", action: "Review" },
    oversight.changeRequests > 0 && { tone: "info" as const, icon: Repeat, text: `${plural(oversight.changeRequests, "event change request")} from students`, href: "/admin?view=changes#students", action: "Decide" },
    untrustedColleges > 0 && { tone: "warning" as const, icon: Building2, text: `${plural(untrustedColleges, "outside student")} waiting for college confirmation`, href: "/admin?type=OUTSIDE_INDIAN&status=PENDING#students", action: "Confirm" },
    comp.overdue > 0 && { tone: "warning" as const, icon: Timer, text: `${plural(comp.overdue, "match", "matches")} played but no result entered`, href: "/score", action: "Enter results" },
    comp.eventsToSetUp > 0 && { tone: "info" as const, icon: Trophy, text: `${plural(comp.eventsToSetUp, "event")} with approved athletes but no format yet`, href: "/admin/competition", action: "Set up" },
    pendingDeletions > 0 && { tone: "warning" as const, icon: XCircle, text: `${plural(pendingDeletions, "data deletion request")}`, href: "/admin/settings#deletion", action: "Process" },
  ].filter((a): a is Item => !!a);
  const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = me.name.split(" ")[0];
  const TONE: Record<Item["tone"], string> = { danger: "bg-danger-bg text-danger-fg", warning: "bg-warning-bg text-warning-fg", info: "bg-info-bg text-info-fg", success: "bg-success-bg text-success-fg" };

  return (
    <div className="space-y-6">
      <section aria-labelledby="welcome" className="hero-pattern relative overflow-hidden rounded-2xl border border-border p-5 text-hero-fg shadow-card sm:p-7">
        <div className="brand-stripe absolute inset-x-0 top-0 h-1" aria-hidden />
        <p className="text-small font-medium text-hero-muted">{settings.meetName}</p>
        <h1 id="welcome" className="mt-1 text-[clamp(1.6rem,3.5vw,2.25rem)]">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-1 text-hero-muted">
          {attention.length ? (
            <>
              <strong className="text-hero-fg">{plural(attention.length, "thing")} need{attention.length === 1 ? "s" : ""} you today.</strong>
              {comp.live.length > 0 && ` ${plural(comp.live.length, "match", "matches")} live now.`}
            </>
          ) : (
            <>Nothing is waiting on you. {comp.live.length > 0 ? `${plural(comp.live.length, "match", "matches")} live now.` : "Enjoy the games."}</>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/ready" className={buttonClass("primary", "md")}>
            <ListChecks className="size-4" aria-hidden /> Ready to approve{stats.ready ? ` (${stats.ready})` : ""}
          </Link>
          <Link href="/admin/competition" className={buttonClass("outline", "md")}>
            <Trophy className="size-4" aria-hidden /> Competition
          </Link>
          <Link href="/admin/announcements" className={buttonClass("outline", "md")}>
            <Megaphone className="size-4" aria-hidden /> Announce
          </Link>
          <Link href="/events" target="_blank" className={buttonClass("ghost", "md")}>
            Public results <ExternalLink className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Registrations" value={stats.total} icon={<Users className="size-5 text-fg" aria-hidden />} href="/admin#students" />
        <StatCard label="Approved athletes" value={stats.approved} icon={<CheckCircle2 className="size-5 text-success-fg" aria-hidden />} href="/admin?status=APPROVED#students" />
        <StatCard label="Ready to approve" value={stats.ready} icon={<ListChecks className="size-5 text-success-fg" aria-hidden />} href="/admin/ready" />
        <StatCard label="Flagged" value={stats.flagged} icon={<Flag className="size-5 text-warning-fg" aria-hidden />} href="/admin?status=FLAGGED#students" />
        <StatCard label="Teams" value={comp.teams} icon={<Shield className="size-5 text-fg" aria-hidden />} href="/admin/competition" />
        <StatCard label="Live now" value={comp.live.length} icon={<Radio className="size-5 text-danger-fg" aria-hidden />} href="/score" />
        <StatCard label="Medals awarded" value={comp.medals} icon={<Medal className="size-5 text-fg" aria-hidden />} href="/admin/competition" />
        <StatCard label="Certificates" value={comp.certificates} icon={<Award className="size-5 text-fg" aria-hidden />} href="/admin/competition" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Needs your attention" description="Everything waiting for a decision, most urgent first." />
          <CardBody>
            {attention.length === 0 ? (
              <p className="flex items-center gap-2 text-muted">
                <CheckCircle2 className="size-5 text-success-fg" aria-hidden /> All clear — nothing is waiting.
              </p>
            ) : (
              <ul className="space-y-2">
                {attention.map((a) => (
                  <li key={a.text}>
                    <Link href={a.href} className="flex min-h-14 items-center gap-3 rounded-xl border border-border p-3 hover:border-border-strong hover:bg-surface-2">
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", TONE[a.tone])}>
                        <a.icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 font-medium">{a.text}</span>
                      <span className="hidden shrink-0 text-small font-semibold text-fg sm:inline">{a.action}</span>
                      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {oversight.recentDobChanges > 0 && (
              <p className="mt-3 text-small text-muted">
                {plural(oversight.recentDobChanges, "verified date")} of birth changed in the last 30 days.{" "}
                <Link href="/admin/audit?action=DOB_CHANGED" className="font-semibold text-fg underline underline-offset-4">
                  Review in audit log
                </Link>
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Live & upcoming" description="Scores update as officials tap them in." action={<Link href="/score" className="text-small font-semibold text-fg underline underline-offset-4">Live scoring</Link>} />
          <CardBody className="space-y-3">
            {comp.live.length === 0 && comp.upcoming.length === 0 && <p className="text-muted">No matches scheduled. Generate fixtures under Competition.</p>}
            {comp.live.map((m) => (
              <Link key={m.id} href={`/admin/competition/${m.eventId}`} className="block rounded-xl border border-danger/40 p-3 hover:border-danger">
                <p className="flex items-center gap-2 text-small text-muted">
                  <span className="inline-flex items-center gap-1 font-semibold text-danger-fg">
                    <span className="size-2 animate-pulse rounded-full bg-danger" aria-hidden /> LIVE
                  </span>
                  {m.title} · {m.round}
                </p>
                <p className="mt-1 flex items-center gap-3">
                  <span className="min-w-0 flex-1 font-semibold break-words">{m.home}</span>
                  <span className="font-mono text-xl font-bold tabular">
                    {m.homeScore ?? 0}–{m.awayScore ?? 0}
                  </span>
                  <span className="min-w-0 flex-1 text-right font-semibold break-words">{m.away}</span>
                </p>
              </Link>
            ))}
            {comp.upcoming.length > 0 && (
              <ul className="divide-y divide-border">
                {comp.upcoming.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/competition/${m.eventId}`} className="flex min-h-14 items-center gap-3 py-2 hover:bg-surface-2">
                      <span className="w-24 shrink-0 text-small text-muted">{m.at ? formatDateTime(m.at).replace(/ \d{4},/, ",") : "TBC"}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium break-words">
                          {m.home} <span className="text-muted">vs</span> {m.away}
                        </span>
                        <span className="block text-small text-muted">{m.title} · {m.round}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Registrations by sport" description="Students per sport (all submitted statuses). Hover for approved count." rows={bySport.map((s) => ({ label: s.name, value: s.total, secondary: { label: "approved", value: s.approved } }))} />
        <Card>
          <CardHeader title="Recent medals" action={<Link href="/admin/competition" className="text-small font-semibold text-fg underline underline-offset-4">Medal tally</Link>} />
          <CardBody>
            {comp.recentMedals.length === 0 ? (
              <p className="text-muted">Medals appear once an event&apos;s results are finalised.</p>
            ) : (
              <ul className="space-y-2">
                {comp.recentMedals.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full font-mono text-small font-bold text-white", MEDAL_BG[p.position])} aria-label={MEDAL_NAME[p.position]}>
                      {p.position}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{p.who}</span>
                      <span className="block text-small text-muted">
                        {p.event} · {p.institution}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Registration pipeline" description="Submitted → desk verified → approved" />
          <CardBody>
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ["Pending", stats.pending, "/admin?status=PENDING#students"],
                ["Verified", stats.verified, "/admin?status=VERIFIED#students"],
                ["Approved", stats.approved, "/admin?status=APPROVED#students"],
                ["Flagged", stats.flagged, "/admin?status=FLAGGED#students"],
                ["Rejected", stats.rejected, "/admin?status=REJECTED#students"],
              ].map(([label, n, href]) => (
                <li key={label as string}>
                  <Link href={href as string} className="block rounded-xl bg-surface-2 p-3 text-center hover:bg-border">
                    <span className="block font-mono text-2xl font-semibold tabular">{n}</span>
                    <span className="block text-small text-muted">{label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
        <BarChart title="By student type" description="Submitted registrations" rows={stats.byType.map((t) => ({ label: STUDENT_TYPE_LABEL[t.type as StudentType] ?? t.type, value: t.count }))} />
      </div>

      <section aria-labelledby="students-heading" className="space-y-4" id="students">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="students-heading" className="text-2xl">
            Students
          </h2>
          <p className="text-small text-muted">Flagged records are listed first.</p>
        </div>
        {filters.view && (
          <Alert tone="info" title={{ ready: "Ready to approve", dob: "Waiting for a second admin's DOB approval", concerns: "Open age concerns", changes: "Event change requests" }[filters.view] ?? "Filtered view"}>
            <Link href="/admin#students" className="font-semibold underline underline-offset-4">
              Show all students
            </Link>
          </Alert>
        )}
        <FiltersBar sports={filterSports} ageCategories={cats.map((c) => c.name)} schools={schools} exportQuery={qs} />
        <StudentsTable rows={rows} reviewing={reviewing} />
        <Pagination page={filters.page ?? 1} total={total} pageSize={PAGE_SIZE} params={params} />
      </section>
    </div>
  );
}
