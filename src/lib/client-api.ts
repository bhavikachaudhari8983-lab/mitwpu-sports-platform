import type { ApiErrorBody } from "./registration-types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; fieldErrors: Record<string, string> };

/** fetch wrapper for our JSON API routes (client side). */
export async function api<T>(url: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<ApiResult<T>> {
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
    return { ok: false, status: 0, error: "Network error. Check your connection and try again.", fieldErrors: {} };
  }
}
