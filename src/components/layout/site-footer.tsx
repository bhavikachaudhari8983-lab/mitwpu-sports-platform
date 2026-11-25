import Link from "next/link";
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";

const link = "inline-flex min-h-11 items-center text-stage-muted underline-offset-4 hover:text-stage-fg hover:underline";

export function SiteFooter() {
  return (
    <footer className="stage relative isolate overflow-hidden pb-20 md:pb-0">
      <div className="brand-stripe" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-[clamp(1.6rem,3.5vw,2.25rem)]">
            Fueling passion,
            <br />
            <span className="text-volt">building champions.</span>
          </p>
          <p className="mt-3 font-heading text-lg font-bold">{APP_NAME} — Sports Office</p>
          <p className="text-small text-stage-muted">Paperless registration. Verified identities. Fair play.</p>
        </div>
        <div className="text-small">
          <p className="eyebrow text-volt">Contact</p>
          <p>
            <a className={link} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>
            <a className={link} href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}>
              {CONTACT_PHONE}
            </a>
          </p>
        </div>
        <nav aria-label="Footer" className="text-small">
          <p className="eyebrow text-volt">Quick links</p>
          <ul>
            <li>
              <Link className={link} href="/privacy">
                Privacy notice (DPDP Act)
              </Link>
            </li>
            <li>
              <Link className={link} href="/status">
                Check registration status
              </Link>
            </li>
            <li>
              <Link className={link} href="/staff/login">
                Staff login
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="relative border-t border-white/10 px-4 py-4 text-center text-small text-stage-muted">
        Demo system — all names and records are fictional. External verifications are simulated.
      </p>
    </footer>
  );
}
