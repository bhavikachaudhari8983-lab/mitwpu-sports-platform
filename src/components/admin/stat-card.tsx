import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon, href, accent }: { label: string; value: number | string; icon: ReactNode; href?: string; accent?: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-small font-medium text-muted">{label}</span>
        <span className={cn("grid size-9 place-items-center rounded-lg bg-surface-2", accent)}>{icon}</span>
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold text-fg tabular">{value}</p>
    </>
  );
  const cls = "block rounded-xl border border-border bg-surface p-4 shadow-card";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-border-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
