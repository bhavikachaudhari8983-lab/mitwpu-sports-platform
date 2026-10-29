import type { InternationalAdmissionsService } from "../types";
import { ADMISSIONS_RECORDS } from "./data/international";
import { simulateLatency } from "./latency";

export const mockAdmissionsService: InternationalAdmissionsService = {
  async findByPassport(passportNumber, nationality) {
    await simulateLatency();
    const num = passportNumber.toUpperCase().replace(/\s/g, "");
    const r = ADMISSIONS_RECORDS.find((a) => a.passportNumber === num && a.nationality === nationality.toUpperCase());
    return r ? { passportNumber: r.passportNumber, nationality: r.nationality, name: r.name, dob: r.dob, program: r.program, email: r.email } : null;
  },
};
