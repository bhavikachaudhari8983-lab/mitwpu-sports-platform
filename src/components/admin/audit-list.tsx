import Link from "next/link";
import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/ui/feedback";
import { Badge, type Tone } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type Entry = { id: string; createdAt: Date; actorName: string | null; actorRole: string | null; action: string; summary: string; studentId: string | null; ip: string | null };

const TONE: Record<string, Tone> = {
  DOB_CHANGED: "danger",
  DUPLICATE_BLOCKED: "danger",
  LOGIN_FAILED: "danger",
  VERIFICATION_MISMATCH: "info",
  STATUS_CHANGED: "warning",
  QR_ISSUED: "success",
  COLLEGE_CONFIRMED: "success",
  DELETION_COMPLETED: "danger",
};

export function AuditList({ entries, showStudentLink }: { entries: Entry[]; showStudentLink?: boolean }) {
  if (!entries.length) return <EmptyState icon={<ScrollText className="size-7" aria-hidden />} title="No audit entries" description="Nothing has been recorded for these filters." />;
  return (
    <ol className="divide-y divide-border">
      {entries.map((e) => (
        <li key={e.id} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
          <time dateTime={e.createdAt.toISOString()} className="font-mono text-small text-muted tabular">
            {formatDateTime(e.createdAt)}
          </time>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={TONE[e.action] ?? "neutral"}>{e.action.replace(/_/g, " ").toLowerCase()}</Badge>
              <span className="text-small text-muted">
                by <span className="font-medium text-fg">{e.actorName ?? "System"}</span>
                {e.actorRole && ` (${e.actorRole.toLowerCase()})`}
                {e.ip && e.ip !== "local" && ` · ${e.ip}`}
              </span>
            </div>
            <p className="break-words text-fg">{e.summary}</p>
            {showStudentLink && e.studentId && (
              <Link href={`/admin/students/${e.studentId}`} className="inline-flex min-h-11 items-center text-small font-medium underline underline-offset-4">
                Open student
              </Link>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
