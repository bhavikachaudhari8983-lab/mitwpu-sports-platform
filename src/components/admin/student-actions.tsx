"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CalendarClock, CheckCircle2, Flag, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Textarea, fieldA11y } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";
import { formatDob } from "@/lib/utils";

type Action = "approve" | "reject" | "flag" | "reopen" | "confirm-college" | "edit-dob";

type Props = {
  studentId: string;
  name: string;
  status: string;
  dob: string | null;
  canConfirmCollege: boolean;
  collegeName: string | null;
  approveBlockers: string[];
};

const META: Record<Action, { title: string; confirm: string; tone: "primary" | "danger" | "success"; needsReason: boolean; desc: string }> = {
  approve: { title: "Approve and issue QR Sports ID?", confirm: "Approve", tone: "success", needsReason: false, desc: "The student gets a signed QR Sports ID and becomes eligible to compete." },
  reject: { title: "Reject registration?", confirm: "Reject", tone: "danger", needsReason: true, desc: "The reason is shown to the student." },
  flag: { title: "Flag for review?", confirm: "Flag", tone: "primary", needsReason: true, desc: "The reason is shown to the student. Flagged students can't be verified until resolved." },
  reopen: { title: "Move back to pending?", confirm: "Move to pending", tone: "primary", needsReason: true, desc: "Use after resolving a flag. The student then needs desk verification again." },
  "confirm-college": { title: "Confirm college?", confirm: "Confirm college", tone: "success", needsReason: false, desc: "The college is saved as trusted; future students from it don't need confirmation." },
  "edit-dob": { title: "Change verified date of birth?", confirm: "Change DOB", tone: "danger", needsReason: true, desc: "This overrides a verified value. The old value, new value and your reason are permanently recorded in the audit log." },
};

export function StudentActions({ studentId, name, status, dob, canConfirmCollege, collegeName, approveBlockers }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [newDob, setNewDob] = useState(dob ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function openAction(a: Action) {
    setReason("");
    setErrors({});
    setNewDob(dob ?? "");
    setAction(a);
  }

  async function run() {
    if (!action) return;
    const meta = META[action];
    if (meta.needsReason && reason.trim().length < 5) return setErrors({ reason: "Give a reason (at least 5 characters)" });
    setLoading(true);
    const body = action === "edit-dob" ? { action, dob: newDob, reason } : meta.needsReason ? { action, reason } : { action };
    const r = await api<{ sportsId?: string }>(`/api/admin/students/${studentId}/action`, { body });
    setLoading(false);
    if (!r.ok) {
      setErrors(r.fieldErrors);
      if (!Object.keys(r.fieldErrors).length) toast.error("Action failed", r.error);
      return;
    }
    setAction(null);
    toast.success(action === "approve" ? `Approved — Sports ID ${r.data.sportsId}` : "Saved", `${name}`);
    router.refresh();
  }

  const canApprove = status === "VERIFIED" && approveBlockers.length === 0;
  const meta = action ? META[action] : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="success" onClick={() => openAction("approve")} disabled={!canApprove} icon={<CheckCircle2 className="size-4" aria-hidden />}>
          Approve
        </Button>
        <Button variant="danger" onClick={() => openAction("reject")} disabled={status === "REJECTED" || status === "DRAFT"} icon={<XCircle className="size-4" aria-hidden />}>
          Reject
        </Button>
        <Button variant="outline" onClick={() => openAction("flag")} disabled={status === "FLAGGED" || status === "DRAFT"} icon={<Flag className="size-4" aria-hidden />}>
          Flag
        </Button>
        <Button variant="outline" onClick={() => openAction("reopen")} disabled={status !== "FLAGGED" && status !== "REJECTED"} icon={<RotateCcw className="size-4" aria-hidden />}>
          Resolve → pending
        </Button>
        {canConfirmCollege && (
          <Button variant="secondary" onClick={() => openAction("confirm-college")} icon={<Building2 className="size-4" aria-hidden />} className="sm:col-span-2">
            Confirm college
          </Button>
        )}
        <Button variant="outline" onClick={() => openAction("edit-dob")} disabled={!dob} icon={<CalendarClock className="size-4" aria-hidden />} className="sm:col-span-2">
          Edit DOB (admin only)
        </Button>
      </div>
      {!canApprove && status !== "APPROVED" && (
        <p className="text-small text-muted">
          Approve becomes available once an official marks the student <strong>Verified</strong> at the desk{approveBlockers.length ? `: ${approveBlockers.join("; ")}` : ""}.
        </p>
      )}

      <ConfirmDialog
        open={!!action}
        onClose={() => setAction(null)}
        onConfirm={run}
        loading={loading}
        title={meta?.title ?? ""}
        confirmLabel={meta?.confirm}
        tone={meta?.tone}
        description={
          <>
            <strong>{name}</strong>. {meta?.desc}
            {action === "confirm-college" && collegeName && <span className="mt-1 block">College: {collegeName}</span>}
          </>
        }
      >
        {action === "edit-dob" && (
          <div className="mb-4 space-y-2">
            <p className="text-small">Current: {formatDob(dob)}</p>
            <Field id="newDob" label="Correct date of birth" error={errors.dob} required>
              <Input {...fieldA11y("newDob", errors.dob)} type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} />
            </Field>
          </div>
        )}
        {meta?.needsReason && (
          <Field id="reason" label="Reason" error={errors.reason} hint={action === "edit-dob" ? "e.g. Original birth certificate checked at sports office on 30 Oct" : undefined} required>
            <Textarea {...fieldA11y("reason", errors.reason, action === "edit-dob")} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
      </ConfirmDialog>
    </div>
  );
}
