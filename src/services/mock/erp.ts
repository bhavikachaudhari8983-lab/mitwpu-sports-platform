import type { ErpService, ErpStudent } from "../types";
import { ERP_STUDENTS } from "./data/erp-students";
import { placeholderPortrait } from "@/lib/placeholder-image";
import { simulateLatency } from "./latency";

export const mockErpService: ErpService = {
  async findStudentByPrn(prn) {
    await simulateLatency();
    const r = ERP_STUDENTS.find((s) => s.prn === prn.trim().toUpperCase());
    if (!r) return null;
    const student: ErpStudent = { prn: r.prn, name: r.name, dob: r.dob, gender: r.gender, phone: r.phone, email: r.email, course: r.course, year: r.year };
    return student;
  },
  async getStudentPhoto(prn) {
    const r = ERP_STUDENTS.find((s) => s.prn === prn.trim().toUpperCase());
    if (!r) return null;
    return { data: placeholderPortrait(r.demoAadhaar, "official"), mimeType: "image/png", fileName: "erp-photo.png" };
  },
};
