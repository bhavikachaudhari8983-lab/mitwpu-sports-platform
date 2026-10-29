import { route, parseJson, ok, clientIp } from "@/lib/api";
import { requireStudentApi, studentActor } from "@/lib/rbac";
import { digiLockerCompleteSchema } from "@/lib/validation/registration";
import { applyDigiLockerProfile, getDraftDto } from "@/lib/registration";
import { digiLockerService } from "@/services";

export const POST = route(async (req) => {
  const student = await requireStudentApi();
  const input = await parseJson(req, digiLockerCompleteSchema);
  const profile = await digiLockerService.completeConsent(input);
  const { mismatches } = await applyDigiLockerProfile(student, profile, studentActor({ ...student, fullName: profile.name }), clientIp(req));
  return ok({ mismatches, draft: await getDraftDto(student.id) });
});
