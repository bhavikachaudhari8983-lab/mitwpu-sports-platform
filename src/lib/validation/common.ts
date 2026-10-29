import { z } from "zod";
import { BLOOD_GROUPS, GENDERS } from "@/lib/constants";

/** Indian mobile → normalised "+91XXXXXXXXXX". */
export const indianMobile = z
  .string({ error: "Enter your mobile number" })
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+91|91|0)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"))
  .transform((s) => `+91${s.slice(-10)}`);

/** Any international number in E.164-ish form → "+<digits>". */
export const anyMobile = z
  .string({ error: "Enter your mobile number" })
  .transform((s) => s.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{8,15}$/, "Enter a valid mobile number with country code, e.g. +9779812345678"))
  .transform((s) => (s.startsWith("+") ? s : `+${s}`));

export const email = z
  .string({ error: "Enter your email address" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(120));

export const prn = z
  .string({ error: "Enter your PRN / enrollment number" })
  .trim()
  .toUpperCase()
  .pipe(z.string().regex(/^[A-Z0-9/-]{5,20}$/, "PRN should be 5–20 letters or digits"));

export const aadhaar = z
  .string({ error: "Enter your Aadhaar number" })
  .transform((s) => s.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{12}$/, "Aadhaar number must be 12 digits"));

export const otpCode = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date").refine((s) => !Number.isNaN(Date.parse(s)), "Enter a valid date");

export const passportNumber = z
  .string({ error: "Enter your passport number" })
  .trim()
  .toUpperCase()
  .transform((s) => s.replace(/\s/g, ""))
  .pipe(z.string().regex(/^[A-Z0-9]{6,9}$/, "Passport number is 6–9 letters/digits"));

export const nationality = z.string().trim().toUpperCase().pipe(z.string().regex(/^[A-Z]{3}$/, "Choose a nationality"));

export const personName = z.string().trim().min(2, "Enter a name").max(80, "Name is too long").regex(/^[\p{L} .'-]+$/u, "Use letters only");

export const gender = z.enum(GENDERS, { error: "Choose a gender" });
export const bloodGroup = z.enum(BLOOD_GROUPS, { error: "Choose a blood group" });
