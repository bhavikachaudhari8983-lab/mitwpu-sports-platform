"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { Button, buttonClass } from "@/components/ui/button";
import { STATUSES, STATUS_LABEL, STUDENT_TYPES, STUDENT_TYPE_LABEL } from "@/lib/constants";

export function FiltersBar({ sports, exportHref }: { sports: Array<{ id: string; name: string }>; exportHref: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // URL we asked for vs URL we are on — "Updating…" shows until they match.
  const [requested, setRequested] = useState<string | null>(null);
  const current = `${pathname}?${params.toString()}`;
  const pending = requested !== null && requested !== current;
  const [q, setQ] = useState(params.get("q") ?? "");
  const [college, setCollege] = useState(params.get("college") ?? "");

  function update(next: Record<string, string>) {
    // Read the live URL (not the render-time snapshot) so a late debounced update can't undo "Clear filters".
    const sp = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page");
    const target = `${pathname}?${sp.toString()}`;
    setRequested(target);
    router.replace(target, { scroll: false });
  }

  // Debounced text search.
  useEffect(() => {
    const t = setTimeout(() => {
      const live = new URLSearchParams(window.location.search);
      if ((live.get("q") ?? "") !== q || (live.get("college") ?? "") !== college) update({ q, college });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on typed values
  }, [q, college]);

  const any = ["q", "status", "sport", "type", "college"].some((k) => params.get(k));

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1.3fr]">
        <label className="relative block">
          <span className="sr-only">Search by name, PRN, passport, Sports ID, mobile or email</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input type="search" placeholder="Name, PRN, passport, Sports ID…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <Select value={params.get("status") ?? ""} onChange={(e) => update({ status: e.target.value })}>
            <option value="">All submitted</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Sport</span>
          <Select value={params.get("sport") ?? ""} onChange={(e) => update({ sport: e.target.value })}>
            <option value="">All sports</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Student type</span>
          <Select value={params.get("type") ?? ""} onChange={(e) => update({ type: e.target.value })}>
            <option value="">All student types</option>
            {STUDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {STUDENT_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">College</span>
          <Input placeholder="College contains…" value={college} onChange={(e) => setCollege(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {any && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="size-4" aria-hidden />}
            onClick={() => {
              setQ("");
              setCollege("");
              setRequested(`${pathname}?`);
              router.replace(pathname, { scroll: false });
            }}
          >
            Clear filters
          </Button>
        )}
        {pending && (
          <span className="inline-flex items-center gap-1 text-small text-muted" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Updating…
          </span>
        )}
        <a href={exportHref} className={buttonClass("outline", "sm", "ml-auto")} download>
          <Download className="size-4" aria-hidden /> Export CSV
        </a>
      </div>
    </div>
  );
}
