import { route, ok, ApiError } from "@/lib/api";
import { isDemoMode } from "@/lib/env";
import { getDemoHints } from "@/services/mock/demo-hints";

export const GET = route(async () => {
  if (!isDemoMode()) throw new ApiError(404, "Not found");
  return ok(getDemoHints());
});
