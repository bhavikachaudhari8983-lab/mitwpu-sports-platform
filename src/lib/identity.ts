import { createHash } from "node:crypto";
import { normaliseName } from "./utils";

const SALT = "srp-identity-v1";

function sha256(s: string): string {
  return createHash("sha256").update(`${SALT}|${s}`).digest("hex");
}

/** Indian students: masked Aadhaar (last 4) + name + DOB hash. */
export function indianIdentityKey(aadhaarLast4: string, name: string, dob: string): string {
  return sha256(`IN|${aadhaarLast4}|${normaliseName(name)}|${sha256(dob)}`);
}

/** International students: passport number (+ issuing country). */
export function passportIdentityKey(nationality: string, passportNumber: string): string {
  return sha256(`PP|${nationality.toUpperCase()}|${passportNumber.toUpperCase().replace(/\s/g, "")}`);
}
