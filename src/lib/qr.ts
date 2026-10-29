import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { UNIVERSITY_SHORT } from "./constants";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateSportsId(): string {
  const yy = new Date().getFullYear().toString().slice(-2);
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `${UNIVERSITY_SHORT}-${yy}-${code}`;
}

function secret(): string {
  const s = process.env.QR_SIGNING_SECRET;
  if (!s) throw new Error("QR_SIGNING_SECRET is not set");
  return s;
}

function sign(sportsId: string): string {
  return createHmac("sha256", secret()).update(sportsId).digest("base64url").slice(0, 22);
}

/** Content encoded in the QR. Signed so a forged/printed QR cannot pass as valid. */
export function qrPayload(sportsId: string): string {
  return `SRP1:${sportsId}:${sign(sportsId)}`;
}

export function verifyQrPayload(payload: string): { ok: true; sportsId: string } | { ok: false; reason: string } {
  const parts = payload.trim().split(":");
  if (parts.length !== 3 || parts[0] !== "SRP1") return { ok: false, reason: "Not a Sports ID QR code" };
  const [, sportsId, sig] = parts;
  const expected = Buffer.from(sign(sportsId));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "QR signature invalid — possible forgery" };
  return { ok: true, sportsId };
}
