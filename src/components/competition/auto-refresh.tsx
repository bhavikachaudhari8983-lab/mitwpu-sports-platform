"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the page every few seconds while something is live, so spectators see scores move. */
export function AutoRefresh({ active, seconds = 15 }: { active: boolean; seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [active, seconds, router]);
  return null;
}
