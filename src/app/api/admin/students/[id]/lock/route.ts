import { route, ok } from "@/lib/api";
import { requireStaffApi } from "@/lib/rbac";
import { claimReview, releaseReview } from "@/lib/review-lock";

/** Heartbeat: "I'm looking at this record". Returns another admin who is already reviewing it, if any. */
export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { id } = await params;
  const staff = await requireStaffApi(["ADMIN"]);
  return ok({ other: await claimReview(id, staff) });
});

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { id } = await params;
  const staff = await requireStaffApi(["ADMIN"]);
  await releaseReview(id, staff.id);
  return ok({ ok: true });
});
