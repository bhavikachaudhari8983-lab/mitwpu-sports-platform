import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { staffActor } from "@/lib/rbac";
import { ageCategoryFor } from "@/lib/age";
import { getSettings } from "@/lib/settings";
import { APP_NAME } from "@/lib/constants";
import { formatDateTime, formatDob } from "@/lib/utils";
import { PrintButton } from "@/components/admin/print-button";

export const metadata: Metadata = { title: "Entry sheet" };

/** Printable start list for referees and desks. Approved athletes only; no DOB, contacts or IDs beyond the Sports ID. */
export default async function EntrySheet({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const staff = await requireStaffPage(["ADMIN"], `/admin/sports/${eventId}/sheet`);
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { sport: true, ageCategory: true } });
  if (!event) notFound();
  const [regs, settings, cats] = await Promise.all([
    prisma.registration.findMany({
      where: { eventId, student: { status: "APPROVED" } },
      include: { weightCategory: true, student: { select: { fullName: true, sportsId: true, universityName: true, dob: true, playingPosition: true } } },
    }),
    getSettings(),
    prisma.ageCategory.findMany(),
  ]);
  const rows = regs
    .map((r) => ({ ...r.student, weight: r.weightCategory?.name ?? null, weightOrder: r.weightCategory?.maxKg ?? 999, age: ageCategoryFor(r.student.dob, settings.ageCutoffDate, cats) }))
    .sort((a, b) => a.weightOrder - b.weightOrder || (a.universityName ?? "").localeCompare(b.universityName ?? "") || (a.fullName ?? "").localeCompare(b.fullName ?? ""));
  await audit({ actor: staffActor(staff), action: "DATA_EXPORTED", entityType: "Event", entityId: event.id, summary: `Opened printable entry sheet for ${event.sport.name} · ${event.name} (${rows.length} athletes)` });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/admin/sports" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-medium text-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> Sports & events
        </Link>
        <PrintButton />
      </div>
      <article className="rounded-xl border border-border bg-surface p-4 sm:p-6 print:border-0 print:p-0">
        <header className="mb-4 border-b border-border pb-3">
          <p className="text-small text-muted">{APP_NAME} · Official entry sheet</p>
          <h1 className="text-2xl">
            {event.sport.name} · {event.name}
          </h1>
          <p className="text-small text-muted">
            {[event.eventDate && formatDob(event.eventDate), event.venue, event.ageCategory && `${event.ageCategory.name} only`, `${rows.length} approved athletes`].filter(Boolean).join(" · ")}
          </p>
        </header>
        {rows.length === 0 ? (
          <p className="text-muted">No approved athletes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-small">
              <thead className="border-b-2 border-border-strong">
                <tr>
                  <th scope="col" className="w-10 py-2 pr-2">#</th>
                  <th scope="col" className="py-2 pr-2">Name</th>
                  <th scope="col" className="py-2 pr-2">Sports ID</th>
                  <th scope="col" className="py-2 pr-2">College</th>
                  <th scope="col" className="py-2 pr-2">{event.sport.isWeightCategory ? "Weight class" : event.sport.isTeam ? "Position" : "Age cat."}</th>
                  <th scope="col" className="w-36 py-2">Signature / result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.sportsId ?? i} className="border-b border-border break-inside-avoid">
                    <td className="py-3 pr-2 font-mono tabular">{i + 1}</td>
                    <td className="py-3 pr-2 font-semibold">{r.fullName}</td>
                    <td className="py-3 pr-2 font-mono">{r.sportsId}</td>
                    <td className="py-3 pr-2">{r.universityName}</td>
                    <td className="py-3 pr-2">{event.sport.isWeightCategory ? r.weight : event.sport.isTeam ? r.playingPosition || "—" : r.age}</td>
                    <td className="py-3" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <footer className="mt-6 flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-small text-muted">
          <span>Confidential — for official use only. Do not share or post publicly.</span>
          <span>Printed by {staff.name} · {formatDateTime(new Date())}</span>
        </footer>
      </article>
    </div>
  );
}
