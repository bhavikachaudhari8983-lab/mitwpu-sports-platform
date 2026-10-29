// ICAO 9303 TD3 (passport) machine-readable zone — line 2 helpers.
// Line 2 layout (44 chars): number(9) chk nationality(3) dob(6) chk sex expiry(6) chk personal(14) chk composite

function charValue(ch: string): number {
  if (ch === "<") return 0;
  if (/[0-9]/.test(ch)) return Number(ch);
  if (/[A-Z]/.test(ch)) return ch.charCodeAt(0) - 55; // A=10
  return -1;
}

export function checkDigit(s: string): string {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const v = charValue(s[i]);
    if (v < 0) return "?";
    sum += v * weights[i % 3];
  }
  return String(sum % 10);
}

const pad = (s: string, n: number) => (s + "<".repeat(n)).slice(0, n);
const yymmdd = (iso: string) => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);

export function buildMrzLine2(p: { passportNumber: string; nationality: string; dob: string; gender: "MALE" | "FEMALE" | "OTHER"; expiry: string }): string {
  const num = pad(p.passportNumber.toUpperCase(), 9);
  const dob = yymmdd(p.dob);
  const exp = yymmdd(p.expiry);
  const personal = "<".repeat(14);
  const sex = p.gender === "MALE" ? "M" : p.gender === "FEMALE" ? "F" : "<";
  const part1 = num + checkDigit(num);
  const part2 = dob + checkDigit(dob);
  const part3 = exp + checkDigit(exp);
  const part4 = personal + checkDigit(personal);
  const composite = checkDigit(part1 + part2 + part3 + part4);
  return part1 + p.nationality.toUpperCase() + part2 + sex + part3 + part4 + composite;
}

export type MrzCheck = {
  valid: boolean;
  problems: string[];
};

/** Validates all check digits AND that the MRZ agrees with the values the student typed. */
export function validateMrzLine2(line: string, entered: { passportNumber: string; nationality: string; dob: string; expiry: string }): MrzCheck {
  const problems: string[] = [];
  const l = line.toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z0-9<]{44}$/.test(l)) return { valid: false, problems: ["MRZ line 2 must be exactly 44 characters (A–Z, 0–9, <)"] };

  const num = l.slice(0, 9);
  const dob = l.slice(13, 19);
  const exp = l.slice(21, 27);
  if (checkDigit(num) !== l[9]) problems.push("Passport number check digit is wrong");
  if (checkDigit(dob) !== l[19]) problems.push("Date of birth check digit is wrong");
  if (checkDigit(exp) !== l[27]) problems.push("Expiry date check digit is wrong");
  const personal = l.slice(28, 42);
  if (l[42] !== "<" || personal !== "<".repeat(14)) {
    if (checkDigit(personal) !== l[42]) problems.push("Personal number check digit is wrong");
  }
  const composite = l.slice(0, 10) + l.slice(13, 20) + l.slice(21, 43);
  if (checkDigit(composite) !== l[43]) problems.push("Composite check digit is wrong");

  if (num.replace(/</g, "") !== entered.passportNumber.toUpperCase().replace(/\s/g, "")) problems.push("Passport number does not match the MRZ");
  if (l.slice(10, 13) !== entered.nationality.toUpperCase()) problems.push("Nationality does not match the MRZ");
  if (dob !== yymmdd(entered.dob)) problems.push("Date of birth does not match the MRZ");
  if (exp !== yymmdd(entered.expiry)) problems.push("Expiry date does not match the MRZ");

  return { valid: problems.length === 0, problems };
}
