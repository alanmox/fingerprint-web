# ALLANTECH Fingerprint Intake Desk

ALLANTECH Fingerprint Intake Desk is a Next.js application for capturing a verified fingerprint from a physical Mantra MFS500 biometric scanner and placing a digital capture certificate into a printable ALLANTECH letter.

This project is designed for practical intake work rather than flashy demo behavior. An operator can:

- connect the Mantra MFS500 scanner
- capture a fingerprint and review the device's quality score
- review the biometric capture certificate (device, serial, quality, PID data hash)
- issue a printable confirmation letter from the same workflow

## What The App Does

The current workflow is centered around two main routes:

- `/register`
  Scanner intake desk for connecting the device, capturing, and review
- `/dashboard`
  Printable ALLANTECH letter using the captured fingerprint certificate

The app stores the current capture session in browser local storage so the operator can move from capture to print without losing the record.

## Core Features

- Next.js App Router with TypeScript
- Mantra MFS500 fingerprint capture via the local Mantra RD Service
- Server-side proxy to the RD Service (avoids HTTPS/mixed-content and CORS issues)
- Device connection status messaging
- Biometric capture certificate (device serial/model, quality score, capture timestamp, PID data hash)
- Printable ALLANTECH confirmation letter
- Render deployment via Blueprint (for the app UI; see deployment note below)

## Tech Stack

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL

## Important Reality Check

This project captures fingerprints through Mantra's UIDAI-compliant RD Service, the same interface used for Aadhaar-grade biometric devices. Because that service is UIDAI-certified, it deliberately never exposes a raw fingerprint image to the calling page — only capture metadata (quality score, device identity, timestamp) and an encrypted PID data block.

That means the printed letter shows a **capture certificate**, not a picture of the fingerprint. The certificate's PID data hash can be used to verify the underlying encrypted capture matches what the device produced, but decrypting or matching the fingerprint itself requires UIDAI/AUA infrastructure this app does not implement.

## Project Structure

```text
app/
  api/fingerprint/capture/route.ts
  api/fingerprint/device-info/route.ts
  dashboard/page.tsx
  login/page.tsx
  page.tsx
  register/page.tsx
  globals.css
  layout.tsx
components/
  Button.tsx
  FingerprintStudio.tsx
  Form.tsx
lib/
  auth.ts
  db.ts
  mantraRdService.ts
  webauthn.ts
prisma/
  schema.prisma
render.yaml
schema.sql
```

Notes:

- The active user-facing experience is the scanner-based intake flow.
- Some legacy auth-related files are still present in the repo, but the current product flow is the fingerprint capture and print workflow.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. If you want Prisma client generated explicitly:

```bash
npm run prisma:generate
```

3. Start the app locally:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Mantra MFS500 Scanner Setup

The Mantra MFS500 does not talk to the browser directly — it talks through **Mantra's RD Service**, a small local service the Mantra driver installs on the operator's computer. This app's server calls that local service on the operator's behalf, so **the Next.js app must run on the same machine as the scanner** (a local/on-prem or kiosk deployment, not a remote host like Render).

1. Install the Mantra MFS500 driver and RD Service on the operator's PC, and plug in the scanner.
2. Confirm the RD Service is running (it typically listens on `https://127.0.0.1:11100` with a self-signed local certificate).
3. Set the following in `.env` if your installed service uses different values (see [.env.example](.env.example)):

```env
RD_SERVICE_BASE_URL=https://127.0.0.1:11100
RD_SERVICE_INFO_PATH=/rd/info
RD_SERVICE_CAPTURE_PATH=/rd/capture
RD_SERVICE_CAPTURE_TIMEOUT_MS=10000
RD_SERVICE_PID_FORMAT=0
RD_SERVICE_PID_VERSION=2.0
RD_SERVICE_ENV=P
RD_SERVICE_WADH=
RD_SERVICE_POSH=UNKNOWN
RD_SERVICE_ALLOW_SELF_SIGNED=true
```

Exact paths and method names can vary slightly between RD Service builds. If capture calls fail, check [lib/mantraRdService.ts](lib/mantraRdService.ts) and verify these values against your installed service's documentation or Postman collection.

4. Run the app (`npm run dev` or a production build) on that same machine, and open `/register`.
5. Click **Connect Scanner** to confirm the RD Service and device are reachable, then **Capture Fingerprint**.

## How To Use The App

1. Open `/register`
2. Fill in the intake record fields
3. Click `Connect Scanner`
4. Have the applicant place their thumb on the MFS500 sensor
5. Click `Capture Fingerprint`
6. Review the capture certificate (quality score, device serial, PID data hash)
7. Open `/dashboard`
8. Print the ALLANTECH letter

## Scripts

- `npm run dev`
  Start the local development server
- `npm run dev:network`
  Start the dev server on `0.0.0.0`
- `npm run dev:https`
  Start the dev server with HTTPS
- `npm run build`
  Create a production build
- `npm run start`
  Start the production server
- `npm run lint`
  Run ESLint
- `npm run format`
  Format the codebase with Prettier
- `npm run format:check`
  Check formatting
- `npm run prisma:generate`
  Generate Prisma client
- `npm run prisma:migrate`
  Run Prisma dev migrations locally
- `npm run prisma:push`
  Push schema changes directly to the database
- `npm run prisma:deploy`
  Run deploy migrations if migrations exist
- `npm run prisma:studio`
  Open Prisma Studio

## Environment Variables

Local `.env` example:

```env
NEXT_PUBLIC_RP_NAME=ALLANMOX
NEXT_PUBLIC_RP_ID=localhost
ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fingerprint_web?schema=public
SESSION_SECRET=replace-with-a-long-random-string

RD_SERVICE_BASE_URL=https://127.0.0.1:11100
RD_SERVICE_INFO_PATH=/rd/info
RD_SERVICE_CAPTURE_PATH=/rd/capture
RD_SERVICE_CAPTURE_TIMEOUT_MS=10000
RD_SERVICE_PID_FORMAT=0
RD_SERVICE_PID_VERSION=2.0
RD_SERVICE_ENV=P
RD_SERVICE_WADH=
RD_SERVICE_POSH=UNKNOWN
RD_SERVICE_ALLOW_SELF_SIGNED=true
```

Notes:

- `DATABASE_URL` is required if you use Prisma-backed features
- `ORIGIN` should match the real app URL in each environment
- `RD_SERVICE_*` variables configure the local Mantra RD Service connection — see the scanner setup section above
- some legacy env vars remain from the earlier auth foundation, but they do not drive the current fingerprint capture workflow

## Deployment Note

Because fingerprint capture requires the app server to reach the scanner's RD Service on `127.0.0.1`, capture only works when the Next.js server runs on the same machine as the scanner (a local kiosk or on-prem install). A remotely hosted deployment (e.g. Render) can still serve the app's other routes, but `/register` and `/dashboard` capture flows will not be able to reach a scanner on an operator's local network from there.

[render.yaml](render.yaml) remains available for hosting a non-capture deployment (e.g. an admin view over previously captured records once server-side persistence is added).

## Verification

The project has been checked with:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Recommended Next Improvements

- remove the remaining legacy auth routes if the project is now permanently scanner-first
- persist capture records (including the encrypted PID data blob) in PostgreSQL instead of only browser local storage
- add server-side document numbering
- add operator accounts and intake history
- generate downloadable PDF letters
- surface RD Service error codes with device-specific troubleshooting guidance

## License / Internal Use

If this project is for internal ALLANTECH operational use, add your organization's preferred license or internal usage notice here.
