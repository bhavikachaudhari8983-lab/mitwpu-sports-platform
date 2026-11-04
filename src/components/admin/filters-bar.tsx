"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, Search, ShieldAlert, X } from "lucide-react";
import { Field, Input, Select, Textarea, fieldA11y } from "@/components/ui/field";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { GENDERS, GENDER_LABEL, STATUSES, STATUS_LABEL, STUDENT_TYPES, STUDENT_TYPE_LABEL } from "@/lib/constants";

export type FilterSport = {
  id: string;
  name: string;
  events: Array<{ id: string; name: string }>;
  weights: Array<{ id: string; name: string; gender: string }>;
};

const KEYS = ["q", "status", "sport", "event", "weight", "type", "college", "gender", "school", "age", "view"];

export function FiltersBar({ sports, ageCategories, schools, exportQuery }: { sports: FilterSport[]; ageCategories: string[]; schools: Array<{ id: string; name: string }>; exportQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // URL we asked for vs URL we are on — "Updating…" shows until they match.
  const [requested, setRequested] = useState<string | null>(null);
  const current = `${pathname}?${params.toString()}`;
  const pending = requested !== null && requested !== current;
  const [q, setQ] = useState(params.get("q") ?? "");
  const [college, setCollege] = useState(params.get("college") ?? "");
  const [fullOpen, setFullOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();

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

  const any = KEYS.some((k) => params.get(k));
  const sport = sports.find((s) => s.id === params.get("sport"));
  const gender = params.get("gender");
  const weights = sport?.weights.filter((w) => !gender || w.gender === gender) ?? [];
  const exportHref = (extra = "") => `/api/admin/export${exportQuery || extra ? `?${[exportQuery, extra].filter(Boolean).join("&")}` : ""}`;

  function fullExport() {
    if (reason.trim().length < 10) return setReasonError("Give a reason (at least 10 characters)");
    window.location.href = exportHref(`full=1&reason=${encodeURIComponent(reason.trim())}`);
    setFullOpen(false);
    setReason("");
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative block sm:col-span-2">
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
          <span className="sr-only">Sport</span>
          <Select value={params.get("sport") ?? ""} onChange={(e) => update({ sport: e.target.value, event: "", weight: "" })}>
            <option value="">All sports</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Event</span>
          <Select value={params.get("event") ?? ""} onChange={(e) => update({ event: e.target.value })} disabled={!sport}>
            <option value="">{sport ? "All events" : "Event (choose a sport)"}</option>
            {sport?.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </label>
        {weights.length > 0 && (
          <label>
            <span className="sr-only">Weight class</span>
            <Select value={params.get("weight") ?? ""} onChange={(e) => update({ weight: e.target.value })}>
              <option value="">All weight classes</option>
              {weights.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({GENDER_LABEL[w.gender as keyof typeof GENDER_LABEL] ?? w.gender})
                </option>
              ))}
            </Select>
          </label>
        )}
        <label>
          <span className="sr-only">Gender</span>
          <Select value={gender ?? ""} onChange={(e) => update({ gender: e.target.value, weight: "" })}>
            <option value="">All genders</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABEL[g]}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Age category</span>
          <Select value={params.get("age") ?? ""} onChange={(e) => update({ age: e.target.value })}>
            <option value="">All age categories</option>
            {ageCategories.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </label>
        {schools.length > 0 && (
          <label>
            <span className="sr-only">School</span>
            <Select value={params.get("school") ?? ""} onChange={(e) => update({ school: e.target.value })}>
              <option value="">All schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>
        )}
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
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={exportHref()} className={buttonClass("outline", "sm")} download title="No date of birth; mobile and email masked">
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
          <Button variant="ghost" size="sm" onClick={() => setFullOpen(true)} icon={<ShieldAlert className="size-4" aria-hidden />}>
            Full export…
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={fullOpen}
        onClose={() => setFullOpen(false)}
        onConfirm={fullExport}
        tone="danger"
        confirmLabel="Download full CSV"
        title="Export personal data?"
        description="The full export includes date of birth, mobile and email. Once downloaded, the file is outside the portal's protection. Your name, the filters and this reason are recorded in the audit log."
      >
        <Field id="export-reason" label="Why do you need personal data?" error={reasonError} hint="e.g. Sending the approved list to the AIU for eligibility checks" required>
          <Textarea {...fieldA11y("export-reason", reasonError, true)} rows={3} maxLength={300} value={reason} onChange={(e) => (setReason(e.target.value), setReasonError(undefined))} />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
