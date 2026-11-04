import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AUDIENCE_LABEL, type Audience } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementForm } from "@/components/competition/announcement-form";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  await requireStaffPage(["ADMIN"], "/admin/announcements");
  const [events, sent] = await Promise.all([
    prisma.event.findMany({ where: { active: true }, include: { sport: true }, orderBy: [{ sport: { name: "asc" } }, { name: "asc" }] }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { event: { select: { name: true } } } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Reach exactly the right people: one event's athletes, captains, officials, coaches or everyone." />
      <Card>
        <CardHeader title="New announcement" />
        <CardBody>
          <AnnouncementForm events={events.map((e) => ({ id: e.id, label: `${e.sport.name} · ${e.name}` }))} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Sent" />
        <CardBody>
          {sent.length === 0 ? (
            <p className="text-muted">Nothing sent yet.</p>
          ) : (
            <ul className="space-y-3">
              {sent.map((a) => (
                <li key={a.id} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{a.title}</p>
                    <Badge>{AUDIENCE_LABEL[a.audience as Audience] ?? a.audience}{a.event ? `: ${a.event.name}` : ""}</Badge>
                    {a.channels.split(",").filter((c) => c !== "IN_APP").map((c) => (
                      <Badge key={c} tone="info">{c === "WHATSAPP" ? "WhatsApp" : c}</Badge>
                    ))}
                  </div>
                  <p className="mt-1 break-words whitespace-pre-line">{a.body}</p>
                  <p className="mt-1 text-small text-muted">
                    {a.recipients} recipients · {a.createdByName} · {formatDateTime(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
