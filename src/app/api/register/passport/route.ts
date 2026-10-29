import { route, parseJson, ok, clientIp, ApiError } from "@/lib/api";
import { requireStudentApi, studentActor } from "@/lib/rbac";
import { passportSchema } from "@/lib/validation/registration";
import { applyPassport, getDraftDto } from "@/lib/registration";
import { rateLimit } from "@/lib/rate-limit";

export const POST = route(async (req) => {
  const student = await requireStudentApi();
  const limit = rateLimit(`pp:${student.id}`, 10, 10 * 60_000);
  if (!limit.ok) throw new ApiError(429, "Too many attempts. Please wait a few minutes.");
  const input = await parseJson(req, passportSchema);
  const { mismatches } = await applyPassport(student, input, studentActor({ ...student, fullName: input.fullName }), clientIp(req));
  return ok({ mismatches, draft: await getDraftDto(student.id) });
});
