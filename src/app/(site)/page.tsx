import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDot,
  ClipboardList,
  Crown,
  Dumbbell,
  Feather,
  Flame,
  Footprints,
  Globe2,
  GraduationCap,
  Hand,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Ruler,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Volleyball,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { CONTACT_EMAIL, CONTACT_PHONE, UNIVERSITY_NAME, UNIVERSITY_SHORT } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export const revalidate = 300;

const SPORT_ICON: Record<string, LucideIcon> = {
  Cricket: Target,
  Football: CircleDot,
  Basketball: CircleDot,
  Volleyball: Volleyball,
  Athletics: Footprints,
  Badminton: Feather,
  "Table Tennis": Zap,
  Kabaddi: Hand,
  "Kho-Kho": Activity,
  Wrestling: Swords,
  Boxing: Flame,
  Judo: Swords,
  Weightlifting: Dumbbell,
  Chess: Crown,
  Swimming: Waves,
};

const STEPS = [
  { icon: ShieldCheck, title: "Verify your identity", body: "Sign in with OTP, then verify through DigiLocker — or your passport if you're an international student. Your date of birth comes from the verified source." },
  { icon: ClipboardList, title: "Complete the form", body: "Take a live selfie, choose your sports and events, and upload your medical certificate. Everything saves automatically." },
  { icon: Ruler, title: "Visit the verification desk", body: "An official compares your photo, and measures your height and weight. Students never enter these themselves." },
  { icon: QrCode, title: "Get your QR Sports ID", body: "Once approved, download your Sports ID card. Officials scan it at every venue — it's checked live." },
];

const DOCS = [
  {
    icon: GraduationCap,
    title: `${UNIVERSITY_SHORT} students (Indian)`,
    fetched: ["Name, DOB, gender, photo — DigiLocker", "Class 10 certificate — DigiLocker", "Course & year — university ERP"],
    upload: ["Passport-size photo", "Live selfie (camera)", "Medical fitness certificate", "Guardian consent (if under 18)"],
  },
  {
    icon: Building2,
    title: "Other universities (Indian)",
    fetched: ["Name, DOB, gender, photo — DigiLocker", "Class 10 certificate — DigiLocker"],
    upload: ["College ID card", "Bonafide letter (this year)", "Passport-size photo & live selfie", "Medical fitness certificate", "Guardian consent (if under 18)"],
  },
  {
    icon: Globe2,
    title: "International, OCI & NRI",
    fetched: ["Passport checked via MRZ", `DOB matched with admissions (${UNIVERSITY_SHORT} students)`],
    upload: ["Passport photo page", "Student visa", "FRRO residence permit", "Passport-size photo & live selfie", "Medical fitness certificate"],
  },
];

const FAQ = [
  { q: "Why can't I type my date of birth?", a: "To keep age categories fair, your DOB comes only from DigiLocker (Aadhaar) or your passport. After verification it's locked. Only an admin can correct it, with a recorded reason." },
  { q: "How is my age category decided?", a: "It's calculated automatically from your verified date of birth, as on the competition cutoff date: U-19, U-21, U-23 or Open. You can't choose it." },
  { q: "Who records my height and weight?", a: "An official at the verification desk. For wrestling, boxing, judo and weightlifting there is also a weigh-in on event day, recorded for each event." },
  { q: "Is my Aadhaar number stored?", a: "No. Only the last 4 digits are stored, as part of a one-way identity check that stops duplicate registrations." },
  { q: "I'm from another college. Why is my registration still pending?", a: "The sports office confirms your enrolment with your college's sports or admin office. Once a college is confirmed it's saved as trusted, so later students from it are faster." },
  { q: "My details didn't match and I've been flagged. What now?", a: "A flag means an automatic check failed, for example your DOB on DigiLocker differs from the university record. Visit the sports office with your original documents. The reason is shown on your status page." },
  { q: "Can I edit my registration after submitting?", a: "No. Contact the sports office if something needs correcting. Before you submit, you can change anything, and your draft is saved automatically." },
  { q: "Do I need to print anything?", a: "No — the process is fully paperless. Show your QR Sports ID on your phone. A PDF and PNG are available if you want a copy." },
];

export default async function HomePage() {
  const [sports, settings] = await Promise.all([prisma.sport.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { name: true, isWeightCategory: true, isTeam: true } }).catch(() => []), getSettings().catch(() => null)]);

  return (
    <>
      {/* Hero */}
      <section className="hero-pattern relative overflow-hidden text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-small font-medium">
            <Trophy className="size-4 text-accent" aria-hidden />
            {settings?.meetName ?? `${UNIVERSITY_NAME} Games`}
          </p>
          <h1 className="mt-5 max-w-3xl text-white">
            Register. Get verified. <span className="text-accent">Play fair.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            One paperless registration for {UNIVERSITY_NAME} events — open to our students, other universities and international students. Verified age, verified identity, one QR Sports ID.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg">
              Register now <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/status" size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
              Check status
            </ButtonLink>
          </div>
          <ul className="mt-10 grid max-w-3xl gap-3 text-small text-white/85 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, t: "DigiLocker & passport verified" },
              { icon: BadgeCheck, t: "Age category set automatically" },
              { icon: QrCode, t: "Signed QR Sports ID" },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-2">
                <Icon className="size-5 shrink-0 text-accent" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden className="track-stripe h-2 opacity-80" />
      </section>

      {/* Sports */}
      <section aria-labelledby="sports-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 id="sports-heading" className="text-fg">
          Sports offered
        </h2>
        <p className="mt-2 text-muted">{sports.length} sports. Combat and strength sports have weight categories with an event-day weigh-in.</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {sports.map((s) => {
            const Icon = SPORT_ICON[s.name] ?? Trophy;
            return (
              <li key={s.name} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-card">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-lg leading-tight font-semibold">{s.name}</span>
                  <span className="block text-small text-muted">{s.isWeightCategory ? "Weight classes" : s.isTeam ? "Team" : "Individual"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 id="how-heading" className="text-fg">
            How registration works
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-xl border border-border bg-bg p-5">
                <span className="font-mono text-small font-semibold text-muted">STEP {i + 1}</span>
                <span className="mt-3 grid size-12 place-items-center rounded-xl bg-accent text-accent-fg">
                  <s.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4">{s.title}</h3>
                <p className="mt-2 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Documents */}
      <section aria-labelledby="docs-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 id="docs-heading" className="text-fg">
          What you&apos;ll need
        </h2>
        <p className="mt-2 max-w-2xl text-muted">If the university can fetch or check something itself, you don&apos;t upload it. Images or PDF, up to 5 MB each — you can take photos with your phone camera.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {DOCS.map((d) => (
            <Card key={d.title}>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-fg">
                    <d.icon className="size-5" aria-hidden />
                  </span>
                  <h3>{d.title}</h3>
                </div>
                <div>
                  <p className="text-small font-semibold text-secondary">Fetched for you</p>
                  <ul className="mt-1 space-y-1">
                    {d.fetched.map((x) => (
                      <li key={x} className="flex gap-2">
                        <BadgeCheck className="mt-1 size-4 shrink-0 text-secondary" aria-hidden />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-small font-semibold text-muted">You upload</p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    {d.upload.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 id="faq-heading" className="text-fg">
            Frequently asked questions
          </h2>
          <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-bg">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-4">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold">
                  {f.q}
                  <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section aria-labelledby="contact-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 id="contact-heading" className="text-fg">
              Contact the sports office
            </h2>
            <p className="mt-2 text-muted">For flagged registrations, DOB corrections or college confirmations, bring your original documents.</p>
            <ul className="mt-6 space-y-3">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 items-center gap-3 font-medium hover:underline">
                  <Mail className="size-5 text-muted" aria-hidden /> {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-3 font-medium hover:underline">
                  <Phone className="size-5 text-muted" aria-hidden /> {CONTACT_PHONE}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 size-5 shrink-0 text-muted" aria-hidden />
                <span>
                  Sports Office, Ground floor, Pavilion Building, {UNIVERSITY_NAME} (fictional campus)
                  <span className="block text-small text-muted">Mon–Sat, 10:00–17:00</span>
                </span>
              </li>
            </ul>
          </div>
          <Card className="self-start bg-primary text-primary-fg">
            <CardBody className="space-y-3">
              <ShieldCheck className="size-8 text-accent" aria-hidden />
              <h3 className="text-white">Your data, protected</h3>
              <p className="text-white/85">We collect only what&apos;s needed to verify athletes, keep documents private, log every access, and delete your data on request — in line with India&apos;s DPDP Act, 2023.</p>
              <Link href="/privacy" className="inline-flex min-h-11 items-center gap-1 font-semibold text-white underline decoration-accent decoration-2 underline-offset-4">
                Read the privacy notice <ArrowRight className="size-4" aria-hidden />
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
