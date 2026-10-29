import type { Metadata } from "next";
import { BadgeCheck, CheckCircle2, Clock, Flag, Users, XCircle } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { dashboardStats, listStudents, PAGE_SIZE, parseFilters } from "@/lib/admin-queries";
import { STUDENT_TYPE_LABEL, type StudentType } from "@/lib/constants";
import { PageHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { BarChart } from "@/components/admin/bar-chart";
import { FiltersBar } from "@/components/admin/filters-bar";
import { Pagination, StudentsTable } from "@/components/admin/students-table";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaffPage(["ADMIN"], "/admin");
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [stats, { rows, total }, sports, pendingDeletions, untrustedColleges] = await Promise.all([
    dashboardStats(),
    listStudents(filters),
    prisma.sport.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.deletionRequest.count({ where: { status: "PENDING" } }),
    prisma.student.count({ where: { studentType: "OUTSIDE_INDIAN", status: "PENDING", college: { trusted: false } } }),
  ]);
  const qs = new URLSearchParams(Object.entries(filters).filter((e): e is [string, string] => typeof e[1] === "string" && !!e[1])).toString();
  const bySport = stats.bySport.filter((s) => s.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Registrations across all sports. Drafts are not counted until submitted." />

      {(pendingDeletions > 0 || untrustedColleges > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {untrustedColleges > 0 && <Alert tone="warning" title={`${untrustedColleges} outside student${untrustedColleges > 1 ? "s" : ""} awaiting college confirmation`}>Open the student and use “Confirm college”.</Alert>}
          {pendingDeletions > 0 && <Alert tone="warning" title={`${pendingDeletions} data deletion request${pendingDeletions > 1 ? "s" : ""}`}>Process them under Settings → Deletion requests.</Alert>}
        </div>
      )}

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Submitted" value={stats.total} icon={<Users className="size-5 text-fg" aria-hidden />} href="/admin" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="size-5 text-warning-fg" aria-hidden />} href="/admin?status=PENDING" />
        <StatCard label="Verified" value={stats.verified} icon={<BadgeCheck className="size-5 text-info-fg" aria-hidden />} href="/admin?status=VERIFIED" />
        <StatCard label="Flagged" value={stats.flagged} icon={<Flag className="size-5 text-info-fg" aria-hidden />} href="/admin?status=FLAGGED" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 className="size-5 text-success-fg" aria-hidden />} href="/admin?status=APPROVED" />
        <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="size-5 text-danger-fg" aria-hidden />} href="/admin?status=REJECTED" />
      </section>

      <section aria-label="Charts" className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Registrations by sport" description="Students per sport (all submitted statuses). Hover for approved count." rows={bySport.map((s) => ({ label: s.name, value: s.total, secondary: { label: "approved", value: s.approved } }))} />
        <BarChart title="By student type" description="Submitted registrations" rows={stats.byType.map((t) => ({ label: STUDENT_TYPE_LABEL[t.type as StudentType] ?? t.type, value: t.count }))} />
      </section>

      <section aria-labelledby="students-heading" className="space-y-4" id="students">
        <h2 id="students-heading" className="text-2xl">
          Students
        </h2>
        <FiltersBar sports={sports} exportHref={`/api/admin/export${qs ? `?${qs}` : ""}`} />
        <StudentsTable rows={rows} />
        <Pagination page={filters.page ?? 1} total={total} pageSize={PAGE_SIZE} params={{ q: filters.q, status: filters.status, sport: filters.sport, type: filters.type, college: filters.college }} />
      </section>
    </div>
  );
}
