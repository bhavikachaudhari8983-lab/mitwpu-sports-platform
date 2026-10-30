"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Textarea, fieldA11y } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";

type Choice = { label: string; tone: "success" | "danger" | "primary"; title: string; description: string; body: Record<string, unknown>; done: string };

/**
 * Two buttons (yes / no) that each ask for a reason, then POST to the student action route.
 * Used for DOB corrections, age concerns and event change requests.
 */
export function DecisionButtons({ studentId, yes, no, disabledReason }: { studentId: string; yes: Choice; no: Choice; disabledReason?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<Choice | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!open) return;
    if (reason.trim().length < 5) return setError("Give a reason (at least 5 characters)");
    setLoading(true);
    const r = await api<{ flagged?: boolean }>(`/api/admin/students/${studentId}/action`, { body: { ...open.body, reason } });
    setLoading(false);
    if (!r.ok) return setError(r.fieldErrors.reason ?? r.error);
    setOpen(null);
    toast.success(open.done, r.data.flagged ? "The new age makes some events ineligible, so the registration is now flagged." : undefined);
    router.refresh();
  }

  const show = (c: Choice) => {
    setReason("");
    setError(undefined);
    setOpen(c);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={yes.tone} onClick={() => show(yes)} disabled={!!disabledReason} icon={<Check className="size-4" aria-hidden />}>
          {yes.label}
        </Button>
        <Button size="sm" variant="outline" onClick={() => show(no)} icon={<X className="size-4" aria-hidden />}>
          {no.label}
        </Button>
      </div>
      {disabledReason && <p className="text-small text-muted">{disabledReason}</p>}
      <ConfirmDialog open={!!open} onClose={() => setOpen(null)} onConfirm={run} loading={loading} tone={open?.tone ?? "primary"} confirmLabel={open?.label} title={open?.title ?? ""} description={open?.description}>
        <Field id="decision-reason" label="Reason / note" error={error} required>
          <Textarea {...fieldA11y("decision-reason", error)} rows={3} maxLength={500} value={reason} onChange={(e) => (setReason(e.target.value), setError(undefined))} />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
