import { route, parseJson, ok, clientIp, ApiError } from "@/lib/api";
import { requireStudentApi } from "@/lib/rbac";
import { digiLockerStartSchema } from "@/lib/validation/registration";
import { rateLimit } from "@/lib/rate-limit";
import { digiLockerService } from "@/services";

export const POST = route(async (req) => {
  const student = await requireStudentApi();
  if (student.status !== "DRAFT") throw new ApiError(409, "This registration has already been submitted.");
  const limit = rateLimit(`dl:${student.id}:${clientIp(req)}`, 6, 10 * 60_000);
  if (!limit.ok) throw new ApiError(429, "Too many DigiLocker attempts. Please wait a few minutes.");
  const { aadhaarNumber } = await parseJson(req, digiLockerStartSchema);
  // The full Aadhaar number is passed straight to the provider and never stored or logged.
  const res = await digiLockerService.startConsent({ aadhaarNumber });
  return ok(res);
});
