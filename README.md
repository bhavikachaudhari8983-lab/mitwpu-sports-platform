# Sports Sphere — Sports Registration Portal

Sports Sphere is a paperless sports registration portal for inter-university games in India. The host university is configurable with `NEXT_PUBLIC_UNIVERSITY_NAME` (default "Host University"). Students from the university, from other universities, and international students register online. Their identity and age come from verified sources, never from what they type. Officials measure height and weight at a desk, and approved athletes get a signed QR Sports ID that is checked live at venues.

> **Demo system.** Every person, number and document in the seed data is fictional. DigiLocker, OTP delivery, the university ERP, passport MRZ verification and the international admissions office are **mocked** (see [Replacing the mocks](#replacing-the-mocks-with-real-services)).

## Quick start

Requirements: Node.js 20+ (tested on 24) and npm 10+.

```bash
npm install            # also generates the Prisma client
cp .env.example .env   # then set NEXTAUTH_SECRET and QR_SIGNING_SECRET (openssl rand -base64 32)
npm run setup          # creates the SQLite DB and loads fictional seed data
npm run dev            # http://localhost:3000
```

* npm 11 blocks dependency install scripts unless they are approved. The required ones (Prisma, esbuild) are already listed under `allowScripts` in `package.json`.
* If port 3000 is busy, run `npm run dev -- -p 3100` and set `NEXTAUTH_URL` to match.
* `npm run db:reset` wipes the database and reseeds it. Prisma asks for confirmation because it is destructive.
* Production: `npm run build && npm start`, with `DEMO_MODE="false"`.

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint, `tsc --noEmit` |
| `npm run setup` | `db push` + seed (safe on a fresh DB) |
| `npm run db:seed` | Clears all tables and uploads, then loads demo data |
| `npm run db:reset` | Force-resets the schema and reseeds |

## Demo accounts (all fictional)

**Staff** (`/staff/login`; the login page also has tap-to-fill buttons in demo mode)

| Role | Email | Password |
|---|---|---|
| Admin | admin@sportssphere.example | Admin@12345 |
| Official | official@sportssphere.example | Official@12345 |
| Medical | medical@sportssphere.example | Medical@12345 |
| Coach (Football) | coach@sportssphere.example | Coach@12345 |

**Students** sign in with an OTP on `/status`. In demo mode the OTP is shown on screen in a box labelled "Demo OTP".

| Test case | How to reach it |
|---|---|
| Approved, with QR Sports ID | Aarav Kulkarni, mobile `7000010001` |
| DOB mismatch (flagged) | Rohan Deshmukh, `7000010002` |
| Name mismatch (flagged) | Sneha (Patil in the ERP / Jadhav on DigiLocker), `7000010003` |
| Under 18, pending | Kavya Iyer, `7000010004` |
| Outside student awaiting college confirmation | Nikhil Sawant, `7000020001` |
| International, waiting for desk passport check | Sujan Thapa Magar, email `sujan.thapa@intl.sportssphere.example` |
| Duplicate attempt | Register as an outside student and use DigiLocker Aadhaar `0000 1000 0001` (already Aarav's) |
| Fresh DOB mismatch for a walkthrough | PRN `SS24EE005` (Vikram) |

Fictional Aadhaar numbers start with `0000`, a prefix UIDAI never issues. Each screen has a **Demo helper** panel that lists the test PRNs, Aadhaar numbers and passports (with valid MRZ lines).

## How it works

```
DRAFT ──submit──▶ PENDING ──desk verify──▶ VERIFIED ──admin approve──▶ APPROVED (QR issued)
   │  (auto-check mismatch)  ▲                                    
   └────────▶ FLAGGED ───────┘ admin "Resolve flag"      any submitted status ──▶ REJECTED / FLAGGED (reason shown to student)
```

* **DOB is never typed by Indian students.** It comes from DigiLocker (or the passport + MRZ check for international students), and is then locked. Only an admin can change it (`Edit DOB`), the reason is mandatory, and the old and new values go to the audit log.
* **Age category** (U-19/U-21/U-23/Open) is computed from the verified DOB on the cutoff date set in Settings.
* **Height and weight** are entered only at `/desk` by an Official or Admin, and stored with who measured them and when (history kept). Weight-category sports (wrestling, boxing, judo, weightlifting) also have per-event **weigh-ins**, flagged as within or outside the declared category.
* **One person = one profile.** `identityKey` is a unique hash of masked Aadhaar (last 4) + normalised name + a DOB hash, or of nationality + passport number. A collision is blocked and audited.
* **Auto-checks.** Path A compares ERP vs DigiLocker name and DOB. Path C compares passport vs admissions-record DOB and name, and validates the ICAO 9303 MRZ check digits. A mismatch means the registration is FLAGGED on submit, with a readable reason.
* **Outside students** stay PENDING until an admin uses "Confirm college". After that the college is saved as trusted.
* **QR Sports ID.** The payload is `SRP1:<sportsId>:<HMAC>`. A scan is VALID only if the signature checks out **and** the athlete is APPROVED right now, so flagging someone revokes their QR instantly.

## Security & privacy

* Every page **and** every API route checks the role server-side (`src/lib/rbac.ts`). `src/middleware.ts` is an extra first layer. Staff are re-checked against the database on each request, so deactivation takes effect immediately.
* Uploads go to `./uploads` (or `UPLOAD_DIR`), which is outside `/public`. They are served only by `/api/documents/[id]` after an ownership or role check (`DOC_ACCESS` in `src/lib/constants.ts`), and **every view is audited**. File type is checked by magic bytes, with a 5 MB limit. Images are compressed in the browser first.
* bcrypt staff passwords, rate-limited login (5 per 15 min), OTP send (3 per 10 min per target) and OTP verify (5 attempts). OTP codes are stored only as HMACs.
* Only the last 4 Aadhaar digits are stored. CSV export excludes medical data and guards against spreadsheet formula injection.
* DPDP Act: privacy notice at `/privacy`, a "Request data deletion" button on `/status`, an admin deletion queue, and a retention purge (Settings). Deletion erases files and the profile, and redacts the name in the audit log.

## Folder structure

```
prisma/
  schema.prisma          portable schema (SQLite ⇄ PostgreSQL)
  seed.ts                fictional demo data + test cases
  sports-catalog.ts      15 sports, events, weight classes
scripts/prisma-provider.mjs   sets the datasource provider from DATABASE_URL
src/
  app/
    (site)/              public + student pages: /, /register, /status, /privacy, /staff/login, /forbidden
    (staff)/             staff shell: /admin, /admin/students/[id], /admin/audit, /admin/settings, /desk, /scan, /medical, /coach
    api/                 route handlers (auth, otp, register/*, uploads, documents, student/*, admin/*, desk/*, scan)
  components/            ui/ (design system), layout/, register/ (wizard + steps), status/, admin/, desk/, scan/, staff/
  lib/                   auth, rbac, audit, workflow (status rules), registration, submission, eligibility,
                         qr, id-card, mrz, otp, rate-limit, storage, settings, validation/ (shared Zod schemas)
  services/
    types.ts             interfaces for every external system
    index.ts             service registry: the ONLY place that picks implementations
    mock/                mock implementations + fictional data
uploads/                 private files (git-ignored)
```

## Replacing the mocks with real services

Each external system has an interface in `src/services/types.ts`. Write a real class that implements it, then change the one line that wires it up in **`src/services/index.ts`**. Nothing else needs to change.

| Interface | Mock file | Replace with |
|---|---|---|
| `ErpService` | `src/services/mock/erp.ts` | University ERP API (student by PRN, photo) |
| `DigiLockerService` | `src/services/mock/digilocker.ts` | DigiLocker Partner API (OAuth 2.0 + e-Aadhaar XML + issued documents). With the real OAuth redirect flow, `startConsent` returns the authorisation URL and `completeConsent` exchanges the code. The UI in `src/components/register/digilocker-dialog.tsx` then becomes a redirect instead of a modal. |
| `OtpDeliveryService` | `src/services/mock/otp-delivery.ts` | SMS gateway (DLT-registered template) + transactional email |
| `PassportVerificationService` | `src/services/mock/passport.ts` | MRZ/NFC passport reader SDK at the desk, or a document-verification provider. `src/lib/mrz.ts` already implements real ICAO check digits. |
| `InternationalAdmissionsService` | `src/services/mock/admissions.ts` | International admissions office system |

Also remove `src/services/mock/demo-hints.ts` and `/api/demo/hints` (they are already disabled when `DEMO_MODE="false"`).

**Switching to PostgreSQL:** set `DATABASE_URL="postgresql://…"` in `.env` and run `npm run db:push`. `scripts/prisma-provider.mjs` rewrites the provider automatically. The schema uses only portable features, with enums stored as strings.

**Scaling out:** the rate limiter (`src/lib/rate-limit.ts`) and the DigiLocker mock state are in-memory. Use Redis when running more than one instance. `src/lib/storage.ts` can be swapped for S3/GCS (private bucket).

## Decisions & assumptions

* Students choose their **weight category** when registering. The official weigh-in then checks it.
* Gender is taken from the verified source and is read-only. Events are filtered by gender.
* Auto-check mismatches are shown immediately, but the status changes to FLAGGED **on submit**. That way the student can still complete the form.
* Approve requires VERIFIED. Verify requires a measurement, a confirmed college (outside students) and the desk passport tick (international students). A flagged registration must be resolved by an admin before desk verification.
* Admins see everything except declared medical conditions (medical staff only). Coaches see only approved players in their own sport, and no ID or medical documents.
* **Branding ("Light & warm").** The colours come from the official Sports Sphere logo (`public/brand/sports-sphere-logo.png`, also used as the favicon and on the ID card). Surfaces are white/cream, like the logo. The logo's navy ink `#0E1430` is used only for text and small solid elements (selected chips, secondary buttons). Primary buttons are logo orange `#EE7A2B` with navy text (6.4:1). Icon tiles and the active nav item use a soft orange tint (`#FFF1E6` / `#C2410C`). The "SPHERE" orange gradient is used for large headline text. The logo's ring colours (red, orange, yellow, green, water blue) appear in the header stripe and hero arcs. Charts use orange `#E8590C`. Dark mode is neutral charcoal (no blue tint). Sports IDs look like `SS-26-XXXXXX`. All tokens are in `src/app/globals.css`. **Replace the logo PNG with a high-resolution version (≥600 px or SVG) for a crisp hero.**
* **Fonts** (Google Fonts via `next/font`): **Montserrat** 600/700/800 (+ italic for the logo-style wordmark) for headings (MIT-WPU's own heading face), **Inter** for body and form text, and **JetBrains Mono** for IDs, PRNs and measurements.
* Each student may enter at most 4 events. The age cutoff defaults to 1 Dec 2026 and retention to 365 days (both editable).
