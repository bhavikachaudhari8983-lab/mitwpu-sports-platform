import type { ZodType } from "zod";
import { route, parseJson, ok, ApiError } from "@/lib/api";
import { requireStudentApi } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { academicSchema, draftSchema, personalSchema } from "@/lib/validation/registration";
import { getDraftDto } from "@/lib/registration";
import { validateRegistrations } from "@/lib/eligibility";

/**
 * Autosave. Each field is validated on its own: valid values are saved, invalid ones are
 * returned in `skipped` (so a half-typed phone number never blocks saving the address).
 * Verified / ERP-sourced fields are locked and silently ignored.
 */
export const PATCH = route(async (req) => {
  const student = await requireStudentApi();
  if (student.status !== "DRAFT") throw new ApiError(409, "This registration has been submitted and can no longer be edited.");
  const { step, section, values = {} } = await parseJson(req, draftSchema);

  const data: Record<string, unknown> = {};
  const skipped: Record<string, string> = {};

  function take(field: string, schema: ZodType, locked = false) {
    if (!(field in values) || locked) return;
    const raw = values[field];
    if (raw === "" || raw === null || raw === undefined) {
      data[field] = null;
      return;
    }
    const r = schema.safeParse(raw);
    if (r.success) data[field] = r.data;
    else skipped[field] = r.error.issues[0]?.message ?? "Invalid value";
  }

  const isOurIndian = student.studentType === "OUR_INDIAN";
  if (section === "personal") {
    const s = personalSchema.shape;
    take("mobile", s.mobile, student.mobileVerified);
    take("email", s.email, student.emailVerified);
    take("address", s.address);
    take("bloodGroup", s.bloodGroup);
    take("emergencyName", s.emergencyName);
    take("emergencyPhone", s.emergencyPhone);
  } else if (section === "academic") {
    const s = academicSchema.shape;
    take("universityName", s.universityName, student.isOurUniversity);
    take("prn", s.prn, isOurIndian);
    take("course", s.course, isOurIndian);
    take("year", s.year, isOurIndian);
    take("apaarId", s.apaarId);
    take("collegeOfficeEmail", s.collegeOfficeEmail, student.studentType !== "OUTSIDE_INDIAN");
    if (typeof data.prn === "string") {
      const clash = await prisma.student.findFirst({ where: { prn: data.prn, NOT: { id: student.id } }, select: { id: true } });
      if (clash) {
        delete data.prn;
        skipped.prn = "This enrollment number is already used by another registration.";
      }
    }
  } else if (section === "sports") {
    if (typeof values.playingPosition === "string" || values.playingPosition === null) {
      data.playingPosition = typeof values.playingPosition === "string" ? values.playingPosition.trim().slice(0, 60) || null : null;
    }
    if (Array.isArray(values.registrations)) {
      const { valid, errors } = await validateRegistrations(values.registrations, { studentId: student.id, gender: student.gender, dob: student.dob }, { requireWeight: false });
      Object.assign(skipped, errors);
      await prisma.$transaction([
        prisma.registration.deleteMany({ where: { studentId: student.id } }),
        prisma.registration.createMany({ data: valid.map((r) => ({ studentId: student.id, eventId: r.eventId, weightCategoryId: r.weightCategoryId })) }),
      ]);
    }
  } else if (section === "medical") {
    if (typeof values.medicalConditions === "string" || values.medicalConditions === null) {
      data.medicalConditions = typeof values.medicalConditions === "string" ? values.medicalConditions.trim().slice(0, 1000) || null : null;
    }
    if (typeof values.declarationAccepted === "boolean") data.declarationAccepted = values.declarationAccepted;
    if (typeof values.privacyAccepted === "boolean") data.privacyAccepted = values.privacyAccepted;
  }

  if (typeof step === "number" && step > student.wizardStep) data.wizardStep = step;
  if (Object.keys(data).length) await prisma.student.update({ where: { id: student.id }, data });

  return ok({ draft: await getDraftDto(student.id), skipped });
});
