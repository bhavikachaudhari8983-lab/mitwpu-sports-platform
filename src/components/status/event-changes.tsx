"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Select, Textarea, fieldA11y } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";

export type ChangeOption = { id: string; label: string; weights: Array<{ id: string; name: string }> };

/** Withdraw (immediate) and Request change (admin decides) for one entered event. */
export function EventChangeButtons({ eventId, eventName, options, canWithdraw, hasPendingRequest }: { eventId: string; eventName: string; options: ChangeOption[]; canWithdraw: boolean; hasPendingRequest: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"withdraw" | "change" | null>(null);
  const [reason, setReason] = useState("");
  const [toEventId, setTo] = useState("");
  const [weightId, setWeight] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const target = options.find((o) => o.id === toEventId);

  const open = (m: "withdraw" | "change") => {
    setReason("");
    setTo("");
    setWeight("");
    setErrors({});
    setMode(m);
  };

  async function submit() {
    const e: Record<string, string> = {};
    if (reason.trim().length < 5) e.reason = "Give a reason (at least 5 characters)";
    if (mode === "change" && !toEventId) e.toEventId = "Choose the new event";
    if (mode === "change" && target?.weights.length && !weightId) e.weightCategoryId = "Choose your weight class";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    const body = mode === "withdraw" ? { action: "withdraw", eventId, reason } : { action: "change", fromEventId: eventId, toEventId, weightCategoryId: weightId || null, reason };
    const r = await api("/api/student/events", { body });
    setLoading(false);
    if (!r.ok) return setErrors({ ...r.fieldErrors, ...(Object.keys(r.fieldErrors).length ? {} : { form: r.error }) });
    setMode(null);
    toast.success(mode === "withdraw" ? "Withdrawn" : "Change requested", mode === "withdraw" ? `You are no longer entered in ${eventName}.` : "The sports office will review it.");
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => open("change")} disabled={hasPendingRequest || options.length === 0} icon={<Repeat className="size-4" aria-hidden />}>
        Request change
      </Button>
      <Button size="sm" variant="ghost" onClick={() => open("withdraw")} disabled={!canWithdraw} icon={<LogOut className="size-4" aria-hidden />}>
        Withdraw
      </Button>
      <ConfirmDialog
        open={!!mode}
        onClose={() => setMode(null)}
        onConfirm={submit}
        loading={loading}
        tone={mode === "withdraw" ? "danger" : "primary"}
        confirmLabel={mode === "withdraw" ? "Withdraw" : "Send request"}
        title={mode === "withdraw" ? `Withdraw from ${eventName}?` : `Change ${eventName}`}
        description={mode === "withdraw" ? "You are removed from the entry list straight away. To re-enter, ask the sports office." : "The sports office checks eligibility and places left, then approves or declines. You stay in your current event until then."}
      >
        <div className="space-y-3">
          {errors.form && (
            <p role="alert" className="text-small font-medium text-danger-fg">
              {errors.form}
            </p>
          )}
          {mode === "change" && (
            <>
              <Field id="to-event" label="New event" error={errors.toEventId} required>
                <Select {...fieldA11y("to-event", errors.toEventId)} value={toEventId} onChange={(e) => (setTo(e.target.value), setWeight(""))}>
                  <option value="">Choose…</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {!!target?.weights.length && (
                <Field id="to-weight" label="Weight class" error={errors.weightCategoryId} hint="Checked at the weigh-in on event day" required>
                  <Select {...fieldA11y("to-weight", errors.weightCategoryId, true)} value={weightId} onChange={(e) => setWeight(e.target.value)}>
                    <option value="">Choose…</option>
                    {target.weights.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </>
          )}
          <Field id="change-reason" label="Reason" error={errors.reason} required>
            <Textarea {...fieldA11y("change-reason", errors.reason)} rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </ConfirmDialog>
    </div>
  );
}
