"use client";

import { useState } from "react";
import { AlertTriangle, BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import { Card, CardBody, DefinitionList } from "@/components/ui/card";
import { Alert } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CHECK_LABEL, GENDER_LABEL, type CheckType, type Gender } from "@/lib/constants";
import type { DraftCheck } from "@/lib/registration-types";
import { formatDob } from "@/lib/utils";
import { useStepValidator, useWizard } from "../wizard-context";
import { DigiLockerDialog } from "../digilocker-dialog";
import { PassportForm } from "./passport-form";
import { DocumentUpload } from "../document-upload";

export function IdentityStep() {
  const { draft, setDraft, demo } = useWizard();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});
  const intl = draft.studentType === "INTERNATIONAL";
  const v = draft.identity;

  useStepValidator(() => {
    if (!v.verified) return false;
    if (!intl) return true;
    const missing: Record<string, string> = {};
    for (const t of ["PASSPORT", "VISA", "FRRO"] as const) if (!draft.documents.some((d) => d.type === t)) missing[t] = "This document is required";
    setDocErrors(missing);
    return Object.keys(missing).length === 0;
  });

  if (!v.verified) {
    return intl ? (
      <PassportForm />
    ) : (
      <div className="space-y-6">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg">
                <ShieldCheck className="size-6" aria-hidden />
              </span>
              <div>
                <h2 className="text-2xl">Verify with DigiLocker</h2>
                <p className="text-muted">
                  Your name, date of birth and gender come directly from your Aadhaar record — you don&apos;t type them. This keeps every athlete&apos;s age honest.
                </p>
              </div>
            </div>
            <ul className="list-inside list-disc space-y-1 text-small text-muted">
              <li>We receive only the last 4 digits of your Aadhaar.</li>
              <li>Your Class 10 certificate is fetched automatically — no upload needed.</li>
              <li>After verification your date of birth is locked.</li>
            </ul>
            <Button size="lg" onClick={() => setOpen(true)} icon={<ShieldCheck className="size-5" aria-hidden />}>
              Verify with DigiLocker
            </Button>
          </CardBody>
        </Card>
        <DigiLockerDialog
          open={open}
          demo={demo}
          prn={draft.studentType === "OUR_INDIAN" ? draft.academic.prn : null}
          onClose={() => setOpen(false)}
          onVerified={(d, mismatches) => {
            setOpen(false);
            setDraft(d);
            if (mismatches.length) toast.toast({ tone: "warning", title: "Verified — but details don't match", description: "Your registration will be flagged for manual review." });
            else toast.success("Identity verified", "Your details were fetched from DigiLocker.");
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VerifiedIdentityCard />
      <ChecksSummary checks={draft.checks} />
      {intl && (
        <section className="space-y-3" aria-labelledby="intl-docs">
          <h2 id="intl-docs" className="text-xl">
            Immigration documents
          </h2>
          <p className="text-muted">These can&apos;t be fetched automatically, so please upload clear photos or PDFs.</p>
          <DocumentUpload type="PASSPORT" label="Passport photo page" required docs={draft.documents} onChange={(docs) => setDraft({ ...draft, documents: docs })} error={docErrors.PASSPORT} />
          <DocumentUpload type="VISA" label="Student visa" required docs={draft.documents} onChange={(docs) => setDraft({ ...draft, documents: docs })} error={docErrors.VISA} />
          <DocumentUpload type="FRRO" label="FRRO residence permit" description="Residential Permit issued by the FRRO/FRO" required docs={draft.documents} onChange={(docs) => setDraft({ ...draft, documents: docs })} error={docErrors.FRRO} />
        </section>
      )}
    </div>
  );
}

export function VerifiedIdentityCard() {
  const { draft } = useWizard();
  const v = draft.identity;
  const intl = draft.studentType === "INTERNATIONAL";
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeCheck className="size-6 text-success-fg" aria-hidden />
          <h2 className="text-2xl">Identity verified</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-small text-muted">
            <Lock className="size-3.5" aria-hidden /> Locked
          </span>
        </div>
        <DefinitionList
          items={[
            { label: "Full name", value: v.fullName },
            { label: "Date of birth", value: formatDob(v.dob) },
            { label: "Gender", value: v.gender ? GENDER_LABEL[v.gender as Gender] ?? v.gender : "—" },
            { label: "Age category", value: draft.ageCategory ? <span className="font-mono">{draft.ageCategory}</span> : "—" },
            intl ? { label: "Passport", value: <span className="font-mono">{v.nationality} · {v.passportNumber}</span> } : { label: "Aadhaar", value: <span className="font-mono">XXXX XXXX {v.aadhaarLast4}</span> },
            { label: "Verified via", value: v.dobSource === "PASSPORT" ? "Passport (MRZ check)" : v.dobSource === "ADMIN_CORRECTION" ? "Admin correction" : "DigiLocker" },
          ]}
        />
        <p className="text-small text-muted">
          Age category is calculated from your verified date of birth as on {formatDob(draft.ageCutoffDate)}. If something is wrong, contact the sports office — only an admin can correct verified details.
        </p>
      </CardBody>
    </Card>
  );
}

export function ChecksSummary({ checks }: { checks: DraftCheck[] }) {
  const failed = checks.filter((c) => !c.passed);
  if (!failed.length) return null;
  return (
    <Alert tone="warning" icon={<AlertTriangle className="size-5" aria-hidden />} title="Your details don't match our records">
      <ul className="mt-1 space-y-1">
        {failed.map((c) => (
          <li key={c.type}>
            <strong>{CHECK_LABEL[c.type as CheckType] ?? c.type}:</strong> record says “{c.type.includes("DOB") ? formatDob(c.expected) : c.expected}”, verified source says “{c.type.includes("DOB") ? formatDob(c.actual) : c.actual}”.
          </li>
        ))}
      </ul>
      <p className="mt-2">You can still complete the form. After you submit, your registration will be <strong>flagged</strong> for manual review by the sports office.</p>
    </Alert>
  );
}
