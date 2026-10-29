import { prisma } from "./prisma";

export type AppSettings = {
  ageCutoffDate: string; // age categories are calculated on this date
  retentionDays: number; // drafts/rejected records older than this are purged
  meetName: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  ageCutoffDate: "2026-12-01",
  retentionDays: 365,
  meetName: "Sports Sphere Inter-University Games 2026",
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    ageCutoffDate: map.get("ageCutoffDate") ?? DEFAULT_SETTINGS.ageCutoffDate,
    retentionDays: Number(map.get("retentionDays") ?? DEFAULT_SETTINGS.retentionDays),
    meetName: map.get("meetName") ?? DEFAULT_SETTINGS.meetName,
  };
}

export async function saveSettings(s: Partial<AppSettings>): Promise<void> {
  await prisma.$transaction(
    Object.entries(s).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } }),
    ),
  );
}
