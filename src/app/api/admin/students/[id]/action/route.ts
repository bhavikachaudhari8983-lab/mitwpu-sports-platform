import { z } from "zod";
import { route, ok, parseJson, clientIp } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { approve, assertUnchanged, confirmCollege, decideDobChange, flag, reject, reopen, requestDobChange } from "@/lib/workflow";
import { resolveAgeConcern } from "@/lib/age-concerns";
import { decideEventChange } from "@/lib/event-changes";
import { isoDate } from "@/lib/validation/common";

const reason = z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500);
const version = z.string().max(40).optional();
const schema = z.union([
  z.object({ action: z.literal("approve"), version }),
  z.object({ action: z.literal("reject"), reason, version }),
  z.object({ action: z.literal("flag"), reason, version }),
  z.object({ action: z.literal("reopen"), reason, version }),
  z.object({ action: z.literal("confirm-college"), version }),
  z.object({ action: z.literal("edit-dob"), dob: isoDate.refine((d) => d < new Date().toISOString().slice(0, 10), "Date must be in the past"), reason, version }),
  z.object({ action: z.literal("decide-dob"), correctionId: z.string().min(1), approve: z.boolean(), reason }),
  z.object({ action: z.literal("resolve-concern"), concernId: z.string().min(1), outcome: z.enum(["UPHELD", "DISMISSED"]), reason }),
  z.object({ action: z.literal("decide-change"), requestId: z.string().min(1), approve: z.boolean(), reason }),
]);

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const { id } = await params;
  const staff = await requireStaffApi(["ADMIN"]);
  const input = await parseJson(req, schema);
  const actor = { ...staffActor(staff), type: "STAFF" as const, id: staff.id, name: staff.name, role: staff.role };
  const ip = clientIp(req);
  if ("version" in input) await assertUnchanged(id, input.version);
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
      await requestDobChange(id, input.dob, input.reason, actor, ip);
      break;
    case "decide-dob":
      return ok(await decideDobChange(input.correctionId, input.approve, input.reason, actor, ip));
    case "resolve-concern":
      await resolveAgeConcern(id, input.concernId, input.outcome, input.reason, actor, ip);
      break;
    case "decide-change":
      await decideEventChange(id, input.requestId, input.approve, input.reason, actor, ip);
      break;
  }
  return ok({ ok: true });
});
