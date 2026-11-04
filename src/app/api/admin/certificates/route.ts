import { z } from "zod";
import { route, ok, parseJson, clientIp } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { revokeCertificate } from "@/lib/certificates";

const schema = z.object({ code: z.string().trim().min(5).max(20), reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(300) });

export const POST = route(async (req) => {
  const staff = await requireStaffApi(["ADMIN"]);
  const { code, reason } = await parseJson(req, schema);
  await revokeCertificate(code, reason, staffActor(staff), clientIp(req));
  return ok({ ok: true });
});
