// Shared enumerations. Stored as strings in the DB so the schema stays portable (SQLite ⇄ PostgreSQL).

export const APP_NAME = "Rivermount Sports Portal";
export const UNIVERSITY_NAME = process.env.NEXT_PUBLIC_UNIVERSITY_NAME ?? "Rivermount University";
export const UNIVERSITY_SHORT = "RMU";
export const CONTACT_EMAIL = "sports.office@rivermount.example";
export const CONTACT_PHONE = "+91 20 5550 0100";

export const STATUSES = ["DRAFT", "PENDING", "VERIFIED", "APPROVED", "FLAGGED", "REJECTED"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  VERIFIED: "Verified",
  APPROVED: "Approved",
  FLAGGED: "Flagged",
  REJECTED: "Rejected",
};

export const STUDENT_TYPES = ["OUR_INDIAN", "OUTSIDE_INDIAN", "INTERNATIONAL"] as const;
export type StudentType = (typeof STUDENT_TYPES)[number];

export const STUDENT_TYPE_LABEL: Record<StudentType, string> = {
  OUR_INDIAN: `${UNIVERSITY_SHORT} student (Indian)`,
  OUTSIDE_INDIAN: "Other university (Indian)",
  INTERNATIONAL: "International / OCI / NRI",
};

export const ROLES = ["STUDENT", "OFFICIAL", "ADMIN", "MEDICAL", "COACH"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES = ["OFFICIAL", "ADMIN", "MEDICAL", "COACH"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  OFFICIAL: "Official",
  ADMIN: "Admin",
  MEDICAL: "Medical",
  COACH: "Coach",
};

export const DOC_TYPES = [
  "PHOTO",
  "SELFIE",
  "REFERENCE_PHOTO",
  "CLASS10",
  "COLLEGE_ID",
  "BONAFIDE",
  "PASSPORT",
  "VISA",
  "FRRO",
  "MEDICAL_CERT",
  "GUARDIAN_CONSENT",
  "ACHIEVEMENT",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_LABEL: Record<DocType, string> = {
  PHOTO: "Passport-size photo",
  SELFIE: "Live selfie",
  REFERENCE_PHOTO: "Verified source photo",
  CLASS10: "Class 10 certificate",
  COLLEGE_ID: "College ID card",
  BONAFIDE: "Bonafide letter",
  PASSPORT: "Passport photo page",
  VISA: "Student visa",
  FRRO: "FRRO residence permit",
  MEDICAL_CERT: "Medical fitness certificate",
  GUARDIAN_CONSENT: "Parent/guardian consent",
  ACHIEVEMENT: "Achievement certificate",
};

/** Documents a student may upload themselves (others come from verified sources). */
export const STUDENT_UPLOADABLE: readonly DocType[] = [
  "PHOTO",
  "SELFIE",
  "COLLEGE_ID",
  "BONAFIDE",
  "PASSPORT",
  "VISA",
  "FRRO",
  "MEDICAL_CERT",
  "GUARDIAN_CONSENT",
  "ACHIEVEMENT",
];

/** Which staff roles may view which document types. Students may always view their own. */
export const DOC_ACCESS: Record<DocType, readonly StaffRole[]> = {
  PHOTO: ["ADMIN", "OFFICIAL", "MEDICAL", "COACH"],
  SELFIE: ["ADMIN", "OFFICIAL"],
  REFERENCE_PHOTO: ["ADMIN", "OFFICIAL"],
  CLASS10: ["ADMIN", "OFFICIAL"],
  COLLEGE_ID: ["ADMIN", "OFFICIAL"],
  BONAFIDE: ["ADMIN", "OFFICIAL"],
  PASSPORT: ["ADMIN", "OFFICIAL"],
  VISA: ["ADMIN", "OFFICIAL"],
  FRRO: ["ADMIN", "OFFICIAL"],
  MEDICAL_CERT: ["ADMIN", "MEDICAL"],
  GUARDIAN_CONSENT: ["ADMIN", "MEDICAL"],
  ACHIEVEMENT: ["ADMIN", "OFFICIAL", "COACH"],
};

export const DOC_SOURCES = ["UPLOAD", "CAMERA", "DIGILOCKER", "ERP", "PASSPORT", "SEED"] as const;
export type DocSource = (typeof DOC_SOURCES)[number];

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof GENDERS)[number];
export const GENDER_LABEL: Record<Gender, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const EVENT_GENDERS = ["MALE", "FEMALE", "MIXED"] as const;
export type EventGender = (typeof EVENT_GENDERS)[number];

export const CHECK_TYPES = [
  "ERP_NAME_MATCH",
  "ERP_DOB_MATCH",
  "ADMISSIONS_DOB_MATCH",
  "ADMISSIONS_NAME_MATCH",
  "MRZ_CHECK",
  "DUPLICATE",
] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

export const CHECK_LABEL: Record<CheckType, string> = {
  ERP_NAME_MATCH: "Name: ERP vs DigiLocker",
  ERP_DOB_MATCH: "Date of birth: ERP vs DigiLocker",
  ADMISSIONS_DOB_MATCH: "Date of birth: passport vs admissions record",
  ADMISSIONS_NAME_MATCH: "Name: passport vs admissions record",
  MRZ_CHECK: "Passport MRZ check digits",
  DUPLICATE: "Duplicate identity check",
};

export const DOB_SOURCES = ["DIGILOCKER", "PASSPORT", "ADMIN_CORRECTION"] as const;
export type DobSource = (typeof DOB_SOURCES)[number];

export const AUDIT_ACTIONS = [
  "LOGIN",
  "LOGIN_FAILED",
  "LOGOUT",
  "OTP_SENT",
  "REGISTRATION_STARTED",
  "IDENTITY_VERIFIED",
  "VERIFICATION_MISMATCH",
  "DUPLICATE_BLOCKED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_DELETED",
  "DOCUMENT_VIEWED",
  "REGISTRATION_SUBMITTED",
  "STATUS_CHANGED",
  "DOB_CHANGED",
  "MEASUREMENT_RECORDED",
  "WEIGH_IN_RECORDED",
  "PASSPORT_VERIFIED",
  "COLLEGE_CONFIRMED",
  "QR_ISSUED",
  "QR_SCANNED",
  "SETTINGS_CHANGED",
  "STAFF_CHANGED",
  "DELETION_REQUESTED",
  "DELETION_COMPLETED",
  "DELETION_DECLINED",
  "DATA_EXPORTED",
  "RETENTION_PURGE",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const WIZARD_STEPS = [
  { id: "identity", label: "Identity" },
  { id: "selfie", label: "Selfie" },
  { id: "personal", label: "Personal" },
  { id: "academic", label: "Academic" },
  { id: "sports", label: "Sports" },
  { id: "medical", label: "Medical & consent" },
  { id: "review", label: "Review" },
] as const;
export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}
export function isStudentType(v: string): v is StudentType {
  return (STUDENT_TYPES as readonly string[]).includes(v);
}
export function isDocType(v: string): v is DocType {
  return (DOC_TYPES as readonly string[]).includes(v);
}
export function isStaffRole(v: string): v is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(v);
}
