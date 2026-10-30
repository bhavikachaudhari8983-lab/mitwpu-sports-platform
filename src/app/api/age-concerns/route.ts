import { z } from "zod";
import { route, ok, parseJson, clientIp, ApiError } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { raiseAgeConcern } from "@/lib/age-concerns";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  studentId: z.string().min(1).optional(),
  sportsId: z.string().trim().max(20).optional(),
  reason: z.string().trim().min(10, "Describe why you doubt the age (at least 10 characters)").max(500),
}).refine((v) => v.studentId || v.sportsId, { message: "Enter the athlete's Sports ID", path: ["sportsId"] });

export const POST = route(async (req) => {
  const staff = await requireStaffApi(["COACH", "OFFICIAL", "MEDICAL", "ADMIN"]);
  if (!rateLimit(`age-concern:${staff.id}`, 20, 60 * 60 * 1000).ok) throw new ApiError(429, "Too many concerns raised. Try again later.");
  const input = await parseJson(req, schema);
  return ok(await raiseAgeConcern(input, input.reason, staff, staffActor(staff), clientIp(req)), { status: 201 });
});
