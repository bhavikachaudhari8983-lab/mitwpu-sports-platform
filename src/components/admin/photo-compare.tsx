import { Camera, ShieldCheck } from "lucide-react";

type Photo = { id: string; label: string };

/** Side-by-side: verified-source photos (ERP / DigiLocker / passport) vs what the student submitted. */
export function PhotoCompare({ reference, submitted }: { reference: Photo[]; submitted: Photo[] }) {
  const tile = (p: Photo) => (
    <figure key={p.id} className="w-32 shrink-0 sm:w-40">
      {/* eslint-disable-next-line @next/next/no-img-element -- authorised private route; each load is audited */}
      <img src={`/api/documents/${p.id}`} alt={p.label} className="aspect-[3/4] w-full rounded-lg border border-border bg-surface-2 object-cover" loading="lazy" />
      <figcaption className="mt-1 text-center text-small text-muted">{p.label}</figcaption>
    </figure>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl bg-surface-2 p-3">
        <p className="mb-2 inline-flex items-center gap-1.5 text-small font-semibold">
          <ShieldCheck className="size-4" aria-hidden /> Verified source
        </p>
        <div className="flex flex-wrap gap-3">{reference.length ? reference.map(tile) : <p className="text-small text-muted">None on file</p>}</div>
      </div>
      <div className="rounded-xl bg-surface-2 p-3">
        <p className="mb-2 inline-flex items-center gap-1.5 text-small font-semibold">
          <Camera className="size-4" aria-hidden /> Submitted by student
        </p>
        <div className="flex flex-wrap gap-3">{submitted.length ? submitted.map(tile) : <p className="text-small text-muted">None on file</p>}</div>
      </div>
    </div>
  );
}
