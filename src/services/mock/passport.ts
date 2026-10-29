import type { PassportVerificationService } from "../types";
import { validateMrzLine2 } from "@/lib/mrz";
import { placeholderPortrait } from "@/lib/placeholder-image";
import { simulateLatency } from "./latency";

export const mockPassportService: PassportVerificationService = {
  async verifyMrz(input) {
    await simulateLatency();
    return validateMrzLine2(input.mrzLine2, input);
  },
  async getReferencePhoto({ passportNumber }) {
    return { data: placeholderPortrait(passportNumber.toUpperCase(), "official"), mimeType: "image/png", fileName: "passport-chip-photo.png" };
  },
};
