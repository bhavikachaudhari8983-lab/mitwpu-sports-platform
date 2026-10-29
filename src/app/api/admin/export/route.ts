import { route, clientIp } from "@/lib/api";
import { requireStaffApi, staffActor } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { parseFilters, studentWhere } from "@/lib/admin-queries";
import { getSettings } from "@/lib/settings";
import { ageCategoryFor } from "@/lib/age";

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=@\t\r]/.test(s) || /^[+-](?!\d)/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV of the filtered list. Excludes Aadhaar digits, medical conditions and documents by design. */
export const GET = route(async (req) => {
  const staff = await requireStaffApi(["ADMIN"]);
  const f = parseFilters(Object.fromEntries(new URL(req.url).searchParams));
  const [rows, settings, cats] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere(f),
      orderBy: { submittedAt: "desc" },
      include: { registrations: { include: { event: { include: { sport: true } }, weightCategory: true } }, measurements: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    getSettings(),
    prisma.ageCategory.findMany(),
  ]);
  const header = ["Sports ID", "Status", "Name", "Student type", "University/College", "PRN", "Nationality", "Gender", "DOB", "Age category", "Events", "Height cm", "Weight kg", "Mobile", "Email", "Submitted", "Status reason"];
  const lines = [header.join(",")];
  for (const s of rows) {
    lines.push(
      [
        s.sportsId, s.status, s.fullName, s.studentType, s.universityName, s.prn, s.nationality, s.gender, s.dob,
        ageCategoryFor(s.dob, settings.ageCutoffDate, cats),
        s.registrations.map((r) => `${r.event.sport.name}: ${r.event.name}${r.weightCategory ? ` (${r.weightCategory.name})` : ""}`).join("; "),
        s.measurements[0]?.heightCm, s.measurements[0]?.weightKg, s.mobile, s.email, s.submittedAt?.toISOString(), s.statusReason,
      ].map(csvCell).join(","),
    );
  }
  await audit({ actor: staffActor(staff), action: "DATA_EXPORTED", summary: `Exported ${rows.length} registrations to CSV`, details: { filters: f }, ip: clientIp(req) });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="registrations-${stamp}.csv"`, "Cache-Control": "no-store" },
  });
});
