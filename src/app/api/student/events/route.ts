import { z } from "zod";
import { route, ok, parseJson, clientIp } from "@/lib/api";
import { requireStudentApi, studentActor } from "@/lib/rbac";
import { requestEventChange, withdrawFromEvent } from "@/lib/event-changes";

const reason = z.string().trim().min(5, "Give a reason (at least 5 characters)").max(300);
const schema = z.union([
  z.object({ action: z.literal("withdraw"), eventId: z.string().min(1), reason }),
  z.object({ action: z.literal("change"), fromEventId: z.string().min(1), toEventId: z.string().min(1, "Choose the new event"), weightCategoryId: z.string().nullable().optional(), reason }),
]);

/** Withdraw from an event (immediate) or ask to swap it for another (needs an admin). */
export const POST = route(async (req) => {
  const student = await requireStudentApi();
  const input = await parseJson(req, schema);
  const actor = studentActor(student);
  if (input.action === "withdraw") await withdrawFromEvent(student.id, input.eventId, input.reason, actor, clientIp(req));
  else await requestEventChange(student.id, { fromEventId: input.fromEventId, toEventId: input.toEventId, weightCategoryId: input.weightCategoryId ?? null, reason: input.reason }, actor, clientIp(req));
  return ok({ ok: true });
});
