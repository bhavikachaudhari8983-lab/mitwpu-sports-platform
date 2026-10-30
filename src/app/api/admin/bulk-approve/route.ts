import { z } from "zod";
import { route, ok, parseJson, clientIp } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { bulkApprove } from "@/lib/workflow";

const schema = z.object({ ids: z.array(z.string().min(1)).min(1, "Select at least one student").max(100) });

export const POST = route(async (req) => {
  const staff = await requireStaffApi(["ADMIN"]);
  const { ids } = await parseJson(req, schema);
  const actor = { ...staffActor(staff), type: "STAFF" as const, id: staff.id, name: staff.name, role: staff.role };
  return ok(await bulkApprove([...new Set(ids)], actor, clientIp(req)));
});
