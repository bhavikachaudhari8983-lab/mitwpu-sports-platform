import type { ApiErrorBody } from "./registration-types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; fieldErrors: Record<string, string> };

export const OFFLINE_MESSAGE = "You're offline. Check your Wi-Fi or mobile data and try again.";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch wrapper for our JSON API routes (client side).
 * `retries`: extra attempts after a *network* failure (never after a server answer), waiting 1s, 2s, 4s…
 * Only pass it for requests that are safe to repeat (autosave, reads, submit — which the server refuses twice).
 */
export async function api<T>(url: string, init?: { method?: string; body?: unknown; signal?: AbortSignal; retries?: number }): Promise<ApiResult<T>> {
  const retries = init?.retries ?? 0;
  for (let attempt = 0; ; attempt++) {
    const r = await apiOnce<T>(url, init);
    if (r.ok || r.status !== 0 || r.error === "Cancelled" || attempt >= retries) return r;
    await wait(1000 * 2 ** attempt);
  }
}

async function apiOnce<T>(url: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init?.signal,
    });
    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      const b = json as Partial<ApiErrorBody>;
      return { ok: false, status: res.status, error: b.error ?? `Request failed (${res.status})`, fieldErrors: b.fieldErrors ?? {} };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return { ok: false, status: 0, error: "Cancelled", fieldErrors: {} };
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    return { ok: false, status: 0, error: offline ? OFFLINE_MESSAGE : "Network error. Check your connection and try again.", fieldErrors: {} };
  }
}
