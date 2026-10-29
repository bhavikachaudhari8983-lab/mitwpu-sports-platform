"use client";

import { useState } from "react";
import { FileBadge, Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldA11y } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { api } from "@/lib/client-api";
import { APP_NAME } from "@/lib/constants";
import type { DraftCheck, RegistrationDraft } from "@/lib/registration-types";
import { DemoCode, DemoPanel, useDemoHints } from "./demo-panel";

type Stage = "aadhaar" | "otp" | "consent";

function formatAadhaar(v: string) {
  return v.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * MOCK of DigiLocker's consent flow. The real integration is an OAuth redirect to
 * digilocker.gov.in; this dialog stands in for those pages so the demo works offline.
 */
export function DigiLockerDialog({ open, onClose, onVerified, demo, prn }: { open: boolean; onClose: () => void; onVerified: (draft: RegistrationDraft, mismatches: DraftCheck[]) => void; demo: boolean; prn: string | null }) {
  const hints = useDemoHints(demo);
  const [stage, setStage] = useState<Stage>("aadhaar");
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [req, setReq] = useState<{ requestId: string; maskedMobile: string; demoOtp?: string } | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  function reset() {
    setStage("aadhaar");
    setOtp("");
    setReq(null);
    setError(undefined);
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    const r = await api<{ requestId: string; maskedMobile: string; demoOtp?: string }>("/api/register/digilocker/start", { body: { aadhaarNumber: aadhaar } });
    setLoading(false);
    if (!r.ok) return setError(r.fieldErrors.aadhaarNumber ?? r.error);
    setReq(r.data);
    setStage("otp");
  }

  async function allow() {
    if (!req) return;
    setLoading(true);
    setError(undefined);
    const r = await api<{ draft: RegistrationDraft; mismatches: DraftCheck[] }>("/api/register/digilocker/complete", { body: { requestId: req.requestId, otp } });
    setLoading(false);
    if (!r.ok) {
      setError(r.fieldErrors.otp ?? r.error);
      if (r.status === 422 || r.status === 400) setStage("otp");
      return;
    }
    reset();
    setAadhaar("");
    onVerified(r.data.draft, r.data.mismatches);
  }

  const mine = hints?.erp.find((e) => e.prn === prn);

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="DigiLocker"
      description={
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded bg-info-bg px-1.5 py-0.5 text-small font-semibold text-info-fg">SIMULATED</span> Mock of the government consent screen
        </span>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-surface-2 p-3 text-small text-muted">
          <Lock className="size-4 shrink-0" aria-hidden /> Your Aadhaar number goes only to DigiLocker. {APP_NAME} stores just the last 4 digits.
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        {stage === "aadhaar" && (
          <form onSubmit={start} className="space-y-4" noValidate>
            <Field id="aadhaar" label="Aadhaar number" hint="12 digits" required>
              <Input {...fieldA11y("aadhaar", undefined, true)} inputMode="numeric" autoComplete="off" value={formatAadhaar(aadhaar)} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))} className="font-mono text-lg tracking-wider tabular" />
            </Field>
            <Button type="submit" loading={loading} className="w-full">
              Sign in to DigiLocker
            </Button>
            {demo && hints && (
              <DemoPanel title="Demo Aadhaar numbers">
                {mine && (
                  <p>
                    Your fictional record ({mine.name}):{" "}
                    <button type="button" className="min-h-11 rounded px-1 font-mono font-semibold underline" onClick={() => setAadhaar(mine.aadhaar)}>
                      {formatAadhaar(mine.aadhaar)}
                    </button>
                  </p>
                )}
                {!prn && (
                  <ul>
                    {hints.outside.map((o) => (
                      <li key={o.aadhaar}>
                        <button type="button" className="min-h-11 rounded px-1 text-left hover:bg-surface" onClick={() => setAadhaar(o.aadhaar)}>
                          <span className="font-mono">{formatAadhaar(o.aadhaar)}</span> · {o.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p>
                  Duplicate test (already registered):{" "}
                  <button type="button" className="min-h-11 rounded px-1 font-mono underline" onClick={() => setAadhaar(hints.duplicateAadhaar)}>
                    {formatAadhaar(hints.duplicateAadhaar)}
                  </button>
                </p>
              </DemoPanel>
            )}
          </form>
        )}

        {stage === "otp" && req && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP");
              setError(undefined);
              setStage("consent");
            }}
            className="space-y-4"
            noValidate
          >
            <p>
              Enter the OTP sent to your Aadhaar-linked mobile <strong className="font-mono">{req.maskedMobile}</strong>.
            </p>
            {req.demoOtp && <DemoCode label="Demo DigiLocker OTP" code={req.demoOtp} />}
            <Field id="dl-otp" label="DigiLocker OTP" required>
              <Input {...fieldA11y("dl-otp")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="max-w-48 font-mono text-xl tracking-[0.3em]" autoFocus />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Continue</Button>
              <Button variant="ghost" onClick={reset}>
                Start again
              </Button>
            </div>
          </form>
        )}

        {stage === "consent" && (
          <div className="space-y-4">
            <p className="font-semibold">{APP_NAME} is requesting access to:</p>
            <ul className="space-y-2">
              <li className="flex gap-3 rounded-lg border border-border p-3">
                <Fingerprint className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
                <span>
                  <strong>Aadhaar e-KYC</strong>
                  <span className="block text-small text-muted">Name, date of birth, gender, photo, address, last 4 digits of Aadhaar</span>
                </span>
              </li>
              <li className="flex gap-3 rounded-lg border border-border p-3">
                <FileBadge className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
                <span>
                  <strong>Class X passing certificate</strong>
                  <span className="block text-small text-muted">Issued by your school board</span>
                </span>
              </li>
            </ul>
            <p className="text-small text-muted">Purpose: identity and age verification for sports registration. Consent valid for 30 days.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="success" onClick={allow} loading={loading} icon={<ShieldCheck className="size-4" aria-hidden />}>
                Allow
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  onClose();
                }}
                disabled={loading}
              >
                Deny
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
