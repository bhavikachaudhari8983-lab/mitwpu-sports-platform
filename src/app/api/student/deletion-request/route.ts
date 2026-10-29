import { z } from "zod";
import { route, ok, parseJson, clientIp, ApiError } from "@/lib/api";
import { requireStudentApi, studentActor } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

const schema = z.object({ reason: z.string().trim().max(500).optional() });

/** DPDP Act right to erasure: the student asks; an admin completes it (records may be needed for an ongoing event). */
export const POST = route(async (req) => {
  const student = await requireStudentApi();
  const { reason } = await parseJson(req, schema);
  const existing = await prisma.deletionRequest.findFirst({ where: { studentId: student.id, status: "PENDING" } });
  if (existing) throw new ApiError(409, "You already have a pending deletion request.");
  await prisma.deletionRequest.create({
    data: { studentId: student.id, studentLabel: `${student.fullName ?? "Unverified"}${student.prn ? ` (${student.prn})` : ""}`, reason: reason || null },
  });
  await prisma.student.update({ where: { id: student.id }, data: { deletionRequestedAt: new Date() } });
  await audit({ actor: studentActor(student), action: "DELETION_REQUESTED", studentId: student.id, summary: "Student requested deletion of their data", details: reason ? { reason } : undefined, ip: clientIp(req) });
  return ok({ requested: true }, { status: 201 });
});
