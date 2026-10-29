"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText, Pencil, Send } from "lucide-react";
import { Card, CardBody, CardHeader, DefinitionList } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";
import { DOC_LABEL, STUDENT_TYPE_LABEL } from "@/lib/constants";
import type { RegistrationDraft } from "@/lib/registration-types";
import { formatBytes } from "@/lib/utils";
import { useWizard } from "../wizard-context";
import { ChecksSummary, VerifiedIdentityCard } from "./identity-step";
import type { StepProps } from ".";

type SubmitResult = { status: string; draft: RegistrationDraft };
type Problem = { step: number; message: string };

const STEP_OF: Record<string, number> = { identity: 0, selfie: 1, personal: 2, academic: 3, sports: 4, medical: 5 };

export function ReviewStep({ onGoTo }: StepProps) {
  const { draft, flush } = useWizard();
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const p = draft.personal;
  const a = draft.academic;
  const willFlag = draft.checks.some((c) => !c.passed);

  const events = draft.sports.registrations.map((r) => {
    const sport = draft.catalog.find((s) => s.events.some((e) => e.id === r.eventId));
    const ev = sport?.events.find((e) => e.id === r.eventId);
    const wc = sport?.weightCategories.find((w) => w.id === r.weightCategoryId);
    return `${ev?.name ?? "Event"} (${sport?.name ?? ""})${wc ? ` · ${wc.name}` : ""}`;
  });

  async function submit() {
    setLoading(true);
    await flush();
    const r = await api<SubmitResult>("/api/register/submit", { body: {} });
    setLoading(false);
    setConfirm(false);
    if (!r.ok) {
      const list = Object.entries(r.fieldErrors).map(([k, message]) => ({ step: STEP_OF[k.split(".")[0]] ?? 0, message }));
      setProblems(list.length ? list : [{ step: 0, message: r.error }]);
      toast.error("Please fix the issues below", r.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    toast.success(r.data.status === "FLAGGED" ? "Submitted — flagged for review" : "Registration submitted!", "Track progress on your status page.");
    router.push("/status");
    router.refresh();
  }

  const edit = (step: number) => (
    <Button variant="ghost" size="sm" onClick={() => onGoTo(step)} icon={<Pencil className="size-4" aria-hidden />}>
      Edit
    </Button>
  );

  return (
    <div className="space-y-6">
      {problems.length > 0 && (
        <Alert tone="danger" icon={<AlertTriangle className="size-5" aria-hidden />} title="Some information is missing">
          <ul className="mt-1 space-y-1">
            {problems.map((pr, i) => (
              <li key={i}>
                {pr.message}{" "}
                <button type="button" className="min-h-11 font-semibold underline underline-offset-4" onClick={() => onGoTo(pr.step)}>
                  Fix
                </button>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <VerifiedIdentityCard />
      <ChecksSummary checks={draft.checks} />

      <Section title="Personal" action={edit(2)}>
        <DefinitionList
          items={[
            { label: "Mobile", value: p.mobile },
            { label: "Email", value: <span className="break-all">{p.email}</span> },
            { label: "Address", value: p.address },
            { label: "Blood group", value: p.bloodGroup },
            { label: "Emergency contact", value: p.emergencyName ? `${p.emergencyName} · ${p.emergencyPhone ?? ""}` : null },
          ]}
        />
      </Section>

      <Section title="Academic" action={edit(3)}>
        <DefinitionList
          items={[
            { label: "Student type", value: STUDENT_TYPE_LABEL[draft.studentType] },
            { label: "University / college", value: a.universityName },
            { label: "PRN / enrollment no.", value: a.prn ? <span className="font-mono">{a.prn}</span> : null },
            { label: "Course & year", value: a.course ? `${a.course}${a.year ? ` · Year ${a.year}` : ""}` : null },
            { label: "APAAR / ABC ID", value: a.apaarId || "Not provided" },
            ...(draft.studentType === "OUTSIDE_INDIAN" ? [{ label: "College office email", value: a.collegeOfficeEmail }] : []),
          ]}
        />
      </Section>

      <Section title="Sports" action={edit(4)}>
        <DefinitionList
          items={[
            { label: "Age category", value: <span className="font-mono">{draft.ageCategory}</span> },
            { label: "Playing position", value: draft.sports.playingPosition || "—" },
            {
              label: "Events",
              value: events.length ? (
                <ul className="list-inside list-disc">
                  {events.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : (
                "None selected"
              ),
            },
          ]}
        />
      </Section>

      <Section title="Medical & consent" action={edit(5)}>
        <DefinitionList
          items={[
            { label: "Medical conditions", value: draft.medical.medicalConditions ? "Provided (medical team only)" : "None declared" },
            { label: "Declaration", value: draft.medical.declarationAccepted ? "Accepted" : "Not accepted" },
            { label: "Privacy notice", value: draft.medical.privacyAccepted ? "Accepted" : "Not accepted" },
          ]}
        />
      </Section>

      <Section title="Documents">
        <ul className="divide-y divide-border">
          {draft.documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2">
              <FileText className="size-5 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{DOC_LABEL[d.type]}</span>
                <span className="block truncate text-small text-muted">
                  {d.source === "DIGILOCKER" || d.source === "ERP" || d.source === "PASSPORT" ? `Fetched from ${d.source === "ERP" ? "university ERP" : d.source === "PASSPORT" ? "passport" : "DigiLocker"}` : d.originalName} · {formatBytes(d.size)}
                </span>
              </span>
              <CheckCircle2 className="size-5 text-success-fg" aria-label="Received" />
            </li>
          ))}
        </ul>
      </Section>

      <Card className="border-accent">
        <CardBody className="space-y-4">
          <p className="text-fg">
            When you submit, your registration goes to the sports office for verification. {willFlag && <strong>Because some details didn&apos;t match, it will be flagged for manual review.</strong>} You won&apos;t be able to edit it afterwards.
          </p>
          <Button size="lg" onClick={() => setConfirm(true)} icon={<Send className="size-5" aria-hidden />} className="w-full sm:w-auto">
            Submit registration
          </Button>
        </CardBody>
      </Card>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={submit} loading={loading} title="Submit registration?" confirmLabel="Yes, submit" description="Please check your details. After submitting you can't make changes yourself." />
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} action={action} />
      <CardBody>{children}</CardBody>
    </Card>
  );
}
