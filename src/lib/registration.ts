import type { Student } from "@prisma/client";
import { prisma } from "./prisma";
import { audit, type Actor } from "./audit";
import { ApiError } from "./api";
import { saveFile } from "./storage";
import { indianIdentityKey, passportIdentityKey } from "./identity";
import { ageCategoryFor, isMinor } from "./age";
import { getSettings } from "./settings";
import { normaliseName, maskPhone } from "./utils";
import { isDocType, isStatus, isStudentType, UNIVERSITY_NAME, type CheckType } from "./constants";
import { erpService, passportService, admissionsService, type BinaryFile, type DigiLockerProfile } from "@/services";
import type { RegistrationDraft } from "./registration-types";

type CheckInput = { type: CheckType; passed: boolean; expected?: string | null; actual?: string | null; details?: string };

async function storeServiceFile(studentId: string, type: string, source: string, file: BinaryFile) {
  // Replace any earlier copy from the same source.
  const old = await prisma.document.findMany({ where: { studentId, type, source } });
  for (const d of old) await prisma.document.delete({ where: { id: d.id } });
  const storageKey = await saveFile(file.data, file.mimeType);
  await prisma.document.create({
    data: { studentId, type, source, storageKey, originalName: file.fileName, mimeType: file.mimeType, size: file.data.length },
  });
}

/** Blocks a second profile for the same person. Logged against the existing profile. */
async function assertNotDuplicate(identityKey: string, student: Student, label: string, ip: string | null) {
  const existing = await prisma.student.findUnique({ where: { identityKey }, select: { id: true, fullName: true } });
  if (existing && existing.id !== student.id) {
    const from = student.mobile ? `mobile ${maskPhone(student.mobile)}` : student.email ? "an email login" : "an unknown contact";
    await audit({
      actor: { type: "SYSTEM" },
      action: "DUPLICATE_BLOCKED",
      studentId: existing.id,
      summary: `Blocked duplicate registration attempt: ${label} already belongs to an existing profile (${existing.fullName ?? "unnamed"}). Attempt came from ${from}.`,
      details: { attemptStudentId: student.id },
      ip,
    });
    throw new ApiError(409, "A registration already exists for this person. One person can have only one sports profile. Use “Check status” to sign in to the existing registration, or contact the sports office.");
  }
}

async function replaceChecks(studentId: string, checks: CheckInput[]) {
  await prisma.verificationCheck.deleteMany({ where: { studentId, type: { in: checks.map((c) => c.type) } } });
  await prisma.verificationCheck.createMany({
    data: checks.map((c) => ({ studentId, type: c.type, passed: c.passed, expected: c.expected ?? null, actual: c.actual ?? null, details: c.details ?? null })),
  });
}

function assertEditable(student: Student) {
  if (student.status !== "DRAFT") throw new ApiError(409, "This registration has already been submitted and can no longer be edited.");
}

/** Path A & B: apply a DigiLocker e-KYC profile. DOB becomes locked. */
export async function applyDigiLockerProfile(student: Student, profile: DigiLockerProfile, actor: Actor, ip: string | null) {
  assertEditable(student);
  if (student.studentType === "INTERNATIONAL") throw new ApiError(400, "International students verify with a passport.");
  if (student.dobLocked) throw new ApiError(409, "Your identity is already verified. Only an admin can change verified details.");

  const identityKey = indianIdentityKey(profile.aadhaarLast4, profile.name, profile.dob);
  await assertNotDuplicate(identityKey, student, "this DigiLocker identity", ip);

  const checks: CheckInput[] = [];
  if (student.studentType === "OUR_INDIAN" && student.prn) {
    const erp = await erpService.findStudentByPrn(student.prn);
    if (erp) {
      const nameOk = normaliseName(erp.name) === normaliseName(profile.name);
      const dobOk = erp.dob === profile.dob;
      checks.push(
        { type: "ERP_NAME_MATCH", passed: nameOk, expected: erp.name, actual: profile.name, details: nameOk ? undefined : "Name on DigiLocker differs from the university record" },
        { type: "ERP_DOB_MATCH", passed: dobOk, expected: erp.dob, actual: profile.dob, details: dobOk ? undefined : "Date of birth on DigiLocker differs from the university record" },
      );
      const erpPhoto = await erpService.getStudentPhoto(student.prn);
      if (erpPhoto) await storeServiceFile(student.id, "REFERENCE_PHOTO", "ERP", erpPhoto);
    }
  }
  checks.push({ type: "DUPLICATE", passed: true, details: "No other profile with this identity" });

  await prisma.student.update({
    where: { id: student.id },
    data: {
      identityKey,
      fullName: profile.name,
      dob: profile.dob,
      dobSource: "DIGILOCKER",
      dobLocked: true,
      identityVerifiedAt: new Date(),
      gender: profile.gender,
      aadhaarLast4: profile.aadhaarLast4,
      address: student.address ?? profile.address,
      wizardStep: Math.max(student.wizardStep, 1),
    },
  });
  await storeServiceFile(student.id, "REFERENCE_PHOTO", "DIGILOCKER", profile.photo);
  if (profile.class10Certificate) await storeServiceFile(student.id, "CLASS10", "DIGILOCKER", profile.class10Certificate);
  await replaceChecks(student.id, checks);

  const failed = checks.filter((c) => !c.passed);
  await audit({ actor, action: "IDENTITY_VERIFIED", studentId: student.id, summary: `Identity verified via DigiLocker (Aadhaar ••••${profile.aadhaarLast4})`, ip });
  if (failed.length) {
    await audit({ actor: { type: "SYSTEM" }, action: "VERIFICATION_MISMATCH", studentId: student.id, summary: `Auto-check mismatch: ${failed.map((f) => f.type).join(", ")}`, details: { failed }, ip });
  }
  return { mismatches: failed };
}

/** Path C: passport details + MRZ check (+ admissions match for our international students). */
export async function applyPassport(
  student: Student,
  input: { fullName: string; passportNumber: string; nationality: string; dob: string; expiry: string; mrzLine2: string; isOurUniversity: boolean },
  actor: Actor,
  ip: string | null,
) {
  assertEditable(student);
  if (student.studentType !== "INTERNATIONAL") throw new ApiError(400, "Indian students verify with DigiLocker.");
  if (student.dobLocked) throw new ApiError(409, "Your identity is already verified. Only an admin can change verified details.");

  const mrz = await passportService.verifyMrz(input);
  if (!mrz.valid) throw new ApiError(422, `Passport check failed: ${mrz.problems.join("; ")}.`, { mrzLine2: mrz.problems[0] });

  const identityKey = passportIdentityKey(input.nationality, input.passportNumber);
  await assertNotDuplicate(identityKey, student, `passport ${input.passportNumber}`, ip);

  const sex = input.mrzLine2.toUpperCase()[20];
  const gender = sex === "M" ? "MALE" : sex === "F" ? "FEMALE" : "OTHER";
  const checks: CheckInput[] = [{ type: "MRZ_CHECK", passed: true, details: "All ICAO check digits valid and match the details entered" }];

  if (input.isOurUniversity) {
    const rec = await admissionsService.findByPassport(input.passportNumber, input.nationality);
    if (!rec) {
      throw new ApiError(404, "No international admissions record matches this passport. If you study at another university, choose “Other university” instead.");
    }
    const dobOk = rec.dob === input.dob;
    const nameOk = normaliseName(rec.name) === normaliseName(input.fullName);
    checks.push(
      { type: "ADMISSIONS_DOB_MATCH", passed: dobOk, expected: rec.dob, actual: input.dob, details: dobOk ? undefined : "Passport date of birth differs from the admissions record" },
      { type: "ADMISSIONS_NAME_MATCH", passed: nameOk, expected: rec.name, actual: input.fullName, details: nameOk ? undefined : "Passport name differs from the admissions record" },
    );
  }
  checks.push({ type: "DUPLICATE", passed: true, details: "No other profile with this passport" });

  await prisma.student.update({
    where: { id: student.id },
    data: {
      identityKey,
      isOurUniversity: input.isOurUniversity,
      universityName: input.isOurUniversity ? UNIVERSITY_NAME : student.universityName,
      fullName: input.fullName.trim(),
      dob: input.dob,
      dobSource: "PASSPORT",
      dobLocked: true,
      identityVerifiedAt: new Date(),
      gender,
      passportNumber: input.passportNumber,
      nationality: input.nationality,
      passportExpiry: input.expiry,
      mrzValid: true,
      wizardStep: Math.max(student.wizardStep, 1),
    },
  });
  const photo = await passportService.getReferencePhoto(input);
  if (photo) await storeServiceFile(student.id, "REFERENCE_PHOTO", "PASSPORT", photo);
  await replaceChecks(student.id, checks);

  const failed = checks.filter((c) => !c.passed);
  await audit({ actor, action: "IDENTITY_VERIFIED", studentId: student.id, summary: `Identity verified via passport ${input.nationality} ${input.passportNumber} (MRZ valid)`, ip });
  if (failed.length) {
    await audit({ actor: { type: "SYSTEM" }, action: "VERIFICATION_MISMATCH", studentId: student.id, summary: `Auto-check mismatch: ${failed.map((f) => f.type).join(", ")}`, details: { failed }, ip });
  }
  return { mismatches: failed };
}

export async function getCatalog() {
  const sports = await prisma.sport.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { events: { where: { active: true }, orderBy: { name: "asc" }, include: { ageCategory: true } }, weightCategories: { orderBy: [{ gender: "asc" }, { maxKg: "asc" }] } },
  });
  return sports.map((s) => ({
    id: s.id,
    name: s.name,
    isWeightCategory: s.isWeightCategory,
    positions: s.positions ? s.positions.split(",").map((p) => p.trim()).filter(Boolean) : [],
    events: s.events.map((e) => ({ id: e.id, name: e.name, gender: e.gender, eventDate: e.eventDate, venue: e.venue, ageLimit: e.ageCategory ? { name: e.ageCategory.name, maxAge: e.ageCategory.maxAge } : null })),
    // "+X kg" (maxKg null) sorts last
    weightCategories: [...s.weightCategories]
      .sort((a, b) => (a.gender === b.gender ? (a.maxKg ?? 999) - (b.maxKg ?? 999) : a.gender.localeCompare(b.gender)))
      .map((w) => ({ id: w.id, name: w.name, gender: w.gender, minKg: w.minKg, maxKg: w.maxKg })),
  }));
}

export async function getAgeCategory(dob: string | null) {
  const [settings, categories] = await Promise.all([getSettings(), prisma.ageCategory.findMany()]);
  return { ageCategory: ageCategoryFor(dob, settings.ageCutoffDate, categories), cutoff: settings.ageCutoffDate };
}

export async function getDraftDto(studentId: string): Promise<RegistrationDraft | null> {
  const s = await prisma.student.findUnique({
    where: { id: studentId },
    include: { documents: { orderBy: { createdAt: "asc" } }, registrations: true, checks: { orderBy: { createdAt: "asc" } } },
  });
  if (!s) return null;
  const [{ ageCategory, cutoff }, catalog] = await Promise.all([getAgeCategory(s.dob), getCatalog()]);
  return {
    id: s.id,
    status: isStatus(s.status) ? s.status : "DRAFT",
    studentType: isStudentType(s.studentType) ? s.studentType : "OUTSIDE_INDIAN",
    isOurUniversity: s.isOurUniversity,
    wizardStep: s.wizardStep,
    statusReason: s.statusReason,
    submittedAt: s.submittedAt?.toISOString() ?? null,
    identity: {
      verified: s.dobLocked,
      fullName: s.fullName,
      dob: s.dob,
      dobSource: s.dobSource,
      gender: s.gender,
      aadhaarLast4: s.aadhaarLast4,
      passportNumber: s.passportNumber,
      nationality: s.nationality,
      passportExpiry: s.passportExpiry,
    },
    personal: {
      mobile: s.mobile,
      email: s.email,
      mobileVerified: s.mobileVerified,
      emailVerified: s.emailVerified,
      address: s.address,
      bloodGroup: s.bloodGroup,
      emergencyName: s.emergencyName,
      emergencyPhone: s.emergencyPhone,
    },
    academic: {
      universityName: s.universityName,
      prn: s.prn,
      course: s.course,
      year: s.year,
      apaarId: s.apaarId,
      collegeOfficeEmail: s.collegeOfficeEmail,
      prnLocked: s.studentType === "OUR_INDIAN",
      universityLocked: s.isOurUniversity,
    },
    sports: {
      registrations: s.registrations.map((r) => ({ eventId: r.eventId, weightCategoryId: r.weightCategoryId })),
      playingPosition: s.playingPosition,
    },
    medical: {
      medicalConditions: s.medicalConditions,
      declarationAccepted: s.declarationAccepted,
      privacyAccepted: s.privacyAccepted,
    },
    documents: s.documents
      .filter((d) => isDocType(d.type))
      .map((d) => ({
        id: d.id,
        type: d.type as RegistrationDraft["documents"][number]["type"],
        source: d.source,
        originalName: d.originalName,
        mimeType: d.mimeType,
        size: d.size,
        createdAt: d.createdAt.toISOString(),
      })),
    checks: s.checks.map((c) => ({ type: c.type, passed: c.passed, expected: c.expected, actual: c.actual, details: c.details })),
    ageCategory,
    isMinor: isMinor(s.dob),
    ageCutoffDate: cutoff,
    catalog,
  };
}
