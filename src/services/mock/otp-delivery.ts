import type { OtpDeliveryService } from "../types";
import { isDemoMode } from "@/lib/env";
import { simulateLatency } from "./latency";

/** Pretends to send an SMS/email. In demo mode the code is returned so the UI can show it. */
export const mockOtpDeliveryService: OtpDeliveryService = {
  async send({ channel, to, code, purpose }) {
    await simulateLatency(150, 400);
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mock-otp] ${channel} to ${to.slice(0, 3)}… for ${purpose}: ${code}`);
    }
    return { delivered: true, demoCode: isDemoMode() ? code : undefined };
  },
};
