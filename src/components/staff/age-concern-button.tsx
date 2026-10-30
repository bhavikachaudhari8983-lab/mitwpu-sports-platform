"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Textarea, fieldA11y } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";

/**
 * "I doubt this athlete's age." Pass studentId for a known athlete; without it the user types a Sports ID
 * (e.g. an opponent's, read off their ID card). The athlete's status does not change until an admin decides.
 */
export function AgeConcernButton({ studentId, athleteName, variant = "outline" }: { studentId?: string; athleteName?: string; variant?: "outline" | "secondary" }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [sportsId, setSportsId] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit() {
    const e: Record<string, string> = {};
    if (!studentId && !sportsId.trim()) e.sportsId = "Enter the athlete's Sports ID";
    if (reason.trim().length < 10) e.reason = "Describe why you doubt the age (at least 10 characters)";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    const r = await api<{ name: string }>("/api/age-concerns", { body: studentId ? { studentId, reason } : { sportsId, reason } });
    setLoading(false);
    if (!r.ok) return setErrors(Object.keys(r.fieldErrors).length ? r.fieldErrors : { form: r.error });
    setOpen(false);
    setSportsId("");
    setReason("");
    toast.success("Concern sent to the sports office", `About ${r.data.name}. An admin will investigate.`);
    router.refresh();
  }

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => (setErrors({}), setOpen(true))} icon={<ShieldQuestion className="size-4" aria-hidden />}>
        {studentId ? "Raise age concern" : "Report an age concern"}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={submit}
        loading={loading}
        confirmLabel="Send to sports office"
        title={athleteName ? `Age concern: ${athleteName}` : "Report an age concern"}
        description="Only admins see this. The athlete keeps competing until an admin checks original documents and decides. False or repeated complaints are visible in the audit log."
      >
        <div className="space-y-3">
          {errors.form && (
            <p role="alert" className="text-small font-medium text-danger-fg">
              {errors.form}
            </p>
          )}
          {!studentId && (
            <Field id="concern-sid" label="Athlete's Sports ID" error={errors.sportsId} hint="Printed under the QR code, e.g. SS-26-4F7K2Q" required>
              <Input {...fieldA11y("concern-sid", errors.sportsId, true)} value={sportsId} onChange={(e) => setSportsId(e.target.value)} autoCapitalize="characters" className="font-mono" />
            </Field>
          )}
          <Field id="concern-reason" label="What makes you doubt the age?" error={errors.reason} hint="e.g. Played in the senior state league in 2019; physical maturity far beyond U-19" required>
            <Textarea {...fieldA11y("concern-reason", errors.reason, true)} rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </ConfirmDialog>
    </>
  );
}
