"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldA11y } from "@/components/ui/field";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { OtpEntry } from "@/components/register/otp-entry";

type Sent = { challengeId: string; maskedTarget: string; demoCode?: string };

export function StatusLogin({ demo, notice }: { demo: boolean; notice?: ReactNode }) {
  const [channel, setChannel] = useState<"SMS" | "EMAIL">("SMS");
  const [value, setValue] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(undefined);
    const v = channel === "SMS" && /^\d{10}$/.test(value) ? `+91${value}` : value;
    const r = await api<Sent>("/api/otp/send", { body: channel === "SMS" ? { path: "LOGIN", channel, mobile: v } : { path: "LOGIN", channel, email: v } });
    setLoading(false);
    if (!r.ok) return setError(r.fieldErrors.mobile ?? r.fieldErrors.email ?? r.error);
    setSent(r.data);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      {notice}
      <h1 className="text-fg">Check your status</h1>
      <p className="mt-2 text-muted">Sign in with the mobile number or email you verified during registration.</p>
      <Card className="mt-6">
        <CardBody>
          {sent ? (
            <OtpEntry {...sent} onResend={() => send()} onBack={() => setSent(null)} />
          ) : (
            <form onSubmit={send} className="space-y-5" noValidate>
              <div role="radiogroup" aria-label="Sign in with" className="inline-flex rounded-lg border border-border-strong p-1">
                {(["SMS", "EMAIL"] as const).map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={channel === c} onClick={() => { setChannel(c); setValue(""); setError(undefined); }} className={cn("min-h-11 rounded-md px-4 font-medium", channel === c ? "bg-primary text-primary-fg" : "text-muted")}>
                    {c === "SMS" ? "Mobile" : "Email"}
                  </button>
                ))}
              </div>
              {channel === "SMS" ? (
                <Field id="login-mobile" label="Mobile number" error={error} hint="10-digit Indian number, or include the country code (+…)" required>
                  <Input {...fieldA11y("login-mobile", error, true)} type="tel" inputMode="tel" autoComplete="tel" value={value} onChange={(e) => setValue(e.target.value.trim())} className="font-mono" />
                </Field>
              ) : (
                <Field id="login-email" label="Email address" error={error} required>
                  <Input {...fieldA11y("login-email", error)} type="email" inputMode="email" autoComplete="email" value={value} onChange={(e) => setValue(e.target.value)} />
                </Field>
              )}
              <Button type="submit" loading={loading} icon={<LogIn className="size-4" aria-hidden />}>
                Send code
              </Button>
              {demo && (
                <p className="rounded-lg border-2 border-dashed border-info/50 p-3 text-small">
                  <strong className="text-info-fg">Demo:</strong> approved student Aarav Kulkarni → mobile <span className="font-mono">7000010001</span>. Flagged student Rohan → <span className="font-mono">7000010002</span>. Outside student awaiting college confirmation → <span className="font-mono">7000020001</span>.
                </p>
              )}
            </form>
          )}
        </CardBody>
      </Card>
      <p className="mt-6 text-center text-muted">
        Not registered yet?{" "}
        <Link href="/register" className="font-semibold text-fg underline underline-offset-4">
          Start registration
        </Link>
      </p>
    </div>
  );
}
