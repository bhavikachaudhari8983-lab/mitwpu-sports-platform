/** Whole years between dob (YYYY-MM-DD) and on (YYYY-MM-DD). */
export function ageOn(dob: string, on: string): number {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [y, m, d] = on.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}

export function todayIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export type AgeCategoryLike = { name: string; maxAge: number | null; sortOrder: number };

/**
 * Picks the youngest category the athlete is eligible for, using age on the cutoff date.
 * Eligible for "U-19" if age < 19 on the cutoff date. Never chosen by the student.
 */
export function ageCategoryFor(dob: string | null | undefined, cutoffDate: string, categories: AgeCategoryLike[]): string | null {
  if (!dob) return null;
  const age = ageOn(dob, cutoffDate);
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const c of sorted) {
    if (c.maxAge === null || age < c.maxAge) return c.name;
  }
  return null;
}

export function isMinor(dob: string | null | undefined): boolean {
  return !!dob && ageOn(dob, todayIso()) < 18;
}
