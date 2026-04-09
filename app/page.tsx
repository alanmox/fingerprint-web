import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid">
      <section className="hero">
        <p className="eyebrow">WebAuthn + Prisma + PostgreSQL</p>
        <h1>Passkeys for ALLANMOX.</h1>
        <p>
          A minimal full-stack foundation for biometric, passwordless login in Next.js.
          Register a passkey, sign in without passwords, and land on a protected dashboard.
        </p>
        <div className="hero__actions">
          <Link className="button button--primary" href="/register">
            Register Passkey
          </Link>
          <Link className="button button--secondary" href="/login">
            Login With Passkey
          </Link>
        </div>
      </section>
    </div>
  );
}
