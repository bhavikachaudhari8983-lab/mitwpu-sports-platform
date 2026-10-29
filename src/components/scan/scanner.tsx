"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Keyboard, Scale, ScanLine, XCircle } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/feedback";
import { api } from "@/lib/client-api";
import type { ScanResult } from "@/app/api/scan/route";
import { formatDateTime } from "@/lib/utils";

const READER_ID = "qr-reader";

export function Scanner() {
  const scanner = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [camState, setCamState] = useState<"off" | "starting" | "on" | "error">("off");
  const [camError, setCamError] = useState<string>();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string>();
  const [manual, setManual] = useState("");

  const check = useCallback(async (body: { payload: string } | { sportsId: string }) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setChecking(true);
    setError(undefined);
    try {
      scanner.current?.pause(true);
    } catch {
      /* not scanning */
    }
    const r = await api<ScanResult>("/api/scan", { body });
    setChecking(false);
    if (!r.ok) setError(r.error);
    else {
      setResult(r.data);
      if ("vibrate" in navigator) navigator.vibrate(r.data.valid ? 80 : [80, 60, 80]);
    }
  }, []);

  async function stop() {
    try {
      if (scanner.current?.isScanning) await scanner.current.stop();
    } catch {
      /* ignore */
    }
    setCamState("off");
  }

  async function start() {
    setCamError(undefined);
    setCamState("starting");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      scanner.current ??= new Html5Qrcode(READER_ID, { verbose: false });
      await scanner.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s }; } },
        (text) => void check({ payload: text }),
        () => undefined,
      );
      setCamState("on");
    } catch (e) {
      setCamState("error");
      const msg = e instanceof Error ? e.message : String(e);
      setCamError(/permission|notallowed/i.test(msg) ? "Camera permission denied. Allow camera access in browser settings, or use manual entry." : "Couldn't start the camera. Use manual entry below.");
    }
  }

  function next() {
    setResult(null);
    setError(undefined);
    busyRef.current = false;
    try {
      scanner.current?.resume();
    } catch {
      /* not paused */
    }
  }

  useEffect(() => () => void stop(), []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div id={READER_ID} className="mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl bg-black [&_video]:h-full [&_video]:w-full [&_video]:object-cover" aria-label="Camera viewfinder" />
            {camState === "off" && (
              <Button size="lg" className="w-full" onClick={start} icon={<Camera className="size-5" aria-hidden />}>
                Start camera
              </Button>
            )}
            {camState === "starting" && <Spinner label="Starting camera" />}
            {camState === "on" && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-small text-muted">
                  <ScanLine className="size-4 animate-pulse" aria-hidden /> Point at the QR on the athlete&apos;s Sports ID
                </span>
                <Button variant="outline" size="sm" onClick={stop} icon={<CameraOff className="size-4" aria-hidden />}>
                  Stop camera
                </Button>
              </div>
            )}
            {camState === "error" && (
              <Alert tone="warning" title="Camera unavailable">
                {camError}
              </Alert>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (manual.trim()) void check({ sportsId: manual.trim() });
              }}
            >
              <label className="min-w-0 flex-1">
                <span className="mb-1.5 flex items-center gap-1.5 font-medium">
                  <Keyboard className="size-4" aria-hidden /> Manual Sports ID lookup
                </span>
                <Input value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} placeholder="SS-26-XXXXXX" autoCapitalize="characters" spellCheck={false} className="font-mono" />
              </label>
              <Button type="submit" variant="outline" loading={checking}>
                Check
              </Button>
            </form>
            <p className="mt-2 text-small text-muted">Manual lookups skip the QR signature check — always compare the photo.</p>
          </CardBody>
        </Card>
      </div>

      <div aria-live="assertive" className="space-y-4">
        {checking && <Spinner label="Checking" />}
        {error && <Alert tone="danger">{error}</Alert>}
        {!result && !checking && !error && (
          <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border-strong p-6 text-center text-muted">Scan a Sports ID to see the result here.</div>
        )}
        {result && <ResultCard r={result} onNext={next} />}
      </div>
    </div>
  );
}

function ResultCard({ r, onNext }: { r: ScanResult; onNext: () => void }) {
  const s = r.student;
  return (
    <Card className="overflow-hidden">
      <div className={r.valid ? "bg-[#15803d] text-white" : "bg-[#b91c1c] text-white"} role="status">
        <div className="flex items-center gap-3 px-5 py-5">
          {r.valid ? <CheckCircle2 className="size-12 shrink-0" aria-hidden /> : <XCircle className="size-12 shrink-0" aria-hidden />}
          <div>
            <p className="font-heading text-5xl leading-none font-bold tracking-tight">{r.valid ? "VALID" : "INVALID"}</p>
            <p className="mt-1 text-white/90">{r.reason}</p>
          </div>
        </div>
      </div>
      <CardBody className="space-y-4">
        {r.manual && <Badge tone="warning">Manual lookup — QR signature not checked</Badge>}
        {s ? (
          <div className="grid grid-cols-[7rem_1fr] gap-4">
            {s.photoDocId ? (
              // eslint-disable-next-line @next/next/no-img-element -- authorised private route
              <img src={`/api/documents/${s.photoDocId}`} alt={`Photo of ${s.name}`} className="aspect-[3/4] w-full rounded-lg object-cover" />
            ) : (
              <div className="aspect-[3/4] w-full rounded-lg bg-surface-2" />
            )}
            <div className="min-w-0 space-y-1">
              <p className="font-heading text-2xl leading-tight font-bold">{s.name}</p>
              <p className="font-mono text-small">{s.sportsId}</p>
              <p>
                Age category <strong className="font-mono">{s.ageCategory ?? "—"}</strong>
              </p>
              <p className="text-small text-muted">{s.university}</p>
              <ul className="text-small">
                {s.sports.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-muted">No athlete record attached to this code.</p>
        )}
        {s?.latestWeighIn && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 p-3 text-small">
            <Scale className="size-4" aria-hidden />
            Latest weigh-in: <strong className="font-mono">{s.latestWeighIn.weightKg} kg</strong> · {s.latestWeighIn.event}
            {s.latestWeighIn.category && ` (${s.latestWeighIn.category})`}
            {s.latestWeighIn.within === false ? <Badge tone="danger">Outside category</Badge> : s.latestWeighIn.within ? <Badge tone="success">Within category</Badge> : null}
            <span className="text-muted">{formatDateTime(s.latestWeighIn.at)}</span>
          </div>
        )}
        <Button size="lg" className="w-full" onClick={onNext} icon={<ScanLine className="size-5" aria-hidden />}>
          Scan next
        </Button>
      </CardBody>
    </Card>
  );
}
