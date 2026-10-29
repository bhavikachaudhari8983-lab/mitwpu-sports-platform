import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { isStatus, isStudentType } from "./constants";

export type StudentFilters = { q?: string; status?: string; sport?: string; type?: string; college?: string; page?: number };

export function parseFilters(sp: Record<string, string | string[] | undefined>): StudentFilters {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : undefined) || undefined;
  return { q: one("q"), status: one("status"), sport: one("sport"), type: one("type"), college: one("college"), page: Math.max(1, Number(one("page") ?? 1) || 1) };
}

export function studentWhere(f: StudentFilters): Prisma.StudentWhereInput {
  const and: Prisma.StudentWhereInput[] = [];
  // Drafts are excluded unless explicitly requested.
  and.push(f.status && isStatus(f.status) ? { status: f.status } : { status: { not: "DRAFT" } });
  if (f.type && isStudentType(f.type)) and.push({ studentType: f.type });
  if (f.sport) and.push({ registrations: { some: { event: { sportId: f.sport } } } });
  if (f.college) and.push({ universityName: { contains: f.college } });
  if (f.q) {
    const q = f.q;
    and.push({ OR: [{ fullName: { contains: q } }, { prn: { contains: q.toUpperCase() } }, { passportNumber: { contains: q.toUpperCase() } }, { sportsId: { contains: q.toUpperCase() } }, { mobile: { contains: q } }, { email: { contains: q.toLowerCase() } }] });
  }
  return { AND: and };
}

export const PAGE_SIZE = 20;

export async function listStudents(f: StudentFilters) {
  const where = studentWhere(f);
  const [rows, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      skip: ((f.page ?? 1) - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { registrations: { include: { event: { include: { sport: true } } } }, college: true },
    }),
    prisma.student.count({ where }),
  ]);
  return { rows, total };
}

export async function dashboardStats() {
  const [byStatus, byType, sports, regs] = await Promise.all([
    prisma.student.groupBy({ by: ["status"], _count: true }),
    prisma.student.groupBy({ by: ["studentType"], where: { status: { not: "DRAFT" } }, _count: true }),
    prisma.sport.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.registration.findMany({ where: { student: { status: { not: "DRAFT" } } }, select: { studentId: true, event: { select: { sportId: true } }, student: { select: { status: true } } } }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  // Distinct students per sport (a student in two events of one sport counts once).
  const bySport = sports.map((sp) => {
    const rs = regs.filter((r) => r.event.sportId === sp.id);
    const all = new Set(rs.map((r) => r.studentId)).size;
    const approved = new Set(rs.filter((r) => r.student.status === "APPROVED").map((r) => r.studentId)).size;
    return { id: sp.id, name: sp.name, total: all, approved };
  });
  return {
    total: byStatus.filter((b) => b.status !== "DRAFT").reduce((a, b) => a + b._count, 0),
    drafts: count("DRAFT"),
    pending: count("PENDING"),
    verified: count("VERIFIED"),
    flagged: count("FLAGGED"),
    approved: count("APPROVED"),
    rejected: count("REJECTED"),
    byType: byType.map((t) => ({ type: t.studentType, count: t._count })),
    bySport,
  };
}
