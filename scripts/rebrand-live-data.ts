/**
 * One-off (25 Nov 2026): rename Sports Sphere → MIT-WPU Department of Sports in an existing database, in place.
 * Renames only; deletes nothing. The audit log and issued certificates are left untouched on purpose: the audit log
 * is the permanent record, and certificate titles are signed.
 *
 *   tsx scripts/rebrand-live-data.ts            # dry run: prints what would change
 *   tsx scripts/rebrand-live-data.ts --apply    # makes the changes in one transaction
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const OLD_DOMAIN = "sportssphere.example";
const NEW_DOMAIN = "mitwpu.example";
const text = (s: string) =>
  s
    .replaceAll("Sports Sphere Inter-University Games", "MIT-WPU Inter-University Games")
    .replaceAll("SPORTS SPHERE", "MIT-WPU")
    .replaceAll("Sports Sphere", "MIT-WPU")
    .replaceAll(OLD_DOMAIN, NEW_DOMAIN);

async function main() {
  const ops: Array<ReturnType<typeof prisma.staffUser.update> | ReturnType<typeof prisma.$executeRaw>> = [];
  const log: string[] = [];

  const staff = await prisma.staffUser.findMany({ where: { email: { contains: OLD_DOMAIN } }, select: { id: true, email: true } });
  for (const s of staff) {
    const email = s.email.replace(OLD_DOMAIN, NEW_DOMAIN);
    if (await prisma.staffUser.findUnique({ where: { email } })) throw new Error(`Staff email ${email} already exists`);
    ops.push(prisma.staffUser.update({ where: { id: s.id }, data: { email } }));
  }
  log.push(`staff emails: ${staff.length}`);

  const students = await prisma.student.findMany({
    where: { OR: [{ email: { contains: OLD_DOMAIN } }, { collegeOfficeEmail: { contains: OLD_DOMAIN } }, { universityName: "Host University" }] },
    select: { id: true, email: true, collegeOfficeEmail: true, universityName: true },
  });
  for (const s of students) {
    ops.push(
      prisma.student.update({
        where: { id: s.id },
        data: {
          email: s.email ? s.email.replace(OLD_DOMAIN, NEW_DOMAIN) : s.email,
          collegeOfficeEmail: s.collegeOfficeEmail ? s.collegeOfficeEmail.replace(OLD_DOMAIN, NEW_DOMAIN) : s.collegeOfficeEmail,
          universityName: s.universityName === "Host University" ? "MIT World Peace University" : s.universityName,
        },
      }) as never,
    );
  }
  log.push(`students (emails / "Host University"): ${students.length}`);

  const settings = (await prisma.setting.findMany()).filter((r) => text(r.value) !== r.value);
  for (const r of settings) ops.push(prisma.setting.update({ where: { key: r.key }, data: { value: text(r.value) } }) as never);
  log.push(`settings: ${settings.map((r) => `${r.key}="${r.value}" → "${text(r.value)}"`).join("; ") || 0}`);

  const tournaments = (await prisma.tournament.findMany()).filter((t) => text(t.name) !== t.name || t.slug.includes("sports-sphere"));
  for (const t of tournaments) {
    ops.push(prisma.tournament.update({ where: { id: t.id }, data: { name: text(t.name), slug: t.slug.replace("sports-sphere", "mitwpu") } }) as never);
  }
  log.push(`tournaments: ${tournaments.map((t) => `"${t.name}" → "${text(t.name)}"`).join("; ") || 0}`);

  // Issued certificates are NOT renamed: their title is covered by the HMAC signature, so editing it would make
  // genuine certificates fail verification. They stay as issued; new certificates carry the new name.
  const certs = await prisma.certificate.count({ where: { title: { contains: "Sports Sphere" } } });
  log.push(`certificates left as issued (old name in title): ${certs}`);

  const anns = (await prisma.announcement.findMany({ select: { id: true, title: true, body: true } })).filter((a) => text(a.title) !== a.title || text(a.body) !== a.body);
  for (const a of anns) ops.push(prisma.announcement.update({ where: { id: a.id }, data: { title: text(a.title), body: text(a.body) } }) as never);
  log.push(`announcements: ${anns.length}`);

  const notes = (await prisma.notification.findMany({ select: { id: true, title: true, body: true } })).filter((n) => text(n.title) !== n.title || text(n.body) !== n.body);
  for (const n of notes) ops.push(prisma.notification.update({ where: { id: n.id }, data: { title: text(n.title), body: text(n.body) } }) as never);
  log.push(`notifications: ${notes.length}`);

  console.log((apply ? "APPLYING" : "DRY RUN") + "\n  " + log.join("\n  "));
  if (apply && ops.length) {
    await prisma.$transaction(ops as never);
    console.log(`Done: ${ops.length} rows updated.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
