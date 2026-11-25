"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useOnline } from "@/lib/use-online";

/**
 * Site-wide connection banner: appears as soon as the connection drops and says what happens to the
 * student's work, then shows "Back online" for a few seconds when it returns.
 */
export function OfflineBanner() {
  const online = useOnline();
  const [backOnline, setBackOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setBackOnline(false);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setBackOnline(true);
    const t = setTimeout(() => setBackOnline(false), 4000);
    return () => clearTimeout(t);
  }, [online]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-3">
      {!online ? (
        <p className="pointer-events-auto flex max-w-xl items-start gap-2 rounded-lg bg-stage px-4 py-3 text-small text-stage-fg shadow-2xl ring-2 ring-volt">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-volt" aria-hidden />
          <span>
            <strong className="font-bold">You&apos;re offline.</strong> Don&apos;t worry: what you&apos;ve typed is kept on this page and saves automatically when the connection is back.
          </span>
        </p>
      ) : backOnline ? (
        <p className="pointer-events-auto flex items-center gap-2 rounded-lg bg-success-bg px-4 py-2 text-small font-semibold text-success-fg shadow-lg">
          <Wifi className="size-4 shrink-0" aria-hidden /> You&apos;re back online.
        </p>
      ) : null}
    </div>
  );
}
