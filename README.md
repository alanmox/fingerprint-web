# Mloganzila Hospital Field Attendance System

A Next.js application for tracking field placement attendance at Mloganzila Hospital: students
check in and out with a Mantra MFS500 fingerprint scanner, an admin registers students and tracks
a requirements checklist before they're allowed onto the field, and reports cover daily,
range, and flagged (late/absent) attendance.

## How It Works

- **Admin** (`/admin/login` → `/admin/students`, `/admin/reports/*`, `/admin/settings`) registers
  students, tracks their registration checklist, enrolls their fingerprint, and reviews attendance
  reports.
- **Kiosk** (`/kiosk`) is a full-screen, shared-device scan screen for the hospital entrance. A
  logged-in admin/supervisor leaves it open; each student walks up and scans — the system
  auto-identifies them (1:N fingerprint match) and toggles their attendance: first scan of the day
  checks them in, the next scan checks them out.
- A student is only allowed to scan once they have a **fingerprint enrolled** and every active
  **requirement checklist item** marked complete by an admin (see `/admin/settings` to manage the
  checklist — it's extensible, no code change needed to add a new requirement).

## Tech Stack

- Next.js (App Router) + TypeScript
- Prisma + MySQL (Aiven)
- Mantra MFS500 fingerprint scanner, via a local capture/identify service

## Local Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate    # applies the schema to your database
npm run prisma:seed       # creates the field site, requirement catalog, and bootstrap admin
npm run dev
```

Open `http://localhost:3000`, then sign in at `/admin/login` with the `ADMIN_SEED_EMAIL` /
`ADMIN_SEED_PASSWORD` from your `.env`.

## Fingerprint Scanner Setup

Attendance scanning needs the Mantra MFS500's **local capture/identify service** running on the
same machine as the app server (it talks to `127.0.0.1`) — this is a different local service than
the UIDAI RD Service used for Aadhaar authentication, because RD Service only returns an encrypted,
non-matchable PID block. The mode used here is the one meant for attendance/access-control, which
returns a raw fingerprint template that can be enrolled once and matched against on every scan.

**`MANTRA_MODE` controls which client is used:**

- `mock` (default, recommended for development) — an in-memory fake scanner. Enroll a student's
  "fingerprint" and it'll auto-match on the next kiosk scan; no hardware needed. See
  `lib/fingerprintDevice/mock.ts` for test-override options (simulate no-match/device-error via
  an `x-mock-identify` header on `/api/kiosk/scan`).
- `live` — talks to the real local Mantra service via `lib/fingerprintDevice/localService.ts`.

### Hardware bring-up checklist

There was no live MFS500 or vendor SDK documentation available while building this integration —
the exact endpoint paths and JSON request/response shapes in `lib/fingerprintDevice/localService.ts`
are a best-guess default, isolated behind env vars specifically so they can be corrected without
touching any other code. Once you have the real device and service:

1. Verify the service's actual base URL/port and set `MANTRA_LOCAL_BASE_URL`.
2. Confirm the info/enroll/identify endpoint paths and HTTP methods, and update
   `MANTRA_LOCAL_INFO_PATH` / `MANTRA_LOCAL_ENROLL_PATH` / `MANTRA_LOCAL_IDENTIFY_PATH` and the
   request/response parsing in `lib/fingerprintDevice/localService.ts` to match.
3. Confirm whether the local service does 1:N matching server-side (assumed — `identify()` expects
   a `matched`/`vendorTemplateId`/`matchScore` response) or only returns raw templates. If it's the
   latter, client-side matching against stored templates would need to be built (see the
   `selfMatch` note in `lib/fingerprintDevice/localService.ts`'s header comment) — this was
   deliberately not built speculatively.
4. Tune `MANTRA_LOCAL_MATCH_THRESHOLD` against real match-score distributions.
5. Switch `MANTRA_MODE=live`.

Everything else in the app — schema, admin UI, kiosk flow, eligibility gating, reporting — is
already built and tested against the mock, so hardware bring-up should only touch this one module.

## Deployment Note

Because attendance scanning requires the app server to reach the scanner's local service on
`127.0.0.1`, the app must run on the same machine as the scanner (a kiosk PC at the hospital
entrance) — not a remote host. The kiosk machine's clock/timezone should be set correctly
(`Africa/Dar_es_Salaam`), since attendance date-bucketing and late-arrival flags use the server's
local time with no timezone conversion.

[render.yaml](render.yaml) is still available for hosting the admin/reporting side remotely (it
sets `MANTRA_MODE=mock` since Render's servers can't reach a scanner on a hospital LAN), but the
`/kiosk` scan flow only works when the app runs on-site.

## Environment Variables

See [.env.example](.env.example). Key groups:

- `DATABASE_URL`, `SESSION_SECRET` — required.
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — used by `npm run prisma:seed` to create the
  bootstrap admin account.
- `MANTRA_MODE` / `MANTRA_LOCAL_*` — fingerprint scanner configuration, see above.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` / `npm run format` / `npm run format:check`
- `npm run prisma:generate` / `npm run prisma:migrate` / `npm run prisma:deploy` /
  `npm run prisma:push` / `npm run prisma:seed` / `npm run prisma:studio`

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Full end-to-end kiosk/attendance behavior (check-in/check-out toggling, eligibility gating,
reporting) can be exercised without hardware using `MANTRA_MODE=mock`.
