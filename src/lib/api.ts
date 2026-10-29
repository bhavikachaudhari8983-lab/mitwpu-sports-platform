import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ServiceError } from "@/services/types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export function zodFieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  const r = schema.safeParse(body);
  if (!r.success) throw new ApiError(400, "Please correct the highlighted fields.", zodFieldErrors(r.error));
  return r.data;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler: maps ApiError / ZodError / ServiceError to JSON responses. */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message, fieldErrors: e.fieldErrors }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "Validation failed", fieldErrors: zodFieldErrors(e) }, { status: 400 });
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message, code: e.code }, { status: 422 });
      console.error("[api] unhandled error", e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
