import { z } from "zod";
import { route, ok, parseJson, clientIp, ApiError } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { verifyQrPayload } from "@/lib/qr";
import { getAgeCategory } from "@/lib/registration";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.union([z.object({ payload: z.string().min(1).max(200) }), z.object({ sportsId: z.string().trim().toUpperCase().min(5).max(20) })]);

export type ScanResult = {
  valid: boolean;
  reason: string;
  manual: boolean;
  student: {
    name: string;
    sportsId: string | null;
    status: string;
    ageCategory: string | null;
    photoDocId: string | null;
    university: string | null;
    sports: string[];
    latestWeighIn: { event: string; weightKg: number; category: string | null; within: boolean | null; at: string } | null;
  } | null;
};

/** Event-day QR check. VALID only if the signature verifies AND the athlete is currently APPROVED. */
export const POST = route(async (req) => {
  const staff = await requireStaffApi(["OFFICIAL", "ADMIN"]);
  const limit = rateLimit(`scan:${staff.id}`, 120, 60_000);
  if (!limit.ok) throw new ApiError(429, "Scanning too fast — wait a moment.");
  const input = await parseJson(req, schema);
  const ip = clientIp(req);

  let sportsId: string;
  let manual = false;
  if ("payload" in input) {
    const v = verifyQrPayload(input.payload);
    if (!v.ok) {
      await audit({ actor: staffActor(staff), action: "QR_SCANNED", summary: `INVALID scan: ${v.reason}`, ip });
      return ok<ScanResult>({ valid: false, reason: v.reason, manual: false, student: null });
    }
    sportsId = v.sportsId;
  } else {
    sportsId = input.sportsId;
    manual = true;
  }

  const s = await prisma.student.findUnique({
    where: { sportsId },
    include: {
      documents: { where: { type: "PHOTO" }, take: 1 },
      registrations: { include: { event: { include: { sport: true } }, weightCategory: true } },
      weighIns: { orderBy: { createdAt: "desc" }, take: 1, include: { event: { include: { sport: true } } } },
    },
  });
  if (!s) {
    await audit({ actor: staffActor(staff), action: "QR_SCANNED", summary: `INVALID scan: unknown Sports ID ${sportsId}`, ip });
    return ok<ScanResult>({ valid: false, reason: "Sports ID not found — it may have been revoked or deleted.", manual, student: null });
  }
  const { ageCategory } = await getAgeCategory(s.dob);
  const valid = s.status === "APPROVED";
  const reason = valid ? "Approved athlete" : `Registration is ${s.status.toLowerCase()}${s.statusReason ? `: ${s.statusReason}` : ""}`;
  const w = s.weighIns[0];
  await audit({ actor: staffActor(staff), action: "QR_SCANNED", studentId: s.id, summary: `${valid ? "VALID" : "INVALID"} ${manual ? "manual lookup" : "QR scan"}: ${s.fullName} (${sportsId})`, ip });
  return ok<ScanResult>({
    valid,
    reason,
    manual,
    student: {
      name: s.fullName ?? "",
      sportsId: s.sportsId,
      status: s.status,
      ageCategory,
      photoDocId: s.documents[0]?.id ?? null,
      university: s.universityName,
      sports: s.registrations.map((r) => `${r.event.sport.name} · ${r.event.name}${r.weightCategory ? ` (${r.weightCategory.name})` : ""}`),
      latestWeighIn: w ? { event: `${w.event.sport.name} · ${w.event.name}`, weightKg: w.weightKg, category: w.categoryName, within: w.withinCategory, at: w.createdAt.toISOString() } : null,
    },
  });
});
