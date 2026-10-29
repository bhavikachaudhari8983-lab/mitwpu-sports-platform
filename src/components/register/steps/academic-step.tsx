"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, LockedValue, Select, fieldA11y } from "@/components/ui/field";
import { STUDENT_TYPE_LABEL } from "@/lib/constants";
import { academicSchema } from "@/lib/validation/registration";
import { useStepValidator, useWizard } from "../wizard-context";
import { useSection } from "../use-section";
import { DocumentUpload } from "../document-upload";

export function AcademicStep() {
  const { draft, setDraft } = useWizard();
  const a = draft.academic;
  const isOurIndian = draft.studentType === "OUR_INDIAN";
  const isOutside = draft.studentType === "OUTSIDE_INDIAN";
  const { values, set, validate, errorFor } = useSection("academic", {
    universityName: a.universityName ?? "",
    prn: a.prn ?? "",
    course: a.course ?? "",
    year: a.year ? String(a.year) : "",
    apaarId: a.apaarId ?? "",
    collegeOfficeEmail: a.collegeOfficeEmail ?? "",
  });
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});

  useStepValidator(() => {
    const extra: Record<string, string> = {};
    const docs: Record<string, string> = {};
    if (isOutside) {
      if (!values.collegeOfficeEmail) extra.collegeOfficeEmail = "Enter your college sports/admin office email";
      for (const t of ["COLLEGE_ID", "BONAFIDE"] as const) if (!draft.documents.some((d) => d.type === t)) docs[t] = "This document is required";
    }
    setDocErrors(docs);
    // Empty optional fields are sent as undefined so they don't fail format checks.
    const fieldsOk = validate(academicSchema, extra, { ...values, apaarId: values.apaarId || undefined, collegeOfficeEmail: values.collegeOfficeEmail || undefined });
    return fieldsOk && Object.keys(docs).length === 0;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Studies" description={isOurIndian ? "Fetched from the university ERP — no need to type." : undefined} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <LockedValue label="Student type" value={STUDENT_TYPE_LABEL[draft.studentType]} />
          {a.universityLocked ? (
            <LockedValue label="University" value={a.universityName} source="Verified" />
          ) : (
            <Field id="universityName" label={isOutside ? "College / university name" : "University name"} error={errorFor("universityName")} required>
              <Input {...fieldA11y("universityName", errorFor("universityName"))} autoComplete="organization" value={values.universityName} onChange={(e) => set("universityName", e.target.value)} />
            </Field>
          )}
          {a.prnLocked ? (
            <LockedValue label="PRN" value={<span className="font-mono">{a.prn}</span>} source="ERP" />
          ) : (
            <Field id="prn" label="Enrollment / student ID number" error={errorFor("prn")} required>
              <Input {...fieldA11y("prn", errorFor("prn"))} autoCapitalize="characters" spellCheck={false} value={values.prn} onChange={(e) => set("prn", e.target.value.toUpperCase())} className="font-mono uppercase" />
            </Field>
          )}
          {isOurIndian ? (
            <>
              <LockedValue label="Course" value={a.course} source="ERP" />
              <LockedValue label="Year" value={a.year ? `Year ${a.year}` : "—"} source="ERP" />
            </>
          ) : (
            <>
              <Field id="course" label="Course" error={errorFor("course")} hint="e.g. B.Tech Mechanical" required>
                <Input {...fieldA11y("course", errorFor("course"), true)} value={values.course} onChange={(e) => set("course", e.target.value)} />
              </Field>
              <Field id="year" label="Year of study" error={errorFor("year")} required>
                <Select {...fieldA11y("year", errorFor("year"))} value={values.year} onChange={(e) => set("year", e.target.value)}>
                  <option value="">Choose…</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          )}
          <Field id="apaarId" label="APAAR / ABC ID" error={errorFor("apaarId")} hint="Optional · 12 digits">
            <Input {...fieldA11y("apaarId", errorFor("apaarId"), true)} inputMode="numeric" value={values.apaarId} onChange={(e) => set("apaarId", e.target.value.replace(/[^\d ]/g, "").slice(0, 14))} className="font-mono" />
          </Field>
          {isOutside && (
            <Field id="collegeOfficeEmail" label="College sports / admin office email" error={errorFor("collegeOfficeEmail")} hint="We contact this office to confirm you are enrolled." required>
              <Input {...fieldA11y("collegeOfficeEmail", errorFor("collegeOfficeEmail"), true)} type="email" inputMode="email" value={values.collegeOfficeEmail} onChange={(e) => set("collegeOfficeEmail", e.target.value)} />
            </Field>
          )}
        </CardBody>
      </Card>

      {isOutside && (
        <section className="space-y-3" aria-labelledby="college-docs">
          <h2 id="college-docs" className="text-xl">
            College documents
          </h2>
          <p className="text-muted">Your registration stays pending until the sports office confirms your college.</p>
          <DocumentUpload type="COLLEGE_ID" label="College ID card" required docs={draft.documents} onChange={(docs) => setDraft({ ...draft, documents: docs })} error={docErrors.COLLEGE_ID} />
          <DocumentUpload type="BONAFIDE" label="Bonafide letter" description="Signed by your principal / registrar, issued this academic year" required docs={draft.documents} onChange={(docs) => setDraft({ ...draft, documents: docs })} error={docErrors.BONAFIDE} />
        </section>
      )}
    </div>
  );
}
