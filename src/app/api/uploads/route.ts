import { route, ok, ApiError, clientIp } from "@/lib/api";
import { requireStudentApi, studentActor } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { saveFile, sniffMime } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { DOC_LABEL, STUDENT_UPLOADABLE, UPLOAD_MAX_BYTES, isDocType } from "@/lib/constants";
import { MAX_ACHIEVEMENTS, SINGLE_INSTANCE, deleteDocument, toDraftDoc } from "@/lib/documents";
import { formatBytes } from "@/lib/utils";

const IMAGE_ONLY = new Set(["PHOTO", "SELFIE"]);

export const POST = route(async (req) => {
  const student = await requireStudentApi();
  if (student.status !== "DRAFT") throw new ApiError(409, "This registration has been submitted; documents can no longer be changed.");
  const limit = rateLimit(`upload:${student.id}`, 40, 10 * 60_000);
  if (!limit.ok) throw new ApiError(429, "Too many uploads. Please wait a few minutes.");

  const form = await req.formData().catch(() => null);
  if (!form) throw new ApiError(400, "Expected a file upload");
  const type = String(form.get("type") ?? "");
  const file = form.get("file");
  if (!isDocType(type) || !STUDENT_UPLOADABLE.includes(type)) throw new ApiError(400, "This document type cannot be uploaded.");
  if (!(file instanceof File)) throw new ApiError(400, "Choose a file to upload.");
  if (file.size === 0) throw new ApiError(400, "The file is empty.");
  if (file.size > UPLOAD_MAX_BYTES) throw new ApiError(413, `File is ${formatBytes(file.size)}. The limit is 5 MB.`);

  const data = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(data); // trust the bytes, not the file name or browser-declared type
  if (!mime) throw new ApiError(415, "Only JPG, PNG, WebP images or PDF files are allowed.");
  if (IMAGE_ONLY.has(type) && mime === "application/pdf") throw new ApiError(415, "Please upload a photo (JPG or PNG), not a PDF.");

  if (SINGLE_INSTANCE.includes(type)) {
    const old = await prisma.document.findMany({ where: { studentId: student.id, type } });
    for (const d of old) await deleteDocument(d);
  } else if ((await prisma.document.count({ where: { studentId: student.id, type } })) >= MAX_ACHIEVEMENTS) {
    throw new ApiError(400, `You can upload at most ${MAX_ACHIEVEMENTS} achievement documents.`);
  }

  const storageKey = await saveFile(data, mime);
  const source = String(form.get("source") ?? "") === "CAMERA" ? "CAMERA" : "UPLOAD";
  const name = file.name.replace(/[^\w.\- ]/g, "_").slice(0, 100) || "upload";
  const doc = await prisma.document.create({
    data: { studentId: student.id, type, source, storageKey, originalName: name, mimeType: mime, size: data.length },
  });
  await audit({ actor: studentActor(student), action: "DOCUMENT_UPLOADED", studentId: student.id, entityType: "Document", entityId: doc.id, summary: `${DOC_LABEL[type]} uploaded (${formatBytes(data.length)})`, ip: clientIp(req) });
  return ok(toDraftDoc(doc), { status: 201 });
});
