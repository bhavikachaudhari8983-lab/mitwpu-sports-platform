import { prisma } from "./prisma";

type RegIn = { eventId?: unknown; weightCategoryId?: unknown };
export type ValidReg = { eventId: string; weightCategoryId: string | null };

/**
 * Checks events exist, are active, match the athlete's verified gender, aren't duplicated,
 * and (for weight-category sports) carry a weight class of the same sport and gender.
 */
export async function validateRegistrations(input: unknown[], gender: string | null, opts: { requireWeight: boolean }) {
  const errors: Record<string, string> = {};
  const valid: ValidReg[] = [];
  const items = input.slice(0, 4) as RegIn[];
  if (input.length > 4) errors.registrations = "You can enter at most 4 events";

  const ids = items.map((i) => String(i.eventId ?? ""));
  const events = await prisma.event.findMany({ where: { id: { in: ids }, active: true }, include: { sport: { include: { weightCategories: true } } } });

  items.forEach((item, idx) => {
    const ev = events.find((e) => e.id === item.eventId);
    const key = `registrations.${idx}`;
    if (!ev || !ev.sport.active) return void (errors[key] = "This event is no longer available");
    if (valid.some((v) => v.eventId === ev.id)) return;
    if (gender && ev.gender !== "MIXED" && ev.gender !== gender) return void (errors[key] = `${ev.name} is not open to your category`);
    let weightCategoryId: string | null = null;
    if (ev.sport.isWeightCategory) {
      const wc = ev.sport.weightCategories.find((w) => w.id === item.weightCategoryId);
      if (wc && (wc.gender === gender || !gender)) weightCategoryId = wc.id;
      else if (opts.requireWeight) return void (errors[key] = `Choose a weight category for ${ev.name}`);
    }
    valid.push({ eventId: ev.id, weightCategoryId });
  });
  return { valid, errors };
}
