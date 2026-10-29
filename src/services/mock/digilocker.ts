import { randomInt, randomUUID } from "node:crypto";
import { ServiceError, type DigiLockerService } from "../types";
import { DIGILOCKER_ACCOUNTS } from "./data/digilocker-accounts";
import { placeholderPortrait } from "@/lib/placeholder-image";
import { samplePdf } from "@/lib/placeholder-pdf";
import { maskPhone } from "@/lib/utils";
import { isDemoMode } from "@/lib/env";
import { simulateLatency } from "./latency";

type Pending = { aadhaar: string; otp: string; expiresAt: number; attempts: number };

// The real provider keeps this state on its side; the mock keeps it in memory (survives dev hot-reload).
const store = ((globalThis as unknown as { __mockDigiLocker?: Map<string, Pending> }).__mockDigiLocker ??= new Map());

export const mockDigiLockerService: DigiLockerService = {
  async startConsent({ aadhaarNumber }) {
    await simulateLatency();
    const aadhaar = aadhaarNumber.replace(/\D/g, "");
    if (aadhaar.length !== 12) throw new ServiceError("INVALID_AADHAAR", "Enter a 12-digit Aadhaar number.");
    const acct = DIGILOCKER_ACCOUNTS.find((a) => a.aadhaar === aadhaar);
    if (!acct) throw new ServiceError("NO_ACCOUNT", "No DigiLocker account is linked to this Aadhaar number.");
    const requestId = randomUUID();
    const otp = String(randomInt(100000, 1000000));
    store.set(requestId, { aadhaar, otp, expiresAt: Date.now() + 10 * 60_000, attempts: 0 });
    return { requestId, maskedMobile: maskPhone(acct.mobile), demoOtp: isDemoMode() ? otp : undefined };
  },

  async completeConsent({ requestId, otp }) {
    await simulateLatency(400, 900);
    const p = store.get(requestId);
    if (!p || p.expiresAt < Date.now()) throw new ServiceError("EXPIRED", "DigiLocker session expired. Please start again.");
    p.attempts++;
    if (p.attempts > 5) {
      store.delete(requestId);
      throw new ServiceError("TOO_MANY_ATTEMPTS", "Too many wrong OTP attempts. Please start again.");
    }
    if (p.otp !== otp.trim()) throw new ServiceError("WRONG_OTP", "Incorrect DigiLocker OTP.");
    store.delete(requestId);

    const acct = DIGILOCKER_ACCOUNTS.find((a) => a.aadhaar === p.aadhaar);
    if (!acct) throw new ServiceError("NO_ACCOUNT", "DigiLocker account not found.");
    return {
      name: acct.name,
      dob: acct.dob,
      gender: acct.gender,
      aadhaarLast4: acct.aadhaar.slice(-4),
      address: acct.address,
      photo: { data: placeholderPortrait(acct.aadhaar, "official"), mimeType: "image/png", fileName: "digilocker-photo.png" },
      class10Certificate: {
        data: await samplePdf("Class X Certificate (DigiLocker mock)", [
          `Name: ${acct.name}`,
          `Date of birth: ${acct.dob}`,
          `Board: ${acct.class10.board}`,
          `School: ${acct.class10.school}`,
          `Roll no: ${acct.class10.rollNo}`,
          `Year of passing: ${acct.class10.year}`,
        ]),
        mimeType: "application/pdf",
        fileName: "class10-certificate.pdf",
      },
    };
  },
};
