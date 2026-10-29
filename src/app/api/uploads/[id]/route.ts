import { route, ok, ApiError, clientIp } from "@/lib/api";
import { requireStudentApi, studentActor } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { deleteDocument } from "@/lib/documents";
import { DOC_LABEL, isDocType } from "@/lib/constants";

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const { id } = await params;
  const student = await requireStudentApi();
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.studentId !== student.id) throw new ApiError(404, "Document not found.");
  if (student.status !== "DRAFT") throw new ApiError(409, "Submitted documents cannot be removed.");
  if (doc.source !== "UPLOAD" && doc.source !== "CAMERA") throw new ApiError(403, "Verified documents cannot be removed.");
  await deleteDocument(doc);
  await audit({ actor: studentActor(student), action: "DOCUMENT_DELETED", studentId: student.id, entityType: "Document", entityId: id, summary: `${isDocType(doc.type) ? DOC_LABEL[doc.type] : doc.type} removed`, ip: clientIp(req) });
  return ok({ deleted: true });
});
