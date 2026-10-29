import { route, ok, ApiError } from "@/lib/api";
import { requireStudentApi } from "@/lib/rbac";
import { getDraftDto } from "@/lib/registration";

export const GET = route(async () => {
  const student = await requireStudentApi();
  const draft = await getDraftDto(student.id);
  if (!draft) throw new ApiError(404, "Registration not found");
  return ok(draft);
});
