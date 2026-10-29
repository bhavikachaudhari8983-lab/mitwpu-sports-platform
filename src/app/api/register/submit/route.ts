import { route, ok, clientIp } from "@/lib/api";
import { requireStudentApi, studentActor } from "@/lib/rbac";
import { submitRegistration } from "@/lib/submission";
import { getDraftDto } from "@/lib/registration";

export const POST = route(async (req) => {
  const student = await requireStudentApi();
  const status = await submitRegistration(student.id, studentActor(student), clientIp(req));
  return ok({ status, draft: await getDraftDto(student.id) });
});
