import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building2, ClipboardX, Printer } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { missingSteps, sportsOverview } from "@/lib/admin-queries";
import { GENDER_LABEL, type Gender } from "@/lib/constants";
import { formatDob } from "@/lib/utils";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sports & events" };

const list = (q: Record<string, string>) => `/admin?${new URLSearchParams(q).toString()}#students`;

/** A number that opens the matching student list. */
function Count({ n, label, q, tone }: { n: number; label: string; q: Record<string, string>; tone?: "success" | "muted" }) {
  return (
    <Link
      href={list(q)}
      className={`inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-small hover:border-border-strong hover:bg-surface-2 ${tone === "success" ? "text-success-fg" : tone === "muted" ? "text-muted" : "text-fg"}`}
    >
      <span className="font-mono font-semibold tabular">{n}</span> {label}
    </Link>
  );
}

export default async function SportsPage() {
  await requireStaffPage(["ADMIN"], "/admin/sports");
  const [{ sports, ageCategories, colleges }, missing] = await Promise.all([sportsOverview(), missingSteps()]);
  const active = sports.filter((s) => s.split.total > 0);
  const empty = sports.filter((s) => s.split.total === 0);
  const warnings = active.flatMap((s) => s.events.filter((e) => e.warnings.length).map((e) => ({ sport: s.name, event: e })));

  return (
    <div className="space-y-6">
      <PageHeader title="Sports & events" description="Entries per sport, event and weight class. Rejected and draft registrations are not counted. Click any number to see those students." />

      {warnings.length > 0 && (
        <Card>
          <CardHeader title="Needs attention" description="Entry limits and minimum squad sizes" />
          <CardBody>
            <ul className="space-y-2">
              {warnings.map(({ sport, event }) => (
                <li key={event.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-warning-bg px-3 py-2 text-warning-fg">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden />
                  <span className="font-semibold">
                    {sport} · {event.name}
                  </span>
                  <span>{event.warnings.join(" · ")}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {active.map((sp) => (
          <Card key={sp.id}>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl">{sp.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <Count n={sp.split.total} label="athletes" q={{ sport: sp.id }} />
                  <Count n={sp.split.approved} label="approved" q={{ sport: sp.id, status: "APPROVED" }} tone="success" />
                  <span className="inline-flex min-h-9 items-center rounded-lg px-1 text-small text-muted">{sp.split.pending} not yet approved</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2" aria-label={`${sp.name} by gender and age`}>
                <Count n={sp.split.male} label="men" q={{ sport: sp.id, gender: "MALE" }} tone="muted" />
                <Count n={sp.split.female} label="women" q={{ sport: sp.id, gender: "FEMALE" }} tone="muted" />
                {ageCategories.filter((a) => sp.split.byAge[a]).map((a) => (
                  <Count key={a} n={sp.split.byAge[a]} label={a} q={{ sport: sp.id, age: a }} tone="muted" />
                ))}
              </div>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {sp.events.map((ev) => (
                  <li key={ev.id} className="space-y-2 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{ev.name}</p>
                        <p className="flex flex-wrap gap-x-3 text-small text-muted">
                          <span>{ev.gender === "MIXED" ? "Mixed" : GENDER_LABEL[ev.gender as Gender]}</span>
                          {ev.eventDate && <span>{formatDob(ev.eventDate)}</span>}
                          {ev.venue && <span>{ev.venue}</span>}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {ev.ageLimit && <Badge tone="info">{ev.ageLimit} only</Badge>}
                        {ev.warnings.map((w) => (
                          <Badge key={w} tone="warning">
                            {w}
                          </Badge>
                        ))}
                        <Link href={`/admin/sports/${ev.id}/sheet`} prefetch={false} className={buttonClass("outline", "sm")}>
                          <Printer className="size-4" aria-hidden /> Entry sheet
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Count n={ev.split.total} label={ev.maxEntries ? `of ${ev.maxEntries} places` : "entries"} q={{ sport: sp.id, event: ev.id }} />
                      <Count n={ev.split.approved} label="approved" q={{ sport: sp.id, event: ev.id, status: "APPROVED" }} tone="success" />
                      {ev.minEntries != null && <span className="inline-flex min-h-9 items-center px-1 text-small text-muted">min. squad {ev.minEntries}</span>}
                      {ageCategories.filter((a) => ev.split.byAge[a]).map((a) => (
                        <Count key={a} n={ev.split.byAge[a]} label={a} q={{ sport: sp.id, event: ev.id, age: a }} tone="muted" />
                      ))}
                    </div>
                    {ev.weights.some((w) => w.count > 0) && (
                      <div className="flex flex-wrap gap-2" aria-label="By weight class">
                        {ev.weights.filter((w) => w.count > 0).map((w) => (
                          <Count key={w.id} n={w.count} label={w.name} q={{ sport: sp.id, event: ev.id, weight: w.id }} tone="muted" />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
        {empty.length > 0 && <p className="text-small text-muted">No entries yet: {empty.map((s) => s.name).join(", ")}.</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Colleges" description="Athletes sent and approved" />
          <CardBody>
            <ul className="space-y-1">
              {colleges.map((c) => (
                <li key={c.name}>
                  <Link href={list({ college: c.name })} className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-surface-2">
                    <Building2 className="size-4 shrink-0 text-muted" aria-hidden />
                    <span className="min-w-0 flex-1 break-words">{c.name}</span>
                    <span className="shrink-0 font-mono text-small tabular">
                      {c.approved}/{c.total}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Approved but not match-ready" description="Chase these before event day" />
          <CardBody>
            {missing.length === 0 ? (
              <p className="text-muted">Every approved athlete has been measured and weighed in.</p>
            ) : (
              <ul className="space-y-2">
                {missing.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/students/${m.id}`} className="flex min-h-11 items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                      <ClipboardX className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-hidden />
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {m.name} {m.sportsId && <span className="font-mono text-small font-normal text-muted">{m.sportsId}</span>}
                        </span>
                        <span className="block text-small text-muted">{m.missing.join(" · ")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
