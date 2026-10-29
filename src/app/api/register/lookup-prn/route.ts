import { route, parseJson, ok, clientIp, ApiError } from "@/lib/api";
import { prnLookupSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/rate-limit";
import { erpService } from "@/services";
import { maskEmail, maskPhone } from "@/lib/utils";

/** Public: confirms a PRN exists and returns ONLY masked contact details. */
export const POST = route(async (req) => {
  const limit = rateLimit(`prn:${clientIp(req)}`, 20, 10 * 60_000);
  if (!limit.ok) throw new ApiError(429, "Too many lookups. Please wait a few minutes.");
  const { prn } = await parseJson(req, prnLookupSchema);
  const erp = await erpService.findStudentByPrn(prn);
  if (!erp) throw new ApiError(404, "Not a registered student of this university.");
  return ok({ prn: erp.prn, maskedPhone: maskPhone(erp.phone), maskedEmail: maskEmail(erp.email) });
});
