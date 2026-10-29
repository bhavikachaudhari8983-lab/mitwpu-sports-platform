import Link from "next/link";
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface pb-20 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-heading text-lg font-bold">{APP_NAME} — Sports Office</p>
          <p className="text-small text-muted">Paperless registration. Verified identities. Fair play.</p>
        </div>
        <div className="text-small">
          <p className="font-semibold">Contact</p>
          <p>
            <a className="inline-flex min-h-11 items-center underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>
            <a className="inline-flex min-h-11 items-center underline-offset-4 hover:underline" href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}>
              {CONTACT_PHONE}
            </a>
          </p>
        </div>
        <nav aria-label="Footer" className="text-small">
          <ul className="space-y-1">
            <li>
              <Link className="inline-flex min-h-11 items-center underline-offset-4 hover:underline" href="/privacy">
                Privacy notice (DPDP Act)
              </Link>
            </li>
            <li>
              <Link className="inline-flex min-h-11 items-center underline-offset-4 hover:underline" href="/status">
                Check registration status
              </Link>
            </li>
            <li>
              <Link className="inline-flex min-h-11 items-center underline-offset-4 hover:underline" href="/staff/login">
                Staff login
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-small text-muted">
        Demo system — all names and records are fictional. External verifications are simulated.
      </p>
    </footer>
  );
}
