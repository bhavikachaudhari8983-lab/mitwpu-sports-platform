import { Megaphone } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type Item = { id: string; title: string; body: string; createdAt: Date; event?: { name: string } | null };

export function AnnouncementList({ items, empty }: { items: Item[]; empty?: string }) {
  if (!items.length) return empty ? <p className="text-muted">{empty}</p> : null;
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 rounded-xl bg-surface-2 p-3">
          <Megaphone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">{a.title}</p>
            <p className="break-words whitespace-pre-line">{a.body}</p>
            <p className="mt-1 text-small text-muted">
              {formatDateTime(a.createdAt)}
              {a.event ? ` · ${a.event.name}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
