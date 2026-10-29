"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import type { DemoHints } from "@/services/mock/demo-hints";
import { api } from "@/lib/client-api";

let cache: DemoHints | null = null;

export function useDemoHints(enabled: boolean) {
  const [hints, setHints] = useState<DemoHints | null>(cache);
  useEffect(() => {
    if (!enabled || cache) return;
    api<DemoHints>("/api/demo/hints").then((r) => {
      if (r.ok) {
        cache = r.data;
        setHints(r.data);
      }
    });
  }, [enabled]);
  return hints;
}

/** Collapsible, clearly-labelled helper with fictional test data. Only rendered in demo mode. */
export function DemoPanel({ title = "Demo helper", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border-2 border-dashed border-info/50 bg-info-bg/40 p-4 text-small">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-info-fg">
        <FlaskConical className="size-4" aria-hidden />
        {title} <span className="font-normal">(fictional test data — not shown in production)</span>
      </summary>
      <div className="mt-3 space-y-3 text-fg">{children}</div>
    </details>
  );
}

export function DemoCode({ label = "Demo OTP", code }: { label?: string; code: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-info bg-info-bg p-3" role="note">
      <p className="text-small font-semibold text-info-fg">{label} — shown because demo mode is on (a real SMS/email would be sent)</p>
      <p className="font-mono text-2xl font-semibold tracking-[0.3em] text-fg tabular">{code}</p>
    </div>
  );
}
