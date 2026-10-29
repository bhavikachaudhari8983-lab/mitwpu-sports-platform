import { z } from "zod";
import { route, ok, parseJson, clientIp } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { approve, confirmCollege, editDob, flag, reject, reopen } from "@/lib/workflow";
import { isoDate } from "@/lib/validation/common";

const reason = z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason }),
  z.object({ action: z.literal("flag"), reason }),
  z.object({ action: z.literal("reopen"), reason }),
  z.object({ action: z.literal("confirm-college") }),
  z.object({ action: z.literal("edit-dob"), dob: isoDate.refine((d) => d < new Date().toISOString().slice(0, 10), "Date must be in the past"), reason }),
]);

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const { id } = await params;
  const staff = await requireStaffApi(["ADMIN"]);
  const input = await parseJson(req, schema);
  const actor = { ...staffActor(staff), type: "STAFF" as const, id: staff.id, name: staff.name, role: staff.role };
  const ip = clientIp(req);
  switch (input.action) {
    case "approve":
      return ok({ sportsId: await approve(id, actor, ip) });
    case "reject":
      await reject(id, input.reason, actor, ip);
      break;
    case "flag":
      await flag(id, input.reason, actor, ip);
      break;
    case "reopen":
      await reopen(id, input.reason, actor, ip);
      break;
    case "confirm-college":
      await confirmCollege(id, actor, ip);
      break;
    case "edit-dob":
      await editDob(id, input.dob, input.reason, actor, ip);
      break;
  }
  return ok({ ok: true });
});
