type EventDef = { name: string; gender: "MALE" | "FEMALE" | "MIXED"; date: string; venue: string; min?: number; max?: number; age?: string };
type SportDef = {
  name: string;
  isTeam?: boolean;
  weight?: { MALE: number[]; FEMALE: number[]; heavyOpen?: boolean };
  positions?: string;
  events: EventDef[];
};

const MW = (base: string, date: string, venue: string, limits: Pick<EventDef, "min" | "max" | "age"> = {}): EventDef[] => [
  { name: `${base} — Men`, gender: "MALE", date, venue, ...limits },
  { name: `${base} — Women`, gender: "FEMALE", date, venue, ...limits },
];

export const SPORTS: SportDef[] = [
  { name: "Cricket", isTeam: true, positions: "Batter,Bowler,All-rounder,Wicket-keeper", events: MW("T20", "2026-12-03", "Main Cricket Ground", { min: 11, max: 16 }) },
  { name: "Football", isTeam: true, positions: "Goalkeeper,Defender,Midfielder,Forward", events: [...MW("11-a-side", "2026-12-04", "Turf Field A", { min: 11, max: 20 })] },
  { name: "Basketball", isTeam: true, positions: "Point guard,Shooting guard,Small forward,Power forward,Center", events: MW("5x5", "2026-12-05", "Indoor Court 1", { min: 5, max: 12 }) },
  { name: "Volleyball", isTeam: true, positions: "Setter,Libero,Outside hitter,Middle blocker,Opposite", events: MW("Indoor", "2026-12-05", "Indoor Court 2", { min: 6, max: 12 }) },
  {
    name: "Athletics",
    events: [
      ...MW("100 m", "2026-12-06", "Athletics Track", { max: 32 }),
      ...MW("200 m (U-23)", "2026-12-06", "Athletics Track", { max: 24, age: "U-23" }),
      ...MW("400 m", "2026-12-06", "Athletics Track"),
      ...MW("Long jump", "2026-12-07", "Jumping Pit"),
      ...MW("Shot put", "2026-12-07", "Throws Area"),
    ],
  },
  { name: "Badminton", events: [...MW("Singles", "2026-12-08", "Badminton Hall"), { name: "Mixed doubles", gender: "MIXED", date: "2026-12-09", venue: "Badminton Hall" }] },
  { name: "Table Tennis", events: MW("Singles", "2026-12-08", "TT Hall") },
  { name: "Kabaddi", isTeam: true, positions: "Raider,Defender,All-rounder", events: MW("Team", "2026-12-09", "Kabaddi Mat Area", { min: 7, max: 12 }) },
  { name: "Kho-Kho", isTeam: true, positions: "Chaser,Runner,All-rounder", events: MW("Team", "2026-12-10", "Kho-Kho Ground", { min: 9, max: 15 }) },
  { name: "Wrestling", weight: { MALE: [57, 65, 74, 86, 97, 125], FEMALE: [50, 53, 57, 62, 68, 76] }, events: MW("Freestyle", "2026-12-11", "Wrestling Hall") },
  { name: "Boxing", weight: { MALE: [51, 57, 63.5, 71, 80, 92], FEMALE: [50, 54, 57, 60, 66, 75], heavyOpen: true }, events: MW("Boxing", "2026-12-12", "Boxing Arena") },
  { name: "Judo", weight: { MALE: [60, 66, 73, 81, 90, 100], FEMALE: [48, 52, 57, 63, 70, 78], heavyOpen: true }, events: MW("Judo", "2026-12-12", "Combat Hall") },
  { name: "Weightlifting", weight: { MALE: [60, 65, 71, 79, 88, 94, 110], FEMALE: [48, 53, 58, 63, 69, 77, 86], heavyOpen: true }, events: MW("Weightlifting", "2026-12-13", "Strength Hall") },
  { name: "Chess", events: [{ name: "Rapid — Open", gender: "MIXED", date: "2026-12-03", venue: "Seminar Hall", max: 64 }] },
  { name: "Swimming", events: [...MW("50 m freestyle", "2026-12-14", "Aquatic Centre"), ...MW("100 m breaststroke", "2026-12-14", "Aquatic Centre")] },
];

export function weightClasses(limits: number[], heavyOpen: boolean) {
  const out: Array<{ name: string; minKg: number | null; maxKg: number | null }> = [];
  let prev: number | null = null;
  for (const l of limits) {
    out.push({ name: `−${l} kg`, minKg: prev, maxKg: l });
    prev = l;
  }
  if (heavyOpen) out.push({ name: `+${limits[limits.length - 1]} kg`, minKg: limits[limits.length - 1], maxKg: null });
  return out;
}
