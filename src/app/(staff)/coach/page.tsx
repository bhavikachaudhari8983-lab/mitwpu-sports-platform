import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { ageCategoryFor } from "@/lib/age";
import { Card, CardBody, PageHeader } from "@/components/ui/card";
import { Alert, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "My players" };

/** Coaches see APPROVED players in their own sport only — no ID documents, DOB or medical data. */
export default async function CoachPage() {
  const me = await requireStaffPage(["COACH"], "/coach");
  if (!me.sportId) {
    return (
      <div className="space-y-6">
        <PageHeader title="My players" />
        <Alert tone="warning" title="No sport assigned">Ask an admin to link your account to a sport.</Alert>
      </div>
    );
  }
  const [sport, players, settings, cats] = await Promise.all([
    prisma.sport.findUnique({ where: { id: me.sportId } }),
    prisma.student.findMany({
      where: { status: "APPROVED", registrations: { some: { event: { sportId: me.sportId } } } },
      orderBy: { fullName: "asc" },
      select: {
        id: true, fullName: true, dob: true, playingPosition: true, universityName: true, sportsId: true,
        registrations: { where: { event: { sportId: me.sportId } }, select: { event: { select: { name: true } }, weightCategory: { select: { name: true } } } },
        measurements: { orderBy: { createdAt: "desc" }, take: 1, select: { heightCm: true, weightKg: true } },
        documents: { where: { type: { in: ["PHOTO", "ACHIEVEMENT"] } }, select: { id: true, type: true } },
      },
    }),
    getSettings(),
    prisma.ageCategory.findMany(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={`My players · ${sport?.name ?? ""}`} description="Approved athletes only. Identity and medical documents are not shown to coaches." />
      {players.length === 0 ? (
        <EmptyState icon={<Users className="size-7" aria-hidden />} title="No approved players yet" description="Players appear here once the sports office approves them." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {players.map((p) => {
            const photo = p.documents.find((d) => d.type === "PHOTO");
            const achievements = p.documents.filter((d) => d.type === "ACHIEVEMENT");
            const m = p.measurements[0];
            return (
              <li key={p.id}>
                <Card className="h-full">
                  <CardBody className="flex gap-4">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- authorised private route
                      <img src={`/api/documents/${photo.id}`} alt={`Photo of ${p.fullName}`} className="aspect-[3/4] w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="aspect-[3/4] w-20 shrink-0 rounded-lg bg-surface-2" />
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="font-heading text-xl leading-tight font-semibold">{p.fullName}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone="success">{ageCategoryFor(p.dob, settings.ageCutoffDate, cats) ?? "—"}</Badge>
                        {p.playingPosition && <Badge>{p.playingPosition}</Badge>}
                      </div>
                      <p className="text-small text-muted">{p.universityName}</p>
                      <p className="text-small">{p.registrations.map((r) => `${r.event.name}${r.weightCategory ? ` (${r.weightCategory.name})` : ""}`).join("; ")}</p>
                      {m && <p className="font-mono text-small tabular">{m.heightCm} cm · {m.weightKg} kg</p>}
                      {achievements.length > 0 && (
                        <p className="text-small">
                          {achievements.map((a, i) => (
                            <a key={a.id} href={`/api/documents/${a.id}`} target="_blank" rel="noopener" className="mr-2 inline-flex min-h-11 items-center underline underline-offset-4">
                              Achievement {i + 1}
                            </a>
                          ))}
                        </p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
