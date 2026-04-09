# ALLANTECH Thumb Intake Desk

ALLANTECH Thumb Intake Desk is a Next.js application for capturing a thumb image from a phone camera, transforming it into a blue-ink administrative impression, and placing the result into a printable ALLANTECH letter.

This project is designed for practical intake work rather than flashy demo behavior. A phone operator can:

- allow camera access
- frame and capture a thumb image
- review the raw crop and processed scan
- generate a blue-ink impression for printing
- issue a printable confirmation letter from the same workflow

## What The App Does

The current workflow is centered around two main routes:

- `/register`
  Camera intake desk for permission, capture, import, and review
- `/dashboard`
  Printable ALLANTECH letter using the captured thumb impression

The app stores the current capture session in browser local storage so the operator can move from capture to print without losing the record.

## Core Features

- Next.js App Router with TypeScript
- Mobile-friendly camera capture flow
- Secure-context detection for browser camera access
- Camera permission status messaging
- Fallback camera request path when the preferred back camera is unavailable
- In-browser image processing for:
  - raw crop
  - reference scan
  - blue-ink thumb impression
- Printable ALLANTECH confirmation letter
- Render deployment via Blueprint

## Tech Stack

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL

## Important Reality Check

This project is a camera-assisted thumb capture workflow.

It is not a forensic fingerprint scanner and it is not a certified biometric matching system. The image processing improves presentation and document usability, but it does not replace dedicated hardware fingerprint devices for legal or forensic-grade enrollment.

## Project Structure

```text
app/
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
  webauthn.ts
prisma/
  schema.prisma
render.yaml
schema.sql
```

Notes:

- The active user-facing experience is the camera-based intake flow.
- Some legacy auth-related files are still present in the repo, but the current product flow is the thumb capture and print workflow.

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

## Local Camera Testing

### Best option on the same computer

Use:

```text
http://localhost:3000/register
```

Browsers usually allow camera access on `localhost` because it is treated as a secure local origin.

### Best option on a phone over the same network

Use HTTPS dev mode:

```bash
npm run dev:https
```

Then open on your phone:

```text
https://YOUR-PC-LAN-IP:3000/register
```

Example:

```text
https://192.168.1.10:3000/register
```

Important:

- phone and computer must be on the same Wi-Fi or LAN
- the browser may show a certificate warning for local HTTPS
- you may need to trust the local development certificate before camera access works

### Why plain LAN HTTP often fails

This URL usually loads the page but still blocks the camera:

```text
http://192.168.x.x:3000
```

That happens because mobile browsers normally require a secure context for camera APIs. `localhost` is special, but a plain network IP over `http://` is not.

## How To Use The App

1. Open `/register`
2. Fill in the intake record fields
3. Tap `Allow Camera`
4. Place the thumb inside the on-screen guide
5. Tap `Record Thumb`
6. Review:
   - camera crop
   - blue-ink print version
   - reference scan
7. Open `/dashboard`
8. Print the ALLANTECH letter

### Alternative capture path

If direct camera access is unavailable, you can import an existing image file and the app will still generate:

- an enhanced scan preview
- a blue-ink thumb impression
- a printable letter

## Blue-Ink Print Logic

The printed letter does not use the plain camera photo as the main thumb mark.

Instead, the app creates a processed blue-ink version intended to look closer to an administrative thumb impression on paper. The letter keeps a separate reference scan for visual review.

This means the print flow contains:

- a blue-ink thumb impression for the main document presentation
- a processed reference scan beside it

## Scripts

- `npm run dev`
  Start the local development server
- `npm run dev:network`
  Start the dev server on `0.0.0.0`
- `npm run dev:https`
  Start the dev server with HTTPS for better mobile camera testing
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
```

Notes:

- `DATABASE_URL` is required if you use Prisma-backed features
- `ORIGIN` should match the real app URL in each environment
- some legacy env vars remain from the earlier auth foundation, but they do not drive the current camera workflow

## Render Deployment

This repo includes [render.yaml](/home/allanmox/ALLANMOX/PROJECT/fingerprint-web/render.yaml) for Render Blueprint deployment.

The Blueprint creates:

- a web service named `fingerprint-web`
- a Postgres database named `fingerprint-web-db`

### Render Build Flow

The Render Blueprint currently uses:

- build:

```text
npm install --include=dev && npm run prisma:push && npm run build
```

- start:

```text
npm start
```

`npm run prisma:push` is used because the repository does not currently contain committed Prisma migration files.

### Render Environment Values

On Render, use:

- `ORIGIN`
  Example:

```text
https://fingerprint-web.onrender.com
```

- `NEXT_PUBLIC_RP_ID`
  Hostname only:

```text
fingerprint-web.onrender.com
```

Important:

- `ORIGIN` includes `https://`
- `NEXT_PUBLIC_RP_ID` must be hostname only, without `https://`

### Why Render Helps For Camera Access

Render serves the app over HTTPS, which is exactly what mobile browsers want for camera permission. That makes it much easier to test the camera flow on a phone than a plain LAN `http://` address.

## Verification

The project has been checked with:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Recommended Next Improvements

- remove the remaining legacy auth routes if the project is now permanently camera-first
- persist capture records in PostgreSQL instead of only browser local storage
- add server-side document numbering
- add operator accounts and intake history
- generate downloadable PDF letters
- add image quality scoring for poor lighting or blur

## License / Internal Use

If this project is for internal ALLANTECH operational use, add your organization’s preferred license or internal usage notice here.
