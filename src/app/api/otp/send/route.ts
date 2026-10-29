import { route, parseJson, ok, clientIp, ApiError } from "@/lib/api";
import { sendOtpSchema } from "@/lib/validation/auth";
import { createOtpChallenge } from "@/lib/otp";
import { audit } from "@/lib/audit";
import { erpService } from "@/services";
import { maskEmail, maskPhone } from "@/lib/utils";

/** Public: sends a one-time code. Path A sends to the contact stored in the ERP, never one typed by the student. */
export const POST = route(async (req) => {
  const input = await parseJson(req, sendOtpSchema);
  const ip = clientIp(req);

  let target: string;
  let channel: "SMS" | "EMAIL";
  if (input.path === "A") {
    const erp = await erpService.findStudentByPrn(input.prn);
    if (!erp) throw new ApiError(404, "Not a registered student of this university.");
    channel = input.channel;
    target = channel === "SMS" ? erp.phone : erp.email;
  } else if (input.path === "B") {
    channel = "SMS";
    target = input.mobile;
  } else if (input.channel === "EMAIL") {
    channel = "EMAIL";
    target = input.email;
  } else {
    channel = "SMS";
    target = input.mobile;
  }

  const meta = input.path === "A" ? { path: "A" as const, prn: input.prn } : { path: input.path };
  const { challengeId, demoCode } = await createOtpChallenge({ target, channel, meta, ip });
  const masked = channel === "SMS" ? maskPhone(target) : maskEmail(target);
  await audit({ actor: { type: "SYSTEM" }, action: "OTP_SENT", summary: `OTP sent by ${channel === "SMS" ? "SMS" : "email"} to ${masked} (${input.path === "LOGIN" ? "status login" : `registration path ${input.path}`})`, ip });
  return ok({ challengeId, maskedTarget: masked, channel, demoCode });
});
