"use client";

import { useState } from "react";
import { ExternalLink, FileText, ImageIcon } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { formatBytes, formatDateTime } from "@/lib/utils";

export type ViewerDoc = { id: string; label: string; mimeType: string; size: number; source: string; createdAt: string };

/** Lists documents; opening one shows it inline (each open is logged by the server). */
export function DocumentViewer({ docs }: { docs: ViewerDoc[] }) {
  const [open, setOpen] = useState<ViewerDoc | null>(null);
  if (!docs.length) return <p className="text-muted">No documents.</p>;
  return (
    <>
      <ul className="divide-y divide-border">
        {docs.map((d) => (
          <li key={d.id}>
            <button type="button" onClick={() => setOpen(d)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left hover:bg-surface-2">
              {d.mimeType.startsWith("image/") ? <ImageIcon className="size-5 shrink-0 text-muted" aria-hidden /> : <FileText className="size-5 shrink-0 text-muted" aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{d.label}</span>
                <span className="block text-small text-muted">
                  {d.source.toLowerCase()} · {formatBytes(d.size)} · {formatDateTime(d.createdAt)}
                </span>
              </span>
              <span className="text-small font-semibold text-fg underline underline-offset-4">View</span>
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={!!open} onClose={() => setOpen(null)} title={open?.label ?? ""} description="This view is recorded in the audit log." size="lg">
        {open &&
          (open.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element -- authorised private route
            <img src={`/api/documents/${open.id}`} alt={open.label} className="mx-auto max-h-[60vh] rounded-lg object-contain" />
          ) : (
            <div className="space-y-2">
              <iframe src={`/api/documents/${open.id}`} title={open.label} className="h-[60vh] w-full rounded-lg border border-border bg-white" />
              <a href={`/api/documents/${open.id}`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1 font-medium underline underline-offset-4">
                <ExternalLink className="size-4" aria-hidden /> Open in new tab
              </a>
            </div>
          ))}
      </Dialog>
    </>
  );
}
