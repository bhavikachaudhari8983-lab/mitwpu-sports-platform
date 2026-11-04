"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea, fieldA11y } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client-api";
import { AUDIENCES, AUDIENCE_LABEL, type Audience } from "@/lib/constants";

export function AnnouncementForm({ events }: { events: Array<{ id: string; label: string }> }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ title: "", body: "", audience: "ATHLETES" as Audience, eventId: "", sms: false, whatsapp: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const channels = [...(v.sms ? ["SMS"] : []), ...(v.whatsapp ? ["WHATSAPP"] : [])];
    const r = await api<{ recipients: number }>("/api/admin/announcements", { body: { title: v.title, body: v.body, audience: v.audience, eventId: v.audience === "EVENT" ? v.eventId || null : null, channels } });
    setLoading(false);
    if (!r.ok) {
      setErrors(r.fieldErrors);
      return toast.error("Not sent", r.error);
    }
    setErrors({});
    toast.success("Announcement sent", `${r.data.recipients} people${channels.length ? `, also by ${channels.join(" & ").toLowerCase()}` : ""}`);
    setV({ ...v, title: "", body: "" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field id="an-title" label="Title" error={errors.title} required className="sm:col-span-2">
        <Input {...fieldA11y("an-title", errors.title)} maxLength={80} placeholder="e.g. Football semi-finals moved to 4 pm" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
      </Field>
      <Field id="an-body" label="Message" error={errors.body} required className="sm:col-span-2">
        <Textarea {...fieldA11y("an-body", errors.body)} rows={4} maxLength={1000} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
      </Field>
      <Field id="an-aud" label="Send to" required>
        <Select {...fieldA11y("an-aud")} value={v.audience} onChange={(e) => setV({ ...v, audience: e.target.value as Audience })}>
          {AUDIENCES.map((a) => (
            <option key={a} value={a}>
              {AUDIENCE_LABEL[a]}
            </option>
          ))}
        </Select>
      </Field>
      {v.audience === "EVENT" && (
        <Field id="an-ev" label="Event" error={errors.eventId} required>
          <Select {...fieldA11y("an-ev", errors.eventId)} value={v.eventId} onChange={(e) => setV({ ...v, eventId: e.target.value })}>
            <option value="">Choose…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <fieldset className="sm:col-span-2">
        <legend className="font-medium">Also send to athletes&apos; phones</legend>
        <div className="flex flex-wrap gap-x-6">
          <Checkbox id="an-sms" label="SMS" checked={v.sms} onChange={(e) => setV({ ...v, sms: e.target.checked })} />
          <Checkbox id="an-wa" label="WhatsApp" checked={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.checked })} />
        </div>
        <p className="text-small text-muted">Always shown in the portal too. SMS and WhatsApp are simulated in this demo.</p>
      </fieldset>
      <div>
        <Button type="submit" loading={loading} icon={<Megaphone className="size-4" aria-hidden />}>
          Send announcement
        </Button>
      </div>
    </form>
  );
}
