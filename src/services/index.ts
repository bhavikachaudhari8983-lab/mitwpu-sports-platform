// ┌──────────────────────────────────────────────────────────────────────────┐
// │ Service registry — the ONLY place that decides which implementation runs. │
// │ To go live, write a class implementing the interface in ./types.ts and    │
// │ swap the mock here. Nothing else in the app needs to change.              │
// └──────────────────────────────────────────────────────────────────────────┘
import type { DigiLockerService, ErpService, InternationalAdmissionsService, OtpDeliveryService, PassportVerificationService } from "./types";
import { mockErpService } from "./mock/erp";
import { mockDigiLockerService } from "./mock/digilocker";
import { mockOtpDeliveryService } from "./mock/otp-delivery";
import { mockPassportService } from "./mock/passport";
import { mockAdmissionsService } from "./mock/admissions";

export const erpService: ErpService = mockErpService;
export const digiLockerService: DigiLockerService = mockDigiLockerService;
export const otpDeliveryService: OtpDeliveryService = mockOtpDeliveryService;
export const passportService: PassportVerificationService = mockPassportService;
export const admissionsService: InternationalAdmissionsService = mockAdmissionsService;

export { ServiceError } from "./types";
export type * from "./types";
