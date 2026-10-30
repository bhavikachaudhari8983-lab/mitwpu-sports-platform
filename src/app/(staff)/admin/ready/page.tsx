import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { studentWhere } from "@/lib/admin-queries";
import { activeReviews } from "@/lib/review-lock";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { BulkApprove } from "@/components/admin/bulk-approve";

export const metadata: Metadata = { title: "Ready to approve" };

export default async function ReadyPage() {
  await requireStaffPage(["ADMIN"], "/admin/ready");
  const rows = await prisma.student.findMany({
    where: await studentWhere({ view: "ready" }),
    orderBy: { verifiedAt: "asc" },
    take: 100,
    select: { id: true, fullName: true, prn: true, passportNumber: true, universityName: true, verifiedAt: true, registrations: { select: { event: { select: { name: true, sport: { select: { name: true } } } } } } },
  });
  const reviewing = await activeReviews(rows.map((r) => r.id));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ready to approve"
        description="Verified at the desk, every automatic check passed, college confirmed and no open age concern. Anything else must be opened and reviewed one by one."
      />
      {rows.length === 0 ? (
        <EmptyState icon={<ListChecks className="size-7" aria-hidden />} title="Nothing waiting" description="Students appear here after an official verifies them at the desk." />
      ) : (
        <BulkApprove
          rows={rows.map((r) => ({
            id: r.id,
            name: r.fullName ?? "—",
            idNo: r.prn ?? r.passportNumber ?? "—",
            college: r.universityName ?? "—",
            events: r.registrations.map((x) => `${x.event.sport.name} · ${x.event.name}`),
            verifiedAt: r.verifiedAt?.toISOString() ?? null,
            reviewer: reviewing.get(r.id) ?? null,
          }))}
        />
      )}
    </div>
  );
}
