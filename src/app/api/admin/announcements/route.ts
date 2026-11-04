import { z } from "zod";
import { route, ok, parseJson, clientIp } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { AUDIENCES } from "@/lib/constants";
import { sendAnnouncement } from "@/lib/announcements";

const schema = z.object({
  title: z.string().trim().min(3, "Add a short title").max(80),
  body: z.string().trim().min(5, "Write the message").max(1000),
  audience: z.enum(AUDIENCES),
  eventId: z.string().nullable(),
  channels: z.array(z.enum(["SMS", "WHATSAPP"])).max(2),
});

export const POST = route(async (req) => {
  const staff = await requireStaffApi(["ADMIN"]);
  const input = await parseJson(req, schema);
  const a = await sendAnnouncement(input, { ...staffActor(staff), type: "STAFF", id: staff.id, name: staff.name, role: staff.role }, clientIp(req));
  return ok({ recipients: a.recipients }, { status: 201 });
});
