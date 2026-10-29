import { prisma } from "./prisma";
import { deleteStoredFile } from "./storage";
import { audit, type Actor } from "./audit";

/** Permanently removes a student's profile and files. Audit entries are kept but their name is redacted. */
export async function deleteStudentData(studentId: string, actor: Actor, reason: string, ip?: string | null) {
  const s = await prisma.student.findUnique({ where: { id: studentId }, include: { documents: true } });
  if (!s) return false;
  for (const d of s.documents) await deleteStoredFile(d.storageKey);
  await prisma.student.delete({ where: { id: studentId } }); // cascades documents, registrations, checks, measurements, weigh-ins
  if (s.fullName) {
    const entries = await prisma.auditLog.findMany({ where: { studentId }, select: { id: true, summary: true, actorId: true } });
    for (const e of entries) {
      await prisma.auditLog.update({
        where: { id: e.id },
        data: { summary: e.summary.split(s.fullName).join("[deleted student]"), ...(e.actorId === studentId ? { actorName: "[deleted student]" } : {}) },
      });
    }
  }
  await audit({ actor, action: "DELETION_COMPLETED", studentId, summary: `All data deleted for a student profile (${reason})`, ip });
  return true;
}
