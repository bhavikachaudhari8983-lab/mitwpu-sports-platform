"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** true while the browser has a network connection. Server render assumes online. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/** Resolves when the browser is online (immediately if it already is). */
export function whenOnline(): Promise<void> {
  if (typeof navigator === "undefined" || navigator.onLine) return Promise.resolve();
  return new Promise((resolve) => window.addEventListener("online", () => resolve(), { once: true }));
}

export const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;
