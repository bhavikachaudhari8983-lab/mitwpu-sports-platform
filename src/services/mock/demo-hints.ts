// Data for the on-screen "Demo helper" panels. Only exposed when DEMO_MODE is on.
import { ERP_STUDENTS } from "./data/erp-students";
import { DIGILOCKER_ACCOUNTS, DUPLICATE_TEST_AADHAAR } from "./data/digilocker-accounts";
import { DEMO_PASSPORTS } from "./data/international";
import { buildMrzLine2 } from "@/lib/mrz";

export type DemoHints = {
  erp: Array<{ prn: string; name: string; note?: string; aadhaar: string }>;
  outside: Array<{ aadhaar: string; label: string; mobile: string }>;
  duplicateAadhaar: string;
  passports: Array<{ passportNumber: string; nationality: string; dob: string; expiry: string; gender: string; mrzLine2: string; label: string }>;
};

export function getDemoHints(): DemoHints {
  return {
    erp: ERP_STUDENTS.map((s) => ({ prn: s.prn, name: s.name, note: s.note, aadhaar: s.demoAadhaar })),
    outside: DIGILOCKER_ACCOUNTS.filter((a) => a.aadhaar.startsWith("00002")).map((a) => ({ aadhaar: a.aadhaar, label: a.label, mobile: a.mobile })),
    duplicateAadhaar: DUPLICATE_TEST_AADHAAR,
    passports: DEMO_PASSPORTS.map((p) => ({
      passportNumber: p.passportNumber,
      nationality: p.nationality,
      dob: p.dob,
      expiry: p.expiry,
      gender: p.gender,
      mrzLine2: buildMrzLine2(p),
      label: p.label,
    })),
  };
}
