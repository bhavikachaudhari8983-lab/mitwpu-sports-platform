import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, UNIVERSITY_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy notice" };
export const revalidate = 300;

const DATA = [
  ["Identity (from DigiLocker / passport)", "Name, date of birth, gender, photo, last 4 digits of Aadhaar, passport number & nationality", "Verify identity and age; stop duplicate profiles"],
  ["Contact", "Mobile, email, address, emergency contact", "Sign-in OTPs, event communication, emergencies"],
  ["Academic", "University/college, PRN or enrollment number, course, year, APAAR/ABC ID (optional)", "Confirm you are an enrolled student"],
  ["Sports", "Events, weight category, playing position, achievements", "Entries, draws and team selection"],
  ["Physical", "Height and weight (measured by an official), weigh-in records", "Eligibility for weight-category events"],
  ["Medical", "Fitness certificate, conditions you choose to declare, blood group, guardian consent", "Athlete safety; seen only by the medical team (conditions)"],
  ["Images", "Live selfie, passport-size photo", "Photo comparison at the desk; Sports ID card"],
  ["Technical", "Login and document-view logs, IP address", "Security and accountability (audit log)"],
];

export default async function PrivacyPage() {
  const { retentionDays } = await getSettings().catch(() => ({ retentionDays: 365 }));
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 pb-24 sm:px-6 sm:py-14">
      <p className="text-small font-semibold text-muted">Last updated 30 Oct 2026 · Demo document</p>
      <h1 className="mt-2 text-fg">Privacy notice</h1>
      <p className="mt-4 text-lg text-muted">
        How {UNIVERSITY_NAME} (“we”) handles your personal data in the Sports Registration Portal, under the Digital Personal Data Protection Act, 2023 (DPDP Act). This sample notice describes a fictional university and is not legal advice.
      </p>

      <div className="mt-10 space-y-10 [&_h2]:text-[1.5rem] [&_h2]:sm:text-[1.75rem] [&_p]:mt-3 [&_ul]:mt-3">
        <section>
          <h2>1. Who is responsible</h2>
          <p>{UNIVERSITY_NAME} is the Data Fiduciary. Questions and complaints go to the Grievance Officer, Sports Office: <a className="font-semibold underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We reply within 7 working days.</p>
        </section>

        <section>
          <h2>2. Purpose</h2>
          <p>We use your data <strong>only</strong> to register you for university sports events, verify your identity and age, check eligibility (including weight categories), keep athletes safe, and issue and check your QR Sports ID. We never sell it or use it for marketing.</p>
        </section>

        <section>
          <h2>3. What we collect</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[36rem] text-left text-small">
              <thead className="bg-surface-2">
                <tr>
                  <th scope="col" className="p-3">Category</th>
                  <th scope="col" className="p-3">Data</th>
                  <th scope="col" className="p-3">Why</th>
                </tr>
              </thead>
              <tbody>
                {DATA.map(([c, d, w]) => (
                  <tr key={c} className="border-t border-border align-top">
                    <th scope="row" className="p-3 font-semibold">{c}</th>
                    <td className="p-3">{d}</td>
                    <td className="p-3 text-muted">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p><strong>We never store your full Aadhaar number.</strong> It goes directly to DigiLocker; we keep only the last 4 digits. Your date of birth is never typed by you. It comes from DigiLocker or your passport and is locked.</p>
        </section>

        <section>
          <h2>4. Consent and children</h2>
          <p>We process your data on the basis of the consent you give in the form (and to DigiLocker on its own consent screen). For athletes under 18, we also need verifiable consent from a parent or guardian, uploaded during registration. You may withdraw consent at any time. This withdraws you from events.</p>
        </section>

        <section>
          <h2>5. Who can see it</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Officials</strong>: identity documents, photos, measurements: to verify you at the desk.</li>
            <li><strong>Medical team</strong>: medical certificate, declared conditions, blood group, emergency contact.</li>
            <li><strong>Coaches</strong>: approved players in their sport only: name, photo, age category, events, height/weight. No ID or medical documents.</li>
            <li><strong>Admins</strong>: everything except declared medical conditions, to approve registrations.</li>
          </ul>
          <p>Documents are stored privately, never at a public link, and <strong>every view is recorded</strong> in an audit log. We share data outside the university only with the verification services you use (DigiLocker, SMS/email delivery) or where the law requires it.</p>
        </section>

        <section>
          <h2>6. How long we keep it</h2>
          <p>Approved registrations are kept until the end of the competition year plus the period needed for results and appeals. Unfinished drafts and rejected registrations are deleted automatically after <strong>{retentionDays} days</strong> of inactivity. Audit entries are kept for accountability, with your name removed after deletion.</p>
        </section>

        <section>
          <h2>7. Your rights</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Access</strong>: see your data and status anytime on <Link href="/status" className="underline underline-offset-4">your status page</Link>.</li>
            <li><strong>Correction</strong>: ask the sports office to fix mistakes (verified fields such as DOB need original documents).</li>
            <li><strong>Erasure</strong>: use “Request data deletion” on your status page. An admin completes it, normally within 7 days. The only exception is if you are in an event that is still running.</li>
            <li><strong>Grievance redressal</strong>: contact the Grievance Officer. If unresolved, you may complain to the Data Protection Board of India.</li>
            <li><strong>Nomination</strong>: you may nominate someone to exercise these rights on your behalf.</li>
          </ul>
        </section>

        <section>
          <h2>8. Security</h2>
          <p>Encrypted connections, hashed staff passwords, role-based access checked on every request, rate-limited sign-in and OTPs, signed QR codes, and a tamper-evident audit trail. If a breach affects you, we will tell you and the Data Protection Board as the DPDP Act requires.</p>
        </section>
      </div>
    </article>
  );
}
