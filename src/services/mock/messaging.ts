import type { MessagingService } from "../types";
import { simulateLatency } from "./latency";

/** Pretends to send SMS / WhatsApp broadcasts. Swap for a real provider (e.g. an SMS gateway or WhatsApp Business API). */
export const mockMessagingService: MessagingService = {
  async broadcast({ channel, to, text }) {
    await simulateLatency(100, 300);
    if (process.env.NODE_ENV !== "production") console.info(`[mock-${channel.toLowerCase()}] ${to.length} recipients: ${text.slice(0, 60)}`);
    return { accepted: to.length };
  },
};
