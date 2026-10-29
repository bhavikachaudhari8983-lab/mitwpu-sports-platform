"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Textarea, fieldA11y } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";

export function DeletionRequestButton() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function submit() {
    setLoading(true);
    const r = await api("/api/student/deletion-request", { body: { reason } });
    setLoading(false);
    setOpen(false);
    if (!r.ok) return toast.error("Request not sent", r.error);
    toast.success("Deletion requested", "The sports office will process it and remove your data.");
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} icon={<Trash2 className="size-4" aria-hidden />}>
        Request data deletion
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={submit}
        loading={loading}
        tone="danger"
        confirmLabel="Send request"
        title="Delete my data?"
        description="Once approved, your profile, documents and Sports ID are permanently deleted and you are withdrawn from all events. An anonymised audit entry is kept as required by law."
      >
        <Field id="deletion-reason" label="Reason (optional)">
          <Textarea {...fieldA11y("deletion-reason")} rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </ConfirmDialog>
    </>
  );
}
