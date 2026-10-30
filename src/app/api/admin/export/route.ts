import { route, clientIp, ApiError } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { parseFilters, studentWhere } from "@/lib/admin-queries";
import { getSettings } from "@/lib/settings";
import { ageCategoryFor } from "@/lib/age";
import { maskEmail, maskPhone } from "@/lib/utils";

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=@\t\r]/.test(s) || /^[+-](?!\d)/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV of the filtered list. Excludes Aadhaar digits, medical conditions and documents by design.
 * The default ("safe") export also leaves out DOB and masks contact details; `full=1` needs a written reason.
 */
export const GET = route(async (req) => {
  const staff = await requireStaffApi(["ADMIN"]);
  const sp = new URL(req.url).searchParams;
  const f = parseFilters(Object.fromEntries(sp));
  const full = sp.get("full") === "1";
  const reason = sp.get("reason")?.trim() ?? "";
  if (full && reason.length < 10) throw new ApiError(400, "Give a reason for exporting personal data (at least 10 characters).");
  const [rows, settings, cats] = await Promise.all([
    prisma.student.findMany({
      where: await studentWhere(f),
      orderBy: { submittedAt: "desc" },
      include: { registrations: { include: { event: { include: { sport: true } }, weightCategory: true } }, measurements: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    getSettings(),
    prisma.ageCategory.findMany(),
  ]);
  const header = ["Sports ID", "Status", "Name", "Student type", "University/College", "PRN", "Nationality", "Gender", ...(full ? ["DOB"] : []), "Age category", "Events", "Height cm", "Weight kg", "Mobile", "Email", "Submitted", "Status reason"];
  const lines = [header.join(",")];
  for (const s of rows) {
    lines.push(
      [
        s.sportsId, s.status, s.fullName, s.studentType, s.universityName, s.prn, s.nationality, s.gender, ...(full ? [s.dob] : []),
        ageCategoryFor(s.dob, settings.ageCutoffDate, cats),
        s.registrations.map((r) => `${r.event.sport.name}: ${r.event.name}${r.weightCategory ? ` (${r.weightCategory.name})` : ""}`).join("; "),
        s.measurements[0]?.heightCm, s.measurements[0]?.weightKg,
        full ? s.mobile : s.mobile && maskPhone(s.mobile), full ? s.email : s.email && maskEmail(s.email), s.submittedAt?.toISOString(), s.statusReason,
      ].map(csvCell).join(","),
    );
  }
  await audit({ actor: staffActor(staff), action: "DATA_EXPORTED", summary: `Exported ${rows.length} registrations to CSV (${full ? `FULL personal data. Reason: ${reason}` : "safe: no DOB, masked contacts"})`, details: { filters: f, full, reason: full ? reason : undefined }, ip: clientIp(req) });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="registrations-${full ? "full-CONFIDENTIAL" : "safe"}-${stamp}.csv"`, "Cache-Control": "no-store" },
  });
});
