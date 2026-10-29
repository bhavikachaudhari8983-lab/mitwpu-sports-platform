import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { isStatus, STUDENT_TYPE_LABEL, type StudentType } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type Row = {
  id: string;
  fullName: string | null;
  status: string;
  studentType: string;
  prn: string | null;
  passportNumber: string | null;
  universityName: string | null;
  submittedAt: Date | null;
  registrations: Array<{ event: { sport: { name: string } } }>;
};

const sportsOf = (r: Row) => [...new Set(r.registrations.map((x) => x.event.sport.name))].join(", ") || "—";

/** Table on ≥1024px; stacked cards on phones and tablets. */
export function StudentsTable({ rows, hrefBase = "/admin/students" }: { rows: Row[]; hrefBase?: string }) {
  if (!rows.length) return <EmptyState icon={<Users className="size-7" aria-hidden />} title="No registrations match" description="Try clearing a filter or searching for something else." />;
  return (
    <>
      <ul className="space-y-3 lg:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`${hrefBase}/${r.id}`} className="block rounded-xl border border-border bg-surface p-4 shadow-card hover:border-border-strong">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 font-semibold text-fg">{r.fullName ?? "Unverified"}</p>
                {isStatus(r.status) && <StatusBadge status={r.status} />}
              </div>
              <p className="mt-1 text-small text-muted">{STUDENT_TYPE_LABEL[r.studentType as StudentType] ?? r.studentType}</p>
              <p className="text-small text-muted">{sportsOf(r)}</p>
              <p className="mt-1 font-mono text-small text-fg">{r.prn ?? r.passportNumber ?? "—"}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="relative hidden overflow-x-auto rounded-xl border border-border bg-surface shadow-card lg:block">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-2 text-small text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Name</th>
              <th scope="col" className="px-4 py-3 font-medium">ID no.</th>
              <th scope="col" className="px-4 py-3 font-medium">Type / college</th>
              <th scope="col" className="px-4 py-3 font-medium">Sports</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
              <th scope="col" className="px-2 py-3"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`${hrefBase}/${r.id}`} className="hover:underline">
                    {r.fullName ?? "Unverified"}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-small">{r.prn ?? r.passportNumber ?? "—"}</td>
                <td className="px-4 py-3 text-small">
                  <span className="block">{STUDENT_TYPE_LABEL[r.studentType as StudentType] ?? r.studentType}</span>
                  <span className="block max-w-56 truncate text-muted">{r.universityName}</span>
                </td>
                <td className="px-4 py-3 text-small">{sportsOf(r)}</td>
                <td className="px-4 py-3">{isStatus(r.status) && <StatusBadge status={r.status} />}</td>
                <td className="px-4 py-3 text-small whitespace-nowrap text-muted">{formatDate(r.submittedAt)}</td>
                <td className="px-2 py-3">
                  <Link href={`${hrefBase}/${r.id}`} aria-label={`Open ${r.fullName ?? "registration"}`} className="grid size-11 place-items-center rounded-lg text-muted hover:bg-surface hover:text-fg">
                    <ChevronRight className="size-5" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Pagination({ page, total, pageSize, params }: { page: number; total: number; pageSize: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  };
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
      <p className="text-small text-muted">
        Page {page} of {pages} · {total} results
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="inline-flex min-h-11 items-center rounded-lg border border-border-strong px-4 font-medium hover:bg-surface-2">
            Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="inline-flex min-h-11 items-center rounded-lg border border-border-strong px-4 font-medium hover:bg-surface-2">
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
