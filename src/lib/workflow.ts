// Status transitions. All staff actions go through here so rules and audit entries are consistent.
import { prisma } from "./prisma";
import { audit, type Actor } from "./audit";
import { ApiError } from "./api";
import { generateSportsId } from "./qr";
import { indianIdentityKey } from "./identity";
import type { Status } from "./constants";

async function load(id: string) {
  const s = await prisma.student.findUnique({ where: { id }, include: { college: true, measurements: { take: 1 } } });
  if (!s) throw new ApiError(404, "Student not found");
  return s;
}

async function setStatus(id: string, from: string, to: Status, actor: Actor, reason: string | null, extra: Record<string, unknown> = {}, ip?: string | null) {
  await prisma.student.update({ where: { id }, data: { status: to, statusReason: reason, ...extra } });
  await audit({ actor, action: "STATUS_CHANGED", studentId: id, summary: `Status ${from} → ${to}${reason ? `: ${reason}` : ""}`, details: reason ? { reason } : undefined, ip });
}

/** Requirements an official must meet before marking someone VERIFIED (also shown in the UI). */
export function verificationBlockers(s: Awaited<ReturnType<typeof load>>): string[] {
  const out: string[] = [];
  if (s.status !== "PENDING") out.push(s.status === "FLAGGED" ? "Flag must be resolved by an admin first" : `Status is ${s.status}, expected PENDING`);
  if (!s.measurements.length) out.push("Record height and weight");
  if (s.studentType === "OUTSIDE_INDIAN" && !s.college?.trusted) out.push("College not yet confirmed by an admin");
  if (s.studentType === "INTERNATIONAL" && !s.passportDeskVerified) out.push("Tick “Passport chip/MRZ verified”");
  return out;
}

export async function markVerified(id: string, actor: Actor & { type: "STAFF" }, ip: string | null) {
  const s = await load(id);
  const blockers = verificationBlockers(s);
  if (blockers.length) throw new ApiError(409, `Cannot verify yet: ${blockers.join("; ")}.`);
  await setStatus(id, s.status, "VERIFIED", actor, null, { verifiedAt: new Date(), verifiedById: actor.id }, ip);
}

export async function approve(id: string, actor: Actor & { type: "STAFF" }, ip: string | null) {
  const s = await load(id);
  if (s.status !== "VERIFIED") throw new ApiError(409, "Only VERIFIED registrations can be approved. An official must verify at the desk first.");
  if (s.studentType === "OUTSIDE_INDIAN" && !s.college?.trusted) throw new ApiError(409, "Confirm the college first.");
  const sportsId = s.sportsId ?? (await uniqueSportsId());
  await setStatus(id, s.status, "APPROVED", actor, null, { approvedAt: new Date(), approvedById: actor.id, sportsId }, ip);
  await audit({ actor, action: "QR_ISSUED", studentId: id, summary: `QR Sports ID ${sportsId} issued`, ip });
  return sportsId;
}

async function uniqueSportsId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const id = generateSportsId();
    if (!(await prisma.student.findUnique({ where: { sportsId: id }, select: { id: true } }))) return id;
  }
  throw new Error("Could not allocate a Sports ID");
}

export async function reject(id: string, reason: string, actor: Actor, ip: string | null) {
  const s = await load(id);
  if (s.status === "DRAFT") throw new ApiError(409, "Draft registrations can't be rejected.");
  if (s.status === "REJECTED") throw new ApiError(409, "Already rejected.");
  await setStatus(id, s.status, "REJECTED", actor, reason, {}, ip);
}

export async function flag(id: string, reason: string, actor: Actor, ip: string | null) {
  const s = await load(id);
  if (s.status === "DRAFT") throw new ApiError(409, "Draft registrations can't be flagged.");
  await setStatus(id, s.status, "FLAGGED", actor, reason, {}, ip);
}

/** Resolve a flag / reopen a rejection → back to PENDING for desk verification. */
export async function reopen(id: string, reason: string, actor: Actor, ip: string | null) {
  const s = await load(id);
  if (s.status !== "FLAGGED" && s.status !== "REJECTED") throw new ApiError(409, "Only flagged or rejected registrations can be moved back to pending.");
  await setStatus(id, s.status, "PENDING", actor, null, { verifiedAt: null, verifiedById: null }, ip);
  await audit({ actor, action: "STATUS_CHANGED", studentId: id, summary: `Flag resolved / reopened: ${reason}` , ip });
}

export async function confirmCollege(id: string, actor: Actor & { type: "STAFF" }, ip: string | null) {
  const s = await load(id);
  if (s.studentType !== "OUTSIDE_INDIAN" || !s.college) throw new ApiError(400, "This student has no outside college to confirm.");
  if (s.college.trusted) throw new ApiError(409, "College is already confirmed.");
  await prisma.college.update({ where: { id: s.college.id }, data: { trusted: true, confirmedById: actor.id, confirmedAt: new Date() } });
  await audit({ actor, action: "COLLEGE_CONFIRMED", studentId: id, entityType: "College", entityId: s.college.id, summary: `College confirmed and saved as trusted: ${s.college.name}`, ip });
}

/** The ONLY way to change a locked DOB. Mandatory reason; old and new values audited. */
export async function editDob(id: string, newDob: string, reason: string, actor: Actor & { type: "STAFF" }, ip: string | null) {
  const s = await load(id);
  if (!s.dob) throw new ApiError(409, "Identity has not been verified yet.");
  if (s.dob === newDob) throw new ApiError(400, "The new date of birth is the same as the current one.");
  let identityKey = s.identityKey;
  if (s.studentType !== "INTERNATIONAL" && s.aadhaarLast4 && s.fullName) {
    identityKey = indianIdentityKey(s.aadhaarLast4, s.fullName, newDob);
    const clash = await prisma.student.findFirst({ where: { identityKey, NOT: { id } }, select: { id: true } });
    if (clash) throw new ApiError(409, "Another profile already has this identity. Investigate before changing the DOB.");
  }
  await prisma.student.update({ where: { id }, data: { dob: newDob, dobSource: "ADMIN_CORRECTION", dobLocked: true, identityKey } });
  await audit({ actor, action: "DOB_CHANGED", studentId: id, summary: `DOB changed ${s.dob} → ${newDob}. Reason: ${reason}`, details: { from: s.dob, to: newDob, reason }, ip });
}
