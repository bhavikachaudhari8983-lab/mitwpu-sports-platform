"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquareText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldA11y } from "@/components/ui/field";
import { DemoCode } from "./demo-panel";

type Props = {
  challengeId: string;
  maskedTarget: string;
  demoCode?: string;
  onResend: () => Promise<void>;
  onBack: () => void;
  /** where to go after a successful login; default: refresh current page */
  redirectTo?: string;
};

export function OtpEntry({ challengeId, maskedTarget, demoCode, onResend, onBack, redirectTo }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    setCooldown(30);
    setCode("");
    setError(undefined);
  }, [challengeId]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError(undefined);
    const res = await signIn("student-otp", { challengeId, code, redirect: false });
    if (!res || res.error) {
      setLoading(false);
      setError(res?.error && res.error !== "CredentialsSignin" ? res.error : "Incorrect code. Please try again.");
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={verify} className="space-y-4" noValidate>
      <p className="flex items-start gap-2 text-fg">
        <MessageSquareText className="mt-1 size-5 shrink-0 text-muted" aria-hidden />
        <span>
          We sent a 6-digit code to <strong className="font-mono tabular">{maskedTarget}</strong>. It is valid for 10 minutes.
        </span>
      </p>
      {demoCode && <DemoCode code={demoCode} />}
      <Field id="otp" label="One-time code" error={error} required>
        <Input
          {...fieldA11y("otp", error)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="max-w-48 font-mono text-xl tracking-[0.3em] tabular"
          autoFocus
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={loading}>
          Verify & continue
        </Button>
        <Button
          variant="outline"
          disabled={cooldown > 0}
          icon={<RotateCcw className="size-4" aria-hidden />}
          onClick={async () => {
            await onResend();
          }}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Change details
        </Button>
      </div>
    </form>
  );
}
