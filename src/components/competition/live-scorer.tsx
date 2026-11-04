"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, Flag, Minus, Plus, RefreshCw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, fieldA11y } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Tap = { clientId: string; side: "HOME" | "AWAY"; delta: 1 | -1; at: string };
type Props = { matchId: string; home: string; away: string; homeShort: string; awayShort: string; initialHome: number; initialAway: number; knockout: boolean; shootout: boolean; finished: boolean };

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * Phone scoreboard for officials. Every tap is saved on the device first (localStorage) and sent when there is
 * signal; the server ignores duplicates, so nothing is lost or double-counted if the network drops at the ground.
 */
export function LiveScorer(p: Props) {
  const router = useRouter();
  const toast = useToast();
  const key = `score-queue:${p.matchId}`;
  const [score, setScore] = useState({ home: p.initialHome, away: p.initialAway });
  const [queue, setQueue] = useState<Tap[]>([]);
  const [online, setOnline] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [finish, setFinish] = useState(false);
  const [tb, setTb] = useState({ h: "", a: "" });
  const [err, setErr] = useState<string>();
  const [saving, setSaving] = useState(false);
  const sending = useRef(false);

  const persist = useCallback(
    (q: Tap[]) => {
      try {
        localStorage.setItem(key, JSON.stringify(q));
      } catch {
        /* storage blocked: the queue still lives in memory for this visit */
      }
    },
    [key],
  );

  // Restore taps left over from a previous visit (e.g. phone went offline and the page was closed).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "[]") as Tap[];
      if (Array.isArray(saved) && saved.length) {
        setQueue(saved);
        setScore((s) => saved.reduce((acc, t) => (t.side === "HOME" ? { ...acc, home: Math.max(0, acc.home + t.delta) } : { ...acc, away: Math.max(0, acc.away + t.delta) }), s));
      }
    } catch {
      /* ignore unreadable storage */
    }
    setOnline(navigator.onLine);
  }, [key]);

  const flush = useCallback(async () => {
    if (sending.current) return;
    let pending: Tap[] = [];
    setQueue((q) => (pending = q));
    if (!pending.length || !navigator.onLine) return;
    sending.current = true;
    const r = await api<{ homeScore: number; awayScore: number }>(`/api/score/${p.matchId}`, { body: { kind: "taps", taps: pending } });
    sending.current = false;
    if (!r.ok) {
      if (r.status === 0) setOnline(false);
      else if (r.status === 409) toast.error("Not saved", r.error);
      return;
    }
    const sentIds = new Set(pending.map((t) => t.clientId));
    setQueue((q) => {
      const rest = q.filter((t) => !sentIds.has(t.clientId));
      persist(rest);
      // Taps made while this request was in flight are still on top of the server's score.
      const extra = rest.reduce((acc, t) => (t.side === "HOME" ? { ...acc, home: acc.home + t.delta } : { ...acc, away: acc.away + t.delta }), { home: 0, away: 0 });
      setScore({ home: Math.max(0, r.data.homeScore + extra.home), away: Math.max(0, r.data.awayScore + extra.away) });
      return rest;
    });
  }, [p.matchId, persist, toast]);

  useEffect(() => {
    const up = () => (setOnline(true), void flush());
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    const t = setInterval(() => void flush(), 5000);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
      clearInterval(t);
    };
  }, [flush]);

  function tap(side: "HOME" | "AWAY", delta: 1 | -1) {
    const cur = side === "HOME" ? score.home : score.away;
    if (delta < 0 && cur === 0) return;
    const t: Tap = { clientId: uid(), side, delta, at: new Date().toISOString() };
    setScore((s) => (side === "HOME" ? { ...s, home: s.home + delta } : { ...s, away: s.away + delta }));
    setLog((l) => [`${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · ${side === "HOME" ? p.homeShort : p.awayShort} ${delta > 0 ? "+1" : "undo"}`, ...l].slice(0, 8));
    setQueue((q) => {
      const next = [...q, t];
      persist(next);
      return next;
    });
    void Promise.resolve().then(flush);
  }

  async function submitFinal() {
    const tie = score.home === score.away;
    if (tie && p.knockout && (!tb.h || !tb.a || tb.h === tb.a)) return setErr(p.shootout ? "Enter the shoot-out score — it decides the winner." : "A knockout match needs a winner.");
    if (queue.length) {
      await flush();
      if (queue.length && !navigator.onLine) return setErr("Some taps haven't reached the server yet. Get signal, then finish the match.");
    }
    setSaving(true);
    const r = await api(`/api/score/${p.matchId}`, { body: { kind: "final", homeScore: score.home, awayScore: score.away, homeTiebreak: tie && p.knockout ? tb.h : null, awayTiebreak: tie && p.knockout ? tb.a : null } });
    setSaving(false);
    if (!r.ok) return setErr(r.error);
    setFinish(false);
    toast.success("Match finished", `${p.homeShort} ${score.home} – ${score.away} ${p.awayShort}`);
    router.refresh();
  }

  if (p.finished) return <p className="rounded-xl bg-surface-2 p-4 text-center font-semibold">This match is finished: {p.home} {p.initialHome} – {p.initialAway} {p.away}</p>;

  const Side = ({ side, name, value }: { side: "HOME" | "AWAY"; name: string; value: number }) => (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <p className="text-center font-heading text-lg leading-tight font-semibold break-words">{name}</p>
      <p className="font-mono text-6xl font-bold tabular" aria-live="polite" aria-label={`${name} ${value}`}>
        {value}
      </p>
      <button type="button" onClick={() => tap(side, 1)} className="grid h-24 w-full place-items-center rounded-2xl bg-primary text-primary-fg shadow-card active:scale-[0.98]" aria-label={`Point to ${name}`}>
        <Plus className="size-10" aria-hidden />
      </button>
      <button type="button" onClick={() => tap(side, -1)} disabled={value === 0} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border-strong font-medium text-muted hover:bg-surface-2 disabled:opacity-40" aria-label={`Undo a point for ${name}`}>
        <Minus className="size-4" aria-hidden /> Undo
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div role="status" className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-small font-medium", !online ? "bg-warning-bg text-warning-fg" : queue.length ? "bg-info-bg text-info-fg" : "bg-success-bg text-success-fg")}>
        {!online ? <CloudOff className="size-4" aria-hidden /> : queue.length ? <RefreshCw className="size-4 animate-spin" aria-hidden /> : <Wifi className="size-4" aria-hidden />}
        {!online ? `Offline — ${queue.length} tap${queue.length === 1 ? "" : "s"} saved on this phone, will send automatically` : queue.length ? `Sending ${queue.length}…` : "All taps saved"}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Side side="HOME" name={p.home} value={score.home} />
        <Side side="AWAY" name={p.away} value={score.away} />
      </div>
      <Button variant="success" size="lg" className="w-full" onClick={() => (setErr(undefined), setFinish(true))} icon={<Flag className="size-5" aria-hidden />}>
        Finish match
      </Button>
      {log.length > 0 && (
        <ol className="space-y-0.5 rounded-xl bg-surface-2 p-3 font-mono text-small text-muted" aria-label="Recent taps">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      )}
      <ConfirmDialog open={finish} onClose={() => setFinish(false)} onConfirm={submitFinal} loading={saving} tone="success" confirmLabel="Confirm result" title="Finish the match?" description={`Final score: ${p.home} ${score.home} – ${score.away} ${p.away}. Standings update straight away.`}>
        {err && (
          <p role="alert" className="mb-3 text-small font-medium text-danger-fg">
            {err}
          </p>
        )}
        {score.home === score.away && p.knockout && p.shootout && (
          <div className="grid grid-cols-2 gap-3">
            <Field id="tb-h" label={`${p.homeShort} shoot-out`}>
              <Input {...fieldA11y("tb-h")} type="number" min={0} inputMode="numeric" value={tb.h} onChange={(e) => setTb({ ...tb, h: e.target.value })} />
            </Field>
            <Field id="tb-a" label={`${p.awayShort} shoot-out`}>
              <Input {...fieldA11y("tb-a")} type="number" min={0} inputMode="numeric" value={tb.a} onChange={(e) => setTb({ ...tb, a: e.target.value })} />
            </Field>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
