"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Alert } from "@/components/ui/badge";
import { api } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";

const HEARTBEAT_MS = 60_000;

/** Tells the server "I'm reviewing this record" and warns if another admin already is. */
export function ReviewPresence({ studentId }: { studentId: string }) {
  const [other, setOther] = useState<{ name: string; since: string } | null>(null);

  useEffect(() => {
    const url = `/api/admin/students/${studentId}/lock`;
    let alive = true;
    const beat = async () => {
      const r = await api<{ other: { name: string; since: string } | null }>(url, { method: "POST" });
      if (alive && r.ok) setOther(r.data.other);
    };
    void beat();
    const t = setInterval(beat, HEARTBEAT_MS);
    return () => {
      alive = false;
      clearInterval(t);
      void fetch(url, { method: "DELETE", keepalive: true });
    };
  }, [studentId]);

  if (!other) return null;
  return (
    <Alert tone="warning" icon={<Eye className="size-5" aria-hidden />} title={`${other.name} is reviewing this record`}>
      Since {formatDateTime(other.since)}. Coordinate before acting — if they act first, your action will be blocked and the page will ask you to refresh.
    </Alert>
  );
}
