import { z } from "zod";
import { aadhaar, anyMobile, bloodGroup, email, isoDate, nationality, passportNumber, personName } from "./common";

export const digiLockerStartSchema = z.object({ aadhaarNumber: aadhaar });
export const digiLockerCompleteSchema = z.object({ requestId: z.string().uuid(), otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit DigiLocker OTP") });

export const passportSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your name exactly as on the passport").max(80).regex(/^[\p{L} .'-]+$/u, "Use letters only"),
    passportNumber,
    nationality,
    dob: isoDate,
    expiry: isoDate,
    mrzLine2: z
      .string()
      .transform((s) => s.toUpperCase().replace(/\s/g, ""))
      .pipe(z.string().length(44, "MRZ line 2 must be exactly 44 characters")),
    isOurUniversity: z.boolean(),
  })
  .refine((v) => v.expiry > new Date().toISOString().slice(0, 10), { path: ["expiry"], message: "This passport has expired" })
  .refine((v) => v.dob < new Date().toISOString().slice(0, 10), { path: ["dob"], message: "Date of birth must be in the past" });

// ---------- Form sections (draft: every field optional; submit: required) ----------

export const personalSchema = z.object({
  mobile: anyMobile,
  email,
  address: z.string().trim().min(10, "Enter your full address").max(300),
  bloodGroup,
  emergencyName: personName,
  emergencyPhone: anyMobile,
});

const ACADEMIC_YEARS = [1, 2, 3, 4, 5, 6] as const;

export const academicSchema = z.object({
  universityName: z.string().trim().min(3, "Enter your university / college").max(150),
  prn: z.string().trim().toUpperCase().regex(/^[A-Z0-9/-]{4,20}$/, "Enter your PRN / enrollment number"),
  course: z.string().trim().min(2, "Enter your course").max(100),
  year: z.coerce.number().int().refine((n) => (ACADEMIC_YEARS as readonly number[]).includes(n), "Choose your year"),
  apaarId: z
    .string()
    .trim()
    .transform((s) => s.replace(/\s/g, ""))
    .pipe(z.string().regex(/^(\d{12})?$/, "APAAR/ABC ID is 12 digits"))
    .optional(),
  collegeOfficeEmail: email.optional(),
});

export const registrationItem = z.object({
  eventId: z.string().min(1),
  weightCategoryId: z.string().min(1).nullable().optional(),
});

export const sportsSchema = z.object({
  registrations: z.array(registrationItem).min(1, "Choose at least one event").max(4, "You can enter at most 4 events"),
  playingPosition: z.string().trim().max(60).optional(),
});

export const medicalSchema = z.object({
  medicalConditions: z.string().trim().max(1000, "Keep this under 1000 characters").optional(),
  declarationAccepted: z.literal(true, { error: "You must accept the declaration" }),
  privacyAccepted: z.literal(true, { error: "You must accept the privacy notice" }),
});

export const DRAFT_SECTIONS = ["personal", "academic", "sports", "medical"] as const;
export type DraftSection = (typeof DRAFT_SECTIONS)[number];

/** Autosave payload. Fields are validated one by one so a half-typed value never blocks saving the rest. */
export const draftSchema = z.object({
  step: z.number().int().min(0).max(6).optional(),
  section: z.enum(DRAFT_SECTIONS).optional(),
  values: z.record(z.string(), z.unknown()).optional(),
});
export type DraftInput = z.infer<typeof draftSchema>;
