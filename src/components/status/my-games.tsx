import Link from "next/link";
import { Award, CalendarDays, Crown, Download, ShieldCheck } from "lucide-react";
import { CERT_LABEL, type CertKind } from "@/lib/constants";
import { formatDateTime, cn } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import type { myGames } from "@/lib/my-games";

const MEDAL = ["", "Gold", "Silver", "Bronze"];

/** The athlete's sports record: teams, fixtures and results, medals and verifiable certificates. */
export function MyGames({ data }: { data: Awaited<ReturnType<typeof myGames>> }) {
  const upcoming = data.matches.filter((m) => !m.outcome);
  const played = data.matches.filter((m) => m.outcome);
  if (!data.teams.length && !data.matches.length && !data.medals.length && !data.certificates.length) return null;
  return (
    <Card>
      <CardHeader title="My games" description="Your teams, matches, medals and certificates. Your sports record stays here." />
      <CardBody className="space-y-6">
        {data.teams.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.teams.map((t) => (
              <Badge key={t.id} tone="info" icon={t.captain ? <Crown className="size-3.5" aria-hidden /> : undefined}>
                {t.name} · {t.event}
                {t.captain ? " · Captain" : ""}
              </Badge>
            ))}
          </div>
        )}
        {data.medals.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Medals">
            {data.medals.map((m) => (
              <li key={m.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                <span className={cn("size-4 rounded-full", m.position === 1 ? "bg-[#C9A227]" : m.position === 2 ? "bg-[#9AA3AE]" : "bg-[#B0703A]")} aria-hidden />
                <span>
                  <strong>{MEDAL[m.position]}</strong> · {m.event}
                  {m.team ? ` (${m.team})` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        {upcoming.length > 0 && (
          <section aria-labelledby="up-h">
            <h3 id="up-h" className="mb-2 font-semibold">
              Next matches
            </h3>
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li key={m.id} className="rounded-lg bg-surface-2 p-3">
                  <p className="text-small text-muted">{m.title}</p>
                  <p className="font-semibold">vs {m.opponent}</p>
                  <p className="flex flex-wrap gap-x-3 text-small text-muted">
                    {m.when && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {formatDateTime(m.when)}
                      </span>
                    )}
                    {m.venue && <span>{m.venue}</span>}
                    {m.status === "LIVE" && <span className="font-semibold text-danger-fg">● Live {m.score}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {played.length > 0 && (
          <section aria-labelledby="res-h">
            <h3 id="res-h" className="mb-2 font-semibold">
              Results
            </h3>
            <ul className="space-y-1">
              {played.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
                  <Badge tone={m.outcome === "Won" ? "success" : m.outcome === "Lost" ? "danger" : "neutral"}>{m.outcome}</Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block">vs {m.opponent}</span>
                    <span className="block text-small text-muted">{m.title}</span>
                  </span>
                  {m.score && <span className="font-mono font-semibold tabular">{m.score}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
        {data.certificates.length > 0 && (
          <section aria-labelledby="cert-h">
            <h3 id="cert-h" className="mb-2 font-semibold">
              Certificates
            </h3>
            <ul className="space-y-2">
              {data.certificates.map((c) => (
                <li key={c.code} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
                  <Award className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{CERT_LABEL[c.kind as CertKind] ?? c.kind}</span>
                    <span className="block text-small text-muted">{c.title}</span>
                    <span className="block font-mono text-small text-muted">{c.code}</span>
                  </span>
                  <a href={`/api/certificates/${c.code}`} target="_blank" rel="noopener" className={buttonClass("outline", "sm")}>
                    <Download className="size-4" aria-hidden /> PDF
                  </a>
                  <Link href={`/verify/${c.code}`} className={buttonClass("ghost", "sm")}>
                    <ShieldCheck className="size-4" aria-hidden /> Verify link
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-small text-muted">Share the verify link with colleges or employers — it proves the certificate is genuine.</p>
          </section>
        )}
      </CardBody>
    </Card>
  );
}
