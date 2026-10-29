"use client";

import { useState } from "react";
import { BookUser } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, fieldA11y } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";
import { NATIONALITIES } from "@/lib/nationalities";
import type { DraftCheck, RegistrationDraft } from "@/lib/registration-types";
import { cn } from "@/lib/utils";
import { useWizard } from "../wizard-context";
import { DemoPanel, useDemoHints } from "../demo-panel";

type Form = { fullName: string; passportNumber: string; nationality: string; dob: string; expiry: string; mrzLine2: string; isOurUniversity: boolean | null };

export function PassportForm() {
  const { setDraft, demo } = useWizard();
  const toast = useToast();
  const hints = useDemoHints(demo);
  const [f, setF] = useState<Form>({ fullName: "", passportNumber: "", nationality: "", dob: "", expiry: "", mrzLine2: "", isOurUniversity: null });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.isOurUniversity === null) {
      setErrors({ isOurUniversity: "Choose one option" });
      return;
    }
    setLoading(true);
    setErrors({});
    setFormError(undefined);
    const r = await api<{ draft: RegistrationDraft; mismatches: DraftCheck[] }>("/api/register/passport", { body: f });
    setLoading(false);
    if (!r.ok) {
      setErrors(r.fieldErrors);
      setFormError(r.error);
      return;
    }
    setDraft(r.data.draft);
    if (r.data.mismatches.length) toast.toast({ tone: "warning", title: "Passport verified — admissions record differs", description: "Your registration will be flagged for manual review." });
    else toast.success("Passport verified", "All MRZ check digits are valid.");
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg">
              <BookUser className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl">Passport details</h2>
              <p className="text-muted">Enter the details exactly as printed on your passport photo page. We check them against the machine-readable zone (MRZ).</p>
            </div>
          </div>

          {formError && <Alert tone="danger">{formError}</Alert>}

          <fieldset>
            <legend className="mb-2 font-medium">
              Are you a student of the host university? <span className="text-danger-fg">*</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { v: true, l: "Yes, I study at the host university" },
                { v: false, l: "No, another university" },
              ].map((o) => (
                <label key={String(o.v)} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3", f.isOurUniversity === o.v ? "border-accent bg-surface-2" : "border-border")}>
                  <input type="radio" name="isOurUniversity" checked={f.isOurUniversity === o.v} onChange={() => set("isOurUniversity", o.v)} className="size-5 accent-[var(--accent)]" />
                  {o.l}
                </label>
              ))}
            </div>
            {errors.isOurUniversity && <p className="mt-1 text-small font-medium text-danger-fg">{errors.isOurUniversity}</p>}
          </fieldset>

          <Field id="fullName" label="Full name (as on passport)" error={errors.fullName} hint="Given names followed by surname" required>
            <Input {...fieldA11y("fullName", errors.fullName, true)} autoComplete="name" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="passportNumber" label="Passport number" error={errors.passportNumber} required>
              <Input {...fieldA11y("passportNumber", errors.passportNumber)} autoCapitalize="characters" spellCheck={false} value={f.passportNumber} onChange={(e) => set("passportNumber", e.target.value.toUpperCase())} className="font-mono uppercase" />
            </Field>
            <Field id="nationality" label="Nationality" error={errors.nationality} required>
              <Select {...fieldA11y("nationality", errors.nationality)} value={f.nationality} onChange={(e) => set("nationality", e.target.value)}>
                <option value="">Choose…</option>
                {NATIONALITIES.map((n) => (
                  <option key={n.code} value={n.code}>
                    {n.name} ({n.code})
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="dob" label="Date of birth" error={errors.dob} required>
              <Input {...fieldA11y("dob", errors.dob)} type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} />
            </Field>
            <Field id="expiry" label="Passport expiry date" error={errors.expiry} required>
              <Input {...fieldA11y("expiry", errors.expiry)} type="date" value={f.expiry} onChange={(e) => set("expiry", e.target.value)} />
            </Field>
          </div>
          <Field id="mrzLine2" label="MRZ — second line" error={errors.mrzLine2} hint="The bottom line of the two lines of letters, numbers and < symbols on your photo page (44 characters)." required>
            <Input {...fieldA11y("mrzLine2", errors.mrzLine2, true)} autoCapitalize="characters" spellCheck={false} autoComplete="off" value={f.mrzLine2} onChange={(e) => set("mrzLine2", e.target.value.toUpperCase().replace(/\s/g, ""))} className="font-mono text-small tracking-wider uppercase" maxLength={44} />
          </Field>
          <p className="text-small text-muted">{f.mrzLine2.length}/44 characters</p>
          <Button type="submit" loading={loading} size="lg">
            Verify passport
          </Button>

          {demo && hints && (
            <DemoPanel title="Demo passports">
              <p>Tap to fill a fictional passport (including a valid MRZ line).</p>
              <ul className="space-y-1">
                {hints.passports
                  .filter((p) => !p.label.includes("seeded"))
                  .map((p) => (
                    <li key={p.passportNumber}>
                      <button
                        type="button"
                        className="min-h-11 w-full rounded-lg px-2 text-left hover:bg-surface"
                        onClick={() =>
                          setF({
                            fullName: p.fullName,
                            passportNumber: p.passportNumber,
                            nationality: p.nationality,
                            dob: p.dob,
                            expiry: p.expiry,
                            mrzLine2: p.mrzLine2,
                            isOurUniversity: p.label.includes("ours"),
                          })
                        }
                      >
                        {p.label}
                      </button>
                    </li>
                  ))}
              </ul>
              <p>To see the MRZ check fail, change one digit of the date of birth after filling.</p>
            </DemoPanel>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
