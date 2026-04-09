# ALLANMOX WebAuthn Starter

This project is a minimal full-stack authentication app built with Next.js App Router, TypeScript, PostgreSQL, Prisma, and SimpleWebAuthn. It supports passkey registration and login, stores authenticators in PostgreSQL, validates WebAuthn challenges securely, and protects a dashboard with a signed session cookie.

## Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- `@simplewebauthn/server`
- `@simplewebauthn/browser`

## Environment

Create or review `.env`:

```env
NEXT_PUBLIC_RP_NAME=ALLANMOX
NEXT_PUBLIC_RP_ID=localhost
ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:M%40j%40liw%40s%40id2024%28pgadmin%29@localhost:5432/fingerprint_web?schema=public
SESSION_SECRET=change-this-before-production
```

Notes:

- `NEXT_PUBLIC_RP_ID=localhost` is correct for local development.
- `ORIGIN` must exactly match the browser origin used during WebAuthn.
- Update `DATABASE_URL` if your PostgreSQL username, database, or host differs.
- Replace `SESSION_SECRET` with a long random value before production use.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create the database if it does not already exist:

```sql
CREATE DATABASE fingerprint_web;
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run the initial migration:

```bash
npm run prisma:migrate -- --name init
```

5. Start the app:

```bash
npm run dev
```

6. Open:

```text
http://localhost:3000
```

## WebAuthn Flow

Registration:

- `POST /api/auth/register/options`
- Browser calls `startRegistration()`
- `POST /api/auth/register/verify`

Authentication:

- `POST /api/auth/login/options`
- Browser calls `startAuthentication()`
- `POST /api/auth/login/verify`

Security details:

- Challenges are stored in short-lived HTTP-only cookies.
- WebAuthn verification checks both `origin` and `rpID`.
- Authenticator counters are updated after login to help prevent replay attacks.
- Successful login creates a signed HTTP-only session cookie.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

## Project Structure

```text
app/
  api/auth/register/options/route.ts
  api/auth/register/verify/route.ts
  api/auth/login/options/route.ts
  api/auth/login/verify/route.ts
  api/auth/logout/route.ts
  dashboard/page.tsx
  login/page.tsx
  register/page.tsx
lib/
  auth.ts
  db.ts
  webauthn.ts
components/
  Button.tsx
  Form.tsx
types/
  auth.ts
prisma/
  schema.prisma
schema.sql
```

## Local Testing

- Register a new username on `/register`
- Approve your device’s passkey prompt
- Login on `/login` with the same username
- Confirm redirect to `/dashboard`

## Render Deployment

This repo now includes [render.yaml](/home/allanmox/ALLANMOX/PROJECT/fingerprint-web/render.yaml) so you can deploy with a Render Blueprint.

Render setup:

- Push this repository to GitHub, GitLab, or Bitbucket.
- In Render, create a new Blueprint and select the repository.
- Render will create:
  - a Node web service named `fingerprint-web`
  - a Postgres database named `fingerprint-web-db`

Important environment variables on Render:

- `DATABASE_URL` is wired automatically from the Render Postgres instance.
- `SESSION_SECRET` is generated automatically.
- Set `ORIGIN` to your Render app URL, for example `https://fingerprint-web.onrender.com`
- Set `NEXT_PUBLIC_RP_ID` to your Render hostname if you still use the WebAuthn endpoints.

Render commands configured in the Blueprint:

- Build: `npm install && npm run build`
- Pre-deploy: `npm run prisma:deploy`
- Start: `npm start`

## Production Notes

- Use HTTPS outside localhost.
- Replace the cookie-based challenge store with Redis or database-backed storage if you need multi-instance deployments.
- Set a strong `SESSION_SECRET`.
- Consider adding rate limiting, audit logging, and CSRF protections for higher-risk deployments.
