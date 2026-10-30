import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock, CheckCircle2, Clock, Flag, ListChecks, Repeat, ShieldQuestion, Users, XCircle } from "lucide-react";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { dashboardStats, FILTER_KEYS, listStudents, oversightCounts, PAGE_SIZE, parseFilters } from "@/lib/admin-queries";
import { activeReviews } from "@/lib/review-lock";
import { STUDENT_TYPE_LABEL, type StudentType } from "@/lib/constants";
import { PageHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { BarChart } from "@/components/admin/bar-chart";
import { FiltersBar } from "@/components/admin/filters-bar";
import { Pagination, StudentsTable } from "@/components/admin/students-table";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaffPage(["ADMIN"], "/admin");
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [stats, oversight, { rows, total }, sports, cats, pendingDeletions, untrustedColleges] = await Promise.all([
    dashboardStats(),
    oversightCounts(),
    listStudents(filters),
    prisma.sport.findMany({ select: { id: true, name: true, events: { select: { id: true, name: true }, orderBy: { name: "asc" } }, weightCategories: { select: { id: true, name: true, gender: true, maxKg: true } } }, orderBy: { name: "asc" } }),
    prisma.ageCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true } }),
    prisma.deletionRequest.count({ where: { status: "PENDING" } }),
    prisma.student.count({ where: { studentType: "OUTSIDE_INDIAN", status: "PENDING", college: { trusted: false } } }),
  ]);
  const reviewing = Object.fromEntries(await activeReviews(rows.map((r) => r.id)));
  const params = Object.fromEntries(FILTER_KEYS.map((k) => [k, filters[k]]));
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  const bySport = stats.bySport.filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
  const filterSports = sports.map((s) => ({ id: s.id, name: s.name, events: s.events, weights: [...s.weightCategories].sort((a, b) => (a.maxKg ?? 999) - (b.maxKg ?? 999)) }));

  const alerts = [
    oversight.dobCorrections > 0 && { tone: "danger" as const, icon: CalendarClock, title: `${oversight.dobCorrections} DOB correction${oversight.dobCorrections > 1 ? "s" : ""} need a second admin`, body: "A date of birth only changes once a different admin approves it.", href: "/admin?view=dob#students" },
    oversight.ageConcerns > 0 && { tone: "warning" as const, icon: ShieldQuestion, title: `${oversight.ageConcerns} open age concern${oversight.ageConcerns > 1 ? "s" : ""}`, body: "Raised by coaches or officials. Investigate, then uphold or dismiss.", href: "/admin?view=concerns#students" },
    oversight.changeRequests > 0 && { tone: "info" as const, icon: Repeat, title: `${oversight.changeRequests} event change request${oversight.changeRequests > 1 ? "s" : ""}`, body: "Students asking to swap events.", href: "/admin?view=changes#students" },
    untrustedColleges > 0 && { tone: "warning" as const, icon: Users, title: `${untrustedColleges} outside student${untrustedColleges > 1 ? "s" : ""} awaiting college confirmation`, body: "Open the student and use “Confirm college”.", href: null },
    pendingDeletions > 0 && { tone: "warning" as const, icon: XCircle, title: `${pendingDeletions} data deletion request${pendingDeletions > 1 ? "s" : ""}`, body: "Process them under Settings → Deletion requests.", href: "/admin/settings" },
  ].filter((a) => !!a);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Registrations across all sports. Drafts are not counted until submitted."
        actions={
          <Link href="/admin/sports" className={buttonClass("outline", "md")}>
            Sports & events <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />

      {alerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {alerts.map((a) => (
            <Alert key={a.title} tone={a.tone} icon={<a.icon className="size-5" aria-hidden />} title={a.title}>
              {a.body}{" "}
              {a.href && (
                <Link href={a.href} className="font-semibold underline underline-offset-4">
                  Show them
                </Link>
              )}
            </Alert>
          ))}
        </div>
      )}
      {oversight.recentDobChanges > 0 && (
        <p className="text-small text-muted">
          {oversight.recentDobChanges} verified date{oversight.recentDobChanges > 1 ? "s" : ""} of birth changed in the last 30 days.{" "}
          <Link href="/admin/audit?action=DOB_CHANGED" className="font-semibold text-fg underline underline-offset-4">
            Review in audit log
          </Link>
        </p>
      )}

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Submitted" value={stats.total} icon={<Users className="size-5 text-fg" aria-hidden />} href="/admin" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="size-5 text-warning-fg" aria-hidden />} href="/admin?status=PENDING" />
        <StatCard label="Verified" value={stats.verified} icon={<BadgeCheck className="size-5 text-info-fg" aria-hidden />} href="/admin?status=VERIFIED" />
        <StatCard label="Ready to approve" value={stats.ready} icon={<ListChecks className="size-5 text-success-fg" aria-hidden />} href="/admin/ready" />
        <StatCard label="Flagged" value={stats.flagged} icon={<Flag className="size-5 text-info-fg" aria-hidden />} href="/admin?status=FLAGGED" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 className="size-5 text-success-fg" aria-hidden />} href="/admin?status=APPROVED" />
        <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="size-5 text-danger-fg" aria-hidden />} href="/admin?status=REJECTED" />
      </section>

      <section aria-label="Charts" className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Registrations by sport" description="Students per sport (all submitted statuses). Hover for approved count." rows={bySport.map((s) => ({ label: s.name, value: s.total, secondary: { label: "approved", value: s.approved } }))} />
        <BarChart title="By student type" description="Submitted registrations" rows={stats.byType.map((t) => ({ label: STUDENT_TYPE_LABEL[t.type as StudentType] ?? t.type, value: t.count }))} />
      </section>

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
        <FiltersBar sports={filterSports} ageCategories={cats.map((c) => c.name)} exportQuery={qs} />
        <StudentsTable rows={rows} reviewing={reviewing} />
        <Pagination page={filters.page ?? 1} total={total} pageSize={PAGE_SIZE} params={params} />
      </section>
    </div>
  );
}
