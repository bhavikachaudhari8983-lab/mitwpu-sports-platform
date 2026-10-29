"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeOff } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Field, FieldError, Textarea, fieldA11y } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { medicalSchema } from "@/lib/validation/registration";
import { useStepValidator, useWizard } from "../wizard-context";
import { useSection } from "../use-section";
import { DocumentUpload } from "../document-upload";

export function MedicalStep() {
  const { draft, setDraft } = useWizard();
  const m = draft.medical;
  const { values, set, validate, errorFor } = useSection("medical", {
    medicalConditions: m.medicalConditions ?? "",
    declarationAccepted: m.declarationAccepted,
    privacyAccepted: m.privacyAccepted,
  });
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});

  useStepValidator(() => {
    const docs: Record<string, string> = {};
    if (!draft.documents.some((d) => d.type === "MEDICAL_CERT")) docs.MEDICAL_CERT = "Upload your medical fitness certificate";
    if (draft.isMinor && !draft.documents.some((d) => d.type === "GUARDIAN_CONSENT")) docs.GUARDIAN_CONSENT = "Parent/guardian consent is required for athletes under 18";
    setDocErrors(docs);
    const ok = validate(medicalSchema, {}, { ...values, medicalConditions: values.medicalConditions || undefined });
    return ok && Object.keys(docs).length === 0;
  });

  return (
    <div className="space-y-6">
      <DocumentUpload
        type="MEDICAL_CERT"
        label="Medical fitness certificate"
        description="Signed by a registered medical practitioner, dated within the last 6 months."
        required
        docs={draft.documents}
        onChange={(docs) => setDraft({ ...draft, documents: docs })}
        error={docErrors.MEDICAL_CERT}
      />

      {draft.isMinor && (
        <>
          <Alert tone="warning" title="You are under 18">
            A parent or guardian must sign a consent form for you to take part.
          </Alert>
          <DocumentUpload type="GUARDIAN_CONSENT" label="Parent / guardian consent" description="Signed consent letter with the guardian's name and phone number." required docs={draft.documents} onChange={(docs) => setDraft({ ...draft, documents: docs })} error={docErrors.GUARDIAN_CONSENT} />
        </>
      )}

      <Card>
        <CardHeader title="Medical conditions" description="Optional" />
        <CardBody>
          <Field
            id="medicalConditions"
            label="Conditions, allergies or medication the medical team should know about"
            error={errorFor("medicalConditions")}
            hint={
              <span className="inline-flex items-center gap-1">
                <EyeOff className="size-4" aria-hidden /> Visible only to the medical team — not to officials, coaches or admins.
              </span>
            }
          >
            <Textarea {...fieldA11y("medicalConditions", errorFor("medicalConditions"), true)} rows={4} maxLength={1000} value={values.medicalConditions} onChange={(e) => set("medicalConditions", e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Declaration & consent" />
        <CardBody className="space-y-2">
          <Checkbox
            id="declarationAccepted"
            checked={values.declarationAccepted}
            onChange={(e) => set("declarationAccepted", e.target.checked)}
            aria-invalid={errorFor("declarationAccepted") ? true : undefined}
            label={<strong>I confirm all information is true; false information leads to disqualification.</strong>}
          />
          <FieldError message={errorFor("declarationAccepted")} />
          <Checkbox
            id="privacyAccepted"
            checked={values.privacyAccepted}
            onChange={(e) => set("privacyAccepted", e.target.checked)}
            aria-invalid={errorFor("privacyAccepted") ? true : undefined}
            label={
              <>
                I have read the{" "}
                <Link href="/privacy" target="_blank" className="font-semibold underline underline-offset-4">
                  privacy notice
                </Link>{" "}
                and consent to my data being processed for sports registration and verification.
              </>
            }
          />
          <FieldError message={errorFor("privacyAccepted")} />
        </CardBody>
      </Card>
    </div>
  );
}
